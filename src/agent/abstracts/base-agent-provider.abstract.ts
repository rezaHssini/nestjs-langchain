import { Injectable } from '@nestjs/common';
import { AgentContext, AgentResponse } from '../interfaces/agent.interface';
import { IAgentProvider } from '../interfaces/agent-provider.interface';
import { AgentService } from '../services/agent.service';
import { AgentLoggerService } from '../services/agent-logger.service';
import { AGENT_METADATA_KEY } from '../decorators/agent.decorator';
import { Reflector } from '@nestjs/core';

/**
 * Abstract base class for agent providers
 * Provides default implementation and forces developers to define metadata
 * Implements middleware pattern for before/after model call hooks
 */
@Injectable()
export abstract class BaseAgentProvider implements IAgentProvider {
  constructor(
    protected readonly agentService: AgentService,
    protected readonly logger: AgentLoggerService,
    protected readonly reflector: Reflector,
  ) {}

  /**
   * The name of the agent - must be implemented by subclasses
   */
  abstract readonly agentName: string;

  /**
   * Execute the agent using the agent service with middleware support
   * This is the default implementation that delegates to the agent service
   * @param context The context containing input and optional history
   * @returns Promise<AgentResponse> The agent's response
   */
  async execute(context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();

    // Validate context and input
    if (!context) {
      throw new Error('Context is required for agent execution');
    }

    try {
      // Get agent metadata for middleware
      const metadata = this.reflector.get(AGENT_METADATA_KEY, this.constructor);

      // Execute before middleware if implemented
      let processedContext = context;
      if (this.beforeModelCall) {
        const beforeStartTime = Date.now();
        try {
          processedContext = await this.beforeModelCall(context, metadata);
          const beforeDuration = Date.now() - beforeStartTime;
          this.logger.logPerformance(
            'Before Model Call Middleware',
            beforeDuration,
            {
              agent: this.agentName,
              contextModified: processedContext !== context,
            },
          );
        } catch (error) {
          this.logger.error(
            `Before model call middleware failed for agent: ${this.agentName}`,
            error,
            'BaseAgentProvider',
          );
          // Continue with original context if middleware fails
          processedContext = context;
        }
      }

      // Execute the main agent logic
      const result = await this.agentService.executeAgent(
        this.agentName,
        processedContext,
      );

      // Execute after middleware if implemented
      let finalResult = result;
      if (this.afterModelCall) {
        const afterStartTime = Date.now();
        try {
          finalResult = await this.afterModelCall(context, result, metadata);
          const afterDuration = Date.now() - afterStartTime;
          this.logger.logPerformance(
            'After Model Call Middleware',
            afterDuration,
            {
              agent: this.agentName,
              responseModified: finalResult !== result,
            },
          );
        } catch (error) {
          this.logger.error(
            `After model call middleware failed for agent: ${this.agentName}`,
            error,
            'BaseAgentProvider',
          );
          // Continue with original result if middleware fails
          finalResult = result;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.logPerformance('BaseAgentProvider Execution', duration, {
        agent: this.agentName,
        inputLength: context.input.length,
        outputLength: finalResult.output.length,
        middlewareUsed: {
          before: !!this.beforeModelCall,
          after: !!this.afterModelCall,
        },
      });

      return finalResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `BaseAgentProvider execution failed: ${this.agentName}`,
        error,
        'BaseAgentProvider',
      );
      this.logger.logPerformance(
        'BaseAgentProvider Execution Failed',
        duration,
        {
          agent: this.agentName,
          error: error.message,
        },
      );
      throw error;
    }
  }

  /**
   * Optional method for custom execution logic
   * Override this if you need custom behavior beyond the default agent service execution
   * @param context The context containing input and optional history
   * @returns Promise<AgentResponse> The agent's response
   */
  protected async customExecute?(
    context: AgentContext,
  ): Promise<AgentResponse> {
    // Default implementation delegates to the standard execute method
    return this.execute(context);
  }

  /**
   * Optional middleware that runs before the AI model call
   * Override this method to implement custom preprocessing logic
   * @param context The original context
   * @param metadata Agent metadata
   * @returns Promise<AgentContext> Modified context or the original context
   */
  public async beforeModelCall?(
    context: AgentContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata: any,
  ): Promise<AgentContext> {
    // Default implementation returns the original context unchanged
    return context;
  }

  /**
   * Optional middleware that runs after the AI model call
   * Override this method to implement custom post-processing logic
   * @param context The original context
   * @param response The AI model response
   * @param metadata Agent metadata
   * @returns Promise<AgentResponse> Modified response or the original response
   */
  public async afterModelCall?(
    context: AgentContext,
    response: AgentResponse,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata: any,
  ): Promise<AgentResponse> {
    // Default implementation returns the original response unchanged
    return response;
  }
}
