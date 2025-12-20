import { S3Client } from '@aws-sdk/client-s3';

/**
 * Configuración de S3/MinIO para almacenamiento de evidencias
 * 
 * Soporta:
 * - MinIO local (desarrollo)
 * - AWS S3 (producción)
 * - Cualquier servicio compatible con S3
 */

export const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true, // Necesario para MinIO
});

export const BUCKET_NAME = process.env.S3_BUCKET || 'evidencias-fiscales';

/**
 * Configuración de almacenamiento
 */
export const STORAGE_CONFIG = {
    maxFileSize: 50 * 1024 * 1024, // 50MB (aumentado para contratos extremadamente grandes)
    allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
};
