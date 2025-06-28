import { AgentContext, AgentResponse } from './agent.interface';

/**
 * Interface for agent providers
 * Defines the contract that all agent providers must implement
 */
export interface IAgentProvider {
  /**
   * The name of the agent - must be unique
   */
  readonly agentName: string;

  /**
   * Execute the agent with the given context
   * @param context The context containing input and optional history
   * @returns Promise<AgentResponse> The agent's response
   */
  execute(context: AgentContext): Promise<AgentResponse>;

  /**
   * Optional middleware that runs before the model call
   * @param context The agent context
   * @param metadata The agent metadata
   * @returns Promise<AgentContext> The modified context
   */
  beforeModelCall?(context: AgentContext, metadata: any): Promise<AgentContext>;

  /**
   * Optional middleware that runs after the model call
   * @param context The agent context
   * @param response The model response
   * @param metadata The agent metadata
   * @returns Promise<AgentResponse> The modified response
   */
  afterModelCall?(
    context: AgentContext,
    response: AgentResponse,
    metadata: any,
  ): Promise<AgentResponse>;
}
