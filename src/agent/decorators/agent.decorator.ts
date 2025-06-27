export const AGENT_METADATA_KEY = 'agent';

export interface AgentMetadata {
  name: string;
  description: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  memory?: boolean;
  tools?: string[];
}

export const Agent = (metadata: AgentMetadata) => {
  return (target: any) => {
    Reflect.defineMetadata(AGENT_METADATA_KEY, metadata, target);
    return target;
  };
};
