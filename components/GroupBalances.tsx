import React, { useMemo, useState, lazy, Suspense, useRef, useEffect } from 'react';
import { Trip, TripMember, Expense, GroupMessage } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useData } from '../context/DataContext';
import { ADJUSTMENT_CATEGORY } from '../constants';
import MemberAvatar from './common/MemberAvatar';

const SettleDebtModal = lazy(() => import('./SettleDebtModal'));

interface GroupViewProps {
    trip: Trip;
}

// --- Helper Components for Balances ---

const BalanceRing: React.FC<{ color: string; percentage: number }> = ({ color, percentage }) => (
    <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="3.5" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
              fill="none" className={`stroke-current text-${color}`} strokeWidth="3.5"
              strokeDasharray={`${percentage}, 100`} strokeLinecap="round" />
    </svg>
);

interface SimplifiedDebt {
    from: TripMember;
    to: TripMember;
    amount: number;
}

// --- Main Component ---
const GroupView: React.FC<GroupViewProps> = ({ trip }) => {
    const { members, expenses, mainCurrency } = trip;
    const { convert, formatCurrency } = useCurrencyConverter();
    const { addGroupMessage } = useData();
    
    const [activeTab, setActiveTab] = useState<'balances' | 'wall'>('balances');
    const [settlingDebt, setSettlingDebt] = useState<SimplifiedDebt | null>(null);
    
    // State for Wall
    const [newMessage, setNewMessage] = useState('');
    const [messageCategory, setMessageCategory] = useState<GroupMessage['category']>('General');
    const wallContainerRef = useRef<HTMLDivElement>(null);

    const groupMessages = useMemo(() => {
        return [...(trip.groupMessages || [])].sort((a, b) => a.timestamp - b.timestamp);
    }, [trip.groupMessages]);
    
    useEffect(() => {
        if (activeTab === 'wall' && wallContainerRef.current) {
            wallContainerRef.current.scrollTop = wallContainerRef.current.scrollHeight;
        }
    }, [groupMessages, activeTab]);

    const CARD_COLORS = ['bg-orange-500', 'bg-yellow-500', 'bg-violet-500', 'bg-cyan-500', 'bg-pink-500', 'bg-lime-500'];

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

        const user = members.find(m => m.id === 'user-self') || members[0];
        const userBalance = balances.get(user.id) || 0;
        const totalOwedToUser = userBalance > 0 ? userBalance : 0;
        const totalUserOwes = userBalance < 0 ? Math.abs(userBalance) : 0;
        
        // --- Debt Simplification Algorithm ---
        const debtors: { id: string; amount: number }[] = [];
        const creditors: { id: string; amount: number }[] = [];
        balances.forEach((amount, id) => {
            if (amount < -0.01) debtors.push({ id, amount });
            if (amount > 0.01) creditors.push({ id, amount });
        });

        const simplifiedDebts: SimplifiedDebt[] = [];
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

        return { totalOwedToUser, totalUserOwes, simplifiedDebts };

    }, [expenses, members, mainCurrency, convert]);
    
    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        const self = trip.members?.find(m => m.id === 'user-self') || trip.members?.[0];
        if (!self) return;

        addGroupMessage(trip.id, {
            authorId: self.id,
            text: newMessage.trim(),
            category: messageCategory,
        });
        setNewMessage('');
        setMessageCategory('General');
    };

    if (!members || members.length <= 1) {
        return (
            <div className="text-center py-12 px-6 bg-surface-variant/50 rounded-3xl">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">group_add</span>
                <h2 className="text-xl font-bold text-on-surface">Modalità Gruppo</h2>
                <p className="text-sm text-on-surface-variant mt-2 max-w-xs mx-auto">
                    Per usare questa sezione, aggiungi almeno un altro membro al tuo viaggio dalle impostazioni del viaggio.
                </p>
            </div>
        );
    }

    const categoryStyles: { [key in GroupMessage['category']]: { icon: string; bg: string; text: string; label: string } } = {
        'Idea': { icon: 'lightbulb', bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-300', label: 'Idea' },
        'Question': { icon: 'help', bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-300', label: 'Domanda' },
        'Link': { icon: 'link', bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-300', label: 'Link' },
        'Confirmation': { icon: 'check_circle', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-300', label: 'Conferma' },
        'General': { icon: 'chat_bubble', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', label: 'Generale' },
    };

    const renderBalances = () => {
        if (!balanceData) return null;
        const { totalOwedToUser, totalUserOwes, simplifiedDebts } = balanceData;

        return (
             <div className="space-y-8 animate-fade-in">
                 <section className="grid grid-cols-2 gap-4">
                    <div className="bg-surface p-4 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-on-surface-variant">Ti devono</p>
                        </div>
                        <p className="text-2xl font-bold text-on-surface mt-2">{formatCurrency(totalOwedToUser, mainCurrency)}</p>
                    </div>
                     <div className="bg-surface p-4 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-on-surface-variant">Devi dare</p>
                        </div>
                        <p className="text-2xl font-bold text-on-surface mt-2">{formatCurrency(totalUserOwes, mainCurrency)}</p>
                    </div>
                </section>

                <section>
                     <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">RIEPILOGO SALDI</h2>
                     <div className="space-y-3">
                        {simplifiedDebts.length > 0 ? (
                            simplifiedDebts.map((debt, index) => {
                                const isUserDebtor = debt.from.id === (members.find(m => m.id === 'user-self') || members[0]).id;
                                const fromName = isUserDebtor ? 'Tu' : debt.from.name.split(' ')[0];
                                const toName = debt.to.id === (members.find(m => m.id === 'user-self') || members[0]).id ? 'te' : debt.to.name.split(' ')[0];
                                
                                const cardColor = CARD_COLORS[index % CARD_COLORS.length];

                                return (
                                    <div key={`${debt.from.id}-${debt.to.id}-${index}`} className={`${cardColor} p-5 rounded-3xl shadow-lg`}>
                                        <div className="flex justify-between items-center text-white">
                                            <div>
                                                <p className="font-bold text-xl">{`${fromName} deve a ${toName}`}</p>
                                                <p className="font-black text-3xl mt-1 tracking-tighter">
                                                    {formatCurrency(debt.amount, mainCurrency)}
                                                </p>
                                            </div>
                                            <div className="flex -space-x-4">
                                                <MemberAvatar member={debt.from} className={`w-10 h-10 text-sm border-2 ${cardColor}`} />
                                                <MemberAvatar member={debt.to} className={`w-10 h-10 text-sm border-2 ${cardColor}`} />
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/20">
                                            <button 
                                                onClick={() => setSettlingDebt(debt)}
                                                className="w-full text-center bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl transition-colors"
                                            >
                                                Salda
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                             <div className="text-center py-12 px-6 bg-surface-variant/50 rounded-3xl">
                                <span className="material-symbols-outlined text-5xl text-green-500 mb-4">check_circle</span>
                                <h2 className="text-xl font-bold text-on-surface">Tutto in pari!</h2>
                                <p className="text-sm text-on-surface-variant mt-2">Al momento non ci sono debiti da saldare.</p>
                            </div>
                        )}
                     </div>
                </section>
            </div>
        );
    };

    const renderWall = () => (
        <div className="h-full flex flex-col animate-fade-in">
            <div ref={wallContainerRef} className="flex-1 overflow-y-auto space-y-4 p-4">
                {groupMessages.map(msg => {
                    const author = members.find(m => m.id === msg.authorId);
                    const catStyle = categoryStyles[msg.category];
                    return (
                        <div key={msg.id} className="flex items-start gap-3">
                            <MemberAvatar member={author} className="mt-1" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-on-surface">{author?.name || 'Sconosciuto'}</span>
                                    <span className="text-xs text-on-surface-variant">{new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="bg-surface-variant p-3 rounded-xl rounded-tl-none mt-1">
                                    <p className="text-sm text-on-surface whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full mt-1.5 ${catStyle.bg} ${catStyle.text}`}>
                                    <span className="material-symbols-outlined text-xs">{catStyle.icon}</span>
                                    <span>{catStyle.label}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="p-2 border-t border-surface-variant bg-surface">
                <div className="flex items-center gap-2 mb-2">
                    {Object.entries(categoryStyles).map(([key, value]) => (
                        <button key={key} onClick={() => setMessageCategory(key as GroupMessage['category'])} className={`flex-1 text-xs font-semibold px-2 py-1 rounded-full transition-colors ${messageCategory === key ? `${value.bg} ${value.text}` : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            {value.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder="Scrivi un messaggio..."
                        rows={1}
                        className="flex-1 bg-surface-variant rounded-full py-2 px-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button onClick={handleSendMessage} className="w-10 h-10 flex-shrink-0 bg-primary text-on-primary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="bg-surface-variant p-1 rounded-full flex max-w-sm mx-auto mb-6">
                <button onClick={() => setActiveTab('balances')} className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${activeTab === 'balances' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}>Saldos</button>
                <button onClick={() => setActiveTab('wall')} className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${activeTab === 'wall' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}>Bacheca</button>
            </div>
            
            <div className="flex-grow min-h-[60vh] flex flex-col">
                {activeTab === 'balances' ? renderBalances() : renderWall()}
            </div>

            {settlingDebt && (
                <Suspense fallback={<div/>}>
                    <SettleDebtModal
                        trip={trip}
                        debt={settlingDebt}
                        onClose={() => setSettlingDebt(null)}
                    />
                </Suspense>
            )}
        </>
    );
};

// Rinominato per chiarezza, da GroupBalances a GroupView
export default GroupView;