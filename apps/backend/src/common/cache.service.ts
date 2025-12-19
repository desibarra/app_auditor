import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

@Injectable()
export class CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

    /**
     * Obtiene un valor del caché
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Verificar si expiró
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Guarda un valor en el caché
     */
    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.DEFAULT_TTL,
        });
    }

    /**
     * Invalida una clave específica
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalida todas las claves que coincidan con un patrón
     */
    invalidatePattern(pattern: string): void {
        const keys = Array.from(this.cache.keys());
        keys.forEach((key) => {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }

    /**
     * Limpia todo el caché
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Obtiene estadísticas del caché
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}
