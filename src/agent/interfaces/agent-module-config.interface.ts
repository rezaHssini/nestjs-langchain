import { Type } from '@nestjs/common';
import { IAgentProvider } from './agent-provider.interface';

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  /**
   * Enable rate limiting
   */
  rateLimit?: {
    /**
     * Maximum requests per window
     */
    maxRequests: number;
    /**
     * Time window in seconds
     */
    windowMs: number;
    /**
     * Rate limit by user ID or IP
     */
    keyGenerator?: (req: any) => string;
  };

  /**
   * Maximum input length allowed
   */
  maxInputLength?: number;

  /**
   * Allowed domains for external requests
   */
  allowedDomains?: string[];

  /**
   * Enable input sanitization
   */
  sanitizeInput?: boolean;
}

/**
 * Logging configuration interface
 */
export interface LoggingConfig {
  /**
   * Enable or disable logging
   */
  enabled?: boolean;

  /**
   * Log level for the agent module
   */
  level?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Enable detailed execution logging
   */
  detailedExecution?: boolean;

  /**
   * Enable tool execution logging
   */
  toolExecution?: boolean;

  /**
   * Enable performance logging
   */
  performance?: boolean;

  /**
   * Enable request/response logging
   */
  requestResponse?: boolean;

  /**
   * Custom logger instance (optional)
   */
  customLogger?: any;

  /**
   * Log format
   */
  format?: 'json' | 'text';

  /**
   * Log to file
   */
  file?: {
    enabled: boolean;
    path: string;
    maxSize: string;
    maxFiles: number;
  };
}

/**
 * AI Provider configuration interface
 */
export interface AIProviderConfig {
  /**
   * The type of AI provider to use
   */
  type: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';

  /**
   * API key for the provider
   */
  apiKey?: string;

  /**
   * Base URL for the provider (optional, for custom endpoints)
   */
  baseURL?: string;

  /**
   * Additional configuration options specific to the provider
   */
  config?: Record<string, any>;

  /**
   * Custom LLM instance (for custom provider type)
   */
  customLLM?: any;

  /**
   * Provider-specific timeout
   */
  timeout?: number;

  /**
   * Maximum retries for this provider
   */
  maxRetries?: number;
}

/**
 * Configuration interface for the AgentModule
 * Allows users to specify their custom agent providers and AI configuration
 */
export interface AgentModuleConfig {
  /**
   * Custom agent provider classes to register with the module
   */
  providers?: Type<IAgentProvider>[];

  /**
   * AI provider configuration
   */
  aiProvider?: AIProviderConfig;

  /**
   * Logging configuration
   */
  logging?: LoggingConfig;

  /**
   * Security configuration
   */
  security?: SecurityConfig;

  /**
   * Custom configuration for the agent service
   */
  agentService?: {
    /**
     * Default model to use if not specified in agent metadata
     */
    defaultModel?: string;

    /**
     * Default temperature to use if not specified in agent metadata
     */
    defaultTemperature?: number;

    /**
     * Default max tokens to use if not specified in agent metadata
     */
    defaultMaxTokens?: number;

    /**
     * Enable agent execution validation
     */
    enableValidation?: boolean;

    /**
     * Maximum concurrent agent executions
     */
    maxConcurrentExecutions?: number;
  };
}
