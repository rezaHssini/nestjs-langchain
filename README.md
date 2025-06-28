# NestJS LangChain - AI Agent Library

A powerful NestJS library for building AI agents with a unified tool system that makes it simple and intuitive to create both simple and complex AI tools. Built with enterprise-grade features including security, monitoring, performance optimization, and comprehensive logging.

## 🚀 Features

- **Unified Tool System**: One decorator (`@Tool`) handles all tool types
- **Type Safety**: Full TypeScript support with parameter validation
- **Design Patterns**: Implements Factory, Strategy, Repository, Command, and Observer patterns
- **Automatic Discovery**: Tools are automatically discovered and registered
- **Flexible Parameters**: Support for required, optional, and enum-constrained parameters
- **Multiple Return Types**: String, number, boolean, and object return types
- **Async Support**: All tools support async operations
- **Error Handling**: Built-in error handling and fallback mechanisms
- **Comprehensive Logging**: Configurable logging system with multiple levels and categories
- **Security Middleware**: Input validation, sanitization, rate limiting, and authentication
- **Performance Monitoring**: Built-in performance tracking and metrics
- **Resilience Features**: Retry mechanisms, circuit breakers, and timeout handling
- **Middleware System**: Before/after model call hooks for custom processing
- **Multiple AI Providers**: Support for OpenAI, Anthropic, Google, Azure, and custom providers
- **Enterprise Ready**: Production-grade features for scalability and reliability

## 🚀 Quick Installation & Setup

### Step 1: Install the package

```bash
npm install nest-langchain
```

### Step 2: Install peer dependencies

```bash
npm install @nestjs/common @nestjs/core @langchain/core langchain reflect-metadata rxjs
```

### Step 3: Install AI provider (choose one)

```bash
# For OpenAI (recommended for beginners)
npm install @langchain/openai

# For Anthropic Claude
npm install @langchain/anthropic

# For Google Gemini
npm install @langchain/google-genai
```

### Step 4: Set up environment variables

Create a `.env` file in your project root:

```env
# OpenAI (default)
OPENAI_API_KEY=your_openai_api_key_here

# Or for other providers
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

### Step 5: Create your first AI agent

```typescript
// my-agent.ts
import { Injectable } from '@nestjs/common';
import {
  Agent,
  Tool,
  BaseAgentProvider,
  AgentService,
  AgentLoggerService,
} from 'nest-langchain';
import { Reflector } from '@nestjs/core';

@Injectable()
@Agent({
  name: 'my-first-agent',
  description: 'A simple AI assistant',
  model: 'gpt-3.5-turbo',
})
export class MyFirstAgent extends BaseAgentProvider {
  readonly agentName = 'my-first-agent';

  constructor(
    agentService: AgentService,
    logger: AgentLoggerService,
    reflector: Reflector,
  ) {
    super(agentService, logger, reflector);
  }

  @Tool({
    name: 'greet',
    description: 'Greet someone by name',
    parameters: {
      name: {
        type: 'string',
        description: 'Name to greet',
        required: true,
      },
    },
    returnType: 'string',
  })
  async greet(name: string): Promise<string> {
    return `Hello, ${name}! Nice to meet you!`;
  }
}
```

### Step 6: Create a controller

```typescript
// my-agent.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { MyFirstAgent } from './my-agent';
import { AgentContext } from 'nest-langchain';

@Controller('agent')
export class MyAgentController {
  constructor(private readonly agent: MyFirstAgent) {}

  @Post('execute')
  async execute(@Body() request: { input: string }) {
    const context: AgentContext = {
      input: request.input,
      history: [],
    };

    return await this.agent.execute(context);
  }
}
```

### Step 7: Configure your module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { AgentModule } from 'nest-langchain';
import { MyFirstAgent, MyAgentController } from './my-agent';

@Module({
  imports: [AgentModule.forRoot()],
  providers: [MyFirstAgent],
  controllers: [MyAgentController],
})
export class AppModule {}
```

### Step 8: Test your agent

Start your application and send a POST request to `/agent/execute`:

```bash
curl -X POST http://localhost:3000/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"input": "Can you greet John?"}'
```

**That's it!** Your AI agent is now ready to use. 🎉

## 📦 Installation

### 1. Install the main package

```bash
npm install nest-langchain
```

### 2. Install required peer dependencies

```bash
npm install @nestjs/common @nestjs/core @langchain/core langchain reflect-metadata rxjs
```

### 3. Install AI provider packages (optional, based on your needs)

