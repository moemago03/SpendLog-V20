import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
// FIX: Import Stage type
import { Trip, FrequentExpense, CategoryBudget, TripMember, Stage } from '../types';
import { COUNTRIES_CURRENCIES, ALL_CURRENCIES, TRIP_CARD_COLORS } from '../constants';
import { useNotification } from '../context/NotificationContext';

interface TripFormProps {
    trip?: Trip;
    onClose: () => void;
}

const TripForm: React.FC<TripFormProps> = ({ trip, onClose }) => {
    const { addTrip, updateTrip, data } = useData();
    const { addNotification } = useNotification();
    const [name, setName] = useState(trip?.name || '');
    // FIX: Use optional chaining to prevent error if trip.startDate is undefined
    const [startDate, setStartDate] = useState(trip?.startDate?.split('T')[0] || '');
    const [endDate, setEndDate] = useState(trip?.endDate?.split('T')[0] || '');
    const [totalBudget, setTotalBudget] = useState(trip?.totalBudget || 0);
    const [countries, setCountries] = useState<string[]>(trip?.countries || []);
    const [mainCurrency, setMainCurrency] = useState(trip?.mainCurrency || 'EUR');
    const [color, setColor] = useState(trip?.color || TRIP_CARD_COLORS[0]);
    const [preferredCurrencies, setPreferredCurrencies] = useState<string[]>(
        trip ? [...new Set([...trip.preferredCurrencies, trip.mainCurrency])] : ['EUR']
    );
    
    // Group expenses state
    const [members, setMembers] = useState<TripMember[]>(trip?.members || []);
    const [newMemberName, setNewMemberName] = useState('');

    const [enableCategoryBudgets, setEnableCategoryBudgets] = useState(trip?.enableCategoryBudgets || false);
    const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>(trip?.categoryBudgets || []);

    const totalAllocatedBudget = useMemo(() => {
        return categoryBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    }, [categoryBudgets]);
    
    const handleStartDateChange = (newStartDate: string) => {
        setStartDate(newStartDate);
        if (endDate && new Date(endDate) < new Date(newStartDate)) {
            setEndDate('');
        }
    };

    const handleAddMember = () => {
        if (newMemberName.trim()) {
            const newMember: TripMember = {
                id: `member-${Date.now()}`,
                name: newMemberName.trim(),
            };
            setMembers([...members, newMember]);
            setNewMemberName('');
        }
    };
    
    const handleRemoveMember = (memberId: string) => {
        setMembers(members.filter(m => m.id !== memberId));
    };


    const handleCategoryBudgetChange = (categoryName: string, amountStr: string) => {
        const amount = parseFloat(amountStr) || 0;
        const existing = categoryBudgets.find(b => b.categoryName === categoryName);
        let newBudgets;
        if (existing) {
            newBudgets = categoryBudgets.map(b => b.categoryName === categoryName ? { ...b, amount } : b);
        } else {
            newBudgets = [...categoryBudgets, { categoryName, amount }];
        }
        setCategoryBudgets(newBudgets.filter(b => b.amount > 0)); 
    };

    useEffect(() => {
        if (!preferredCurrencies.includes(mainCurrency)) {
            setPreferredCurrencies(prev => [...new Set([...prev, mainCurrency])]);
        }
    }, [mainCurrency, preferredCurrencies]);

    const handleCountryChange = (country: string) => {
        const newCountries = countries.includes(country)
            ? countries.filter(c => c !== country)
            : [...countries, country];
        setCountries(newCountries);

        const newSuggestedCurrencies = newCountries.map(c => COUNTRIES_CURRENCIES[c]).filter(Boolean);
        const newPreferred = [...new Set([mainCurrency, ...newSuggestedCurrencies, ...preferredCurrencies])];
        setPreferredCurrencies(newPreferred);
    };
    
    const handlePreferredCurrencyChange = (currency: string) => {
        if (currency === mainCurrency) return;
        
        const newPreferred = preferredCurrencies.includes(currency)
            ? preferredCurrencies.filter(c => c !== currency)
            : [...preferredCurrencies, currency];
        setPreferredCurrencies(newPreferred);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !startDate || !endDate || totalBudget <= 0 || countries.length === 0 || !mainCurrency) {
            addNotification("Per favore, compila tutti i campi obbligatori.", 'error');
            return;
        }

        if (members.length === 0) {
            addNotification("Aggiungi almeno un membro al viaggio (anche solo te stesso!).", 'error');
            return;
        }
        
        // FIX: Create a stages array from form data to satisfy the Trip type.
        const start = new Date(startDate);
        const end = new Date(endDate);
        const nights = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

        const newStages: Stage[] = [{
            id: trip?.stages?.[0]?.id || `stage-${Date.now()}`,
            location: countries.join(', '), // Best guess for location
            startDate: startDate,
            nights: nights,
        }];

        const tripData = {
            name,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            totalBudget,
            countries,
            mainCurrency,
            preferredCurrencies: [...new Set([...preferredCurrencies, mainCurrency])],
            color,
            members, // Add members to trip data
            enableCategoryBudgets,
            categoryBudgets: enableCategoryBudgets ? categoryBudgets.filter(b => b.amount > 0) : [],
            stages: newStages,
        };

        if (trip) {
            updateTrip({ ...trip, ...tripData });
        } else {
            addTrip(tripData);
        }
        onClose();
    };

    const inputClasses = "mt-1 block w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClasses = "block text-sm font-medium text-on-surface-variant";

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-surface-variant">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">
                    {trip ? 'Modifica Viaggio' : 'Nuovo Viaggio'}
                </h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClasses}>Nome Viaggio</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClasses}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Data Inizio</label>
                            <input type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} required className={inputClasses}/>
                        </div>
                        <div>
                            <label className={labelClasses}>Data Fine</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className={inputClasses} min={startDate} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Budget Totale</label>
                            <input type="number" value={totalBudget} onChange={e => setTotalBudget(parseFloat(e.target.value))} required min="1" className={inputClasses}/>
                        </div>
                        <div>
                           <label className={labelClasses}>Valuta Principale</label>
                           <select value={mainCurrency} onChange={e => setMainCurrency(e.target.value)} required className={inputClasses}>
                                {ALL_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                    </div>
                     <div>
                        <label className={labelClasses}>Membri del Viaggio</label>
                        {members.length === 0 && (
                            <p className="text-xs text-on-surface-variant mt-2 p-2 bg-secondary-container/30 rounded-lg">
                                Aggiungi i partecipanti al viaggio, iniziando da te! Questo è fondamentale per dividere le spese.
                            </p>
                        )}
                        <div className="space-y-2 mt-2">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center justify-between bg-surface-variant/70 p-2 rounded-lg">
                                    <p className="font-medium text-on-surface-variant">{member.name}</p>
                                    <button type="button" onClick={() => handleRemoveMember(member.id)} className="p-1 rounded-full text-on-surface-variant hover:bg-error-container/50 hover:text-on-error-container">
                                        <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={newMemberName}
                                onChange={e => setNewMemberName(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember(); } }}
                                placeholder="Nome nuovo membro"
                                className="block w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button type="button" onClick={handleAddMember} className="bg-primary text-on-primary rounded-lg px-4 font-semibold">Aggiungi</button>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Paesi Visitati</label>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {Object.keys(COUNTRIES_CURRENCIES).map(country => (
                                <label key={country} className="flex items-center space-x-2 p-2 border border-outline rounded-lg cursor-pointer hover:bg-surface-variant">
                                    <input type="checkbox" checked={countries.includes(country)} onChange={() => handleCountryChange(country)} className="focus:ring-primary h-4 w-4 text-primary border-outline rounded"/>
                                    <span className="text-sm">{country}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className={labelClasses}>Valute Preferite</label>
                         <p className="text-xs text-on-surface-variant">Seleziona le valute che userai. La valuta principale è sempre inclusa.</p>
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {ALL_CURRENCIES.map(currency => (
                                <label key={currency} className={`flex items-center space-x-2 p-2 border rounded-lg transition-colors ${currency === mainCurrency ? 'bg-surface-variant cursor-not-allowed' : 'cursor-pointer hover:bg-surface-variant'}`}>
                                    <input type="checkbox" checked={preferredCurrencies.includes(currency)} onChange={() => handlePreferredCurrencyChange(currency)} disabled={currency === mainCurrency} className="focus:ring-primary h-4 w-4 text-primary border-outline rounded"/>
                                    <span className="text-sm">{currency}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Colore Etichetta</label>
                        <div className="mt-2 flex flex-wrap gap-3">
                            {TRIP_CARD_COLORS.map(c => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-10 h-10 rounded-full transition-transform transform hover:scale-110 focus:outline-none ${color === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
                                    style={{ backgroundColor: c }}
                                    aria-label={`Seleziona colore ${c}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-surface-variant">
                        <div className="flex items-center">
                            <input type="checkbox" id="enable-category-budgets" checked={enableCategoryBudgets} onChange={e => setEnableCategoryBudgets(e.target.checked)} className="focus:ring-primary h-4 w-4 text-primary border-outline rounded"/>
                            <label htmlFor="enable-category-budgets" className="ml-2 block text-sm font-medium text-on-surface">Abilita Budget per Categoria</label>
                        </div>
                        {enableCategoryBudgets && (
                            <div className="mt-3 p-3 space-y-3 border border-surface-variant rounded-xl bg-surface-variant/50">
                                <p className="text-xs text-on-surface-variant">Assegna un budget specifico per ogni categoria.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                    {data?.categories.map(category => {
                                        const budget = categoryBudgets.find(b => b.categoryName === category.name);
                                        return (
                                            <div key={category.id}>
                                                <label className="block text-sm font-medium text-on-surface-variant">{category.icon} {category.name}</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={budget?.amount || ''}
                                                    onChange={e => handleCategoryBudgetChange(category.name, e.target.value)}
                                                    className={inputClasses}
                                                    step="1"
                                                    min="0"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className={`mt-2 text-sm font-medium ${totalAllocatedBudget > totalBudget ? 'text-error' : 'text-on-surface-variant'}`}>
                                    Assegnato: {totalAllocatedBudget.toFixed(2)} / {totalBudget.toFixed(2)} {mainCurrency}
                                    {totalAllocatedBudget > totalBudget && <p className="text-xs">Attenzione: Il budget assegnato supera quello totale.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </main>
            
            <footer className="p-4 border-t border-surface-variant mt-auto flex-shrink-0">
                <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
                >
                    {trip ? 'Salva Modifiche' : 'Crea Viaggio'}
                </button>
            </footer>
             <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-\\[slide-up_0\\.3s_ease-out\\] {
                    animation: slide-up 0.3s ease-out;
                }
                 /* Custom select dropdown arrows */
                select {
                  -webkit-appearance: none;
                  -moz-appearance: none;
                  appearance: none;
                  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-chevron-down' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
                  background-repeat: no-repeat;
                  background-position: right 0.75rem center;
                  background-size: 1em;
                  padding-right: 2rem;
                }
            `}</style>
        </div>
    );
};

export default TripForm;