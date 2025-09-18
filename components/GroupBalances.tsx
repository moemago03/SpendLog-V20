import React, { useMemo, useState } from 'react';
import { Trip, TripMember, Expense } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useData } from '../context/DataContext';
import { ADJUSTMENT_CATEGORY } from '../constants';
import { useNotification } from '../context/NotificationContext';

interface GroupBalancesProps {
    trip: Trip;
}

// --- Helper Functions for Avatars ---
const getInitials = (name: string): string => name ? name.charAt(0).toUpperCase() : '?';

const AVATAR_COLORS = ['bg-blue-200 text-blue-800', 'bg-purple-200 text-purple-800', 'bg-green-200 text-green-800', 'bg-yellow-200 text-yellow-800', 'bg-pink-200 text-pink-800', 'bg-indigo-200 text-indigo-800'];

const getAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % AVATAR_COLORS.length);
    return AVATAR_COLORS[index];
};


// --- Child Components for Dashboard Widgets ---

const MemberAvatar: React.FC<{ member: TripMember | undefined; size?: 'sm' | 'md' }> = ({ member, size = 'md' }) => {
    if (!member) return null;
    const sizeClasses = size === 'md'
        ? 'w-12 h-12 text-xl'
        : 'w-10 h-10 text-lg';
    return <div className={`rounded-full flex-shrink-0 flex items-center justify-center font-bold mx-auto ${sizeClasses} ${getAvatarColor(member.name)}`}>{getInitials(member.name)}</div>;
};

const PaymentModal: React.FC<{
    debt: { from: TripMember, to: TripMember, amount: number };
    trip: Trip;
    onClose: () => void;
}> = ({ debt, trip, onClose }) => {
    const { addExpense } = useData();
    const { formatCurrency } = useCurrencyConverter();
    const { addNotification } = useNotification();
    const [amount, setAmount] = useState(debt.amount.toFixed(2));
    const [description, setDescription] = useState('');

    const handleSave = () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0 || numericAmount > debt.amount) {
            addNotification(`Inserisci un importo valido (tra 0 e ${debt.amount.toFixed(2)}).`, 'error');
            return;
        }

        addExpense(trip.id, {
            amount: numericAmount,
            currency: trip.mainCurrency,
            category: ADJUSTMENT_CATEGORY,
            date: new Date().toISOString(),
            description: description || `Pagamento da ${debt.from.name} a ${debt.to.name}`,
            paidById: debt.from.id,
            splitType: 'equally',
            splitBetweenMemberIds: [debt.to.id],
        });
        
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-surface-variant">
                    <h3 className="text-lg font-semibold text-on-surface text-center">Registra Pagamento</h3>
                </header>
                <main className="p-6 space-y-4">
                    <p className="text-sm text-center text-on-surface-variant">
                        <span className="font-semibold">{debt.from.name}</span> paga a <span className="font-semibold">{debt.to.name}</span>
                    </p>
                    <div>
                        <label className="text-xs text-on-surface-variant">Importo ({trip.mainCurrency})</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-surface-variant text-on-surface text-2xl font-bold p-3 rounded-lg mt-1 border-2 border-transparent focus:border-primary focus:outline-none"
                            max={debt.amount.toFixed(2)}
                            min="0.01"
                            step="0.01"
                        />
                    </div>
                     <div>
                        <label className="text-xs text-on-surface-variant">Nota (opzionale)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Es. Pagamento in contanti"
                            className="w-full bg-surface-variant text-on-surface p-3 rounded-lg mt-1 border-2 border-transparent focus:border-primary focus:outline-none"
                        />
                    </div>
                </main>
                 <footer className="p-4 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-surface-variant text-on-surface-variant font-semibold">Annulla</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-semibold">Salva</button>
                </footer>
            </div>
        </div>
    );
};


