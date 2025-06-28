import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';

/**
 * Example 1: Disable all logging (Production)
 */
@Module({
  imports: [
    AgentModule.forRoot({
      logging: {
        enabled: false, // This disables ALL logging
      },
    }),
  ],
})
export class ProductionModule {}

/**
 * Example 2: Minimal logging (Production with errors only)
 */
@Module({
  imports: [
    AgentModule.forRoot({
      logging: {
        enabled: true,
        level: 'error', // Only log errors
        detailedExecution: false,
        toolExecution: false,
        performance: false,
        requestResponse: false,
      },
    }),
  ],
})
export class MinimalLoggingModule {}

/**
 * Example 3: Development logging (Verbose)
 */
@Module({
  imports: [
    AgentModule.forRoot({
      logging: {
        enabled: true,
        level: 'debug',
        detailedExecution: true,
        toolExecution: true,
        performance: true,
        requestResponse: true,
      },
    }),
  ],
})
export class DevelopmentLoggingModule {}

/**
 * Example 4: Custom logger
 */
@Module({
  imports: [
    AgentModule.forRoot({
      logging: {
        enabled: true,
        level: 'info',
        customLogger: {
          debug: (message: string, context?: string) => {
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`[DEBUG] ${context}: ${message}`);
            }
          },
          log: (message: string, context?: string) => {
            console.log(`[INFO] ${context}: ${message}`);
          },
          warn: (message: string, context?: string) => {
            console.warn(`[WARN] ${context}: ${message}`);
          },
          error: (message: string, error?: any, context?: string) => {
            console.error(`[ERROR] ${context}: ${message}`, error);
          },
        },
      },
    }),
  ],
})
export class CustomLoggerModule {}

/**
 * Example 5: File logging
 */
@Module({
  imports: [
    AgentModule.forRoot({
      logging: {
        enabled: true,
        level: 'info',
        format: 'json',
        file: {
          enabled: true,
          path: './logs/agent.log',
          maxSize: '10m',
          maxFiles: 5,
        },
      },
    }),
  ],
})
export class FileLoggingModule {}
