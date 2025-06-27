import { Injectable } from '@nestjs/common';
import { AgentContext, AgentResponse } from '../interfaces/agent.interface';
import { IAgentProvider } from '../interfaces/agent-provider.interface';
import { AGENT_METADATA_KEY } from '../decorators/agent.decorator';
import { Reflector } from '@nestjs/core';
import { AgentLoggerService } from './agent-logger.service';

@Injectable()
export class AgentProviderService {
  private agentProviders = new Map<string, IAgentProvider>();

  constructor(
    private readonly reflector: Reflector,
    private readonly logger: AgentLoggerService,
  ) {}

  /**
   * Register an agent provider
   * @param provider The agent provider to register
   */
  registerAgentProvider(provider: IAgentProvider): void {
    const startTime = Date.now();

    this.agentProviders.set(provider.agentName, provider);

    // Get metadata for logging
    const metadata = this.reflector.get(
      AGENT_METADATA_KEY,
      provider.constructor,
    );
    const tools = metadata?.tools || [];

    const duration = Date.now() - startTime;
    this.logger.logAgentRegistration(provider.agentName, tools);
    this.logger.logPerformance('Agent Registration', duration, {
      agent: provider.agentName,
      toolsCount: tools.length,
    });
  }

  /**
   * Register multiple agent providers
   * @param providers Array of agent providers to register
   */
  registerAgentProviders(providers: IAgentProvider[]): void {
    this.logger.info(
      `Registering ${providers.length} agent providers`,
      'AgentProviderService',
    );

    const startTime = Date.now();
    providers.forEach((provider) => this.registerAgentProvider(provider));

    const duration = Date.now() - startTime;
    this.logger.logPerformance('Bulk Agent Registration', duration, {
      count: providers.length,
    });
  }

  /**
   * Execute an agent by name
   * @param agentName The name of the agent to execute
   * @param context The context for the agent execution
   * @returns Promise<AgentResponse> The agent's response
   */
  async executeAgent(
    agentName: string,
    context: AgentContext,
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    this.logger.debug(`Executing agent: ${agentName}`, 'AgentProviderService', {
      input: context.input,
      sessionId: context.sessionId,
    });

    const provider = this.agentProviders.get(agentName);
    if (!provider) {
      const error = `Agent provider '${agentName}' not found`;
      this.logger.error(error, null, 'AgentProviderService');
      throw new Error(error);
    }

    try {
      const result = await provider.execute(context);

      const duration = Date.now() - startTime;
      this.logger.logAgentExecution(
        agentName,
        context.input,
        result.output,
        duration,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Error executing agent '${agentName}'`,
        error,
        'AgentProviderService',
      );
      this.logger.logPerformance('Agent Execution Failed', duration, {
        agent: agentName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all registered agent providers
   * @returns Map<string, IAgentProvider> All registered providers
   */
  getAgentProviders(): Map<string, IAgentProvider> {
    this.logger.debug(
      `Retrieving all agent providers (${this.agentProviders.size} total)`,
      'AgentProviderService',
    );
    return new Map(this.agentProviders);
  }

  /**
   * Get a specific agent provider
   * @param agentName The name of the agent provider
   * @returns IAgentProvider | undefined The agent provider or undefined if not found
   */
  getAgentProvider(agentName: string): IAgentProvider | undefined {
    const provider = this.agentProviders.get(agentName);
    if (provider) {
      this.logger.debug(
        `Retrieved agent provider: ${agentName}`,
        'AgentProviderService',
      );
    } else {
      this.logger.debug(
        `Agent provider not found: ${agentName}`,
        'AgentProviderService',
      );
    }
    return provider;
  }

  /**
   * Get all registered agent names
   * @returns string[] Array of agent names
   */
  getRegisteredAgentNames(): string[] {
    const names = Array.from(this.agentProviders.keys());
    this.logger.debug(
      `Retrieved ${names.length} registered agent names`,
      'AgentProviderService',
      { agents: names },
    );
    return names;
  }

  /**
   * Get metadata for all registered agents
   * @returns Array of agent metadata
   */
  getAllAgentMetadata(): Array<{
    name: string;
    description: string;
    tools: string[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }> {
    const metadata = Array.from(this.agentProviders.values()).map(
      (provider) => {
        const agentMetadata = this.reflector.get(
          AGENT_METADATA_KEY,
          provider.constructor,
        );
        return {
          name: provider.agentName,
          description: agentMetadata?.description || '',
          tools: agentMetadata?.tools || [],
          model: agentMetadata?.model,
          temperature: agentMetadata?.temperature,
          maxTokens: agentMetadata?.maxTokens,
          systemPrompt: agentMetadata?.systemPrompt,
        };
      },
    );

    this.logger.debug(
      `Retrieved metadata for ${metadata.length} agents`,
      'AgentProviderService',
      {
        agents: metadata.map((m) => ({
          name: m.name,
          toolsCount: m.tools.length,
        })),
      },
    );

    return metadata;
  }

  /**
   * Check if an agent provider is registered
   * @param agentName The name of the agent to check
   * @returns boolean True if the agent is registered
   */
  isAgentRegistered(agentName: string): boolean {
    const isRegistered = this.agentProviders.has(agentName);
    this.logger.debug(
      `Agent registration check: ${agentName} - ${isRegistered ? 'registered' : 'not found'}`,
      'AgentProviderService',
    );
    return isRegistered;
  }

  /**
   * Unregister an agent provider
   * @param agentName The name of the agent to unregister
   * @returns boolean True if the agent was unregistered, false if it wasn't found
   */
  unregisterAgentProvider(agentName: string): boolean {
    const startTime = Date.now();
    const wasRegistered = this.agentProviders.has(agentName);

    if (wasRegistered) {
      this.agentProviders.delete(agentName);
      const duration = Date.now() - startTime;
      this.logger.info(
        `Unregistered agent provider: ${agentName}`,
        'AgentProviderService',
      );
      this.logger.logPerformance('Agent Unregistration', duration, {
        agent: agentName,
      });
    } else {
      this.logger.debug(
        `Attempted to unregister non-existent agent: ${agentName}`,
        'AgentProviderService',
      );
    }

    return wasRegistered;
  }
}