```bash
# For OpenAI (included by default)
npm install @langchain/openai

# For Anthropic
npm install @langchain/anthropic

# For Google
npm install @langchain/google-genai
```

## 🎯 Quick Start

### 1. Create an Agent

```typescript
import { Injectable } from '@nestjs/common';
import { Agent } from 'nest-langchain';
import { Tool } from 'nest-langchain';
import { BaseAgentProvider } from 'nest-langchain';
import { AgentService } from 'nest-langchain';
import { AgentLoggerService } from 'nest-langchain';
import { Reflector } from '@nestjs/core';

@Injectable()
@Agent({
  name: 'my-ai-agent',
  description: 'A helpful AI assistant',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: 'You are a helpful AI assistant.',
})
export class MyAIAgent extends BaseAgentProvider {
  readonly agentName = 'my-ai-agent';

  constructor(
    agentService: AgentService,
    logger: AgentLoggerService,
    reflector: Reflector,
  ) {
    super(agentService, logger, reflector);
  }

  // Simple tool with single parameter
  @Tool({
    name: 'get-weather',
    description: 'Get weather information for a city',
    parameters: {
      city: {
        type: 'string',
        description: 'City name',
        required: true,
      },
    },
    returnType: 'string',
  })
  async getWeather(city: string): Promise<string> {
    // Your weather logic here
    return `Weather in ${city}: Sunny, 72°F`;
  }

  // Complex tool with multiple parameters
  @Tool({
    name: 'calculate',
    description: 'Perform mathematical calculations',
    parameters: {
      operation: {
        type: 'string',
        description: 'Mathematical operation',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        required: true,
      },
      a: {
        type: 'number',
        description: 'First number',
        required: true,
      },
      b: {
        type: 'number',
        description: 'Second number',
        required: true,
      },
    },
    returnType: 'number',
  })
  async calculate(params: {
    operation: string;
    a: number;
    b: number;
  }): Promise<number> {
    const { operation, a, b } = params;

    switch (operation) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        return a / b;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}
```

### 2. Create a Controller

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { MyAIAgent } from './my-ai-agent';
import { AgentContext } from 'nest-langchain';

@Controller('ai-agent')
export class MyAIAgentController {
  constructor(private readonly aiAgent: MyAIAgent) {}

  @Post('execute')
  async executeAgent(@Body() request: { input: string; history?: any[] }) {
    const context: AgentContext = {
      input: request.input,
      history: request.history || [],
    };

    return await this.aiAgent.execute(context);
  }
}
```

### 3. Configure the Module

```typescript
import { Module } from '@nestjs/common';
import { AgentModule } from 'nest-langchain';
import { MyAIAgent, MyAIAgentController } from './my-ai-agent';

@Module({
  imports: [AgentModule.forRoot()],
  providers: [MyAIAgent],
  controllers: [MyAIAgentController],
})
export class AppModule {}
```

### 4. Set up environment variables

Create a `.env` file in your project root:

```env
# OpenAI (default)
OPENAI_API_KEY=your_openai_api_key_here

# Or for other providers
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
AZURE_OPENAI_API_KEY=your_azure_api_key_here
```

### 5. Run your application

```bash
npm run start:dev
```

Your AI agent is now ready! You can test it by sending a POST request to `/ai-agent/execute` with a JSON body like:

```json
{
  "input": "What's the weather like in New York?",
  "history": []
}
```

## 🤖 AI Provider Configuration

The library supports multiple AI providers through LangChain. You can configure the AI provider when registering the AgentModule.

### Supported Providers

- **OpenAI** (Default) - GPT models
- **Anthropic** - Claude models (requires `@langchain/anthropic`)
- **Google** - Gemini models (requires `@langchain/google-genai`)
- **Azure OpenAI** - Azure-hosted OpenAI models
- **Custom** - Your own LLM implementation

### Configuration Examples

#### OpenAI (Default)

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      aiProvider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
      },
    }),
  ],
})
export class AppModule {}
```

#### Anthropic Claude

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      aiProvider: {
        type: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
      },
    }),
  ],
})
export class AppModule {}
```

#### Google Gemini

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      aiProvider: {
        type: 'google',
        apiKey: process.env.GOOGLE_API_KEY,
      },
    }),
  ],
})
export class AppModule {}
```

