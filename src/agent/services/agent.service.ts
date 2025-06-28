import { Injectable, Inject } from '@nestjs/common';
import { DynamicTool } from '@langchain/core/tools';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentContext, AgentResponse } from '../interfaces/agent.interface';
import { AGENT_METADATA_KEY } from '../decorators/agent.decorator';
import { TOOL_METADATA_KEY } from '../decorators/tool.decorator';
import { AgentFactory } from '../factories/agent-factory';
import { IToolCreationStrategy } from '../strategies/tool-creation.strategy';
import { IAgentRepository } from '../repositories/agent-repository';
import {
  IAgentCommand,
  ExecuteAgentCommand,
  FallbackToolExecutionCommand,
} from '../commands/agent-execution.command';
import { AgentEventSubject } from '../observers/agent-event.observer';
import { AgentLoggerService } from './agent-logger.service';
import {
  AGENT_REPOSITORY_TOKEN,
  TOOL_CREATION_STRATEGY_TOKEN,
} from '../constants/tokens';

@Injectable()
export class AgentService {
  constructor(
    @Inject(AGENT_REPOSITORY_TOKEN)
    private readonly agentRepository: IAgentRepository,
    private readonly agentFactory: AgentFactory,
    @Inject(TOOL_CREATION_STRATEGY_TOKEN)
    private readonly toolCreationStrategy: IToolCreationStrategy,
    private readonly eventSubject: AgentEventSubject,
    private readonly logger: AgentLoggerService,
  ) {}

  /**
   * Register an agent using the repository pattern
   */
  registerAgent(agentClass: any, instance: any): void {
    const startTime = Date.now();

    const metadata = Reflect.getMetadata(AGENT_METADATA_KEY, agentClass);
    if (metadata) {
      // Check if tools were explicitly defined or will be auto-discovered
      const hasExplicitTools = metadata.tools && metadata.tools.length > 0;

      this.agentRepository.saveAgent(metadata.name, metadata, instance);
      this.eventSubject.emitAgentRegistered(metadata.name);

      const duration = Date.now() - startTime;
      this.logger.info(`Registered agent: ${metadata.name}`, 'AgentService');
      this.logger.logPerformance('Agent Registration', duration, {
        agent: metadata.name,
        description: metadata.description,
        model: metadata.model,
        toolsDefined: hasExplicitTools ? 'explicit' : 'auto-discover',
        explicitTools: hasExplicitTools ? metadata.tools : [],
      });
    } else {
      this.logger.warn(
        `No metadata found for agent class: ${agentClass.name}`,
        'AgentService',
      );
    }
  }

  /**
   * Register tools using the repository pattern
   */
  registerTools(agentClass: any, instance: any): void {
    const startTime = Date.now();

    const tools = Reflect.getMetadata(TOOL_METADATA_KEY, agentClass);
    if (tools) {
      const toolNames = Object.values(tools).map((tool: any) => tool.name);

      Object.values(tools).forEach((tool: any) => {
        this.agentRepository.saveTool(tool.name, { ...tool, instance });
        this.eventSubject.emitToolRegistered(tool.name);
      });

      const duration = Date.now() - startTime;
      this.logger.info(
        `Registered ${toolNames.length} tools for agent class: ${agentClass.name}`,
        'AgentService',
        { tools: toolNames },
      );
      this.logger.logPerformance('Tool Registration', duration, {
        agentClass: agentClass.name,
        toolsCount: toolNames.length,
      });
    } else {
      this.logger.debug(
        `No tools found for agent class: ${agentClass.name}`,
        'AgentService',
      );
    }
  }

  /**
   * Register custom tools using the repository pattern
   */
  registerCustomTool(tool: any): void {
    const startTime = Date.now();

    this.agentRepository.saveTool(tool.name, tool);
    this.eventSubject.emitToolRegistered(tool.name);

    const duration = Date.now() - startTime;
    this.logger.info(`Registered custom tool: ${tool.name}`, 'AgentService');
    this.logger.logPerformance('Custom Tool Registration', duration, {
      tool: tool.name,
    });
  }

