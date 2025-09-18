import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Trip, Expense, FrequentExpense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useNotification } from '../context/NotificationContext';

const triggerHapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(10);
};

const getLocalDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ExpenseForm: React.FC<{
    trip: Trip;
    expense?: Expense;
    onClose: () => void;
}> = ({ trip, expense, onClose }) => {
    const { addExpense, updateExpense, data } = useData();
    const { convert, formatCurrency } = useCurrencyConverter();
    const { addNotification } = useNotification();
    const [amount, setAmount] = useState(expense?.amount ? expense.amount.toString() : '');
    const [currency, setCurrency] = useState(expense?.currency || trip.mainCurrency);
    const [category, setCategory] = useState(expense?.category || data.categories[0]?.name || '');
    const [date, setDate] = useState(expense ? new Date(expense.date).toISOString().split('T')[0] : getLocalDateString());

    const members = useMemo(() => trip.members || [{ id: 'user-self', name: 'Io' }], [trip.members]);
    
    // Smart split logic
    const isEditingSharedExpense = !!(expense?.splitBetweenMemberIds && expense.splitBetweenMemberIds.length > 1);
    const [isSplit, setIsSplit] = useState(isEditingSharedExpense);

    const [paidById, setPaidById] = useState(expense?.paidById || members[0].id);
    const [splitParticipantIds, setSplitParticipantIds] = useState<string[]>(
        expense?.splitBetweenMemberIds || (isSplit ? members.map(m => m.id) : [members[0].id])
    );

    const amountInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        amountInputRef.current?.focus();
    }, []);
    
     const handleToggleParticipant = (memberId: string) => {
        setSplitParticipantIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberId)) {
                if (newSet.size > 1) newSet.delete(memberId);
            } else {
                newSet.add(memberId);
            }
            return Array.from(newSet);
        });
    };

    const handleToggleSplit = () => {
        const newIsSplit = !isSplit;
        setIsSplit(newIsSplit);
        if (newIsSplit) {
            // When enabling split, default to everyone
            setSplitParticipantIds(members.map(m => m.id));
        } else {
            // When disabling split, it's just for the user
            setPaidById(members[0].id);
            setSplitParticipantIds([members[0].id]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        triggerHapticFeedback();
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0 || !category || !date) {
            addNotification("Per favore, compila tutti i campi correttamente.", 'error');
            return;
        }
        
        if (isSplit && splitParticipantIds.length === 0) {
            addNotification("Seleziona almeno un partecipante alla spesa.", 'error');
            return;
        }
        
        const finalSplitParticipantIds = isSplit ? splitParticipantIds : [members[0].id];
        const finalPaidById = isSplit ? paidById : members[0].id;


        const expenseData = {
            amount: numericAmount,
            currency,
            category,
            date: new Date(date).toISOString(),
            paidById: finalPaidById,
            splitType: 'equally' as 'equally',
            splitBetweenMemberIds: finalSplitParticipantIds,
        };

        if (expense && expense.id) {
            updateExpense(trip.id, { ...expense, ...expenseData });
        } else {
            addExpense(trip.id, expenseData);
        }
        onClose();
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/,/, '.');
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const numericAmount = parseFloat(amount) || 0;
    const convertedAmountDisplay = useMemo(() => {
        if (numericAmount > 0 && currency !== trip.mainCurrency) {
            const convertedValue = convert(numericAmount, currency, trip.mainCurrency);
            return `≈ ${formatCurrency(convertedValue, trip.mainCurrency)}`;
        }
        return null;
    }, [numericAmount, currency, trip.mainCurrency, convert, formatCurrency]);

    const currentCategoryIcon = data.categories.find(c => c.name === category)?.icon || '📝';

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-xl font-bold ml-4">
                    {expense?.id ? 'Modifica Spesa' : 'Nuova Spesa'}
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
                
                {/* Amount & Currency */}
                <div className="bg-surface-variant rounded-2xl p-4">
                    <span className="text-sm font-medium text-on-surface-variant">Importo</span>
                    <div className="flex items-baseline justify-between mt-1">
                        <input
                            ref={amountInputRef}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0"
                            required
                            className="bg-transparent text-5xl font-bold text-on-surface w-full focus:outline-none placeholder:text-on-surface/30 tracking-tighter"
                        />
                         <select
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            required
                            className="bg-transparent text-xl font-semibold text-on-surface-variant focus:outline-none appearance-none pr-6"
                        >
                            {trip.preferredCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {convertedAmountDisplay && (
                        <p className="text-right text-sm text-on-surface-variant mt-1">
                            {convertedAmountDisplay}
                        </p>
                    )}
                </div>
                
                 {/* Category & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface-variant rounded-2xl flex items-center p-4 gap-4">
                        <span className="text-2xl w-8 text-center">{currentCategoryIcon}</span>
                        <select value={category} onChange={e => setCategory(e.target.value)} required className="w-full bg-transparent text-on-surface focus:outline-none appearance-none font-medium text-base">
                            {data.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="bg-surface-variant rounded-2xl flex items-center p-4 gap-4">
                         <span className="material-symbols-outlined text-on-surface-variant w-8 text-center">calendar_month</span>
                         <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                            className="w-full bg-transparent text-on-surface focus:outline-none font-medium text-base"
                        />
                    </div>
                </div>

                {/* Split Expense Toggle */}
                 {members.length > 1 && (
                    <div className="bg-surface-variant rounded-2xl flex items-center justify-between p-4 gap-4">
                        <label htmlFor="split-toggle" className="font-medium text-on-surface">Dividi Spesa</label>
                        <button
                            id="split-toggle"
                            role="switch"
                            aria-checked={isSplit}
                            onClick={handleToggleSplit}
                            className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-variant focus:ring-primary ${
                                isSplit ? 'bg-primary' : 'bg-on-surface/20'
                            }`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                isSplit ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                    </div>
                 )}

                {/* Shared Expense Details - Conditional */}
                <div className={`space-y-4 transition-all duration-300 ease-in-out ${isSplit ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="bg-surface-variant rounded-2xl flex items-center p-4 gap-4">
                        <span className="material-symbols-outlined text-on-surface-variant w-8 text-center">person</span>
                         <select value={paidById} onChange={e => setPaidById(e.target.value)} required className="w-full bg-transparent text-on-surface focus:outline-none appearance-none font-medium text-base">
                            <option value="" disabled>Pagato da...</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="bg-surface-variant rounded-2xl p-4">
                         <label className="block text-sm font-medium text-on-surface-variant mb-2">Diviso equamente tra</label>
                        <div className="flex flex-wrap gap-2">
                            {members.map(member => (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => handleToggleParticipant(member.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        splitParticipantIds.includes(member.id)
                                            ? 'bg-primary-container text-on-primary-container'
                                            : 'bg-surface text-on-surface'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-base ${!splitParticipantIds.includes(member.id) ? 'opacity-0' : ''}`}>check</span>
                                    {member.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </main>

            {/* Fixed Footer with Save Button */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-surface-variant flex-shrink-0">
                <button
                    onClick={handleSubmit}
                    className="w-full bg-trip-primary text-trip-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow active:scale-[0.98]"
                >
                    {expense?.id ? 'Salva Modifiche' : 'Salva Spesa'}
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
                input[type="date"]::-webkit-calendar-picker-indicator {
                    background: none;
                    cursor: pointer;
                    width: 1.5rem;
                    position: absolute;
                    right: 0;
                }
                input[type="date"] {
                    position: relative;
                }
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
                select.pr-6 {
                    background-position: right 0 center;
                }
            `}</style>
        </div>
    );
};

export default ExpenseForm;