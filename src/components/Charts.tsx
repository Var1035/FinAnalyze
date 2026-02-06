
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface ChartProps {
    data: any[];
    xKey: string;
    bars: { key: string; color: string; name: string }[];
}

export const FinancialBarChart: React.FC<ChartProps> = ({ data, xKey, bars }) => {
    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card p-3 border border-border shadow-md rounded-lg">
                    <p className="font-semibold text-primary mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: ${entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                    dataKey={xKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }} />
                <Legend />
                {bars.map((bar) => (
                    <Bar
                        key={bar.key}
                        dataKey={bar.key}
                        fill={bar.color}
                        name={bar.name}
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
};