const GroupBalancesWidget: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { members, expenses, mainCurrency } = trip;
    const { convert, formatCurrency } = useCurrencyConverter();
    const [adjustingDebt, setAdjustingDebt] = useState<{ from: TripMember, to: TripMember, amount: number } | null>(null);

    const simplifiedDebts = useMemo(() => {
        if (!members || members.length <= 1) return [];
        
        const balances = new Map<string, number>();
        members.forEach(m => balances.set(m.id, 0));

        (expenses || []).forEach(expense => {
            if (!expense.paidById || !expense.splitBetweenMemberIds || expense.splitBetweenMemberIds.length === 0) return;
            const expenseAmountInMain = convert(expense.amount, expense.currency, mainCurrency);
            balances.set(expense.paidById, (balances.get(expense.paidById) || 0) + expenseAmountInMain);
            const splitAmount = expenseAmountInMain / expense.splitBetweenMemberIds.length;
            expense.splitBetweenMemberIds.forEach(memberId => {
                balances.set(memberId, (balances.get(memberId) || 0) - splitAmount);
            });
        });

        const debtors = Array.from(balances.entries()).filter(([, bal]) => bal < -0.01).map(([id, bal]) => ({ memberId: id, amount: bal }));
        const creditors = Array.from(balances.entries()).filter(([, bal]) => bal > 0.01).map(([id, bal]) => ({ memberId: id, amount: bal }));

        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => b.amount - a.amount);
        
        const debts = [];
        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0];
            const creditor = creditors[0];
            const transferAmount = Math.min(Math.abs(debtor.amount), creditor.amount);

            if (transferAmount > 0.01) debts.push({ from: debtor.memberId, to: creditor.memberId, amount: transferAmount });
            
            debtor.amount += transferAmount;
            creditor.amount -= transferAmount;
            
            if (Math.abs(debtor.amount) < 0.01) debtors.shift();
            if (creditor.amount < 0.01) creditors.shift();
        }
        return debts;
    }, [expenses, members, mainCurrency, convert]);

    const getMemberById = (memberId: string) => members?.find(m => m.id === memberId);

    return (
        <div className="bg-surface p-4 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-4">Saldi Attuali</h2>
            {simplifiedDebts.length === 0 ? (
                <div className="text-center py-6">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">thumb_up</span>
                    <p className="font-semibold text-on-surface">Tutto in ordine!</p>
                    <p className="text-sm text-on-surface-variant">Nessuno deve soldi a nessun altro.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {simplifiedDebts.map((debt, index) => {
                        const from = getMemberById(debt.from);
                        const to = getMemberById(debt.to);
                        if (!from || !to) return null;
                        return (
                            <div key={index} className="bg-surface-variant p-4 rounded-2xl flex flex-col justify-between animate-slide-in-up" style={{ animationDelay: `${index * 60}ms`, minHeight: '180px' }}>
                                <div className="flex items-center justify-between text-center flex-grow">
                                    {/* Debtor Info */}
                                    <div className="flex flex-col items-center space-y-1 flex-1 min-w-0 px-1">
                                        <MemberAvatar member={from} size="sm" />
                                        <p className="font-semibold text-on-surface text-sm w-full truncate" title={from.name}>{from.name}</p>
                                    </div>
                                    
                                    {/* Amount and Arrow */}
                                    <div className="flex flex-col items-center flex-shrink-0 mx-2">
                                        <p className="font-bold text-lg text-primary">{formatCurrency(debt.amount, mainCurrency)}</p>
                                        <span className="material-symbols-outlined text-2xl text-on-surface-variant">arrow_forward</span>
                                    </div>

                                    {/* Creditor Info */}
                                    <div className="flex flex-col items-center space-y-1 flex-1 min-w-0 px-1">
                                        <MemberAvatar member={to} size="sm" />
                                        <p className="font-semibold text-on-surface text-sm w-full truncate" title={to.name}>{to.name}</p>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setAdjustingDebt({ from, to, amount: debt.amount })}
                                    className="mt-4 w-full px-3 py-2 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full hover:opacity-80 transition-opacity flex-shrink-0"
                                >
                                    Registra Pagamento
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            {adjustingDebt && (
                <PaymentModal 
                    debt={adjustingDebt}
                    trip={trip}
                    onClose={() => setAdjustingDebt(null)} 
                />
            )}
        </div>
    );
};

const GroupStats: React.FC<{ trip: Trip, onShowDetails: () => void }> = ({ trip, onShowDetails }) => {
    const { convert, formatCurrency } = useCurrencyConverter();
    const { members, mainCurrency } = trip;

    const stats = useMemo(() => {
        const sharedExpenses = (trip.expenses || [])
            .filter(e => e.category !== ADJUSTMENT_CATEGORY)
            .filter(e => e.splitBetweenMemberIds && e.splitBetweenMemberIds.length > 1);
        
        const totalSharedSpend = sharedExpenses.reduce((sum, exp) => sum + convert(exp.amount, exp.currency, mainCurrency), 0);

        const categoryTotals = sharedExpenses.reduce((acc, exp) => {
            const amount = convert(exp.amount, exp.currency, mainCurrency);
            acc[exp.category] = (acc[exp.category] || 0) + amount;
            return acc;
        }, {} as { [key: string]: number });
        const topCategory = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, 'N/A');

        const contributorTotals = sharedExpenses.reduce((acc, exp) => {
            if (!exp.paidById) return acc;
            const amount = convert(exp.amount, exp.currency, mainCurrency);
            acc[exp.paidById] = (acc[exp.paidById] || 0) + amount;
            return acc;
        }, {} as { [key: string]: number });
        const topContributorId = Object.keys(contributorTotals).reduce((a, b) => contributorTotals[a] > contributorTotals[b] ? a : b, '');
        const topContributorName = members?.find(m => m.id === topContributorId)?.name || 'N/A';
        
        return { totalSharedSpend, topCategory, topContributorName, sharedExpensesCount: sharedExpenses.length };
    }, [trip.expenses, members, mainCurrency, convert]);

    const StatCard = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
        <div className="flex items-center gap-3 p-3 bg-surface-variant rounded-2xl">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary-container text-on-secondary-container"><span className="material-symbols-outlined">{icon}</span></div>
            <div>
                <p className="text-xs font-medium text-on-surface-variant">{label}</p>
                <p className="font-bold text-sm text-on-surface truncate">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-surface p-4 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-on-surface">Statistiche di Gruppo</h2>
                {stats.sharedExpensesCount > 0 && (
                     <button onClick={onShowDetails} className="text-sm font-medium text-primary hover:underline">Vedi Dettagli</button>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatCard icon="receipt_long" label="Spese Condivise" value={`${stats.sharedExpensesCount}`} />
                <StatCard icon="paid" label="Spesa Totale Gruppo" value={formatCurrency(stats.totalSharedSpend, mainCurrency)} />
                <StatCard icon="category" label="Top Categoria" value={stats.topCategory} />
                <StatCard icon="workspace_premium" label="Top Contributore" value={stats.topContributorName} />
            </div>
        </div>
    );
};

const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = (now.getTime() - date.getTime()) / 1000;
    const diffDays = Math.floor(diffSeconds / 86400);

    if (diffDays === 0) return "Oggi";
    if (diffDays === 1) return "Ieri";
    return `${diffDays} giorni fa`;
};

const GroupActivityFeed: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { members } = trip;
    const { data } = useData();

    const activityFeed = useMemo(() => {
        const sharedExpenses = (trip.expenses || [])
            .filter(e => e.category !== ADJUSTMENT_CATEGORY)
            .filter(e => e.splitBetweenMemberIds && e.splitBetweenMemberIds.length > 1)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return sharedExpenses.slice(0, 5).map(exp => {
            const member = members?.find(m => m.id === exp.paidById);
            const category = data.categories.find(c => c.name === exp.category);
            return {
                id: exp.id,
                memberName: member?.name || 'Sconosciuto',
                categoryIcon: category?.icon || '💸',
                description: `${exp.category}`,
                time: formatRelativeTime(exp.date),
                amount: exp.amount,
                currency: exp.currency
            };
        });
    }, [trip.expenses, members, data.categories]);

    return (
        <div className="bg-surface p-4 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold text-on-surface mb-4">Attività Recenti</h2>
            {activityFeed.length === 0 ? (
                 <p className="text-sm text-center text-on-surface-variant py-4">Nessuna attività di gruppo da mostrare.</p>
            ) : (
                <div className="relative pl-5">
                    <div className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-surface-variant"></div>
                    {activityFeed.map((item, index) => (
                        <div key={item.id} className="relative mb-4">
                            <div className="absolute -left-2.5 top-2 w-5 h-5 bg-surface-variant rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-secondary-container rounded-full"></div>
                            </div>
                            <div className="pl-6">
                                <p className="text-xs text-on-surface-variant">{item.time}</p>
                                <p className="font-semibold text-sm text-on-surface">
                                    {item.memberName} ha pagato per <span className="font-bold">{item.description}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SharedExpensesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    expenses: Expense[];
    trip: Trip;
}> = ({ isOpen, onClose, expenses, trip }) => {
    const { data } = useData();
    const { formatCurrency, convert } = useCurrencyConverter();
    const getMemberById = (memberId: string) => trip.members?.find(m => m.id === memberId);
    
    if (!isOpen) return null;

    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="flex justify-between items-center p-4 border-b border-surface-variant">
                    <h3 className="text-lg font-semibold text-on-surface">Dettaglio Spese Condivise</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant" aria-label="Chiudi">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>
                <ul className="overflow-y-auto p-2 space-y-2">
                    {sortedExpenses.map(expense => {
                        const paidBy = getMemberById(expense.paidById || '');
                        const category = data.categories.find(c => c.name === expense.category);
                        return (
                            <li key={expense.id} className="p-3 rounded-2xl bg-surface-variant">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 flex-shrink-0 bg-surface text-xl rounded-full flex items-center justify-center">
                                            {category?.icon || '💸'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-on-surface truncate">{expense.category}</p>
                                            <p className="text-xs text-on-surface-variant">Pagato da: {paidBy?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-on-surface">{formatCurrency(expense.amount, expense.currency)}</p>
                                        {expense.currency !== trip.mainCurrency && (
                                            <p className="text-xs text-on-surface-variant -mt-0.5">
                                                {`≈ ${formatCurrency(convert(expense.amount, expense.currency, trip.mainCurrency), trip.mainCurrency)}`}
                                            </p>
                                        )}
                                        <p className="text-xs text-on-surface-variant mt-1">{new Date(expense.date).toLocaleDateString('it-IT')}</p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};


// --- Main Component ---
const GroupBalances: React.FC<GroupBalancesProps> = ({ trip }) => {
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const sharedExpenses = useMemo(() => 
        (trip.expenses || [])
            .filter(e => e.category !== ADJUSTMENT_CATEGORY)
            .filter(e => e.splitBetweenMemberIds && e.splitBetweenMemberIds.length > 1),
        [trip.expenses]
    );

    if (!trip.members || trip.members.length <= 1) {
        return (
            <div className="text-center py-12 px-6 bg-surface-variant rounded-3xl">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">group_add</span>
                <h2 className="text-xl font-bold text-on-surface-variant">Modalità Gruppo</h2>
                <p className="text-sm text-on-surface-variant mt-2 max-w-xs mx-auto">
                    Per usare questa sezione, aggiungi almeno un altro membro al tuo viaggio dalle impostazioni.
                </p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <GroupBalancesWidget trip={trip} />
            <GroupStats trip={trip} onShowDetails={() => setIsDetailsModalOpen(true)} />
            <GroupActivityFeed trip={trip} />

            <SharedExpensesModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                expenses={sharedExpenses}
                trip={trip}
            />
        </div>
    );
};

export default GroupBalances;