import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Trip, Expense, Category } from '../types';
import { useData } from '../context/DataContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { ADJUSTMENT_CATEGORY, COUNTRY_TO_CODE, FLAG_SVGS } from '../constants';

const AdvancedFilterPanel = lazy(() => import('./AdvancedFilterPanel'));
const ExportModal = lazy(() => import('./statistics/ExportModal'));

export interface Filters {
    startDate: string;
    endDate: string;
    categories: string[];
    eventId?: string;
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
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [statsView, setStatsView] = useState<'category' | 'country'>('category');
    const [filters, setFilters] = useState<Filters>({
        startDate: '',
        endDate: '',
        categories: [],
        eventId: '',
    });

    const allCategories = data?.categories || [];

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
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
            if (filters.eventId && expense.eventId !== filters.eventId) {
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

        return (Object.values(grouped) as { name: string; value: number }[]).sort((a, b) => b.value - a.value);
    }, [filteredExpenses, trip.mainCurrency, convert]);

    const countrySpendData = useMemo(() => {
        const groupedByCountry = filteredExpenses.reduce((acc, exp) => {
            let country = exp.country || 'Sconosciuto';

            // Refine country logic: if country is generic or missing, try to parse from location
            if ((!exp.country || exp.country === 'Area Euro') && exp.location) {
                const locationParts = exp.location.split(',');
                const potentialCountry = locationParts[locationParts.length - 1].trim();
                // Check if the parsed part is a known country to avoid incorrect parsing
                if (COUNTRY_TO_CODE[potentialCountry]) {
                    country = potentialCountry;
                }
            }
            
            if (!acc[country]) {
                acc[country] = 0;
            }
            acc[country] += convert(exp.amount, exp.currency, trip.mainCurrency);
            return acc;
        }, {} as { [key: string]: number });

        return Object.entries(groupedByCountry)
            .map(([country, total]) => ({
                country,
                total,
            }))
            .sort((a, b) => Number(b.total) - Number(a.total));
    }, [filteredExpenses, trip.mainCurrency, convert]);

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
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="p-2.5 rounded-full bg-surface-variant text-on-surface-variant hover:bg-secondary-container/60 transition-colors shadow-sm"
                        aria-label="Esporta dati"
                    >
                        <span className="material-symbols-outlined">ios_share</span>
                    </button>
                    <button
                        onClick={() => setIsFilterPanelOpen(true)}
                        className="relative p-2.5 rounded-full bg-surface-variant text-on-surface-variant hover:bg-primary-container/60 transition-colors shadow-sm"
                        aria-label="Apri filtri"
                    >
                        <span className="material-symbols-outlined">filter_list</span>
                         {((filters.startDate && filters.endDate) || filters.categories.length > 0 || filters.eventId) && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold ring-2 ring-background">
                                {filters.categories.length + (filters.startDate ? 1 : 0) + (filters.eventId ? 1 : 0)}
                            </span>
                        )}
                    </button>
                </div>
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
                <div className="flex items-center p-1 bg-surface-variant rounded-full mb-4">
                    <button
                        onClick={() => setStatsView('category')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${statsView === 'category' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}
                    >
                        Per Categoria
                    </button>
                    <button
                        onClick={() => setStatsView('country')}
                        className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${statsView === 'country' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}
                    >
                        Per Paese
                    </button>
                </div>

                {statsView === 'category' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
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
                )}
                
                {statsView === 'country' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        {countrySpendData.length > 0 ? (
                            <div className="space-y-3">
                                {countrySpendData.map((item, index) => {
                                    const countryCode = COUNTRY_TO_CODE[item.country];
                                    const flagUrl = countryCode ? FLAG_SVGS[countryCode] : null;

                                    return (
                                        <div key={item.country} className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                            {flagUrl ? (
                                                <img src={flagUrl} alt={`Bandiera ${item.country}`} className="w-10 h-7 object-cover rounded-md shadow-sm flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-7 bg-surface-variant rounded-md flex items-center justify-center flex-shrink-0">
                                                    <span className="material-symbols-outlined text-on-surface-variant">flag</span>
                                                </div>
                                            )}
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold text-on-surface truncate">{item.country}</p>
                                            </div>
                                            <div className="font-semibold text-on-surface-variant flex-shrink-0">
                                                {formatCurrency(item.total, trip.mainCurrency)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-[100px] flex items-center justify-center text-on-surface-variant">
                                Nessuna spesa con dati paese.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isFilterPanelOpen && (
                <Suspense fallback={<div/>}>
                    <AdvancedFilterPanel
                        trip={trip}
                        onClose={() => setIsFilterPanelOpen(false)}
                        onApply={setFilters}
                        currentFilters={filters}
                        allCategories={allCategories}
                    />
                </Suspense>
            )}

            {isExportModalOpen && (
                <Suspense fallback={<div/>}>
                    <ExportModal
                        trip={trip}
                        expenses={filteredExpenses}
                        onClose={() => setIsExportModalOpen(false)}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default Statistics;
