import { Injectable } from '@nestjs/common';
import { Agent } from '../agent/decorators/agent.decorator';
import { Tool } from '../agent/decorators/tool.decorator';
import { BaseAgentProvider } from '../agent/abstracts/base-agent-provider.abstract';
import { AgentService } from '../agent/services/agent.service';
import { AgentLoggerService } from '../agent/services/agent-logger.service';
import {
  AgentContext,
  AgentResponse,
} from '../agent/interfaces/agent.interface';
import { Reflector } from '@nestjs/core';

/**
 * Comprehensive AI Agent Example
 * Demonstrates all features: tools, middleware, logging, error handling
 */
@Injectable()
@Agent({
  name: 'comprehensive-ai-agent',
  description:
    'A comprehensive AI agent demonstrating all features including tools, middleware, logging, and error handling',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: `You are a comprehensive AI assistant with access to various tools and capabilities.

  You can:
  - Perform mathematical calculations
  - Get weather information
  - Format dates and times
  - Validate data
  - Generate content
  - Analyze text sentiment
  
  IMPORTANT TOOL USAGE GUIDELINES:
  - When using the weather tool, ALWAYS extract the city name from the user's request
  - For weather requests, look for city names like "New York", "London", "Paris", etc.
  - If no city is mentioned, ask the user to specify which city they want weather for
  - Use the exact city name as provided by the user
  - For calculations, extract the numbers and operation clearly
  - For date formatting, extract the date and format preference
  
  Always be helpful, accurate, and use the appropriate tools when needed.
  Provide clear, well-formatted responses and explain your reasoning.
  
  When a user asks about weather, make sure to identify the city and use the get-weather tool with the correct city parameter.`,
})
export class ComprehensiveAIAgent extends BaseAgentProvider {
  readonly agentName = 'comprehensive-ai-agent';

  constructor(
    agentService: AgentService,
    logger: AgentLoggerService,
    reflector: Reflector,
  ) {
    super(agentService, logger, reflector);
  }

  /**
   * Before Model Call Middleware
   * Implements input validation, sanitization, and preprocessing
   */
  public async beforeModelCall(
    context: AgentContext,
    metadata: any,
  ): Promise<AgentContext> {
    this.logger.info(
      `Before model call middleware executing for agent: ${this.agentName}`,
      'ComprehensiveAIAgent',
    );

    try {
      // Input validation
      if (!context.input || context.input.trim().length === 0) {
        throw new Error('Input cannot be empty');
      }

      // Sanitize input
      const sanitizedInput = this.sanitizeInput(context.input);

      // Check for inappropriate content
      const inappropriateWords = [
        'spam',
        'inappropriate',
        'blocked',
        'hack',
        'exploit',
      ];
      const hasInappropriateContent = inappropriateWords.some((word) =>
        sanitizedInput.toLowerCase().includes(word),
      );

      if (hasInappropriateContent) {
        this.logger.warn(
          `Inappropriate content detected in input`,
          'ComprehensiveAIAgent',
          { input: sanitizedInput.substring(0, 100) },
        );

        return {
          ...context,
          input:
            'I apologize, but I cannot process that request due to inappropriate content.',
          metadata: {
            ...context.metadata,
            validationFailed: true,
            reason: 'inappropriate_content',
            originalInput: context.input,
          },
        };
      }

      // Add metadata and preprocessing info
      const enhancedContext: AgentContext = {
        ...context,
        input: sanitizedInput,
        metadata: {
          ...context.metadata,
          preprocessed: true,
          originalLength: context.input.length,
          sanitizedLength: sanitizedInput.length,
          timestamp: new Date().toISOString(),
          agentName: this.agentName,
          model: metadata?.model || 'gpt-3.5-turbo',
        },
      };

      this.logger.debug(
        'Input preprocessing completed successfully',
        'ComprehensiveAIAgent',
        {
          original:
            context.input.substring(0, 50) +
            (context.input.length > 50 ? '...' : ''),
          sanitized:
            sanitizedInput.substring(0, 50) +
            (sanitizedInput.length > 50 ? '...' : ''),
          metadata: enhancedContext.metadata,
        },
      );

      return enhancedContext;
    } catch (error) {
      this.logger.error(
        'Before middleware validation failed',
        error,
        'ComprehensiveAIAgent',
      );

      return {
        ...context,
        input:
          'I encountered an error while processing your request. Please try again.',
        metadata: {
          ...context.metadata,
          error: error.message,
          validationFailed: true,
          fallbackUsed: true,
        },
      };
    }
  }

