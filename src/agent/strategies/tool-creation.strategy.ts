import { DynamicTool } from '@langchain/core/tools';
import { Injectable } from '@nestjs/common';
import { ToolMetadata } from '../decorators/tool.decorator';
import { AgentLoggerService } from '../services/agent-logger.service';

/**
 * Strategy interface for tool creation
 * Implements the Strategy Pattern
 */
export interface IToolCreationStrategy {
  createToolsFromMetadata(
    tools: Map<string, ToolMetadata & { instance: any }>,
  ): DynamicTool[];
}

/**
 * Default tool creation strategy
 */
@Injectable()
export class DefaultToolCreationStrategy implements IToolCreationStrategy {
  constructor(private readonly logger: AgentLoggerService) {}

  createToolsFromMetadata(
    tools: Map<string, ToolMetadata & { instance: any }>,
  ): DynamicTool[] {
    const dynamicTools: DynamicTool[] = [];

    for (const [, tool] of tools) {
      dynamicTools.push(
        new DynamicTool({
          name: tool.name,
          description: tool.description,
          func: async (input: string) => {
            try {
              this.logger.debug(
                `Tool ${tool.name} called with input: ${input}`,
                'ToolExecution',
              );
              const parsedInput = this.parseInput(input, tool);
              this.logger.debug(
                `Tool ${tool.name} parsed input: ${JSON.stringify(parsedInput)}`,
                'ToolExecution',
              );
              const result = await tool.instance[tool.methodName](parsedInput);
              this.logger.debug(
                `Tool ${tool.name} result: ${JSON.stringify(result)}`,
                'ToolExecution',
              );
              return String(result);
            } catch (error) {
              this.logger.error(
                `Tool ${tool.name} error: ${error.message}`,
                error,
                'ToolExecution',
              );
              return `Error: ${error.message}`;
            }
          },
        }),
      );
    }

    return dynamicTools;
  }

  private parseInput(input: string, tool: ToolMetadata): any {
    try {
      // First, try to parse as JSON
      const jsonInput = JSON.parse(input);

      // If tool has parameters, try to extract them from JSON
      if (tool.parameters) {
        const extractedParams: any = {};
        let hasExtractedParams = false;

        for (const [paramName, paramConfig] of Object.entries(
          tool.parameters,
        )) {
          if (jsonInput[paramName] !== undefined) {
            extractedParams[paramName] = jsonInput[paramName];
            hasExtractedParams = true;
          } else if (paramConfig.required) {
            // For required parameters, try to extract from the input string
            const extracted = this.extractParameterFromString(
              input,
              paramName,
              paramConfig,
            );
            if (extracted !== null) {
              extractedParams[paramName] = extracted;
              hasExtractedParams = true;
            } else {
              throw new Error(
                `Required parameter '${paramName}' not found in input`,
              );
            }
          }
        }

        if (hasExtractedParams) {
          this.logger.debug(
            `Extracted parameters for ${tool.name}: ${JSON.stringify(extractedParams)}`,
            'ToolExecution',
          );
          return extractedParams;
        }
      }

      // Fallback to simple input extraction
      const fallbackInput =
        jsonInput.input ||
        Object.values(jsonInput).find((val) => typeof val === 'string') ||
        input;

      this.logger.debug(
        `Using fallback input for ${tool.name}: ${fallbackInput}`,
        'ToolExecution',
      );
      return fallbackInput;
    } catch (parseError) {
      // If JSON parsing fails, try to extract parameters from string
      if (tool.parameters) {
        const extractedParams: any = {};
        let hasExtractedParams = false;

        for (const [paramName, paramConfig] of Object.entries(
          tool.parameters,
        )) {
          const extracted = this.extractParameterFromString(
            input,
            paramName,
            paramConfig,
          );
          if (extracted !== null) {
            extractedParams[paramName] = extracted;
            hasExtractedParams = true;
          } else if (paramConfig.required) {
            throw new Error(
              `Required parameter '${paramName}' not found in input: "${input}"`,
            );
          }
        }

        if (hasExtractedParams) {
          this.logger.debug(
            `Extracted parameters from string for ${tool.name}: ${JSON.stringify(extractedParams)}`,
            'ToolExecution',
          );
          return extractedParams;
        }
      }

      this.logger.debug(
        `Using raw input for ${tool.name}: ${input}`,
        'ToolExecution',
      );
      return input;
    }
  }

  private extractParameterFromString(
    input: string,
    paramName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paramConfig: any,
  ): any {
    // Special handling for common parameter types
    switch (paramName) {
      case 'city':
        // Look for city patterns
        const cityMatch = input.match(
          /(?:in|for|at)\s+([A-Za-z\s]+?)(?:\?|$|,|\.)/i,
        );
        if (cityMatch) {
          return cityMatch[1].trim();
        }
        // Look for quoted city names
        const quotedCityMatch = input.match(/"([^"]+)"/);
        if (quotedCityMatch) {
          return quotedCityMatch[1].trim();
        }
        break;

      case 'operation':
        // Look for mathematical operations
        const operationMatch = input.match(
          /(add|subtract|multiply|divide|power|sqrt)/i,
        );
        if (operationMatch) {
          return operationMatch[1].toLowerCase();
        }
        break;

      case 'a':
      case 'b':
        // Look for numbers
        const numberMatch = input.match(/(\d+(?:\.\d+)?)/g);
        if (numberMatch) {
          const numbers = numberMatch.map((n) => parseFloat(n));
          if (paramName === 'a' && numbers.length > 0) {
            return numbers[0];
          } else if (paramName === 'b' && numbers.length > 1) {
            return numbers[1];
          }
        }
        break;

      case 'text':
        // Look for quoted text
        const textMatch = input.match(/"([^"]+)"/);
        if (textMatch) {
          return textMatch[1].trim();
        }
        break;

      case 'email':
        // Look for email patterns
        const emailMatch = input.match(
          /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
        );
        if (emailMatch) {
          return emailMatch[1];
        }
        break;
    }

    return null;
  }
}
