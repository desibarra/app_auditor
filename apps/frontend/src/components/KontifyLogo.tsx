/**
 * 🎨 KONTIFY · SENTINEL LOGO COMPONENT
 * ===================================== 
 * Componente reutilizable que respeta la jerarquía de marca
 * 
 * Props:
 * - variant: 'full' | 'compact' | 'icon'
 * - showTagline: boolean
 * - className: string personalizado
 */

import React from 'react';

interface LogoProps {
    variant?: 'full' | 'compact' | 'icon';
    showTagline?: boolean;
    className?: string;
}

export const KontifyLogo: React.FC<LogoProps> = ({
    variant = 'full',
    showTagline = false,
    className = ''
}) => {

    if (variant === 'icon') {
        return (
            <img
                src="/kontify-icon.svg"
                alt="Kontify"
                className={`kontify-icon ${className}`}
                style={{ height: '48px', width: 'auto' }}
            />
        );
    }

    if (variant === 'compact') {
        return (
            <div className={`kontify-logo-compact ${className}`}>
                <div className="logo-mark">
                    <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="gradient-k-compact" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#4ade80', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#1a7f3e', stopOpacity: 1 }} />
                            </linearGradient>
                        </defs>
                        <rect x="8" y="8" width="25" height="25" fill="url(#gradient-k-compact)" rx="3" />
                        <path d="M 25 20 L 45 8 L 45 16 L 33 24 L 45 32 L 45 40 L 25 28 Z" fill="#1a7f3e" />
                    </svg>
                </div>
                <div className="logo-text">
                    <span className="kontify-brand">Kontify</span>
                    <span className="separator">·</span>
                    <span className="sentinel-brand">Sentinel</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`kontify-logo-full ${className}`}>
            <img
                src="/kontify-sentinel-logo.svg"
                alt="Kontify · Sentinel"
                style={{ height: '48px', width: 'auto' }}
            />
            {showTagline && (
                <p className="tagline">
                    Detecta lo que falta, antes de que el SAT lo haga.
                </p>
            )}

            <style jsx>{`
        .kontify-logo-full {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .tagline {
          margin: 8px 0 0 0;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 400;
          letter-spacing: 0.025em;
        }

        .kontify-logo-compact {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-text {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .kontify-brand {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0a0a0a;
          font-family: 'Inter', -apple-system, system-ui, sans-serif;
        }

        .separator {
          font-size: 1.25rem;
          color: #94a3b8;
          font-weight: 400;
        }

        .sentinel-brand {
          font-size: 1.125rem;
          font-weight: 400;
          color: #4ade80;
          font-family: 'Inter', -apple-system, system-ui, sans-serif;
        }

        .kontify-icon {
          display: block;
        }
      `}</style>
        </div>
    );
};

export default KontifyLogo;
