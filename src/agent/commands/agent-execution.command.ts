import { AgentContext, AgentResponse } from '../interfaces/agent.interface';

/**
 * Command interface for agent operations
 * Implements the Command Pattern
 */
export interface IAgentCommand {
  execute(): Promise<AgentResponse>;
}

/**
 * Command for executing an agent
 */
export class ExecuteAgentCommand implements IAgentCommand {
  constructor(
    private readonly agentName: string,
    private readonly context: AgentContext,
    private readonly executor: (
      agentName: string,
      context: AgentContext,
    ) => Promise<AgentResponse>,
  ) {}

  async execute(): Promise<AgentResponse> {
    return await this.executor(this.agentName, this.context);
  }
}

/**
 * Command for fallback tool execution
 */
export class FallbackToolExecutionCommand implements IAgentCommand {
  constructor(
    private readonly tools: any[],
    private readonly input: string,
    private readonly executor: (tools: any[], input: string) => Promise<string>,
  ) {}

  async execute(): Promise<AgentResponse> {
    const result = await this.executor(this.tools, this.input);
    return {
      output: result,
      metadata: {
        fallbackUsed: true,
        availableTools: this.tools.map((t) => t.name),
      },
    };
  }
}