  /**
   * After Model Call Middleware
   * Implements response formatting, enhancement, and post-processing
   */
  public async afterModelCall(
    context: AgentContext,
    response: AgentResponse,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata: any,
  ): Promise<AgentResponse> {
    this.logger.info(
      `After model call middleware executing for agent: ${this.agentName}`,
      'ComprehensiveAIAgent',
    );

    try {
      // Check if there was a validation error
      if (context.metadata?.validationFailed) {
        return {
          output: context.input, // Use the error message from before middleware
          metadata: {
            ...response.metadata,
            errorHandled: true,
            originalError: context.metadata.error,
            reason: context.metadata.reason,
          },
        };
      }

      // Format and enhance the response
      const formattedOutput = this.formatResponse(response.output);

      // Add response metadata
      const enhancedResponse: AgentResponse = {
        ...response,
        output: formattedOutput,
        metadata: {
          ...response.metadata,
          postprocessed: true,
          originalLength: response.output.length,
          formattedLength: formattedOutput.length,
          processingTime: new Date().toISOString(),
          middlewareVersion: '1.0.0',
          agentName: this.agentName,
          toolsUsed: response.metadata?.tools || [],
        },
      };

      this.logger.debug(
        'Response post-processing completed successfully',
        'ComprehensiveAIAgent',
        {
          original:
            response.output.substring(0, 50) +
            (response.output.length > 50 ? '...' : ''),
          formatted:
            formattedOutput.substring(0, 50) +
            (formattedOutput.length > 50 ? '...' : ''),
          metadata: enhancedResponse.metadata,
        },
      );

      return enhancedResponse;
    } catch (error) {
      this.logger.error(
        'After middleware processing failed',
        error,
        'ComprehensiveAIAgent',
      );

      return {
        output:
          'I encountered an error while processing your response. Please try again.',
        metadata: {
          ...response.metadata,
          error: error.message,
          fallbackUsed: true,
        },
      };
    }
  }

  // ===== TOOL IMPLEMENTATIONS =====

