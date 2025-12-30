import { Injectable, Logger } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { Express } from 'express';
import 'multer';

@Injectable()
export class S3Service {
  private s3: S3;
  private readonly logger = new Logger(S3Service.name);

  constructor() {
    if (process.env.DISABLE_S3 === 'true') {
      this.logger.warn('S3 deshabilitado en entorno local');
      return;
    }

    this.s3 = new S3({
      endpoint: process.env.S3_ENDPOINT,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(file: any, key: string): Promise<string> {
    if (process.env.DISABLE_S3 === 'true') {
      throw new Error('S3 deshabilitado en entorno local');
    }

    await this.s3.putObject({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
  }
}