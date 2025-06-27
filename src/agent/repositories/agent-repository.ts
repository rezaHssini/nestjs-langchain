import { Injectable } from '@nestjs/common';
import { AgentConfig } from '../interfaces/agent.interface';
import { ToolMetadata } from '../decorators/tool.decorator';

/**
 * Repository interface for agent data management
 * Implements the Repository Pattern
 */
export interface IAgentRepository {
  saveAgent(name: string, metadata: AgentConfig, instance: any): void;
  getAgent(name: string): { metadata: AgentConfig; instance: any } | undefined;
  getAllAgents(): Map<string, { metadata: AgentConfig; instance: any }>;
  deleteAgent(name: string): boolean;
  agentExists(name: string): boolean;

  saveTool(name: string, tool: ToolMetadata & { instance: any }): void;
  getTool(name: string): (ToolMetadata & { instance: any }) | undefined;
  getAllTools(): Map<string, ToolMetadata & { instance: any }>;
  deleteTool(name: string): boolean;
}

/**
 * In-memory implementation of agent repository
 */
@Injectable()
export class InMemoryAgentRepository implements IAgentRepository {
  private agents = new Map<string, { metadata: AgentConfig; instance: any }>();
  private tools = new Map<string, ToolMetadata & { instance: any }>();

  // Agent methods
  saveAgent(name: string, metadata: AgentConfig, instance: any): void {
    this.agents.set(name, { metadata, instance });
  }

  getAgent(name: string): { metadata: AgentConfig; instance: any } | undefined {
    return this.agents.get(name);
  }

  getAllAgents(): Map<string, { metadata: AgentConfig; instance: any }> {
    return new Map(this.agents);
  }

  deleteAgent(name: string): boolean {
    return this.agents.delete(name);
  }

  agentExists(name: string): boolean {
    return this.agents.has(name);
  }

  // Tool methods
  saveTool(name: string, tool: ToolMetadata & { instance: any }): void {
    this.tools.set(name, tool);
  }

  getTool(name: string): (ToolMetadata & { instance: any }) | undefined {
    return this.tools.get(name);
  }

  getAllTools(): Map<string, ToolMetadata & { instance: any }> {
    return new Map(this.tools);
  }

  deleteTool(name: string): boolean {
    return this.tools.delete(name);
  }
}
