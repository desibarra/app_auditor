import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EvidenciasController } from './evidencias.controller';
import { EvidenciasService } from './evidencias.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [
        DatabaseModule,
        MulterModule.register({
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
                files: 1,
            },
            fileFilter: (req, file, cb) => {
                const allowedMimeTypes = [
                    'application/pdf',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                ];

                if (allowedMimeTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(
                        new Error(
                            'Tipo de archivo no permitido. Solo PDF, JPG y PNG son aceptados.',
                        ),
                        false,
                    );
                }
            },
        }),
    ],
    controllers: [EvidenciasController],
    providers: [EvidenciasService],
    exports: [EvidenciasService],
})
export class EvidenciasModule { }