#### Azure OpenAI

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      aiProvider: {
        type: 'azure',
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        config: {
          instanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
          deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
          apiVersion: '2023-05-15',
        },
      },
    }),
  ],
})
export class AppModule {}
```

#### Custom LLM

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      aiProvider: {
        type: 'custom',
        customLLM: yourCustomLLMInstance,
      },
    }),
  ],
})
export class AppModule {}
```

#### Auto-Detection (Environment Variables)

```typescript
@Module({
  imports: [AgentModule.forRoot()], // No configuration needed
})
export class AppModule {}
```

The module will automatically detect available API keys:

- `OPENAI_API_KEY` → OpenAI
- `ANTHROPIC_API_KEY` → Anthropic
- `GOOGLE_API_KEY` → Google
- `AZURE_OPENAI_API_KEY` → Azure OpenAI

### Advanced Configuration

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      aiProvider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1', // Custom endpoint
        timeout: 30000,
        maxRetries: 3,
      },
      agentService: {
        defaultModel: 'gpt-4',
        defaultTemperature: 0.7,
        defaultMaxTokens: 2000,
        enableValidation: true,
        maxConcurrentExecutions: 10,
      },
    }),
  ],
})
export class AppModule {}
```

## 🔒 Security Configuration

The library includes comprehensive security features to protect your AI agents.

### Basic Security Configuration

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      rateLimit: {
        maxRequests: 100,
        windowMs: 60, // 1 minute
        keyGenerator: (req) => req.ip, // Rate limit by IP
      },
      maxInputLength: 10000,
      sanitizeInput: true,
      allowedDomains: ['api.openai.com', 'api.anthropic.com'],
    }),
  ],
})
export class AppModule {}
```

### Authentication Configuration

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      authentication: {
        enabled: true,
        type: 'jwt',
        config: {
          secret: process.env.JWT_SECRET,
          issuer: 'your-app',
        },
      },
      rateLimit: {
        maxRequests: 50,
        windowMs: 60,
      },
    }),
  ],
})
export class AppModule {}
```

### Security Features

- **Rate Limiting**: Configurable rate limits per user/IP
- **Input Validation**: Length limits and content validation
- **Input Sanitization**: Automatic removal of malicious content
- **Domain Whitelisting**: Control external API access
- **Authentication**: JWT, API key, and OAuth support
- **Malicious Content Detection**: SQL injection, XSS, command injection protection

## 🔄 Middleware System

The library includes a powerful middleware system that allows you to hook into the agent execution process for custom preprocessing and post-processing.

### Middleware Implementation

```typescript
import { Injectable } from '@nestjs/common';
import {
  Agent,
  Tool,
  BaseAgentProvider,
  AgentService,
  AgentLoggerService,
} from 'nest-langchain';
import { AgentContext, AgentResponse } from 'nest-langchain';
import { Reflector } from '@nestjs/core';

@Injectable()
@Agent({
  name: 'my-agent',
  description: 'An agent with middleware',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
})
export class MyAgent extends BaseAgentProvider {
  readonly agentName = 'my-agent';

  constructor(
    agentService: AgentService,
    logger: AgentLoggerService,
    reflector: Reflector,
  ) {
    super(agentService, logger, reflector);
  }

