import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useData } from '../context/DataContext';
import { Trip, Stage } from '../../types';
import { TRIP_CARD_COLORS } from '../constants';
import { useNotification } from '../context/NotificationContext';
import SelectCountriesScreen from './SelectCountriesScreen';

export interface Country {
    name: string;
    code: string;
    currency: string;
}

interface CreateTripFlowProps {
    onClose: () => void;
}

const DateRangePickerModal: React.FC<{
    startDate: string | null;
    endDate: string | null;
    onClose: () => void;
    onSave: (start: string, end: string) => void;
}> = ({ startDate, endDate, onClose, onSave }) => {
    const [start, setStart] = useState(startDate || '');
    const [end, setEnd] = useState(endDate || '');

    const handleStartChange = (newStart: string) => {
        setStart(newStart);
        if (end && new Date(end) < new Date(newStart)) {
            setEnd('');
        }
    };

    const handleSave = () => {
        if (start && end && new Date(start) <= new Date(end)) {
            onSave(start, end);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-on-surface mb-4">Seleziona le date</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-on-surface-variant">Data di inizio</label>
                        <input type="date" value={start} onChange={e => handleStartChange(e.target.value)} className="mt-1 block w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-on-surface-variant">Data di fine</label>
                        <input type="date" value={end} onChange={e => setEnd(e.target.value)} min={start} className="mt-1 block w-full bg-surface-variant border-transparent rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-full font-semibold text-primary">Annulla</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-full font-semibold bg-primary text-on-primary">Salva</button>
                </div>
            </div>
        </div>
    );
};


const CreateTripFlow: React.FC<CreateTripFlowProps> = ({ onClose }) => {
    const { addTrip } = useData();
    const { addNotification } = useNotification();

    const [step, setStep] = useState<'main' | 'countries'>('main');

    const [name, setName] = useState('');
    const [countries, setCountries] = useState<Country[]>([]);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [totalBudget, setTotalBudget] = useState<number | ''>('');
    const [mainCurrency, setMainCurrency] = useState('EUR');

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const suggestedCurrencies = useMemo(() => {
        const currencies = new Set(countries.map(c => c.currency).filter(Boolean));
        return Array.from(currencies);
    }, [countries]);

    useEffect(() => {
        if (suggestedCurrencies.length > 0 && !suggestedCurrencies.includes(mainCurrency)) {
            setMainCurrency(suggestedCurrencies[0]);
        } else if (suggestedCurrencies.length === 0) {
            setMainCurrency('EUR');
        }
    }, [suggestedCurrencies, mainCurrency]);

    const handleCreateTrip = () => {
        if (!name || countries.length === 0 || !startDate || !endDate || !totalBudget) {
            addNotification("Per favore, compila tutti i campi.", 'error');
            return;
        }

        const nights = Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)));

        const newStages: Stage[] = [{
            id: `stage-${Date.now()}`,
            location: countries.map(c => c.name).join(', '),
            startDate: startDate,
            nights: nights,
        }];

        const preferredCurrencies = Array.from(new Set([mainCurrency, ...suggestedCurrencies]));

        const tripData: Omit<Trip, 'id' | 'expenses' | 'events' | 'documents' | 'checklist' | 'frequentExpenses'> = {
            name,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            totalBudget: Number(totalBudget),
            countries: countries.map(c => c.name),
            mainCurrency,
            preferredCurrencies,
            color: TRIP_CARD_COLORS[Math.floor(Math.random() * TRIP_CARD_COLORS.length)],
            members: [{ id: 'user-self', name: 'Creatore Viaggio' }],
            stages: newStages
        };

        addTrip(tripData);
        onClose();
    };

    const formatDateRange = () => {
        if (!startDate || !endDate) return "Seleziona date";
        const start = new Date(startDate + "T12:00:00Z");
        const end = new Date(endDate + "T12:00:00Z");
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        return `${start.toLocaleDateString('it-IT', options)} - ${end.toLocaleDateString('it-IT', options)}`;
    };

    if (step === 'countries') {
        return <SelectCountriesScreen 
            initialSelectedCountries={countries}
            onDone={(selected) => {
                setCountries(selected);
                setStep('main');
            }}
            onClose={() => setStep('main')}
        />
    }

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-xl font-bold text-center flex-1">Crea un nuovo viaggio</h1>
                 <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-4 bg-surface-variant/50 rounded-2xl flex items-center gap-4">
                    <span className="material-symbols-outlined text-on-surface-variant">bookmark</span>
                    <input
                        type="text"
                        placeholder="Nome del viaggio"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-transparent text-on-surface font-semibold focus:outline-none"
                    />
                </div>
                
                <div className="p-4 bg-surface-variant/50 rounded-2xl space-y-3">
                    <div onClick={() => setStep('countries')} className="flex items-center gap-4 cursor-pointer">
                        <span className="material-symbols-outlined text-on-surface-variant">public</span>
                        <div className="flex-1">
                            {countries.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {countries.map(c => (
                                        <div key={c.code} className="bg-primary-container text-on-primary-container text-sm font-medium px-2 py-1 rounded-md flex items-center gap-1.5">
                                            <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} alt={c.name} />
                                            <span>{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <span className="text-on-surface-variant font-semibold">Seleziona paesi</span>}
                        </div>
                    </div>
                </div>

                <div onClick={() => setIsDatePickerOpen(true)} className="p-4 bg-surface-variant/50 rounded-2xl flex items-center gap-4 cursor-pointer">
                     <span className="material-symbols-outlined text-on-surface-variant">calendar_month</span>
                     <span className="text-on-surface font-semibold">{formatDateRange()}</span>
                </div>
                
                 <div className="p-4 bg-surface-variant/50 rounded-2xl flex items-center gap-4">
                    <span className="material-symbols-outlined text-on-surface-variant">account_balance_wallet</span>
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="number"
                            placeholder="Budget totale"
                            value={totalBudget}
                            onChange={e => setTotalBudget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full bg-transparent text-on-surface font-semibold focus:outline-none"
                        />
                         <select value={mainCurrency} onChange={e => setMainCurrency(e.target.value)} className="bg-primary-container text-on-primary-container font-bold rounded-lg px-3 py-1.5 focus:outline-none appearance-none">
                            {suggestedCurrencies.length > 0 ? (
                                suggestedCurrencies.map(c => <option key={c} value={c}>{c}</option>)
                            ) : <option value="EUR">EUR</option>}
                        </select>
                    </div>
                </div>

            </main>

            <footer className="p-4 border-t border-surface-variant">
                <button onClick={handleCreateTrip} style={{backgroundColor: '#10B981', color: 'white'}} className="w-full font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                    Crea Viaggio
                </button>
            </footer>

            {isDatePickerOpen && (
                <DateRangePickerModal
                    startDate={startDate}
                    endDate={endDate}
                    onClose={() => setIsDatePickerOpen(false)}
                    onSave={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                        setIsDatePickerOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default CreateTripFlow;