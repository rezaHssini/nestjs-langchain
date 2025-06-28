import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AgentConfig } from '../interfaces/agent.interface';
import { AIProviderConfig } from '../interfaces/agent-module-config.interface';
import { AgentLoggerService } from '../services/agent-logger.service';

/**
 * Factory for creating LLM instances with different configurations
 * Implements the Factory Pattern
 */
@Injectable()
export class AgentFactory {
  private aiProviderConfig?: AIProviderConfig;

  constructor(private readonly logger: AgentLoggerService) {}

  /**
   * Set AI provider configuration
   * @param config AI provider configuration
   */
  setAIProviderConfig(config: AIProviderConfig): void {
    this.aiProviderConfig = config;
    this.logger.logConfiguration(config);
  }

  /**
   * Create an LLM instance based on agent configuration and AI provider settings
   * @param config Agent configuration
   * @returns BaseChatModel instance
   */
  async createLLM(config: AgentConfig): Promise<BaseChatModel> {
    const startTime = Date.now();
    const providerConfig =
      this.aiProviderConfig || this.getDefaultProviderConfig();

    this.logger.debug(
      `Creating LLM for agent: ${config.name}`,
      'AgentFactory',
      {
        provider: providerConfig.type,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      },
    );

    let llm: BaseChatModel;

    try {
      switch (providerConfig.type) {
        case 'openai':
          llm = this.createOpenAILLM(config, providerConfig);
          break;
        case 'anthropic':
          llm = await this.createAnthropicLLM(config, providerConfig);
          break;
        case 'google':
          llm = await this.createGoogleLLM(config, providerConfig);
          break;
        case 'azure':
          llm = this.createAzureLLM(config, providerConfig);
          break;
        case 'custom':
          llm = this.createCustomLLM(config, providerConfig);
          break;
        default:
          throw new Error(
            `Unsupported AI provider type: ${providerConfig.type}`,
          );
      }

      const duration = Date.now() - startTime;
      this.logger.logLLMCreation(
        providerConfig.type,
        config.model || 'default',
      );
      this.logger.logPerformance('LLM Creation', duration, {
        provider: providerConfig.type,
        model: config.model,
      });

      return llm;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to create LLM for agent: ${config.name}`,
        error,
        'AgentFactory',
      );
      this.logger.logPerformance('LLM Creation Failed', duration, {
        provider: providerConfig.type,
        model: config.model,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create OpenAI LLM instance
   */
  private createOpenAILLM(
    config: AgentConfig,
    providerConfig: AIProviderConfig,
  ): ChatOpenAI {
    this.logger.debug('Creating OpenAI LLM', 'AgentFactory');
    return new ChatOpenAI({
      modelName: config.model || 'gpt-3.5-turbo',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      openAIApiKey: providerConfig.apiKey || process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: providerConfig.baseURL,
        ...providerConfig.config,
      },
    });
  }

  /**
   * Create Anthropic LLM instance
   */
  private async createAnthropicLLM(
    config: AgentConfig,
    providerConfig: AIProviderConfig,
  ): Promise<BaseChatModel> {
    this.logger.debug('Creating Anthropic LLM', 'AgentFactory');
    try {
      // Dynamic import to avoid missing dependency errors
      // @ts-expect-error - Optional package, handled at runtime
      const anthropicModule = (await import('@langchain/anthropic')) as any;
      const ChatAnthropic = anthropicModule.ChatAnthropic;
      return new ChatAnthropic({
        modelName: config.model || 'claude-3-sonnet-20240229',
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1000,
        anthropicApiKey: providerConfig.apiKey || process.env.ANTHROPIC_API_KEY,
        configuration: {
          baseURL: providerConfig.baseURL,
          ...providerConfig.config,
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to create Anthropic LLM',
        error,
        'AgentFactory',
      );
      throw new Error(
        'Anthropic provider requires @langchain/anthropic package. ' +
          'Install it with: npm install @langchain/anthropic',
      );
    }
  }

  /**
   * Create Google LLM instance
   */
  private async createGoogleLLM(
    config: AgentConfig,
    providerConfig: AIProviderConfig,
  ): Promise<BaseChatModel> {
    this.logger.debug('Creating Google LLM', 'AgentFactory');
    try {
      // Dynamic import to avoid missing dependency errors
      // @ts-expect-error - Optional package, handled at runtime
      const googleModule = (await import('@langchain/google-genai')) as any;
      const ChatGoogleGenerativeAI = googleModule.ChatGoogleGenerativeAI;
      return new ChatGoogleGenerativeAI({
        modelName: config.model || 'gemini-pro',
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 1000,
        googleApiKey: providerConfig.apiKey || process.env.GOOGLE_API_KEY,
        configuration: {
          ...providerConfig.config,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create Google LLM', error, 'AgentFactory');
      throw new Error(
        'Google provider requires @langchain/google-genai package. ' +
          'Install it with: npm install @langchain/google-genai',
      );
    }
  }

  /**
   * Create Azure OpenAI LLM instance
   */
  private createAzureLLM(
    config: AgentConfig,
    providerConfig: AIProviderConfig,
  ): ChatOpenAI {
    this.logger.debug('Creating Azure OpenAI LLM', 'AgentFactory');
    return new ChatOpenAI({
      modelName: config.model || 'gpt-35-turbo',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      azureOpenAIApiKey:
        providerConfig.apiKey || process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName:
        providerConfig.config?.instanceName ||
        process.env.AZURE_OPENAI_INSTANCE_NAME,
      azureOpenAIApiDeploymentName:
        providerConfig.config?.deploymentName ||
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiVersion:
        providerConfig.config?.apiVersion ||
        process.env.AZURE_OPENAI_API_VERSION ||
        '2023-05-15',
      configuration: {
        ...providerConfig.config,
      },
    });
  }

  /**
   * Create custom LLM instance
   */
  private createCustomLLM(
    config: AgentConfig,
    providerConfig: AIProviderConfig,
  ): BaseChatModel {
    this.logger.debug('Creating Custom LLM', 'AgentFactory');
    if (!providerConfig.customLLM) {
      throw new Error(
        'Custom LLM instance is required when using custom provider type',
      );
    }

    // Apply configuration overrides to custom LLM
    if (config.model) {
      providerConfig.customLLM.modelName = config.model;
    }
    if (config.temperature !== undefined) {
      providerConfig.customLLM.temperature = config.temperature;
    }
    if (config.maxTokens !== undefined) {
      providerConfig.customLLM.maxTokens = config.maxTokens;
    }

    return providerConfig.customLLM;
  }

  /**
   * Get default provider configuration
   */
  private getDefaultProviderConfig(): AIProviderConfig {
    // Check environment variables to determine default provider
    if (process.env.OPENAI_API_KEY) {
      return { type: 'openai', apiKey: process.env.OPENAI_API_KEY };
    }
    if (process.env.ANTHROPIC_API_KEY) {
      return { type: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY };
    }
    if (process.env.GOOGLE_API_KEY) {
      return { type: 'google', apiKey: process.env.GOOGLE_API_KEY };
    }
    if (process.env.AZURE_OPENAI_API_KEY) {
      return { type: 'azure', apiKey: process.env.AZURE_OPENAI_API_KEY };
    }

    // Fallback to OpenAI with warning
    this.logger.warn(
      'No AI provider API key found in environment variables. Using OpenAI as default.',
      'AgentFactory',
    );
    return { type: 'openai' };
  }

  /**
   * Create system prompt for agent
   * @param config Agent configuration
   * @returns string System prompt
   */
  createSystemPrompt(config: AgentConfig): string {
    if (config.systemPrompt) {
      return config.systemPrompt;
    }

    return `You are an intelligent assistant with access to various tools and skills.

Your capabilities include:
- Mathematical calculations
- Weather information retrieval
- Date formatting and manipulation
- Email validation
- Password generation
- Sentiment analysis
- Text summarization
- Currency conversion

Please use the appropriate tools when needed to provide accurate and helpful responses.`;
  }
}
