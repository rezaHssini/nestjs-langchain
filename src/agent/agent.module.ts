import { Module, DynamicModule } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { AgentService } from './services/agent.service';
import { AgentProviderService } from './services/agent-provider.service';
import { AgentLoggerService } from './services/agent-logger.service';
import { ModuleDiscoveryService } from './services/module-discovery.service';
import { SecurityMiddleware } from './middleware/security.middleware';
import { AgentModuleConfig } from './interfaces/agent-module-config.interface';

// Factories
import { AgentFactory } from './factories/agent-factory';

// Strategies
import { DefaultToolCreationStrategy } from './strategies/tool-creation.strategy';

// Repositories
import { InMemoryAgentRepository } from './repositories/agent-repository';

// Observers
import {
  AgentEventSubject,
  AgentEventLogger,
} from './observers/agent-event.observer';

// Constants
import {
  AGENT_REPOSITORY_TOKEN,
  TOOL_CREATION_STRATEGY_TOKEN,
} from './constants/tokens';

@Module({})
export class AgentModule {
  /**
   * Create a configured AgentModule with design patterns and production features
   * @param config Configuration for the agent module
   * @returns DynamicModule The configured module
   */
  static forRoot(config?: AgentModuleConfig): DynamicModule {
    const { providers = [], aiProvider, logging, security } = config || {};

    // Create dynamic providers array with design pattern components and production services
    const dynamicProviders: any[] = [
      // Core services
      AgentService,
      AgentProviderService,
      ModuleDiscoveryService,

      // Logging service
      {
        provide: AgentLoggerService,
        useFactory: () => {
          const loggerService = new AgentLoggerService();
          if (logging) {
            loggerService.configure(logging);
          }
          return loggerService;
        },
      },

      // Security middleware
      {
        provide: SecurityMiddleware,
        useFactory: () => {
          const securityMiddleware = new SecurityMiddleware(security);
          return securityMiddleware;
        },
      },

      // Factories
      {
        provide: AgentFactory,
        useFactory: (loggerService: AgentLoggerService) => {
          const factory = new AgentFactory(loggerService);
          if (aiProvider) {
            factory.setAIProviderConfig(aiProvider);
          }

          return factory;
        },
        inject: [AgentLoggerService],
      },

      // Strategies - Provide the interface with the concrete implementation
      {
        provide: TOOL_CREATION_STRATEGY_TOKEN,
        useClass: DefaultToolCreationStrategy,
      },

      // Repositories - Provide the interface with the concrete implementation
      {
        provide: AGENT_REPOSITORY_TOKEN,
        useClass: InMemoryAgentRepository,
      },

      // Observers
      AgentEventSubject,
      AgentEventLogger,
    ];

    // Add custom providers (these will be instantiated by NestJS)
    if (providers.length > 0) {
      dynamicProviders.push(...providers);
    }

    // Create dynamic imports
    const dynamicImports = [DiscoveryModule];

    // Create dynamic controllers (empty for now since controller was deleted)
    const dynamicControllers: any[] = [];

    return {
      module: AgentModule,
      imports: dynamicImports,
      providers: dynamicProviders,
      controllers: dynamicControllers,
      exports: [
        AgentService,
        AgentProviderService,
        AgentLoggerService,
        SecurityMiddleware,
      ],
    };
  }

  /**
   * Create a simple AgentModule with default configuration
   * @returns DynamicModule The default module
   */
  static forFeature(): DynamicModule {
    return AgentModule.forRoot();
  }

  /**
   * Create a production-ready AgentModule with recommended settings
   * @returns DynamicModule The production module
   */
  static forProduction(): DynamicModule {
    return AgentModule.forRoot({
      logging: {
        enabled: true,
        level: 'info',
        format: 'json',
        detailedExecution: false,
        toolExecution: true,
        performance: true,
        requestResponse: true,
      },
      security: {
        rateLimit: {
          maxRequests: 100,
          windowMs: 60, // 1 minute
        },
        maxInputLength: 10000,
        sanitizeInput: true,
        allowedDomains: [
          'api.openai.com',
          'api.anthropic.com',
          'generativelanguage.googleapis.com',
        ],
      },

      agentService: {
        enableValidation: true,
        maxConcurrentExecutions: 10,
      },
    });
  }
}
