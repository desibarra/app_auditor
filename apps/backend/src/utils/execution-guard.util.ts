import { Logger } from '@nestjs/common';
import { setTimeout } from 'timers/promises';

interface ExecutionGuardOptions {
  operationName: string;
  empresaId: string;
  periodo: string;
  timeoutMs: number;
  execute: () => Promise<any>;
}

export class ExecutionGuard {
  private static readonly logger = new Logger(ExecutionGuard.name);

  static async run({ operationName, empresaId, periodo, timeoutMs, execute }: ExecutionGuardOptions): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        execute(),
        setTimeout(timeoutMs).then(() => {
          throw new Error('TIMEOUT');
        }),
      ]);

      const duration = Date.now() - startTime;
      this.logger.log(`[${operationName}] [${empresaId}] [${periodo}] [${duration}ms] [SUCCESS]`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = error.message === 'TIMEOUT' ? 'TIMEOUT' : `ERROR:${error.message}`;
      this.logger.error(`[${operationName}] [${empresaId}] [${periodo}] [${duration}ms] [${result}]`);

      throw error;
    }
  }
}