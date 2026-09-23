import React from 'react';

export interface CustomChartTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    valueSuffix?: string;
    title?: string;
}

export const ChartTooltip = ({
    active,
    payload,
    label,
    valueSuffix = '',
    title,
}: CustomChartTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="min-w-[140px] rounded-xl border border-slate-200/90 bg-white/98 p-3 shadow-xl backdrop-blur-md ring-1 ring-slate-900/5 text-slate-900 dark:border-slate-700/90 dark:bg-slate-900/98 dark:text-slate-100 dark:ring-1 dark:ring-white/15 dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] animate-in fade-in-0 zoom-in-95 duration-150">
                {(title || label) && (
                    <p className="mb-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        {title || label}
                    </p>
                )}
                <div className="space-y-1.5">
                    {payload.map((item: any, index: number) => (
                        <div
                            key={index}
                            className="flex items-center justify-between gap-3 text-xs"
                        >
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                                    style={{
                                        backgroundColor:
                                            item.color || item.fill || '#3b82f6',
                                    }}
                                />
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                    {item.name && item.name !== 'value'
                                        ? item.name
                                        : 'Count'}
                                </span>
                            </div>
                            <div className="font-extrabold text-slate-900 dark:text-white">
                                {typeof item.value === 'number'
                                    ? item.value.toLocaleString()
                                    : item.value}
                                {valueSuffix && (
                                    <span className="ml-1 text-[10px] font-normal text-slate-400 dark:text-slate-400">
                                        {valueSuffix}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};
