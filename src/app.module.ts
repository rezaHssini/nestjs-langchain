import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { ComprehensiveAIAgent } from './examples/comprehensive-ai-agent.example';
import { ComprehensiveAgentController } from './examples/comprehensive-agent.controller';

@Module({
  imports: [
    AgentModule.forRoot({
      // AI Provider Configuration
      aiProvider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        config: {
          timeout: 30000,
          maxRetries: 3,
        },
      },

      // Logging Configuration - Comprehensive for development
      logging: {
        enabled: true,
        level: 'debug',
        detailedExecution: true,
        toolExecution: true,
        performance: true,
        requestResponse: true,
        customLogger: {
          debug: (message: string, context?: string) =>
            console.log(`[DEBUG] ${context}: ${message}`),
          log: (message: string, context?: string) =>
            console.log(`[INFO] ${context}: ${message}`),
          warn: (message: string, context?: string) =>
            console.warn(`[WARN] ${context}: ${message}`),
          error: (message: string, error?: any, context?: string) =>
            console.error(`[ERROR] ${context}: ${message}`, error),
        },
      },

      // Agent Service Configuration
      agentService: {
        defaultModel: 'gpt-3.5-turbo',
        defaultTemperature: 0.7,
        defaultMaxTokens: 1000,
      },
    }),
  ],
  providers: [ComprehensiveAIAgent],
  controllers: [ComprehensiveAgentController],
  exports: [ComprehensiveAIAgent],
})
export class AppModule {}
