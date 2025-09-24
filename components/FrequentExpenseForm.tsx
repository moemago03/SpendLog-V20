import React, { useState, useMemo } from 'react';
import { Trip, FrequentExpense } from '../types';
import { useData } from '../context/DataContext';
import { CATEGORY_ICONS } from '../constants';

interface FrequentExpenseFormProps {
    expense?: FrequentExpense;
    trip: Trip;
    onSave: (expenseData: Omit<FrequentExpense, 'id'>) => void;
    onClose: () => void;
    onDelete?: () => void;
}

const FrequentExpenseForm: React.FC<FrequentExpenseFormProps> = ({ expense, trip, onSave, onClose, onDelete }) => {
    const { data } = useData();

    const [name, setName] = useState(expense?.name || '');
    const [icon, setIcon] = useState(expense?.icon || CATEGORY_ICONS[0]);
    const [amount, setAmount] = useState(expense?.amount?.toString() || '');
    const [category, setCategory] = useState(expense?.category || data.categories[0]?.name || '');

    const members = useMemo(() => trip.members || [], [trip.members]);
    const [paidById, setPaidById] = useState(expense?.paidById || members[0]?.id || 'user-self');
    const [splitBetweenMemberIds, setSplitBetweenMemberIds] = useState<string[]>(expense?.splitBetweenMemberIds || (members.length > 0 ? [members[0].id] : []));


    const handleSubmit = () => {
        const numericAmount = parseFloat(amount);
        if (!name.trim() || isNaN(numericAmount) || numericAmount <= 0) {
            alert("Per favore, compila tutti i campi correttamente.");
            return;
        }

        onSave({
            name,
            icon,
            amount: numericAmount,
            category,
            paidById,
            splitBetweenMemberIds,
        });
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

    return (
        <div className="bg-background text-on-background h-full flex flex-col">
            <header className="flex items-center p-4">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">{expense ? 'Modifica' : 'Crea'} Spesa Frequente</h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center text-5xl">
                        {icon}
                    </div>
                    <div className="flex-grow">
                        <label className={labelClasses}>Nome</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputClasses}/>
                    </div>
                </div>

                <div>
                    <label className={labelClasses}>Icona</label>
                    <div className="mt-2 p-3 bg-surface-variant rounded-2xl grid grid-cols-6 gap-2">
                        {CATEGORY_ICONS.slice(0, 18).map(i => (
                            <button key={i} onClick={() => setIcon(i)} type="button" className={`aspect-square rounded-full text-2xl flex items-center justify-center transition-transform hover:scale-110 ${icon === i ? 'bg-primary text-on-primary' : 'bg-surface'}`}>{i}</button>
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Importo (in {trip.mainCurrency})</label>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className={inputClasses}/>
                    </div>
                    <div>
                        <label className={labelClasses}>Categoria</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} required className={`${inputClasses} appearance-none`}>
                            {data.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {members.length > 1 && (
                    <div className="pt-4 border-t border-surface-variant">
                        <h3 className="font-semibold mb-2 text-on-surface">Divisione Spesa Predefinita</h3>
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
            </main>

            <footer className="p-4 border-t border-surface-variant flex gap-4">
                {expense && onDelete && (
                    <button type="button" onClick={onDelete} className="w-16 h-16 flex items-center justify-center bg-error-container text-on-error-container rounded-2xl flex-shrink-0">
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                )}
                <button onClick={handleSubmit} className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl">
                    Salva
                </button>
            </footer>
        </div>
    );
};

export default FrequentExpenseForm;
