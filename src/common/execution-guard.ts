import { Logger } from '@nestjs/common';
import { setTimeout } from 'timers/promises';

export async function executeWithGuard<T>({
  operation,
  empresaId,
  periodo,
  timeoutMs,
  action,
}: {
  operation: string;
  empresaId: string;
  periodo: string;
  timeoutMs: number;
  action: () => Promise<T>;
}): Promise<T> {
  const logger = new Logger('ExecutionGuard');
  const startTime = Date.now();

  try {
    const result = await Promise.race([
      action(),
      setTimeout(timeoutMs).then(() => {
        throw new Error('TIMEOUT');
      }),
    ]);

    const duration = Date.now() - startTime;
    logger.log(`[${operation}] [${empresaId}] [${periodo}] [${duration}ms] [SUCCESS]`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const result = error.message === 'TIMEOUT' ? 'TIMEOUT' : `ERROR:${error.message}`;
    logger.error(`[${operation}] [${empresaId}] [${periodo}] [${duration}ms] [${result}]`);
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    logger.log(`[${operation}] [${empresaId}] [${periodo}] [${duration}ms] [FINALIZED]`);
  }
}