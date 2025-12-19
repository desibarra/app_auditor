import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    async register(data: any) {
        // TODO: Implementar lógica de registro
        // 1. Validar email único
        // 2. Hashear contraseña con bcrypt
        // 3. Crear usuario en BD
        // 4. Retornar JWT

        return {
            message: 'Usuario registrado (dummy)',
            user: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: data.email,
                nombreCompleto: data.nombreCompleto,
            },
        };
    }

    async login(data: any) {
        // TODO: Implementar lógica de login
        // 1. Buscar usuario por email
        // 2. Validar contraseña
        // 3. Generar JWT (access + refresh)
        // 4. Retornar tokens

        return {
            accessToken: 'dummy-access-token',
            refreshToken: 'dummy-refresh-token',
            user: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: data.email,
                nombreCompleto: 'Usuario Demo',
            },
        };
    }
}