  // Before Model Call Middleware
  public async beforeModelCall(
    context: AgentContext,
    metadata: any,
  ): Promise<AgentContext> {
    // Input validation and preprocessing
    const sanitizedInput = context.input.trim().replace(/\s+/g, ' ');

    return {
      ...context,
      input: sanitizedInput,
      metadata: {
        ...context.metadata,
        preprocessed: true,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // After Model Call Middleware
  public async afterModelCall(
    context: AgentContext,
    response: AgentResponse,
    metadata: any,
  ): Promise<AgentResponse> {
    // Response formatting and enhancement
    const formattedOutput = `Assistant: ${response.output}`;

    return {
      ...response,
      output: formattedOutput,
      metadata: {
        ...response.metadata,
        postprocessed: true,
        processingTime: new Date().toISOString(),
      },
    };
  }

  @Tool({
    name: 'echo',
    description: 'Echo back the input',
    parameters: {
      message: {
        type: 'string',
        description: 'Message to echo',
        required: true,
      },
    },
    returnType: 'string',
  })
  async echo(message: string): Promise<string> {
    return `Echo: ${message}`;
  }
}
```

### Input Validation Middleware

```typescript
public async beforeModelCall(
  context: AgentContext,
  metadata: any,
): Promise<AgentContext> {
  // Validate input
  if (!context.input || context.input.trim().length === 0) {
    throw new Error('Input cannot be empty');
  }

  // Check for inappropriate content
  const inappropriateWords = ['spam', 'inappropriate', 'blocked'];
  const hasInappropriateContent = inappropriateWords.some(word =>
    context.input.toLowerCase().includes(word)
  );

  if (hasInappropriateContent) {
    return {
      ...context,
      input: 'I apologize, but I cannot process that request.',
      metadata: {
        ...context.metadata,
        validationFailed: true,
        reason: 'inappropriate_content',
      },
    };
  }

  return context;
}
```

### Response Formatting Middleware

```typescript
public async afterModelCall(
  context: AgentContext,
  response: AgentResponse,
  metadata: any,
): Promise<AgentResponse> {
  // Add formatting and styling
  let formattedOutput = response.output;

  // Add emoji prefix
  formattedOutput = `🤖 ${formattedOutput}`;

  // Ensure proper punctuation
  if (!formattedOutput.endsWith('.') && !formattedOutput.endsWith('!') && !formattedOutput.endsWith('?')) {
    formattedOutput += '.';
  }

  // Add metadata
  return {
    ...response,
    output: formattedOutput,
    metadata: {
      ...response.metadata,
      formatted: true,
      originalLength: response.output.length,
      formattedLength: formattedOutput.length,
    },
  };
}
```

## 🏗️ Module Configuration Methods

The AgentModule provides several static methods for different use cases:

### Basic Configuration

```typescript
@Module({
  imports: [AgentModule.forRoot()],
})
export class AppModule {}
```

### Feature Module (for libraries)

```typescript
@Module({
  imports: [AgentModule.forFeature()],
})
export class FeatureModule {}
```

### Production-Ready Configuration

```typescript
@Module({
  imports: [AgentModule.forProduction()],
})
export class AppModule {}
```

The `forProduction()` method automatically configures:

- Optimized logging (info level, JSON format)
- Security settings (rate limiting, input validation)
- Performance settings (validation enabled, concurrent execution limits)

## 📊 Logging Configuration

The agent module includes a comprehensive logging system that can be configured through the module registration.

### Basic Logging Configuration

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      enabled: true,
      level: 'info',
      toolExecution: true,
      requestResponse: true,
    }),
  ],
})
export class AppModule {}
```

### Development Logging (Detailed)

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      enabled: true,
      level: 'debug',
      detailedExecution: true,
      toolExecution: true,
      performance: true,
      requestResponse: true,
      format: 'json',
    }),
  ],
})
export class AppModule {}
```

### Production Logging (Minimal)

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      enabled: true,
      level: 'warn',
      toolExecution: false,
      performance: true,
      requestResponse: false,
      file: {
        enabled: true,
        path: './logs/agent.log',
        maxSize: '10m',
        maxFiles: 5,
      },
    }),
  ],
})
export class AppModule {}
```

### Custom Logger

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      enabled: true,
      level: 'info',
      customLogger: {
        debug: (message: string, context?: string) =>
          console.log(`[DEBUG] ${context}: ${message}`),
        log: (message: string, context?: string) =>
          console.log(`[INFO] ${context}: ${message}`),
        warn: (message: string, context?: string) =>
          console.warn(`[WARN] ${context}: ${message}`),
        error: (message: string, error?: any, context?: string) =>
          console.error(`[ERROR] ${context}: ${message}`, error),
      },
    }),
  ],
})
export class AppModule {}
```

### Using the Logger Service

```typescript
import { Injectable } from '@nestjs/common';
import { AgentLoggerService } from 'nest-langchain';

@Injectable()
export class MyCustomService {
  constructor(private readonly agentLogger: AgentLoggerService) {}

