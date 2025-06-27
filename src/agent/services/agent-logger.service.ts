import { Injectable, Logger } from '@nestjs/common';
import { LoggingConfig } from '../interfaces/agent-module-config.interface';

/**
 * Custom logger service for the agent module
 * Provides configurable logging with different levels and categories
 */
@Injectable()
export class AgentLoggerService {
  private logger: Logger;
  private config: LoggingConfig = {
    enabled: true,
    level: 'info',
    detailedExecution: false,
    toolExecution: true,
    performance: false,
    requestResponse: true,
  };

  constructor() {
    this.logger = new Logger('AgentModule');
  }

  /**
   * Configure the logger with custom settings
   * @param config Logging configuration
   */
  configure(config: LoggingConfig): void {
    this.config = { ...this.config, ...config };

    if (config.customLogger) {
      this.logger = config.customLogger;
    }
  }

  /**
   * Check if logging is enabled
   */
  private isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  /**
   * Check if a specific log level should be logged
   */
  private shouldLog(level: string): boolean {
    if (!this.isEnabled()) return false;

    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = this.config.level || 'info';
    const configLevelIndex = levels.indexOf(configLevel);
    const currentLevelIndex = levels.indexOf(level);

    return currentLevelIndex >= configLevelIndex;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: string, data?: any): void {
    if (this.shouldLog('debug')) {
      if (data) {
        this.logger.debug(`${message} ${JSON.stringify(data)}`, context);
      } else {
        this.logger.debug(message, context);
      }
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: string, data?: any): void {
    if (this.shouldLog('info')) {
      if (data) {
        this.logger.log(`${message} ${JSON.stringify(data)}`, context);
      } else {
        this.logger.log(message, context);
      }
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, data?: any): void {
    if (this.shouldLog('warn')) {
      if (data) {
        this.logger.warn(`${message} ${JSON.stringify(data)}`, context);
      } else {
        this.logger.warn(message, context);
      }
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: any, context?: string): void {
    if (this.shouldLog('error')) {
      if (error) {
        this.logger.error(
          `${message}: ${error.message || error}`,
          error.stack,
          context,
        );
      } else {
        this.logger.error(message, context);
      }
    }
  }

  /**
   * Log agent execution details
   */
  logAgentExecution(
    agentName: string,
    input: string,
    output: string,
    duration: number,
  ): void {
    if (!this.config.detailedExecution) return;

    this.info(`Agent execution completed`, 'AgentExecution', {
      agent: agentName,
      input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
      output: output.substring(0, 100) + (output.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
    });
  }

  /**
   * Log tool execution
   */
  logToolExecution(
    toolName: string,
    parameters: any,
    result: any,
    duration: number,
  ): void {
    if (!this.config.toolExecution) return;

    this.info(`Tool executed`, 'ToolExecution', {
      tool: toolName,
      parameters,
      result:
        typeof result === 'string'
          ? result.substring(0, 200) + (result.length > 200 ? '...' : '')
          : result,
      duration: `${duration}ms`,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: any): void {
    if (!this.config.performance) return;

    this.info(`Performance metric`, 'Performance', {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  /**
   * Log request/response
   */
  logRequestResponse(
    method: string,
    url: string,
    requestBody?: any,
    responseBody?: any,
    duration?: number,
  ): void {
    if (!this.config.requestResponse) return;

    this.info(`Request/Response`, 'RequestResponse', {
      method,
      url,
      requestBody: requestBody
        ? JSON.stringify(requestBody).substring(0, 200) + '...'
        : undefined,
      responseBody: responseBody
        ? JSON.stringify(responseBody).substring(0, 200) + '...'
        : undefined,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  /**
   * Log agent registration
   */
  logAgentRegistration(agentName: string, tools: string[]): void {
    this.info(`Agent registered`, 'AgentRegistration', {
      agent: agentName,
      toolsCount: tools.length,
      tools: tools,
    });
  }

  /**
   * Log tool discovery
   */
  logToolDiscovery(agentName: string, discoveredTools: string[]): void {
    this.debug(`Tools discovered`, 'ToolDiscovery', {
      agent: agentName,
      tools: discoveredTools,
    });
  }

  /**
   * Log LLM creation
   */
  logLLMCreation(providerType: string, model: string): void {
    this.debug(`LLM created`, 'LLMCreation', {
      provider: providerType,
      model,
    });
  }

  /**
   * Log configuration
   */
  logConfiguration(config: any): void {
    this.debug(`Module configured`, 'Configuration', {
      ...config,
      // Don't log sensitive data
      apiKey: config.apiKey ? '[REDACTED]' : undefined,
    });
  }
}
