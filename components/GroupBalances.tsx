

import React, { useMemo } from 'react';
import { Trip, TripMember, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useData } from '../context/DataContext';
import { ADJUSTMENT_CATEGORY } from '../constants';

interface GroupBalancesProps {
    trip: Trip;
}

// --- Helper Components for the design ---

const getInitials = (name: string): string => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
const AVATAR_COLORS = ['bg-blue-200 text-blue-800', 'bg-purple-200 text-purple-800', 'bg-green-200 text-green-800', 'bg-yellow-200 text-yellow-800', 'bg-pink-200 text-pink-800', 'bg-indigo-200 text-indigo-800'];
const getAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash % AVATAR_COLORS.length)];
};
const MemberAvatar: React.FC<{ member: TripMember | undefined; className?: string }> = ({ member, className = '' }) => {
    if (!member) return null;
    return <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border-2 border-white dark:border-gray-800 ${getAvatarColor(member.name)} ${className}`}>{getInitials(member.name)}</div>;
};

const BalanceRing: React.FC<{ color: string; percentage: number }> = ({ color, percentage }) => (
    <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="3.5" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
              fill="none" className={`stroke-current text-${color}`} strokeWidth="3.5"
              strokeDasharray={`${percentage}, 100`} strokeLinecap="round" />
    </svg>
);

const TransactionRow: React.FC<{ expense: Expense; trip: Trip }> = ({ expense, trip }) => {
    const { data } = useData();
    const { formatCurrency } = useCurrencyConverter();
    const paidBy = trip.members?.find(m => m.id === expense.paidById);
    const category = data.categories.find(c => c.name === expense.category);
    const date = new Date(expense.date);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = new Date(today.setDate(today.getDate() - 1)).toDateString() === date.toDateString();
    
    let dateLabel = isToday ? `Today, ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` :
                    isYesterday ? `Yesterday, ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` :
                    date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

    return (
        <div className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl">
            <MemberAvatar member={paidBy} />
            <div className="ml-3 flex-grow">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{paidBy?.name || 'Sconosciuto'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{category?.name || 'Spesa'}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{formatCurrency(expense.amount, expense.currency)}</p>
                <p className="text-xs text-gray-400">{dateLabel}</p>
            </div>
        </div>
    );
}

// --- Main Component ---
const GroupBalances: React.FC<GroupBalancesProps> = ({ trip }) => {
    const { members, expenses, mainCurrency } = trip;
    const { convert, formatCurrency } = useCurrencyConverter();

    const balanceData = useMemo(() => {
        if (!members || members.length < 1) return null;
        
        const balances = new Map<string, number>(members.map(m => [m.id, 0]));
        
        (expenses || []).forEach(expense => {
            if (expense.category === ADJUSTMENT_CATEGORY) {
                const amount = convert(expense.amount, expense.currency, mainCurrency);
                if (expense.paidById) balances.set(expense.paidById, (balances.get(expense.paidById) || 0) + amount);
                if (expense.splitBetweenMemberIds?.[0]) balances.set(expense.splitBetweenMemberIds[0], (balances.get(expense.splitBetweenMemberIds[0]) || 0) - amount);
            } else {
                if (!expense.paidById || !expense.splitBetweenMemberIds || expense.splitBetweenMemberIds.length === 0) return;
                const amount = convert(expense.amount, expense.currency, mainCurrency);
                balances.set(expense.paidById, (balances.get(expense.paidById) || 0) + amount);
                const splitAmount = amount / expense.splitBetweenMemberIds.length;
                expense.splitBetweenMemberIds.forEach(id => balances.set(id, (balances.get(id) || 0) - splitAmount));
            }
        });

        const user = members[0];
        const userBalance = balances.get(user.id) || 0;
        const totalOwedToUser = userBalance > 0 ? userBalance : 0;
        const totalUserOwes = userBalance < 0 ? Math.abs(userBalance) : 0;
        
        const totalTransactions = (expenses || []).filter(e => e.category !== ADJUSTMENT_CATEGORY).reduce((sum, exp) => sum + convert(exp.amount, exp.currency, mainCurrency), 0);
        const owedToUserPercentage = totalTransactions > 0 ? (totalOwedToUser / totalTransactions) * 100 : 0;
        const userOwesPercentage = totalTransactions > 0 ? (totalUserOwes / totalTransactions) * 100 : 0;

        const recentSharedExpenses = (expenses || []).filter(e => e.category !== ADJUSTMENT_CATEGORY && e.splitBetweenMemberIds && e.splitBetweenMemberIds.length > 1).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
            
        // --- Debt Simplification Algorithm ---
        const debtors: { id: string; amount: number }[] = [];
        const creditors: { id: string; amount: number }[] = [];
        balances.forEach((amount, id) => {
            if (amount < -0.01) debtors.push({ id, amount });
            if (amount > 0.01) creditors.push({ id, amount });
        });

        const simplifiedDebts: { from: TripMember; to: TripMember; amount: number }[] = [];
        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0];
            const creditor = creditors[0];
            const amountToTransfer = Math.min(Math.abs(debtor.amount), creditor.amount);

            if (amountToTransfer > 0.01) {
                 const fromMember = members.find(m => m.id === debtor.id);
                 const toMember = members.find(m => m.id === creditor.id);
                 if (fromMember && toMember) {
                    simplifiedDebts.push({ from: fromMember, to: toMember, amount: amountToTransfer });
                 }
            }

            debtor.amount += amountToTransfer;
            creditor.amount -= amountToTransfer;

            if (Math.abs(debtor.amount) < 0.01) debtors.shift();
            if (Math.abs(creditor.amount) < 0.01) creditors.shift();
        }

        return { totalOwedToUser, totalUserOwes, owedToUserPercentage, userOwesPercentage, recentSharedExpenses, simplifiedDebts };

    }, [expenses, members, mainCurrency, convert]);

    if (!members || members.length <= 1) {
        return (
            <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-3xl">
                <span className="material-symbols-outlined text-5xl text-gray-400 mb-4">group_add</span>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Modalità Gruppo</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
                    Per usare questa sezione, aggiungi almeno un altro membro al tuo viaggio dalle impostazioni.
                </p>
            </div>
        );
    }
    
    if (!balanceData) return null;
    const { totalOwedToUser, totalUserOwes, owedToUserPercentage, userOwesPercentage, recentSharedExpenses, simplifiedDebts } = balanceData;

    return (
        <div className="space-y-8 animate-fade-in">
             <section className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400">Ti devono</p>
                        <BalanceRing color="green-500" percentage={owedToUserPercentage} />
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{formatCurrency(totalOwedToUser, mainCurrency)}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400">Devi dare</p>
                        <BalanceRing color="red-500" percentage={userOwesPercentage} />
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{formatCurrency(totalUserOwes, mainCurrency)}</p>
                </div>
            </section>

             <section>
                <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">TRANSACTIONS</h2>
                <div className="bg-white dark:bg-gray-800 p-2 rounded-3xl space-y-1 shadow-sm">
                    {recentSharedExpenses.length > 0 ? (
                        recentSharedExpenses.map(exp => <TransactionRow key={exp.id} expense={exp} trip={trip} />)
                    ) : (
                        <p className="text-center text-sm text-gray-400 py-4">Nessuna transazione di gruppo recente.</p>
                    )}
                </div>
            </section>

            <section>
                 <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">RIEPILOGO SALDI</h2>
                 <div className="space-y-3">
                    {simplifiedDebts.length > 0 ? (
                        simplifiedDebts.map((debt, index) => {
                            const isUserDebtor = debt.from.id === members[0].id;
                            const isUserCreditor = debt.to.id === members[0].id;
                            const fromName = isUserDebtor ? 'Tu' : debt.from.name.split(' ')[0];
                            const toName = isUserCreditor ? 'Tu' : debt.to.name.split(' ')[0];
                            
                            // Color coding inspired by the dribbble shot
                            const cardColor = isUserCreditor ? 'bg-orange-500' : (isUserDebtor ? 'bg-yellow-500' : 'bg-gray-500');

                            return (
                                <div key={`${debt.from.id}-${debt.to.id}-${index}`} className={`${cardColor} text-white p-5 rounded-3xl shadow-lg`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-xl">{`${fromName} deve a ${toName}`}</p>
                                            <p className="font-black text-3xl mt-1 tracking-tighter">
                                                {formatCurrency(debt.amount, mainCurrency)}
                                            </p>
                                        </div>
                                        <div className="flex -space-x-4">
                                            <MemberAvatar member={debt.from} className="border-2 border-orange-400" />
                                            <MemberAvatar member={debt.to} className="border-2 border-yellow-300" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                         <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-3xl">
                            <span className="material-symbols-outlined text-5xl text-green-500 mb-4">check_circle</span>
                            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Tutto in pari!</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Al momento non ci sono debiti da saldare.</p>
                        </div>
                    )}
                 </div>
            </section>
        </div>
    );
};

export default GroupBalances;