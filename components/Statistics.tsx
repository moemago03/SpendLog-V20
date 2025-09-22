import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Trip, Expense, Category } from '../types';
import { useData } from '../context/DataContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import {
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import { ADJUSTMENT_CATEGORY } from '../constants';

const AdvancedFilterPanel = lazy(() => import('./AdvancedFilterPanel'));

export interface Filters {
    startDate: string;
    endDate: string;
    categories: string[];
}

const getDaysBetween = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 1;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
};


const Statistics: React.FC<{ trip: Trip; expenses: Expense[] }> = ({ trip, expenses }) => {
    const { data } = useData();
    const { convert, formatCurrency } = useCurrencyConverter();
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [view, setView] = useState<'category' | 'detailed'>('category');
    const [filters, setFilters] = useState<Filters>({
        startDate: '',
        endDate: '',
        categories: [],
    });

    const allCategories = data?.categories || [];

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            // Exclude balance adjustments from all statistics
            if (expense.category === ADJUSTMENT_CATEGORY) {
                return false;
            }

            const expenseDate = new Date(expense.date);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            if (startDate) {
                startDate.setHours(0, 0, 0, 0);
                if (expenseDate < startDate) return false;
            }
            if (endDate) {
                endDate.setHours(23, 59, 59, 999);
                if (expenseDate > endDate) return false;
            }
            if (filters.categories.length > 0 && !filters.categories.includes(expense.category)) {
                return false;
            }
            return true;
        });
    }, [expenses, filters]);

    const summaryData = useMemo(() => {
        const total = filteredExpenses.reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
        
        const days = (filters.startDate && filters.endDate) 
            ? getDaysBetween(filters.startDate, filters.endDate)
            : (filteredExpenses.length > 0
                ? getDaysBetween(filteredExpenses[filteredExpenses.length - 1].date, filteredExpenses[0].date)
                : 1);
                
        const dailyAvg = total / days;

        const categoryTotals = filteredExpenses.reduce((acc, exp) => {
            const amount = convert(exp.amount, exp.currency, trip.mainCurrency);
            acc[exp.category] = (acc[exp.category] || 0) + amount;
            return acc;
        }, {} as { [key: string]: number });

        const topCategory = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, '');
        
        return { total, dailyAvg, topCategory };
    }, [filteredExpenses, trip.mainCurrency, convert, filters.startDate, filters.endDate]);

    const categoryChartData = useMemo(() => {
        const grouped = filteredExpenses.reduce((acc, exp) => {
            const amount = convert(exp.amount, exp.currency, trip.mainCurrency);
            if (!acc[exp.category]) {
                acc[exp.category] = { name: exp.category, value: 0 };
            }
            acc[exp.category].value += amount;
            return acc;
        }, {} as { [key: string]: { name: string; value: number } });

        // FIX: Explicitly cast the result of Object.values to prevent errors on `sort`.
        return (Object.values(grouped) as { name: string; value: number }[]).sort((a, b) => b.value - a.value);
    }, [filteredExpenses, trip.mainCurrency, convert]);

    const trendChartData = useMemo(() => {
        const grouped = filteredExpenses.reduce((acc, exp) => {
            const day = new Date(exp.date).toISOString().split('T')[0];
            const amount = convert(exp.amount, exp.currency, trip.mainCurrency);
            if (!acc[day]) {
                acc[day] = { date: day, amount: 0 };
            }
            acc[day].amount += amount;
            return acc;
        }, {} as { [key: string]: { date: string; amount: number } });
        
        // FIX: Explicitly cast the result of Object.values to prevent errors on `sort`.
        return (Object.values(grouped) as { date: string; amount: number }[]).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredExpenses, trip.mainCurrency, convert]);

    const formatChartCurrency = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: trip.mainCurrency, notation: 'compact' }).format(value);
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

    const summaryCards = useMemo(() => [
        {
            icon: 'account_balance_wallet',
            title: 'Spesa Totale',
            value: formatCurrency(summaryData.total, trip.mainCurrency),
            bgColor: 'bg-primary-container/60',
            iconBgColor: 'bg-primary-container',
            textColor: 'text-on-primary-container',
        },
        {
            icon: 'today',
            title: 'Media Giornaliera',
            value: formatCurrency(summaryData.dailyAvg, trip.mainCurrency),
            bgColor: 'bg-secondary-container/60',
            iconBgColor: 'bg-secondary-container',
            textColor: 'text-on-secondary-container',
        },
        {
            icon: 'category',
            title: 'Top Categoria',
            value: summaryData.topCategory || '-',
            bgColor: 'bg-tertiary-container/60',
            iconBgColor: 'bg-tertiary-container',
            textColor: 'text-on-tertiary-container',
        },
    ], [summaryData, trip.mainCurrency, formatCurrency]);

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex justify-between items-center pt-8 pb-4">
                <h1 className="text-4xl font-bold text-on-background">Statistiche</h1>
                <button
                    onClick={() => setIsFilterPanelOpen(true)}
                    className="relative p-2.5 rounded-full bg-surface-variant text-on-surface-variant hover:bg-primary-container/60 transition-colors shadow-sm"
                    aria-label="Apri filtri"
                >
                    <span className="material-symbols-outlined">filter_list</span>
                     {((filters.startDate && filters.endDate) || filters.categories.length > 0) && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold ring-2 ring-background">
                            {filters.categories.length + (filters.startDate ? 1 : 0)}
                        </span>
                    )}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {summaryCards.map(card => (
                    <div key={card.title} className={`p-4 rounded-3xl flex items-center gap-4 ${card.bgColor}`}>
                        <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${card.iconBgColor}`}>
                            <span className={`material-symbols-outlined text-2xl ${card.textColor}`}>{card.icon}</span>
                        </div>
                        <div>
                            <p className={`text-sm font-medium ${card.textColor}`}>{card.title}</p>
                            <p className="text-xl font-bold text-on-surface tracking-tight truncate">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-surface p-4 rounded-3xl shadow-sm">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Spese per Categoria</h3>
                {categoryChartData.length > 0 ? (
                    <div className="space-y-4">
                        {categoryChartData.map((item, index) => {
                            const category = allCategories.find(c => c.name === item.name);
                            const percentage = summaryData.total > 0 ? (item.value / summaryData.total) * 100 : 0;
                            
                            return (
                                <div key={item.name} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="flex justify-between items-center mb-1.5 text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-lg">{category?.icon || '💸'}</span>
                                            <span className="font-medium text-on-surface truncate">{item.name}</span>
                                        </div>
                                        <span className="font-semibold text-on-surface-variant flex-shrink-0 ml-2">{formatCurrency(item.value, trip.mainCurrency)}</span>
                                    </div>
                                    <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="h-2 rounded-full"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: category?.color || '#8884d8',
                                                transition: 'width 0.5s ease-out'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : <div className="h-[150px] flex items-center justify-center text-on-surface-variant">Nessun dato per la visualizzazione.</div>}
            </div>

            <div className="bg-surface p-4 rounded-3xl shadow-sm">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Andamento Spesa</h3>
                {trendChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={trendChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={trip.color || 'var(--color-primary)'} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={trip.color || 'var(--color-primary)'} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-variant)" />
                            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }} />
                            <YAxis tickFormatter={formatChartCurrency} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }} />
                            <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-inverse-surface)', border: 'none', borderRadius: '1rem' }} labelStyle={{ color: 'var(--color-inverse-on-surface)'}} itemStyle={{ color: 'var(--color-inverse-on-surface)'}} formatter={(value: number) => formatCurrency(value, trip.mainCurrency)}/>
                            <Area type="monotone" dataKey="amount" stroke={trip.color || 'var(--color-primary)'} fillOpacity={1} fill="url(#colorUv)" />
                        </AreaChart>
                    </ResponsiveContainer>
                 ) : <div className="h-[250px] flex items-center justify-center text-on-surface-variant">Dati insufficienti per il trend</div>}
            </div>
{/* FIX: The component was truncated. Completed the component by adding the view logic and a default export. */}
{/* This fixes the "void[] is not assignable to ReactNode" error and the missing default export error. */}
            <div className="bg-surface-variant p-1 rounded-full flex sticky top-2 z-10">
                <button onClick={() => setView('category')} className={`flex-1 py-2 rounded-full font-semibold text-sm transition-colors ${view === 'category' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}>Per Categoria</button>
                <button onClick={() => setView('detailed')} className={`flex-1 py-2 rounded-full font-semibold text-sm transition-colors ${view === 'detailed' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}>Elenco Dettagliato</button>
            </div>

            {view === 'category' && (
                <div className="space-y-3">
                    {categoryChartData.map(item => {
                        const category = allCategories.find(c => c.name === item.name);
                        const categoryExpenses = filteredExpenses
                            .filter(e => e.category === item.name)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                        return (
                            <div key={item.name} className="bg-surface p-4 rounded-3xl shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl" 
                                            style={{ backgroundColor: category?.color || '#8884d8', color: 'white' }}
                                        >
                                            {category?.icon || '💸'}
                                        </div>
                                        <h4 className="font-semibold text-on-surface">{item.name}</h4>
                                    </div>
                                    <span className="font-bold text-on-surface">{formatCurrency(item.value, trip.mainCurrency)}</span>
                                </div>
                                {categoryExpenses.length > 0 && (
                                    <div className="space-y-2 border-t border-surface-variant pt-2 mt-2">
                                        {categoryExpenses.map(exp => (
                                            <div key={exp.id} className="flex justify-between items-center p-2 rounded-lg">
                                                <div>
                                                    <p className="text-sm text-on-surface-variant">{new Date(exp.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-on-surface">{formatCurrency(exp.amount, exp.currency)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            
            {view === 'detailed' && (
                <div className="bg-surface p-2 rounded-3xl shadow-sm">
                    <div className="space-y-2">
                        {filteredExpenses.map(exp => {
                            const category = allCategories.find(c => c.name === exp.category);
                            return (
                                <div key={exp.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-surface-variant">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-surface-variant">
                                            {category?.icon || '💸'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-on-surface">{exp.category}</p>
                                            <p className="text-xs text-on-surface-variant">{new Date(exp.date).toLocaleDateString('it-IT')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-on-surface">{formatCurrency(exp.amount, exp.currency)}</p>
                                        {exp.currency !== trip.mainCurrency && <p className="text-xs text-on-surface-variant">{`≈ ${formatCurrency(convert(exp.amount, exp.currency, trip.mainCurrency), trip.mainCurrency)}`}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {isFilterPanelOpen && (
                <Suspense fallback={<div/>}>
                    <AdvancedFilterPanel
                        onClose={() => setIsFilterPanelOpen(false)}
                        onApply={setFilters}
                        currentFilters={filters}
                        allCategories={allCategories}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default Statistics;