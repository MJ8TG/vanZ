type LogLevel = 'info' | 'warn' | 'error' | 'audit';

interface LogContext {
  userId?: string;
  jobId?: string;
  bidId?: string;
  [key: string]: any;
}

class LoggerService {
  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: any, context?: LogContext) {
    const errDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(this.formatMessage('error', message, { ...context, error: errDetails }));
  }

  audit(action: string, adminId: string, details?: Record<string, any>) {
    console.log(this.formatMessage('audit', `Admin Action: ${action} | Admin: ${adminId}`, details));
    // Here we could persist to `admin_actions` table if needed.
  }
}

export const logger = new LoggerService();
