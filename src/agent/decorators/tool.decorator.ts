export const TOOL_METADATA_KEY = 'tool';

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean';
  description: string;
  enum?: string[];
  required?: boolean;
}

export interface ToolMetadata {
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  parameters?: Record<string, ToolParameter>;
  returnType?: 'string' | 'number' | 'boolean' | 'object';
  examples?: string[];
  isAsync?: boolean;
  methodName?: string;
}

export const Tool = (metadata: ToolMetadata) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const existingTools =
      Reflect.getMetadata(TOOL_METADATA_KEY, target.constructor) || {};

    existingTools[propertyKey] = {
      ...metadata,
      methodName: propertyKey,
    };

    Reflect.defineMetadata(
      TOOL_METADATA_KEY,
      existingTools,
      target.constructor,
    );
    return descriptor;
  };
};
