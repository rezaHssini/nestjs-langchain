export interface AgentConfig {
  name: string;
  description: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  skills?: string[];
  memory?: boolean;
  tools?: string[];
}

export interface SkillConfig {
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  methodName: string;
  target: any;
}

export interface FunctionConfig {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  returnType?: string;
  examples?: string[];
  methodName: string;
  target: any;
}

export interface MemoryConfig {
  type: 'conversation' | 'vector' | 'summary' | 'custom';
  maxTokens?: number;
  returnMessages?: boolean;
  inputKey?: string;
  outputKey?: string;
  memoryKey?: string;
  methodName: string;
  target: any;
}

export interface AgentContext {
  input: string;
  history?: Array<{ role: string; content: string }>;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export interface AgentResponse {
  output: string;
  metadata?: Record<string, any>;
  skills?: string[];
  functions?: string[];
  memory?: any;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}