  async performOperation(): Promise<void> {
    const startTime = Date.now();

    this.agentLogger.info('Starting custom operation', 'MyCustomService');

    try {
      // Your custom logic here
      await this.someAsyncOperation();

      const duration = Date.now() - startTime;
      this.agentLogger.logPerformance('Custom Operation', duration, {
        operation: 'someAsyncOperation',
        success: true,
      });

      this.agentLogger.info(
        'Custom operation completed successfully',
        'MyCustomService',
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.agentLogger.error(
        'Custom operation failed',
        error,
        'MyCustomService',
      );
      this.agentLogger.logPerformance('Custom Operation Failed', duration, {
        operation: 'someAsyncOperation',
        error: error.message,
      });
      throw error;
    }
  }
}
```

### Disable Logging Completely

To disable all logging (useful for production environments):

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      enabled: false, // This disables ALL logging
    }),
  ],
})
export class AppModule {}
```

## ⚙️ Advanced Configuration

### Complete Configuration Example

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      // AI Provider Configuration
      aiProvider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
        timeout: 30000,
        maxRetries: 3,
        config: {
          organization: process.env.OPENAI_ORG_ID,
        },
      },

      // Logging Configuration
      logging: {
        enabled: true,
        level: 'debug',
        detailedExecution: true,
        toolExecution: true,
        performance: true,
        requestResponse: true,
        format: 'json',
        file: {
          enabled: true,
          path: './logs/agent.log',
          maxSize: '10m',
          maxFiles: 5,
        },
      },

      // Security Configuration
      security: {
        rateLimit: {
          maxRequests: 100,
          windowMs: 60,
          keyGenerator: (req) => req.ip,
        },
        maxInputLength: 10000,
        sanitizeInput: true,
        allowedDomains: ['api.openai.com', 'api.anthropic.com'],
        authentication: {
          enabled: true,
          type: 'jwt',
          config: {
            secret: process.env.JWT_SECRET,
            issuer: 'your-app',
          },
        },
      },

      // Agent Service Configuration
      agentService: {
        defaultModel: 'gpt-4',
        defaultTemperature: 0.7,
        defaultMaxTokens: 2000,
        enableValidation: true,
        maxConcurrentExecutions: 10,
      },

      // Custom Providers
      providers: [MyCustomAgent],
    }),
  ],
})
export class AppModule {}
```

### Performance Configuration

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      performance: {
        enableCaching: true,
        cacheTTL: 3600,
        enableConnectionPooling: true,
        poolSize: 10,
        requestTimeout: 30000,
        enableCompression: true,
      },
    }),
  ],
})
export class AppModule {}
```

