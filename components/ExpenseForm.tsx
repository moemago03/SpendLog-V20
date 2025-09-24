import React, { useState, useMemo } from 'react';
import { Trip, Expense, Category, TripMember } from '../types';
import { useData } from '../context/DataContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useNotification } from '../context/NotificationContext';

interface ExpenseFormProps {
    expense: Partial<Expense> & { checklistItemId?: string };
    trip: Trip;
    onClose: () => void;
    onShowPackingPrompt: (tripId: string, description: string) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, trip, onClose, onShowPackingPrompt }) => {
    const { addExpense, updateExpense, data, updateChecklistItem } = useData();
    const { addNotification } = useNotification();
    const { formatCurrency } = useCurrencyConverter();
    const isEditing = !!expense.id;

    const [amount, setAmount] = useState<string>(expense.amount?.toString() || '');
    const [currency, setCurrency] = useState<string>(expense.currency || trip.mainCurrency);
    const [category, setCategory] = useState<string>(expense.category || data.categories[0].name);
    const [description, setDescription] = useState<string>(expense.description || '');
    const [date, setDate] = useState<string>(expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    
    const members = useMemo(() => trip.members || [], [trip.members]);
    const [paidById, setPaidById] = useState(expense.paidById || members[0]?.id || 'user-self');
    const [splitType, setSplitType] = useState(expense.splitType || 'equally');
    const [splitBetweenMemberIds, setSplitBetweenMemberIds] = useState<string[]>(expense.splitBetweenMemberIds || (members.length > 0 ? members.map(m => m.id) : []));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            addNotification("Inserisci un importo valido.", 'error');
            return;
        }

        const expenseDescription = description.trim() || category;

        const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
            amount: numericAmount,
            currency,
            category,
            description: expenseDescription,
            date: new Date(date).toISOString(),
            paidById,
            splitType,
            splitBetweenMemberIds,
            eventId: expense.eventId,
        };

        if (isEditing) {
            updateExpense(trip.id, { ...expense, ...expenseData } as Expense);
            addNotification("Spesa aggiornata!", 'success');
        } else {
            const newExpenseId = addExpense(trip.id, expenseData, expense.checklistItemId);
            if (expense.checklistItemId && newExpenseId) {
                const checklistItem = trip.checklist?.find(item => item.id === expense.checklistItemId);
                if (checklistItem) {
                    updateChecklistItem(trip.id, { ...checklistItem, expenseId: newExpenseId });
                }
            }
            addNotification("Spesa aggiunta!", 'success');
        }
        
        if (!isEditing && (category === 'Shopping' || category === 'Regali') && expenseDescription) {
             onShowPackingPrompt(trip.id, expenseDescription);
        }

        onClose();
    };
    
    const handleToggleSplitMember = (memberId: string) => {
        setSplitBetweenMemberIds(prev => {
            if (prev.includes(memberId)) {
                return prev.length > 1 ? prev.filter(id => id !== memberId) : prev;
            } else {
                return [...prev, memberId];
            }
        });
    };

    const inputClasses = "mt-1 block w-full bg-surface-variant border-transparent rounded-lg py-3 px-3 focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClasses = "block text-sm font-medium text-on-surface-variant";
    
    const eventName = expense.eventId ? trip.events?.find(e => e.eventId === expense.eventId)?.title : null;

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-surface-variant">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">
                    {isEditing ? 'Modifica Spesa' : 'Nuova Spesa'}
                </h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                     {eventName && (
                        <div className="p-3 bg-primary-container/50 rounded-lg text-sm font-medium text-on-primary-container flex items-center gap-2">
                             <span className="material-symbols-outlined text-base">link</span>
                            <span>Spesa collegata all'evento: <strong>{eventName}</strong></span>
                        </div>
                    )}
                    <div className="flex items-end gap-3">
                        <div className="flex-grow">
                            <label htmlFor="amount" className={labelClasses}>Importo</label>
                            <input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className={inputClasses}/>
                        </div>
                        <div className="w-28">
                            <label htmlFor="currency" className={labelClasses}>Valuta</label>
                            <select id="currency" value={currency} onChange={e => setCurrency(e.target.value)} required className={`${inputClasses} appearance-none`}>
                                {trip.preferredCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="category" className={labelClasses}>Categoria</label>
                        <select id="category" value={category} onChange={e => setCategory(e.target.value)} required className={`${inputClasses} appearance-none`}>
                            {data.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>

                     <div>
                        <label htmlFor="description" className={labelClasses}>Descrizione (Opzionale)</label>
                        <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputClasses}/>
                    </div>

                    <div>
                        <label htmlFor="date" className={labelClasses}>Data</label>
                        <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputClasses}/>
                    </div>

                    {members.length > 1 && (
                        <div className="pt-4 border-t border-surface-variant">
                            <h3 className="font-semibold mb-2 text-on-surface">Divisione Spesa</h3>
                            <div>
                                <label className={labelClasses}>Pagato da</label>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {members.map(member => (
                                        <button type="button" key={member.id} onClick={() => setPaidById(member.id)} className={`p-2 rounded-lg text-sm text-center font-medium transition-colors ${paidById === member.id ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>{member.name}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className={labelClasses}>Diviso con</label>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {members.map(member => (
                                        <button type="button" key={member.id} onClick={() => handleToggleSplitMember(member.id)} className={`p-2 rounded-lg text-sm text-center font-medium transition-colors ${splitBetweenMemberIds.includes(member.id) ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}>{member.name}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </main>
            
            <footer className="p-4 border-t border-surface-variant mt-auto flex-shrink-0">
                <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
                >
                    {isEditing ? 'Salva Modifiche' : 'Aggiungi Spesa'}
                </button>
            </footer>
        </div>
    );
};

export default ExpenseForm;
