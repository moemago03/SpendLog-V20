import React, { useState, useMemo, useEffect } from 'react';
import { Trip } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useCurrency } from '../context/CurrencyContext';
import { CURRENCY_INFO, FLAG_SVGS } from '../constants';

interface CurrencyConverterProps {
    trip: Trip;
}

const CurrencySelectorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (currencyCode: string) => void;
    availableCurrencies: { code: string; name: string; flag: string; }[];
}> = ({ isOpen, onClose, onSelect, availableCurrencies }) => {
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-surface rounded-3xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="p-4 border-b border-surface-variant">
                    <h3 className="text-lg font-semibold text-on-surface text-center">Seleziona Valuta</h3>
                </div>
                <ul className="overflow-y-auto p-2">
                    {availableCurrencies.map(currency => (
                        <li key={currency.code}>
                            <button
                                onClick={() => {
                                    onSelect(currency.code);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-variant text-left"
                            >
                                <img
                                    src={FLAG_SVGS[currency.flag.toUpperCase()]}
                                    alt={`Bandiera ${currency.name}`}
                                    className="w-8 h-6 object-cover rounded-md"
                                />
                                <div>
                                    <p className="font-bold text-on-surface">{currency.code}</p>
                                    <p className="text-sm text-on-surface-variant">{currency.name}</p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ trip }) => {
    const [amount, setAmount] = useState('100');
    
    const [fromCurrency, setFromCurrency] = useState(() => {
        const saved = localStorage.getItem(`vsc_converter_from_${trip.id}`);
        return saved && trip.preferredCurrencies.includes(saved) ? saved : trip.mainCurrency;
    });
    
    const [toCurrency, setToCurrency] = useState(() => {
        const saved = localStorage.getItem(`vsc_converter_to_${trip.id}`);
        const defaultTo = trip.preferredCurrencies.find(c => c !== fromCurrency) || trip.preferredCurrencies[0] || 'USD';
        return saved && trip.preferredCurrencies.includes(saved) && saved !== fromCurrency ? saved : defaultTo;
    });

    const [selectorOpenFor, setSelectorOpenFor] = useState<'from' | 'to' | null>(null);
    
    const { convert } = useCurrencyConverter();
    const { lastUpdated, isUpdating, updateRates } = useCurrency();

    useEffect(() => {
        localStorage.setItem(`vsc_converter_from_${trip.id}`, fromCurrency);
        localStorage.setItem(`vsc_converter_to_${trip.id}`, toCurrency);
    }, [fromCurrency, toCurrency, trip.id]);

    const numericAmount = parseFloat(amount) || 0;

    const convertedAmount = useMemo(() => {
        if (numericAmount > 0) {
            return convert(numericAmount, fromCurrency, toCurrency);
        }
        return 0;
    }, [numericAmount, fromCurrency, toCurrency, convert]);
    
    const currencyDetails = useMemo(() => {
        return trip.preferredCurrencies
            .map(code => ({ code, ...CURRENCY_INFO[code] }))
            .filter(details => details.name && details.flag);
    }, [trip.preferredCurrencies]);

    const swapCurrencies = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
    };

    const handleSelectCurrency = (currencyCode: string) => {
        if (selectorOpenFor === 'from') {
            if (currencyCode === toCurrency) setToCurrency(fromCurrency);
            setFromCurrency(currencyCode);
        } else if (selectorOpenFor === 'to') {
            if (currencyCode === fromCurrency) setFromCurrency(toCurrency);
            setToCurrency(currencyCode);
        }
    };

    const CurrencyDisplayButton: React.FC<{ currencyCode: string; onClick: () => void }> = ({ currencyCode, onClick }) => {
        const info = CURRENCY_INFO[currencyCode];
        if (!info) return null;
        
        const flagSvg = FLAG_SVGS[info.flag.toUpperCase()];

        return (
            <button
                onClick={onClick}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-variant hover:bg-primary-container/50 transition-colors w-full text-left"
            >
                {flagSvg && <img
                    src={flagSvg}
                    alt={`Bandiera ${info.name}`}
                    className="w-8 h-6 object-cover rounded-md"
                />}
                <div className="flex-grow min-w-0">
                    <p className="font-bold text-on-surface text-base">{currencyCode}</p>
                    <p className="text-xs text-on-surface-variant truncate">{info.name}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">arrow_drop_down</span>
            </button>
        );
    };

    return (
        <div className="bg-surface p-4 rounded-3xl shadow-sm space-y-3">
             <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold text-on-surface">Convertitore Valuta</h2>
                 <button onClick={updateRates} disabled={isUpdating} className="text-sm font-medium text-primary hover:underline disabled:opacity-50" aria-label="Aggiorna tassi di cambio">
                    {isUpdating ? 'Aggiornando...' : 'Aggiorna'}
                </button>
            </div>

            {/* From Section */}
            <div className="p-3 rounded-xl border-2 border-surface-variant focus-within:border-primary transition-colors">
                <label htmlFor="amount-input" className="text-xs text-on-surface-variant">Da</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 mt-1">
                     <input
                        id="amount-input"
                        type="number"
                        inputMode="decimal"
                        autoComplete="off"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full bg-transparent text-3xl font-bold text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
                        placeholder="0.00"
                    />
                    <div className="w-full sm:w-48 flex-shrink-0">
                        <CurrencyDisplayButton currencyCode={fromCurrency} onClick={() => setSelectorOpenFor('from')} />
                    </div>
                </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-1">
                <button
                    onClick={swapCurrencies}
                    className="p-2.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-primary-container transition-transform hover:rotate-180 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Inverti valute"
                >
                    <span className="material-symbols-outlined text-xl">swap_vert</span>
                </button>
            </div>
            
            {/* To Section */}
            <div className="p-3 rounded-xl bg-surface-variant">
                <label className="text-xs text-on-surface-variant">A</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 mt-1">
                    <div className="w-full text-3xl font-bold text-on-surface truncate">
                        {new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(convertedAmount)}
                    </div>
                     <div className="w-full sm:w-48 flex-shrink-0">
                        <CurrencyDisplayButton currencyCode={toCurrency} onClick={() => setSelectorOpenFor('to')} />
                    </div>
                </div>
            </div>

            {lastUpdated && (
                 <p className="text-xs text-on-surface-variant text-center pt-1">
                    Tassi aggiornati al: {new Date(lastUpdated).toLocaleString('it-IT')}
                </p>
            )}

            <CurrencySelectorModal
                isOpen={!!selectorOpenFor}
                onClose={() => setSelectorOpenFor(null)}
                onSelect={handleSelectCurrency}
                availableCurrencies={currencyDetails}
            />
        </div>
    );
};

export default CurrencyConverter;