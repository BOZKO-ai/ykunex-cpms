/**
 * Centralized logging utility for yakunex-cpms.
 * In a real-world scenario, this would integrate with Sentry, LogRocket, or similar services.
 */

export const logger = {
  error: (message: string, error?: unknown, context?: Record<string, any>) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      ...context,
    });
    // TODO: Send to external monitoring service (e.g., Sentry)
  },
  
  warn: (message: string, context?: Record<string, any>) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, context);
  },
  
  info: (message: string, context?: Record<string, any>) => {
    console.info(`[INFO] ${new Date().toISOString()}: ${message}`, context);
  },
};
