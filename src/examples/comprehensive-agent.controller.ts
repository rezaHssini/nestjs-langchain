import {
  Controller,
  Post,
  Body,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { ComprehensiveAIAgent } from './comprehensive-ai-agent.example';
import { AgentContext } from '../agent/interfaces/agent.interface';
import { ApiTags } from '@nestjs/swagger';
import { RequestDto } from './request.dto';

@ApiTags('comprehensive-agent')
@Controller('comprehensive-agent')
export class ComprehensiveAgentController {
  constructor(private readonly comprehensiveAgent: ComprehensiveAIAgent) {}

  @Post('execute')
  async executeAgent(@Body(new ValidationPipe()) request: RequestDto) {
    // Validate request body
    if (!request) {
      throw new BadRequestException('Request body is required');
    }

    if (!request.input || typeof request.input !== 'string') {
      throw new BadRequestException('Valid input string is required');
    }

    if (request.input.trim().length === 0) {
      throw new BadRequestException('Input cannot be empty');
    }

    const context: AgentContext = {
      input: request.input?.trim() || '',
      history: request.history || [],
      sessionId: request.sessionId || '',
      metadata: {
        source: 'comprehensive-agent-controller',
        timestamp: new Date().toISOString(),
      },
    };

    return await this.comprehensiveAgent.execute(context);
  }
}
