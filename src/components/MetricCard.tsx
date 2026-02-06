
import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon?: React.ReactNode;
    className?: string;
    trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subValue, icon, className = '', trend }) => {
    return (
        <div className={`group p-6 rounded-xl bg-card border border-border shadow-sm card-hover animate-slide-up ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{title}</p>
                    <h3 className="text-2xl lg:text-3xl font-bold text-primary tracking-tight">{value}</h3>
                    {subValue && (
                        <p className={`text-sm font-medium mt-2 ${trend === 'up' ? 'text-green-600 dark:text-green-400' :
                                trend === 'down' ? 'text-red-600 dark:text-red-400' :
                                    'text-secondary'
                            }`}>
                            {trend === 'up' && '↑ '}
                            {trend === 'down' && '↓ '}
                            {subValue}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricCard;

