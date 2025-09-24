import React, { useState, useMemo, memo, useCallback, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Trip, Expense, Category, TripMember, FrequentExpense } from '../types';
import { useNotification } from '../context/NotificationContext';
import { CURRENCY_INFO, FLAG_SVGS } from '../constants';
import { useLocation } from '../context/LocationContext';
import { GoogleGenAI, Type } from "@google/genai";


const triggerHapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(10);
};

const KeypadButton = memo(({ value, onClick, children, className = '' }: { value: string; onClick: (key: string) => void; children: React.ReactNode; className?: string }) => (
    <button
        type="button"
        onClick={() => {
            triggerHapticFeedback();
            onClick(value);
        }}
        className={`flex items-center justify-center h-14 text-3xl font-light transition-transform active:scale-90 rounded-2xl focus:outline-none ${className}`}
    >
        {children}
    </button>
));

const calculate = (firstOperand: number, secondOperand: number, operator: string): number => {
    switch (operator) {
        case '+': return firstOperand + secondOperand;
        case '-': return firstOperand - secondOperand;
        case '*': return firstOperand * secondOperand;
        case '÷': return secondOperand !== 0 ? firstOperand / secondOperand : 0;
        default: return secondOperand;
    }
};

const FullScreenModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, onClose, children, footer }) => (
    <div className="fixed inset-0 bg-background z-[51] flex flex-col animate-[slide-in-up_0.3s_ease-out]">
        <header className="flex items-center p-4 border-b border-surface-variant">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold ml-4">{title}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
        {footer && <footer className="p-4 border-t border-surface-variant">{footer}</footer>}
    </div>
);