  /**
   * Mathematical Calculator Tool
   */
  @Tool({
    name: 'calculate',
    description:
      'Perform mathematical calculations with support for basic operations',
    parameters: {
      operation: {
        type: 'string',
        description: 'Mathematical operation to perform',
        enum: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt'],
        required: true,
      },
      a: {
        type: 'number',
        description: 'First number',
        required: true,
      },
      b: {
        type: 'number',
        description: 'Second number (not required for sqrt)',
        required: false,
      },
    },
    returnType: 'number',
    examples: [
      'Calculate 5 + 3',
      'What is 10 * 7?',
      'Divide 100 by 4',
      'Calculate 2 to the power of 8',
    ],
  })
  async calculate(params: {
    operation: string;
    a: number;
    b?: number;
  }): Promise<number> {
    const { operation, a, b } = params;

    try {
      switch (operation) {
        case 'add':
          return a + (b || 0);
        case 'subtract':
          return a - (b || 0);
        case 'multiply':
          return a * (b || 1);
        case 'divide':
          if (b === 0 || b === undefined) {
            throw new Error('Division by zero is not allowed');
          }
          return a / b;
        case 'power':
          return Math.pow(a, b || 2);
        case 'sqrt':
          if (a < 0) {
            throw new Error('Cannot calculate square root of negative number');
          }
          return Math.sqrt(a);
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      this.logger.error(
        `Calculation failed: ${operation}`,
        error,
        'ComprehensiveAIAgent',
      );
      throw new Error(`Calculation failed: ${error.message}`);
    }
  }

  /**
   * Weather Information Tool
   */
  @Tool({
    name: 'get-weather',
    description: 'Get current weather information for a specific city',
    parameters: {
      city: {
        type: 'string',
        description:
          'City name to get weather for (e.g., "New York", "London", "Tokyo")',
        required: true,
      },
      unit: {
        type: 'string',
        description: 'Temperature unit',
        enum: ['celsius', 'fahrenheit'],
        required: false,
      },
    },
    returnType: 'string',
    examples: [
      'What is the weather in New York?',
      'Get weather for London in celsius',
      'Weather in Tokyo',
    ],
  })
  async getWeather(params: { city: string; unit?: string }): Promise<string> {
    const { city, unit = 'celsius' } = params;

    try {
      // Validate city parameter
      if (!city || typeof city !== 'string' || city.trim().length === 0) {
        this.logger.warn(
          'Weather tool called with invalid city parameter',
          'ComprehensiveAIAgent',
          { params, city: city || 'undefined' },
        );
        return 'Error: Please provide a valid city name. For example: "What is the weather in New York?"';
      }

      const cityName = city.trim();

      // Log the weather request for debugging
      this.logger.debug(`Weather request received`, 'ComprehensiveAIAgent', {
        city: cityName,
        unit,
        params,
      });

      // Simulate weather API call
      const weatherData = {
        temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
        condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][
          Math.floor(Math.random() * 4)
        ],
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      };

      const temp =
        unit === 'fahrenheit'
          ? Math.round((weatherData.temperature * 9) / 5 + 32)
          : weatherData.temperature;

      const tempUnit = unit === 'fahrenheit' ? '°F' : '°C';

      const result = `Weather in ${cityName}: ${weatherData.condition}, ${temp}${tempUnit}, Humidity: ${weatherData.humidity}%, Wind: ${weatherData.windSpeed} km/h`;

      this.logger.debug(`Weather response generated`, 'ComprehensiveAIAgent', {
        city: cityName,
        result,
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Weather lookup failed for ${city || 'undefined'}`,
        error,
        'ComprehensiveAIAgent',
      );
      return `Error: Failed to get weather information. Please try again with a valid city name.`;
    }
  }

  /**
   * Date Formatting Tool
   */
  @Tool({
    name: 'format-date',
    description: 'Format dates in different styles and timezones',
    parameters: {
      date: {
        type: 'string',
        description: 'Date string to format (ISO, timestamp, or readable date)',
        required: true,
      },
      format: {
        type: 'string',
        description: 'Output format style',
        enum: ['short', 'long', 'iso', 'relative', 'custom'],
        required: false,
      },
      timezone: {
        type: 'string',
        description: 'Timezone for the date (e.g., UTC, America/New_York)',
        required: false,
      },
    },
    returnType: 'string',
    examples: [
      'Format today in long format',
      'Convert 2024-01-15 to relative time',
      'Format timestamp 1705276800000 in short format',
    ],
  })
  async formatDate(params: {
    date: string;
    format?: string;
    timezone?: string;
  }): Promise<string> {
    const { date, format = 'short', timezone } = params;

    try {
      let dateObj: Date;

      // Parse the input date
      if (date === 'today' || date === 'now') {
        dateObj = new Date();
      } else if (!isNaN(Number(date))) {
        dateObj = new Date(Number(date));
      } else {
        dateObj = new Date(date);
      }

      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date format');
      }

      // Apply timezone if specified
      if (timezone) {
        // In a real implementation, you would use a library like moment-timezone
        this.logger.debug(
          `Timezone conversion requested: ${timezone}`,
          'ComprehensiveAIAgent',
        );
      }

      // Format the date
      switch (format) {
        case 'short':
          return dateObj.toLocaleDateString();
        case 'long':
          return dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        case 'iso':
          return dateObj.toISOString();
        case 'relative':
          const now = new Date();
          const diffMs = now.getTime() - dateObj.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays === 0) return 'Today';
          if (diffDays === 1) return 'Yesterday';
          if (diffDays === -1) return 'Tomorrow';
          if (diffDays > 0) return `${diffDays} days ago`;
          return `In ${Math.abs(diffDays)} days`;
        case 'custom':
          return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        default:
          return dateObj.toString();
      }
    } catch (error) {
      this.logger.error(
        `Date formatting failed for ${date}`,
        error,
        'ComprehensiveAIAgent',
      );
      throw new Error(`Failed to format date: ${error.message}`);
    }
  }

  /**
   * Email Validation Tool
   */
  @Tool({
    name: 'validate-email',
    description:
      'Validate email address format and check if it follows proper conventions',
    parameters: {
      email: {
        type: 'string',
        description: 'Email address to validate',
        required: true,
      },
      checkDomain: {
        type: 'boolean',
        description: 'Whether to check if the domain exists',
        required: false,
      },
    },
    returnType: 'string',
    examples: [
      'Validate user@example.com',
      'Check if admin@company.org is valid',
    ],
  })
  async validateEmail(params: {
    email: string;
    checkDomain?: boolean;
  }): Promise<string> {
    const { email, checkDomain = false } = params;

    try {
      // Basic email regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(email);

      if (!isValidFormat) {
        return `Invalid email format: ${email}`;
      }

      // Additional validation checks
      const [localPart, domain] = email.split('@');

      if (localPart.length === 0 || localPart.length > 64) {
        return `Invalid local part length: ${email}`;
      }

      if (domain.length === 0 || domain.length > 255) {
        return `Invalid domain length: ${email}`;
      }

      if (checkDomain) {
        // In a real implementation, you would check DNS records
        this.logger.debug(
          `Domain check requested for ${domain}`,
          'ComprehensiveAIAgent',
        );
        return `Email format is valid: ${email} (domain check simulated)`;
      }

      return `Valid email format: ${email}`;
    } catch (error) {
      this.logger.error(
        `Email validation failed for ${email}`,
        error,
        'ComprehensiveAIAgent',
      );
      throw new Error(`Email validation failed: ${error.message}`);
    }
  }

  /**
   * Password Generator Tool
   */
  @Tool({
    name: 'generate-password',
    description: 'Generate secure passwords with customizable options',
    parameters: {
      length: {
        type: 'number',
        description: 'Password length (8-50 characters)',
        required: false,
      },
      includeUppercase: {
        type: 'boolean',
        description: 'Include uppercase letters',
        required: false,
      },
      includeLowercase: {
        type: 'boolean',
        description: 'Include lowercase letters',
        required: false,
      },
      includeNumbers: {
        type: 'boolean',
        description: 'Include numbers',
        required: false,
      },
      includeSymbols: {
        type: 'boolean',
        description: 'Include special symbols',
        required: false,
      },
    },
    returnType: 'string',
    examples: [
      'Generate a 12-character password',
      'Create a strong password with symbols',
      'Generate password with uppercase and numbers',
    ],
  })
  async generatePassword(params: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  }): Promise<string> {
    const {
      length = 12,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = false,
    } = params;

    try {
      // Validate length
      if (length < 8 || length > 50) {
        throw new Error('Password length must be between 8 and 50 characters');
      }

      // Build character set
      let charset = '';
      if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
      if (includeNumbers) charset += '0123456789';
      if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

      if (charset.length === 0) {
        throw new Error('At least one character type must be selected');
      }

      // Generate password
      let password = '';
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      return `Generated password: ${password}`;
    } catch (error) {
      this.logger.error(
        'Password generation failed',
        error,
        'ComprehensiveAIAgent',
      );
      throw new Error(`Password generation failed: ${error.message}`);
    }
  }

  /**
   * Sentiment Analysis Tool
   */
  @Tool({
    name: 'analyze-sentiment',
    description: 'Analyze the sentiment of text (positive, negative, neutral)',
    parameters: {
      text: {
        type: 'string',
        description: 'Text to analyze for sentiment',
        required: true,
      },
      detailed: {
        type: 'boolean',
        description: 'Whether to provide detailed analysis',
        required: false,
      },
    },
    returnType: 'string',
    examples: [
      'Analyze sentiment of "I love this product!"',
      'What is the sentiment of "This is terrible"?',
      'Analyze "The weather is okay today" with details',
    ],
  })
  async analyzeSentiment(params: {
    text: string;
    detailed?: boolean;
  }): Promise<string> {
    const { text, detailed = false } = params;

    try {
      // Simple sentiment analysis (in a real implementation, you'd use a proper NLP library)
      const positiveWords = [
        'love',
        'great',
        'excellent',
        'amazing',
        'wonderful',
        'good',
        'happy',
        'fantastic',
      ];
      const negativeWords = [
        'hate',
        'terrible',
        'awful',
        'bad',
        'horrible',
        'disappointing',
        'sad',
        'angry',
      ];

      const words = text.toLowerCase().split(/\s+/);
      let positiveCount = 0;
      let negativeCount = 0;

      words.forEach((word) => {
        if (positiveWords.includes(word)) positiveCount++;
        if (negativeWords.includes(word)) negativeCount++;
      });

      let sentiment: string;
      let confidence: number;

      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        confidence = Math.min(
          0.9,
          (positiveCount - negativeCount) /
            Math.max(positiveCount + negativeCount, 1),
        );
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        confidence = Math.min(
          0.9,
          (negativeCount - positiveCount) /
            Math.max(positiveCount + negativeCount, 1),
        );
      } else {
        sentiment = 'neutral';
        confidence = 0.5;
      }

      if (detailed) {
        return `Sentiment Analysis: ${sentiment} (confidence: ${(confidence * 100).toFixed(1)}%)
Positive words: ${positiveCount}, Negative words: ${negativeCount}
Text: "${text}"`;
      }

      return `Sentiment: ${sentiment} (${(confidence * 100).toFixed(1)}% confidence)`;
    } catch (error) {
      this.logger.error(
        'Sentiment analysis failed',
        error,
        'ComprehensiveAIAgent',
      );
      throw new Error(`Sentiment analysis failed: ${error.message}`);
    }
  }

  /**
   * Text Summarizer Tool
   */
  @Tool({
    name: 'text-summarizer',
    description: 'Summarize long text into a concise version',
    parameters: {
      text: {
        type: 'string',
        description: 'Text to summarize',
        required: true,
      },
      maxLength: {
        type: 'number',
        description: 'Maximum length of summary (words)',
        required: false,
      },
      style: {
        type: 'string',
        description: 'Summary style',
        enum: ['concise', 'detailed', 'bullet-points'],
        required: false,
      },
    },
    returnType: 'string',
    examples: [
      'Summarize this long article',
      'Create a bullet-point summary of the text',
      'Summarize in 50 words maximum',
    ],
  })
  async textSummarizer(params: {
    text: string;
    maxLength?: number;
    style?: string;
  }): Promise<string> {
    const { text, maxLength = 100, style = 'concise' } = params;

    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      // Simple summarization (in a real implementation, you'd use NLP libraries)
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const words = text.split(/\s+/).filter((w) => w.length > 0);

      if (words.length <= maxLength) {
        return `Original text is already concise (${words.length} words). No summarization needed.`;
      }

      // Select key sentences (simplified approach)
      const keySentences = sentences.slice(
        0,
        Math.ceil(sentences.length * 0.3),
      );
      let summary = keySentences.join('. ');

      // Truncate if still too long
      const summaryWords = summary.split(/\s+/);
      if (summaryWords.length > maxLength) {
        summary = summaryWords.slice(0, maxLength).join(' ') + '...';
      }

      switch (style) {
        case 'bullet-points':
          const points = keySentences.map((s) => `• ${s.trim()}`);
          return `Summary (${summaryWords.length} words):\n${points.join('\n')}`;
        case 'detailed':
          return `Detailed Summary (${summaryWords.length} words):\n${summary}`;
        default:
          return `Summary (${summaryWords.length} words): ${summary}`;
      }
    } catch (error) {
      this.logger.error(
        'Text summarization failed',
        error,
        'ComprehensiveAIAgent',
      );
      throw new Error(`Text summarization failed: ${error.message}`);
    }
  }

  /**
   * Currency Converter Tool
   */
  @Tool({
    name: 'currency-converter',
    description:
      'Convert between different currencies using current exchange rates',
    parameters: {
      amount: {
        type: 'number',
        description: 'Amount to convert',
        required: true,
      },
      fromCurrency: {
        type: 'string',
        description: 'Source currency code (e.g., USD, EUR, GBP)',
        required: true,
      },
      toCurrency: {
        type: 'string',
        description: 'Target currency code (e.g., USD, EUR, GBP)',
        required: true,
      },
    },
    returnType: 'string',
    examples: [
      'Convert 100 USD to EUR',
      'What is 50 GBP in USD?',
      'Convert 1000 JPY to CAD',
    ],
  })
  async currencyConverter(params: {
    amount: number;
    fromCurrency: string;
    toCurrency: string;
  }): Promise<string> {
    const { amount, fromCurrency, toCurrency } = params;

    try {
      // Validate currencies (in a real implementation, you'd use a currency API)
      const validCurrencies = [
        'USD',
        'EUR',
        'GBP',
        'JPY',
        'CAD',
        'AUD',
        'CHF',
        'CNY',
      ];

      if (!validCurrencies.includes(fromCurrency.toUpperCase())) {
        throw new Error(`Invalid source currency: ${fromCurrency}`);
      }

      if (!validCurrencies.includes(toCurrency.toUpperCase())) {
        throw new Error(`Invalid target currency: ${toCurrency}`);
      }

      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      // Simulate exchange rates (in a real implementation, you'd fetch from API)
      const exchangeRates: Record<string, number> = {
        USD: 1.0,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
      };

      const fromRate = exchangeRates[fromCurrency.toUpperCase()];
      const toRate = exchangeRates[toCurrency.toUpperCase()];

      const convertedAmount = (amount / fromRate) * toRate;

      return `${amount} ${fromCurrency.toUpperCase()} = ${convertedAmount.toFixed(2)} ${toCurrency.toUpperCase()}`;
    } catch (error) {
      this.logger.error(
        'Currency conversion failed',
        error,
        'ComprehensiveAIAgent',
      );
      throw new Error(`Currency conversion failed: ${error.message}`);
    }
  }

  // ===== HELPER METHODS =====

  private sanitizeInput(input: string): string {
    // Remove excessive whitespace
    let sanitized = input.trim().replace(/\s+/g, ' ');

    // Remove potentially harmful characters
    sanitized = sanitized.replace(/[<>]/g, '');

    // Limit length
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000) + '...';
    }

    return sanitized;
  }

  private formatResponse(output: string): string {
    // Add a friendly prefix
    let formatted = `🤖 AI Assistant: ${output}`;

    // Ensure proper punctuation
    if (
      !formatted.endsWith('.') &&
      !formatted.endsWith('!') &&
      !formatted.endsWith('?') &&
      !formatted.endsWith(':')
    ) {
      formatted += '.';
    }

    return formatted;
  }
}
