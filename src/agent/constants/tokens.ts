/**
 * Dependency injection tokens for the agent module
 * These tokens are used to avoid circular imports and provide proper DI
 */

export const AGENT_REPOSITORY_TOKEN = 'AGENT_REPOSITORY';
export const AGENT_FACTORY_TOKEN = 'AGENT_FACTORY';
export const AGENT_LOGGER_TOKEN = 'AGENT_LOGGER';
export const TOOL_CREATION_STRATEGY_TOKEN = 'TOOL_CREATION_STRATEGY';
