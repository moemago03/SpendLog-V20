import React, { useState } from 'react';
import { Trip, TripMember } from '../types';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import MemberAvatar from './common/MemberAvatar';

interface SettleDebtModalProps {
    trip: Trip;
    debt: {
        from: TripMember;
        to: TripMember;
        amount: number;
    };
    onClose: () => void;
}

const SettleDebtModal: React.FC<SettleDebtModalProps> = ({ trip, debt, onClose }) => {
    const { addAdjustment } = useData();
    const { addNotification } = useNotification();
    const [amount, setAmount] = useState(debt.amount.toFixed(2));

    const handleSubmit = () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            addNotification("L'importo non è valido.", 'error');
            return;
        }
        
        const adjustmentData = {
            description: `Saldo: ${debt.from.name} -> ${debt.to.name}`,
            amount: numericAmount,
            currency: trip.mainCurrency,
            date: new Date().toISOString(),
            paidById: debt.from.id,
            splitBetweenMemberIds: [debt.to.id],
            splitType: 'equally' as 'equally',
        };

        addAdjustment(trip.id, adjustmentData);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settle-debt-title"
        >
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 id="settle-debt-title" className="text-xl font-bold ml-4">Salda Debito</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center -space-x-4 mb-6">
                    <MemberAvatar member={debt.from} className="w-20 h-20 text-2xl border-4" />
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center z-10 border-4 border-surface">
                        <span className="material-symbols-outlined text-on-primary">arrow_forward</span>
                    </div>
                    <MemberAvatar member={debt.to} className="w-20 h-20 text-2xl border-4" />
                </div>

                <p className="text-lg text-on-surface-variant">
                    Registra il pagamento da <span className="font-bold text-on-surface">{debt.from.name}</span> a <span className="font-bold text-on-surface">{debt.to.name}</span>.
                </p>

                <div className="relative mt-6">
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-48 bg-surface-variant text-center text-5xl font-bold p-3 rounded-2xl border-2 border-transparent focus:border-primary focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-on-surface-variant">
                        {trip.mainCurrency}
                    </span>
                </div>
                 <p className="text-xs text-on-surface-variant mt-2">
                    Importo originale: {debt.amount.toFixed(2)} {trip.mainCurrency}
                </p>
            </main>

            <footer className="p-4 border-t border-surface-variant mt-auto flex-shrink-0">
                <button 
                    onClick={handleSubmit}
                    className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
                >
                    Conferma Pagamento
                </button>
            </footer>
        </div>
    );
};

export default SettleDebtModal;