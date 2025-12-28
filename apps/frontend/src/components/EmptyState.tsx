import React from 'react';

interface EmptyStateProps {
    icon?: string;
    title: string;
    message?: string;
    tip?: string;
    variant?: 'info' | 'warning' | 'empty';
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = '📊',
    title,
    message,
    tip,
    variant = 'empty'
}) => {
    const colors = {
        info: 'text-blue-400',
        warning: 'text-yellow-400',
        empty: 'text-gray-500'
    };

    const bgColors = {
        info: 'bg-blue-500/10',
        warning: 'bg-yellow-500/10',
        empty: 'bg-gray-500/10'
    };

    return (
        <div className={`flex flex-col items-center justify-center p-6 rounded-lg ${bgColors[variant]} border border-gray-700`}>
            <div className="text-4xl mb-3">{icon}</div>
            <div className={`text-sm font-bold ${colors[variant]} mb-1`}>
                {title}
            </div>
            {message && (
                <div className="text-xs text-gray-400 text-center mb-2">
                    {message}
                </div>
            )}
            {tip && (
                <div className="text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded mt-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>{tip}</span>
                </div>
            )}
        </div>
    );
};

export default EmptyState;