### Resilience Configuration

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      resilience: {
        enableRetry: true,
        retry: {
          maxAttempts: 3,
          backoffStrategy: 'exponential',
          backoffDelay: 1000,
        },
        enableCircuitBreaker: true,
        circuitBreaker: {
          failureThreshold: 5,
          recoveryTimeout: 60000,
          halfOpenState: true,
        },
        enableTimeout: true,
        timeout: {
          request: 30000,
          tool: 10000,
          agent: 60000,
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Monitoring Configuration

```typescript
@Module({
  imports: [
    AgentModule.forRoot({
      monitoring: {
        metricsEnabled: true,
        tracingEnabled: true,
        alertingEnabled: true,
        metricsEndpoint: {
          enabled: true,
          path: '/metrics',
        },
        healthCheck: {
          enabled: true,
          path: '/health',
          timeout: 5000,
        },
      },
    }),
  ],
})
export class AppModule {}
```

## 🛠️ Tool Decorator Reference

The `@Tool` decorator is the unified way to define any type of tool. Here's the complete interface:

```typescript
interface ToolMetadata {
  name: string; // Tool name (required)
  description: string; // Tool description (required)
  category?: string; // Tool category (optional)
  tags?: string[]; // Tags for categorization (optional)
  parameters?: Record<string, ToolParameter>; // Parameter definitions (optional)
  returnType?: 'string' | 'number' | 'boolean' | 'object'; // Return type (optional)
  examples?: string[]; // Usage examples (optional)
  isAsync?: boolean; // Whether tool is async (optional)
}

interface ToolParameter {
  type: 'string' | 'number' | 'boolean'; // Parameter type (required)
  description: string; // Parameter description (required)
  enum?: string[]; // Allowed values for string parameters (optional)
  required?: boolean; // Whether parameter is required (default: false)
}
```

## 📝 Tool Examples

### Simple Tool (Single Parameter)

```typescript
@Tool({
  name: 'echo',
  description: 'Echo back the input text',
  parameters: {
    text: {
      type: 'string',
      description: 'Text to echo back',
      required: true,
    },
  },
  returnType: 'string',
})
async echo(text: string): Promise<string> {
  return `Echo: ${text}`;
}
```

### Complex Tool (Multiple Parameters)

```typescript
@Tool({
  name: 'format-date',
  description: 'Format a date in different styles',
  parameters: {
    date: {
      type: 'string',
      description: 'Date string to format',
      required: true,
    },
    format: {
      type: 'string',
      description: 'Output format style',
      enum: ['short', 'long', 'iso', 'relative'],
      required: false,
    },
  },
  returnType: 'string',
})
async formatDate(params: { date: string; format?: string }): Promise<string> {
  const { date, format = 'short' } = params;
  // Your date formatting logic here
  return formattedDate;
}
```

### Tool with Validation

```typescript
@Tool({
  name: 'validate-email',
  description: 'Validate email address format',
  parameters: {
    email: {
      type: 'string',
      description: 'Email address to validate',
      required: true,
    },
  },
  returnType: 'boolean',
})
async validateEmail(email: string): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Tool with Optional Parameters

```typescript
@Tool({
  name: 'generate-password',
  description: 'Generate a secure password',
  parameters: {
    length: {
      type: 'number',
      description: 'Password length (8-50 characters)',
      required: false,
    },
    includeSymbols: {
      type: 'boolean',
      description: 'Include special symbols',
      required: false,
    },
  },
  returnType: 'string',
})
async generatePassword(params: { length?: number; includeSymbols?: boolean }): Promise<string> {
  const { length = 12, includeSymbols = false } = params;
  // Your password generation logic here
  return generatedPassword;
}
```

## 🔧 Advanced Usage

### Custom Tool Categories

```typescript
@Tool({
  name: 'analyze-sentiment',
  description: 'Analyze text sentiment',
  category: 'nlp',
  tags: ['sentiment', 'analysis', 'text'],
  parameters: {
    text: {
      type: 'string',
      description: 'Text to analyze',
      required: true,
    },
  },
  returnType: 'string',
  examples: [
    'analyze sentiment of "I love this product"',
    'what is the sentiment of "This is terrible"?'
  ],
})
async analyzeSentiment(text: string): Promise<string> {
  // Your sentiment analysis logic here
  return sentiment;
}
```

### Error Handling

```typescript
@Tool({
  name: 'divide-numbers',
  description: 'Divide two numbers',
  parameters: {
    a: { type: 'number', description: 'Dividend', required: true },
    b: { type: 'number', description: 'Divisor', required: true },
  },
  returnType: 'number',
})
async divideNumbers(params: { a: number; b: number }): Promise<number> {
  const { a, b } = params;

  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }

  return a / b;
}
```

## 🏗️ Architecture

The library uses several design patterns:

- **Factory Pattern**: `AgentFactory` creates LLMs and system prompts
- **Strategy Pattern**: `IToolCreationStrategy` handles tool creation
- **Repository Pattern**: `IAgentRepository` manages agent and tool storage
- **Command Pattern**: `IAgentCommand` handles agent execution
- **Observer Pattern**: `AgentEventSubject` manages event notifications
- **Middleware Pattern**: Before/after hooks for custom processing

## 🚀 Benefits of Unified Tool System

1. **Simplicity**: One decorator for all tool types
2. **Consistency**: Uniform interface across all tools
3. **Flexibility**: Supports both simple and complex tools
4. **Type Safety**: Full TypeScript support with parameter validation
5. **Extensibility**: Easy to add new parameter types and features
6. **Maintainability**: Single codebase for tool handling
7. **Security**: Built-in input validation and sanitization
8. **Performance**: Optimized execution with caching and monitoring
9. **Reliability**: Error handling and resilience features

## 📚 API Reference

### Agent Decorator

```typescript
@Agent({
  name: string;              // Agent name
  description: string;       // Agent description
  model?: string;           // LLM model name
  temperature?: number;     // Model temperature
  maxTokens?: number;       // Maximum tokens
  systemPrompt?: string;    // System prompt
  memory?: boolean;         // Enable memory
})
```

### Tool Decorator

```typescript
@Tool(metadata: ToolMetadata)
```

### BaseAgentProvider

```typescript
abstract class BaseAgentProvider {
  abstract readonly agentName: string;
  execute(context: AgentContext): Promise<AgentResponse>;

  // Optional middleware methods
  beforeModelCall?(context: AgentContext, metadata: any): Promise<AgentContext>;
  afterModelCall?(
    context: AgentContext,
    response: AgentResponse,
    metadata: any,
  ): Promise<AgentResponse>;
}
```

### Configuration Interfaces

```typescript
interface AgentModuleConfig {
  providers?: Type<IAgentProvider>[];
  aiProvider?: AIProviderConfig;
  logging?: LoggingConfig;
  security?: SecurityConfig;
  performance?: PerformanceConfig;
  resilience?: ResilienceConfig;
  monitoring?: MonitoringConfig;
  agentService?: {
    defaultModel?: string;
    defaultTemperature?: number;
    defaultMaxTokens?: number;
    enableValidation?: boolean;
    maxConcurrentExecutions?: number;
  };
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
