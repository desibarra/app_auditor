import { Injectable } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { Express } from 'express';
import 'multer'; // Esto trae los tipos de Multer

@Injectable()
export class S3Service {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      endpoint: process.env.S3_ENDPOINT,
      region: 'us-east-1', // MinIO no usa región real
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(file: any, key: string): Promise<string> {
    await this.s3.putObject({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: file.buffer,          // ← contenido
      ContentType: file.mimetype, // ← tipo MIME
    });

    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
  }
}