const DateSelectorModal: React.FC<{ 
    currentDate: string; 
    onClose: () => void; 
    onSave: (newDate: string) => void; 
}> = ({ currentDate, onClose, onSave }) => {
    const [tempDate, setTempDate] = useState(currentDate);

    const todayISO = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 bg-black/50 z-[52] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface rounded-3xl p-6 w-full max-w-xs space-y-4 animate-fade-in shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-on-surface">Seleziona Data</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setTempDate(todayISO)} className={`py-2 rounded-full font-semibold transition-colors ${tempDate === todayISO ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>Oggi</button>
                    <button onClick={() => setTempDate(yesterdayISO)} className={`py-2 rounded-full font-semibold transition-colors ${tempDate === yesterdayISO ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>Ieri</button>
                </div>
                <div>
                    <input
                        type="date"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        className="w-full bg-surface-variant p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                    />
                </div>
                <button onClick={() => onSave(tempDate)} className="w-full bg-primary text-on-primary font-bold py-3 rounded-2xl">Conferma</button>
            </div>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => (
    <details className="border-b border-surface-variant group" open={defaultOpen}>
        <summary className="flex justify-between items-center py-4 cursor-pointer list-none">
            <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
            <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-300 group-open:rotate-180">expand_more</span>
        </summary>
        <div className="pb-4 space-y-4">
            {children}
        </div>
    </details>
);


interface ExpenseFormProps {
    trip: Trip;
    expense: Partial<Expense>;
    onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ trip, expense, onClose }) => {
    const { addExpense, updateExpense, data } = useData();
    const { addNotification } = useNotification();
    const { location: deviceLocation, isLoadingLocation, refreshLocation } = useLocation();
    const isEditMode = !!expense.id;
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [view, setView] = useState<'calculator' | 'details'>('calculator');
    
    const isLoan = useMemo(() => {
        if (!expense || !expense.id) return false;
        // A loan has exactly one person in the split, and it's not the person who paid.
        return expense.splitBetweenMemberIds?.length === 1 && expense.paidById !== expense.splitBetweenMemberIds?.[0];
    }, [expense]);

    const [activeTab, setActiveTab] = useState(isLoan ? 'PRESTITO' : (expense.amount && expense.amount < 0 ? 'ENTRATA' : 'SPESA'));
    const [category, setCategory] = useState(expense.category || data.categories.find(c => c.name === "Cibo")?.name || data.categories[0]?.name || '');
    const members = useMemo(() => trip.members || [{ id: 'user-self', name: 'Creatore Viaggio' }], [trip.members]);
    const [paidById, setPaidById] = useState(expense.paidById || members[0].id);
    const [splitBetweenMemberIds, setSplitBetweenMemberIds] = useState<string[]>(expense.splitBetweenMemberIds || [expense.paidById || members[0].id]);
    const [currency, setCurrency] = useState(expense.currency || trip.mainCurrency);
    const [loanToMemberId, setLoanToMemberId] = useState<string | null>(isLoan ? expense.splitBetweenMemberIds![0] : null);
    const [displayValue, setDisplayValue] = useState(expense.amount ? String(Math.abs(expense.amount)).replace('.', ',') : '0');
    const [firstOperand, setFirstOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    
    const [description, setDescription] = useState(expense.description || '');
    const [beneficiary, setBeneficiary] = useState(expense.beneficiary || '');
    const [paymentMethod, setPaymentMethod] = useState(expense.paymentMethod || 'Contanti');
    const [warranty, setWarranty] = useState(expense.warranty || 'Nessuno');
    const [status, setStatus] = useState(expense.status || 'Confermato');
    const [location, setLocation] = useState(expense.location || '');
    const [date, setDate] = useState(expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(expense.date ? new Date(expense.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
    const [tags, setTags] = useState<string[]>(expense.tags || []);
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [attachments, setAttachments] = useState<string[]>(expense.attachments || []);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [isLoanRecipientModalOpen, setIsLoanRecipientModalOpen] = useState(false);
    const [isFrequentExpenseModalOpen, setIsFrequentExpenseModalOpen] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [tempPaidById, setTempPaidById] = useState(paidById);
    const [tempSplitIds, setTempSplitIds] = useState(splitBetweenMemberIds);
    
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);
    
    const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        return (...args: Parameters<F>): Promise<ReturnType<F>> =>
            new Promise(resolve => {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => resolve(func(...args)), waitFor);
            });
    };

    const generateCategorySuggestion = useCallback(async (text: string) => {
        if (text.length < 4) {
            setSuggestedCategory(null);
            return;
        }
        setIsSuggesting(true);
        try {
            const ai = new GoogleGenAI({ apiKey: (window as any).GEMINI_API_KEY });
            const availableCategories = data.categories.map(c => c.name);
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Dato il testo di una spesa "${text}", qual è la categoria più probabile da questa lista? [${availableCategories.join(', ')}].`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { category: { type: Type.STRING, enum: availableCategories } },
                        required: ["category"]
                    }
                }
            });
            const result = JSON.parse(response.text.trim());
            if (result.category && result.category !== category) setSuggestedCategory(result.category);
            else setSuggestedCategory(null);
        } catch (e) {
            console.error("Category suggestion failed:", e);
            setSuggestedCategory(null);
        } finally {
            setIsSuggesting(false);
        }
    }, [data.categories, category]);

    const debouncedSuggest = useMemo(() => debounce(generateCategorySuggestion, 1000), [generateCategorySuggestion]);

    useEffect(() => { 
        if(activeTab === 'SPESA') {
            debouncedSuggest(description); 
        } else {
            setSuggestedCategory(null);
        }
    }, [description, debouncedSuggest, activeTab]);
    
    useEffect(() => {
        setTempPaidById(paidById);
        setTempSplitIds(splitBetweenMemberIds);
    }, [isPaymentModalOpen, paidById, splitBetweenMemberIds]);
    
    const handleKeypad = (key: string) => {
        if (/\d/.test(key)) {
            if (waitingForOperand) {
                setDisplayValue(key);
                setWaitingForOperand(false);
            } else {
                setDisplayValue(displayValue === '0' ? key : displayValue + key);
            }
        } else if (key === ',') {
            if (!displayValue.includes(',')) setDisplayValue(displayValue + ',');
        } else if (key === 'backspace') {
            setDisplayValue(displayValue.length > 1 ? displayValue.slice(0, -1) : '0');
        } else if (['+', '-', '*', '÷'].includes(key)) {
            const currentValue = parseFloat(displayValue.replace(',', '.'));
            if (firstOperand === null) {
                setFirstOperand(currentValue);
            } else if (operator) {
                const result = calculate(firstOperand, currentValue, operator);
                setFirstOperand(result);
                setDisplayValue(String(result).replace('.', ','));
            }
            setOperator(key);
            setWaitingForOperand(true);
        } else if (key === '=') {
            if (firstOperand !== null && operator) {
                const currentValue = parseFloat(displayValue.replace(',', '.'));
                const result = calculate(firstOperand, currentValue, operator);
                setDisplayValue(String(result).replace('.', ','));
                setFirstOperand(null);
                setOperator(null);
                setWaitingForOperand(false);
            }
        }
    };
    
    const handleSave = () => {
        const numericAmount = parseFloat(displayValue.replace(',', '.'));
        if (isNaN(numericAmount) || numericAmount < 0) {
            addNotification("Inserisci un importo valido.", 'error');
            return;
        }
        if (numericAmount === 0 && activeTab !== 'ENTRATA') {
             addNotification("L'importo non può essere zero.", 'error');
             return;
        }

        let expenseData;

        if (activeTab === 'PRESTITO') {
            if (!loanToMemberId) {
                addNotification("Seleziona a chi hai prestato i soldi.", 'error');
                return;
            }
            const borrower = members.find(m => m.id === loanToMemberId);
            expenseData = {
                amount: Math.abs(numericAmount),
                splitBetweenMemberIds: [loanToMemberId],
                description: description || `Prestito a ${borrower?.name || 'sconosciuto'}`,
                category: "Varie", // Loans are categorized as 'Varie' for simplicity
            };
        } else { // SPESA / ENTRATA
            expenseData = {
                amount: activeTab === 'ENTRATA' ? -Math.abs(numericAmount) : Math.abs(numericAmount),
                splitBetweenMemberIds: splitBetweenMemberIds,
                category: category,
                description: description,
            };
        }
    
        const commonData = {
            currency,
            date: new Date(`${date}T${time}`).toISOString(),
            paidById,
            splitType: 'equally' as const,
            tags, beneficiary, paymentMethod, warranty, status, location, attachments
        };
    
        const finalPayload = { ...commonData, ...expenseData };
        
        if (isEditMode) {
            updateExpense(trip.id, { ...expense, ...finalPayload, id: expense.id! });
        } else {
            addExpense(trip.id, finalPayload);
        }
        onClose();
    };

    const handleFrequentExpenseSelect = (freqExpense: FrequentExpense) => {
        setCategory(freqExpense.category);
        setDisplayValue(String(freqExpense.amount).replace('.', ','));
        setDescription(freqExpense.name);
        setIsFrequentExpenseModalOpen(false);
    };

    const handleLocationFetch = async () => {
        if (isLoadingLocation) return;
        await refreshLocation();
        if (deviceLocation?.city && deviceLocation?.country) {
            setLocation(`${deviceLocation.city}, ${deviceLocation.country}`);
        } else {
            addNotification("Impossibile recuperare la posizione.", 'error');
        }
    };

    const handleAddTag = () => {
        if (newTag.trim()) {
            setTags(prev => [...prev, newTag.trim()]);
            setNewTag('');
            setIsAddingTag(false);
        }
    };
    
    const handleAttachment = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // FIX: Explicitly cast `file` to Blob to resolve type inference issues where it might be treated as `unknown`.
            const newAttachments = files.map(file => URL.createObjectURL(file as Blob));
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const TABS = ['ENTRATA', 'SPESA', 'PRESTITO'];
    
    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
            <div className={`flex-1 flex flex-col transition-colors duration-300 ${activeTab === 'ENTRATA' ? 'bg-green-500' : (activeTab === 'SPESA' || activeTab === 'PRESTITO' ? 'bg-[#007aff]' : 'bg-gray-700')}`}>
                <header className="flex items-center justify-between p-4 text-white">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><span className="material-symbols-outlined">close</span></button>
                    <button onClick={handleSave} className="p-2 rounded-full hover:bg-white/10"><span className="material-symbols-outlined">check</span></button>
                </header>

                <main className="flex-1 flex flex-col justify-end p-4 text-white">
                    {view === 'calculator' ? (
                        <>
                            <div className="flex-1 flex flex-col justify-center items-center relative">
                                <div className="flex items-center">
                                    <span className={`text-5xl font-light opacity-80 ${(displayValue !== '0' && activeTab !== 'ENTRATA') ? 'block' : 'hidden'}`}>-</span>
                                    <h1 className="text-8xl font-thin tracking-tighter text-center break-all">{displayValue}</h1>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <button onClick={() => setIsCurrencyModalOpen(true)} className="font-bold text-xl opacity-80 hover:opacity-100">{currency}</button>
                                </div>
                                <button
                                    onClick={() => activeTab !== 'PRESTITO' && setView('details')}
                                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-16 h-24 bg-white/20 rounded-l-full flex items-center justify-center transition-opacity ${activeTab === 'PRESTITO' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/30'}`}
                                >
                                    <span className="material-symbols-outlined text-white">chevron_left</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsDateModalOpen(true)} className="bg-black/20 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-sm font-semibold">
                                        <span className="material-symbols-outlined text-base">calendar_month</span>
                                        {new Date(date + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                    </button>
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Aggiungi descrizione..."
                                            className="w-full bg-transparent border-b border-white/30 py-1.5 focus:outline-none focus:border-white placeholder:text-white/70"
                                        />
                                        {suggestedCategory && (
                                            <button onClick={() => setCategory(suggestedCategory)} className="absolute right-0 -bottom-7 bg-white/30 text-white text-xs font-semibold px-2 py-1 rounded-full animate-fade-in flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                                {suggestedCategory}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div onClick={() => activeTab !== 'PRESTITO' && setIsPaymentModalOpen(true)} className={`${activeTab === 'PRESTITO' ? 'opacity-70' : 'cursor-pointer'}`}>
                                        <p className="text-xs uppercase text-white/70 font-semibold tracking-wider">PAGAMENTO</p>
                                        <p className="font-bold text-white mt-1 truncate">{members.find(m => m.id === paidById)?.name || 'Sconosciuto'}</p>
                                    </div>
                                    
                                    {activeTab === 'PRESTITO' ? (
                                        <div onClick={() => setIsLoanRecipientModalOpen(true)} className="cursor-pointer">
                                            <p className="text-xs uppercase text-white/70 font-semibold tracking-wider">PRESTATO A</p>
                                            <p className="font-bold text-white mt-1 truncate">{members.find(m => m.id === loanToMemberId)?.name || 'Seleziona'}</p>
                                        </div>
                                    ) : (
                                        <div onClick={() => setIsCategoryModalOpen(true)} className="cursor-pointer">
                                            <p className="text-xs uppercase text-white/70 font-semibold tracking-wider">CATEGORIA</p>
                                            <p className="font-bold text-white mt-1 truncate">{category}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col text-on-surface animate-slide-in-right">
                           {/* Details View */}
                        </div>
                    )}
                </main>
            </div>

            <div className="bg-[#1c1c1e] text-white flex-shrink-0">
                {/* Tabs and Models bar */}
                <div className="h-14 flex items-center justify-around border-b border-white/10">
                     {TABS.map(tab => (
                        <button
                            key={tab}
                            type="button"
                            disabled={isEditMode}
                            onClick={() => setActiveTab(tab)}
                            className={`relative h-full flex items-center px-4 font-semibold transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-500'} ${isEditMode ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-4 right-4 h-1 bg-white rounded-t-full"></div>}
                        </button>
                    ))}
                </div>
                 <div className="h-12 flex items-center justify-center border-b border-white/10">
                    <button 
                        onClick={() => activeTab !== 'PRESTITO' && setIsFrequentExpenseModalOpen(true)}
                        className={`font-semibold transition-opacity ${activeTab === 'PRESTITO' ? 'opacity-50 cursor-not-allowed' : 'text-white'}`}
                        disabled={activeTab === 'PRESTITO'}
                    >
                        MODELLI
                    </button>
                </div>
                {/* Keypad */}
                <div className="grid grid-cols-4 gap-2 p-4 px-3">
                    <KeypadButton value="7" onClick={handleKeypad}>7</KeypadButton>
                    <KeypadButton value="8" onClick={handleKeypad}>8</KeypadButton>
                    <KeypadButton value="9" onClick={handleKeypad}>9</KeypadButton>
                    <KeypadButton value="÷" onClick={handleKeypad} className="text-[#007aff] text-4xl">÷</KeypadButton>
                    <KeypadButton value="4" onClick={handleKeypad}>4</KeypadButton>
                    <KeypadButton value="5" onClick={handleKeypad}>5</KeypadButton>
                    <KeypadButton value="6" onClick={handleKeypad}>6</KeypadButton>
                    <KeypadButton value="*" onClick={handleKeypad} className="text-[#007aff] text-4xl">×</KeypadButton>
                    <KeypadButton value="1" onClick={handleKeypad}>1</KeypadButton>
                    <KeypadButton value="2" onClick={handleKeypad}>2</KeypadButton>
                    <KeypadButton value="3" onClick={handleKeypad}>3</KeypadButton>
                    <KeypadButton value="-" onClick={handleKeypad} className="text-[#007aff] text-4xl">-</KeypadButton>
                    <KeypadButton value="," onClick={handleKeypad}>,</KeypadButton>
                    <KeypadButton value="0" onClick={handleKeypad}>0</KeypadButton>
                    <KeypadButton value="backspace" onClick={handleKeypad}><span className="material-symbols-outlined">backspace</span></KeypadButton>
                    <KeypadButton value="+" onClick={handleKeypad} className="text-[#007aff] text-4xl">+</KeypadButton>
                    <KeypadButton value="=" onClick={handleKeypad} className="col-span-4 bg-[#007aff] text-white h-16 text-4xl">=</KeypadButton>
                </div>
            </div>
            
            {/* --- ALL MODALS --- */}
            {isCategoryModalOpen && (
                <FullScreenModal title="Seleziona Categoria" onClose={() => setIsCategoryModalOpen(false)}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {data.categories.map(cat => (
                            <button key={cat.id} onClick={() => { setCategory(cat.name); setIsCategoryModalOpen(false); }}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${category === cat.name ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant'}`}>
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: cat.color }}>{cat.icon}</div>
                                <p className="text-xs font-semibold w-full truncate">{cat.name}</p>
                            </button>
                        ))}
                    </div>
                </FullScreenModal>
            )}

            {isLoanRecipientModalOpen && (
                <FullScreenModal title="Seleziona Membro" onClose={() => setIsLoanRecipientModalOpen(false)}>
                    <div className="space-y-2">
                        {(members.filter(m => m.id !== paidById)).map(member => (
                            <button
                                key={member.id}
                                onClick={() => { setLoanToMemberId(member.id); setIsLoanRecipientModalOpen(false); }}
                                className="w-full text-left p-4 rounded-2xl bg-surface-variant hover:bg-primary-container/50 flex items-center justify-between"
                            >
                                <span className="font-semibold">{member.name}</span>
                                {loanToMemberId === member.id && <span className="material-symbols-outlined text-primary">check_circle</span>}
                            </button>
                        ))}
                    </div>
                </FullScreenModal>
            )}

            {isPaymentModalOpen && (
                <FullScreenModal 
                    title="Dettagli Pagamento" 
                    onClose={() => setIsPaymentModalOpen(false)}
                    footer={
                        <button onClick={() => { setPaidById(tempPaidById); setSplitBetweenMemberIds(tempSplitIds); setIsPaymentModalOpen(false); }} className="w-full bg-primary text-on-primary font-bold py-3 rounded-2xl">Conferma</button>
                    }
                >
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Pagato da</h3>
                            <div className="space-y-2">
                                {members.map(member => (
                                    <button key={member.id} onClick={() => setTempPaidById(member.id)} className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-colors ${tempPaidById === member.id ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant'}`}>
                                        <span className="font-semibold">{member.name}</span>
                                        {tempPaidById === member.id && <span className="material-symbols-outlined">check_circle</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Diviso con</h3>
                             <div className="flex gap-2 mb-3">
                                <button onClick={() => setTempSplitIds(members.map(m => m.id))} className="flex-1 text-sm py-2 bg-secondary-container text-on-secondary-container rounded-full font-semibold">Tutti</button>
                                <button onClick={() => setTempSplitIds([tempPaidById])} className="flex-1 text-sm py-2 bg-surface-variant text-on-surface-variant rounded-full font-semibold">Solo io</button>
                            </div>
                            <div className="space-y-2">
                                {members.map(member => (
                                    <button key={member.id} onClick={() => {
                                        const newIds = tempSplitIds.includes(member.id) ? tempSplitIds.filter(id => id !== member.id) : [...tempSplitIds, member.id];
                                        if (newIds.length === 0) newIds.push(member.id);
                                        setTempSplitIds(newIds);
                                    }} className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-colors ${tempSplitIds.includes(member.id) ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant'}`}>
                                        <span className="font-semibold">{member.name}</span>
                                        {tempSplitIds.includes(member.id) && <span className="material-symbols-outlined">check_box</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </FullScreenModal>
            )}

            {isCurrencyModalOpen && (
                <FullScreenModal title="Seleziona Valuta" onClose={() => setIsCurrencyModalOpen(false)}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {trip.preferredCurrencies.map(code => {
                            const info = CURRENCY_INFO[code];
                            return (
                                <button key={code} onClick={() => { setCurrency(code); setIsCurrencyModalOpen(false); }} className={`p-3 rounded-2xl flex items-center gap-3 ${currency === code ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant'}`}>
                                    <img src={FLAG_SVGS[info.flag.toUpperCase()]} alt={info.name} className="w-10 h-8 object-cover rounded-md" />
                                    <div>
                                        <p className="font-bold">{code}</p>
                                        <p className="text-xs text-left">{info.name}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </FullScreenModal>
            )}

            {isFrequentExpenseModalOpen && (
                <FullScreenModal title="Modelli Spesa" onClose={() => setIsFrequentExpenseModalOpen(false)}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {(trip.frequentExpenses || []).map(fe => (
                            <button key={fe.id} onClick={() => handleFrequentExpenseSelect(fe)} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-variant active:scale-95 transition-transform">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-secondary-container">{fe.icon}</div>
                                <p className="text-xs font-semibold w-full truncate">{fe.name}</p>
                            </button>
                        ))}
                    </div>
                </FullScreenModal>
            )}
            
            {isDateModalOpen && (
                <DateSelectorModal
                    currentDate={date}
                    onClose={() => setIsDateModalOpen(false)}
                    onSave={(newDate) => { setDate(newDate); setIsDateModalOpen(false); }}
                />
            )}
        </div>
    );
};

export default ExpenseForm;