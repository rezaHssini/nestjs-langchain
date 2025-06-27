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
   * Optional middleware that runs before the AI model call
   * Can be used for preprocessing, validation, logging, etc.
   * @param context The original context
   * @param metadata Agent metadata
   * @returns Promise<AgentContext> Modified context or the original context
   */
  beforeModelCall?(context: AgentContext, metadata: any): Promise<AgentContext>;

  /**
   * Optional middleware that runs after the AI model call
   * Can be used for post-processing, response transformation, logging, etc.
   * @param context The original context
   * @param response The AI model response
   * @param metadata Agent metadata
   * @returns Promise<AgentResponse> Modified response or the original response
   */
  afterModelCall?(
    context: AgentContext,
    response: AgentResponse,
    metadata: any,
  ): Promise<AgentResponse>;
}