  /**
   * Execute an agent using the command pattern
   */
  async executeAgent(
    agentName: string,
    context: AgentContext,
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    // Validate context and input
    if (!context) {
      throw new Error('Context is required for agent execution');
    }

    if (!context.input || typeof context.input !== 'string') {
      throw new Error('Valid input string is required for agent execution');
    }

    this.logger.debug(`Executing agent: ${agentName}`, 'AgentService', {
      input:
        context.input.substring(0, 100) +
        (context.input.length > 100 ? '...' : ''),
      sessionId: context.sessionId,
      historyLength: context.history?.length || 0,
    });

    const agent = this.agentRepository.getAgent(agentName);
    if (!agent) {
      const error = `Agent ${agentName} not found`;
      this.logger.error(error, null, 'AgentService');
      throw new Error(error);
    }

    try {
      const command: IAgentCommand = new ExecuteAgentCommand(
        agentName,
        context,
        this.executeAgentInternal.bind(this),
      );

      const response = await command.execute();
      this.eventSubject.emitAgentExecuted(agentName, context, response);

      const duration = Date.now() - startTime;
      this.logger.logAgentExecution(
        agentName,
        context.input,
        response.output,
        duration,
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.eventSubject.emitAgentError(agentName, error);
      this.logger.error(
        `Error executing agent: ${agentName}`,
        error,
        'AgentService',
      );
      this.logger.logPerformance('Agent Execution Failed', duration, {
        agent: agentName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Internal agent execution method
   */
  private async executeAgentInternal(
    agentName: string,
    context: AgentContext,
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    this.logger.debug(
      `Internal execution for agent: ${agentName}`,
      'AgentService',
    );

    const agent = this.agentRepository.getAgent(agentName);
    const { metadata } = agent;

    // Get all available tools for this agent
    const allTools = this.agentRepository.getAllTools();
    const agentTools = new Map<string, any>();

    // Filter tools that belong to this agent instance
    for (const [name, tool] of allTools) {
      if (tool.instance === agent.instance) {
        agentTools.set(name, tool);
      }
    }

    this.logger.logToolDiscovery(agentName, Array.from(agentTools.keys()));

    // Create LangChain tools using strategy pattern
    const tools = this.toolCreationStrategy.createToolsFromMetadata(agentTools);

    // Create LLM using factory pattern
    const llm = await this.agentFactory.createLLM(metadata);
    const systemPrompt = this.agentFactory.createSystemPrompt(metadata);

    // Create agent executor
    const agentExecutor = await this.createAgentExecutor(
      llm,
      tools,
      systemPrompt,
    );

    try {
      const result = await agentExecutor.invoke({
        input: context.input,
        chat_history: context.history || [],
      });

      if (
        result.output &&
        result.output !== 'Agent stopped due to max iterations.'
      ) {
        const duration = Date.now() - startTime;
        this.logger.logPerformance('Agent Internal Execution', duration, {
          agent: agentName,
          toolsUsed: Array.from(agentTools.keys()),
          outputLength: result.output.length,
        });

        return {
          output: result.output,
          metadata: {
            agentName,
            tools: Array.from(agentTools.keys()),
            availableTools: tools.map((t) => t.name),
          },
        };
      } else {
        // Use fallback command pattern
        this.logger.debug(
          `Using fallback execution for agent: ${agentName}`,
          'AgentService',
        );

        const fallbackCommand: IAgentCommand = new FallbackToolExecutionCommand(
          tools,
          context.input,
          this.executeToolsDirectly.bind(this),
        );

        const fallbackResponse = await fallbackCommand.execute();

        const duration = Date.now() - startTime;
        this.logger.logPerformance('Agent Fallback Execution', duration, {
          agent: agentName,
          fallbackUsed: true,
        });

        return {
          ...fallbackResponse,
          metadata: {
            agentName,
            tools: Array.from(agentTools.keys()),
            availableTools: tools.map((t) => t.name),
            fallbackUsed: true,
          },
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Error in internal agent execution: ${agentName}`,
        error,
        'AgentService',
      );
      this.logger.logPerformance('Agent Internal Execution Failed', duration, {
        agent: agentName,
        error: error.message,
      });

      return {
        output: `I encountered an error while processing your request: ${error.message}`,
        metadata: {
          agentName,
          tools: Array.from(agentTools.keys()),
          availableTools: tools.map((t) => t.name),
          error: error.message,
        },
      };
    }
  }

  /**
   * Create agent executor
   */
  private async createAgentExecutor(
    llm: any,
    tools: DynamicTool[],
    systemPrompt: string,
  ): Promise<AgentExecutor> {
    const prompt = ChatPromptTemplate.fromTemplate(
      `${systemPrompt}

Current conversation:
{chat_history}
Human: {input}
{agent_scratchpad}`,
    );

    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    });

    return new AgentExecutor({
      agent,
      tools,
      verbose: true,
      maxIterations: 3,
      returnIntermediateSteps: false,
    });
  }

  /**
   * Execute tools directly (fallback mechanism)
   */
  private async executeToolsDirectly(
    tools: DynamicTool[],
    input: string,
  ): Promise<string> {
    for (const tool of tools) {
      try {
        const toolName = tool.name.toLowerCase();
        const toolDescription = tool.description.toLowerCase();
        const inputLower = input.toLowerCase();

        const isRelevant =
          inputLower.includes(toolName) ||
          toolName.split('-').some((word) => inputLower.includes(word)) ||
          toolDescription
            .split(' ')
            .some((word) => word.length > 3 && inputLower.includes(word));

        if (isRelevant) {
          this.logger.info(
            `Fallback: Attempting to execute tool "${tool.name}" for input "${input}"`,
            'AgentService',
          );
          const result = await tool.func(input);
          return `Based on the ${tool.name} information: ${result}`;
        }
      } catch (error) {
        this.logger.error(
          `Error in fallback tool execution for ${tool.name}`,
          error,
          'AgentService',
        );
      }
    }

    return "I'm sorry, I couldn't process your request properly. Please try rephrasing your question.";
  }

  // Repository delegation methods
  getRegisteredAgents(): string[] {
    return Array.from(this.agentRepository.getAllAgents().keys());
  }

  getRegisteredTools(): string[] {
    return Array.from(this.agentRepository.getAllTools().keys());
  }
}
