import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { AgentService } from './agent.service';
import { AgentProviderService } from './agent-provider.service';
import { IAgentProvider } from '../interfaces/agent-provider.interface';
import { AGENT_METADATA_KEY } from '../decorators/agent.decorator';
import { TOOL_METADATA_KEY } from '../decorators/tool.decorator';
import { AgentEventSubject } from '../observers/agent-event.observer';

@Injectable()
export class ModuleDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(ModuleDiscoveryService.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly agentService: AgentService,
    private readonly agentProviderService: AgentProviderService,
    private readonly eventSubject: AgentEventSubject,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting module discovery...');

    // Discover and register agents
    const providers = this.discoveryService.getProviders();
    const controllers = this.discoveryService.getControllers();

    // Process providers
    for (const provider of providers) {
      const instance = provider.instance;
      if (!instance) continue;

      const metatype = provider.metatype;
      if (!metatype) continue;

      // Check if this is an agent provider
      if (this.isAgentProvider(instance)) {
        this.agentProviderService.registerAgentProvider(instance);
        this.logger.log(`Registered agent provider: ${instance.agentName}`);
      }

      // Register agent metadata
      const agentMetadata = this.reflector.get(AGENT_METADATA_KEY, metatype);
      if (agentMetadata) {
        this.agentService.registerAgent(metatype, instance);
        this.logger.log(`Discovered agent: ${agentMetadata.name}`);
      }

      // Register tools
      const tools = this.reflector.get(TOOL_METADATA_KEY, metatype);
      if (tools) {
        this.agentService.registerTools(metatype, instance);
        this.logger.log(`Discovered tools for: ${metatype.name}`);
      }
    }

    // Process controllers
    for (const controller of controllers) {
      const instance = controller.instance;
      if (!instance) continue;

      const metatype = controller.metatype;
      if (!metatype) continue;

      // Check if this is an agent provider
      if (this.isAgentProvider(instance)) {
        this.agentProviderService.registerAgentProvider(instance);
        this.logger.log(
          `Registered agent provider in controller: ${instance.agentName}`,
        );
      }

      // Register agent metadata
      const agentMetadata = this.reflector.get(AGENT_METADATA_KEY, metatype);
      if (agentMetadata) {
        this.agentService.registerAgent(metatype, instance);
        this.logger.log(
          `Discovered agent in controller: ${agentMetadata.name}`,
        );
      }

      // Register tools
      const tools = this.reflector.get(TOOL_METADATA_KEY, metatype);
      if (tools) {
        this.agentService.registerTools(metatype, instance);
        this.logger.log(`Discovered tools in controller: ${metatype.name}`);
      }
    }

    this.logger.log('Module discovery completed');
    this.logger.log(
      `Registered agents: ${this.agentService.getRegisteredAgents().join(', ')}`,
    );
    this.logger.log(
      `Registered tools: ${this.agentService.getRegisteredTools().join(', ')}`,
    );
  }

  private isAgentProvider(instance: any): instance is IAgentProvider {
    return (
      instance &&
      typeof instance.agentName === 'string' &&
      typeof instance.execute === 'function' &&
      typeof instance.getMetadata === 'function'
    );
  }
}
