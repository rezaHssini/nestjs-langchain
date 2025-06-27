// Core module
export { AgentModule } from './agent.module';

// Constants
export {
  AGENT_REPOSITORY_TOKEN,
  TOOL_CREATION_STRATEGY_TOKEN,
} from './constants/tokens';

// Services
export { AgentService } from './services/agent.service';
export { AgentProviderService } from './services/agent-provider.service';
export { AgentLoggerService } from './services/agent-logger.service';
export { ModuleDiscoveryService } from './services/module-discovery.service';

// Interfaces
export { IAgentProvider } from './interfaces/agent-provider.interface';
export {
  AgentContext,
  AgentResponse,
  AgentConfig,
} from './interfaces/agent.interface';
export {
  AgentModuleConfig,
  AIProviderConfig,
  LoggingConfig,
} from './interfaces/agent-module-config.interface';

// Abstract classes
export { BaseAgentProvider } from './abstracts/base-agent-provider.abstract';

// Decorators
export { Agent } from './decorators/agent.decorator';
export { Tool } from './decorators/tool.decorator';

// Factories
export { AgentFactory } from './factories/agent-factory';

// Strategies
export {
  IToolCreationStrategy,
  DefaultToolCreationStrategy,
} from './strategies/tool-creation.strategy';

// Repositories
export {
  IAgentRepository,
  InMemoryAgentRepository,
} from './repositories/agent-repository';

// Commands
export {
  IAgentCommand,
  ExecuteAgentCommand,
  FallbackToolExecutionCommand,
} from './commands/agent-execution.command';

// Observers
export {
  AgentEventSubject,
  AgentEventLogger,
} from './observers/agent-event.observer';
