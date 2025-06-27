import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class RequestDto {
  @ApiProperty({
    description: 'The input to the agent',
    example: 'What is the weather in Tokyo?',
  })
  @IsNotEmpty()
  @IsString()
  input: string;

  @ApiProperty({
    description: 'The session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    description: 'The history of the conversation',
    example: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  })
  @IsOptional()
  @IsArray()
  history?: any[];
}
