import { Injectable } from '@nestjs/common';
import { AgentContext, AgentResponse } from '../interfaces/agent.interface';
import { AgentLoggerService } from '../services/agent-logger.service';

/**
 * Agent event types
 */
export enum AgentEventType {
  AGENT_REGISTERED = 'agent_registered',
  AGENT_EXECUTED = 'agent_executed',
  AGENT_ERROR = 'agent_error',
  TOOL_REGISTERED = 'tool_registered',
}

/**
 * Agent event interface
 */
export interface IAgentEvent {
  type: AgentEventType;
  agentName?: string;
  timestamp: Date;
  data?: any;
}

/**
 * Observer interface for agent events
 * Implements the Observer Pattern
 */
export interface IAgentEventObserver {
  onAgentEvent(event: IAgentEvent): void;
}

/**
 * Logging observer for agent events
 */
@Injectable()
export class AgentEventLogger implements IAgentEventObserver {
  constructor(private readonly logger: AgentLoggerService) {}

  onAgentEvent(event: IAgentEvent): void {
    switch (event.type) {
      case AgentEventType.AGENT_REGISTERED:
        this.logger.info(`Agent registered: ${event.agentName}`, 'AgentEvent');
        break;
      case AgentEventType.AGENT_EXECUTED:
        this.logger.info(`Agent executed: ${event.agentName}`, 'AgentEvent');
        break;
      case AgentEventType.AGENT_ERROR:
        this.logger.error(
          `Agent error: ${event.agentName} - ${event.data?.error}`,
          null,
          'AgentEvent',
        );
        break;
      case AgentEventType.TOOL_REGISTERED:
        this.logger.info(
          `Tool registered: ${event.data?.toolName}`,
          'AgentEvent',
        );
        break;
    }
  }
}

/**
 * Agent event subject (publisher)
 */
@Injectable()
export class AgentEventSubject {
  private observers: IAgentEventObserver[] = [];

  addObserver(observer: IAgentEventObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: IAgentEventObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notifyObservers(event: IAgentEvent): void {
    this.observers.forEach((observer) => observer.onAgentEvent(event));
  }

  emitAgentRegistered(agentName: string): void {
    this.notifyObservers({
      type: AgentEventType.AGENT_REGISTERED,
      agentName,
      timestamp: new Date(),
    });
  }

  emitAgentExecuted(
    agentName: string,
    context: AgentContext,
    response: AgentResponse,
  ): void {
    this.notifyObservers({
      type: AgentEventType.AGENT_EXECUTED,
      agentName,
      timestamp: new Date(),
      data: { context, response },
    });
  }

  emitAgentError(agentName: string, error: Error): void {
    this.notifyObservers({
      type: AgentEventType.AGENT_ERROR,
      agentName,
      timestamp: new Date(),
      data: { error: error.message },
    });
  }

  emitToolRegistered(toolName: string): void {
    this.notifyObservers({
      type: AgentEventType.TOOL_REGISTERED,
      timestamp: new Date(),
      data: { toolName },
    });
  }
}
