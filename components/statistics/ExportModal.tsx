import React from 'react';
import { Trip, Expense, TripMember } from '../../types';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';
import { useData } from '../../context/DataContext';

interface ExportModalProps {
    trip: Trip;
    expenses: Expense[];
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ trip, expenses, onClose }) => {
    const { convert } = useCurrencyConverter();
    const { data } = useData();
    const members = trip.members || [];

    const generateCSV = (): string => {
        const headers = [
            'Data',
            'Descrizione',
            'Categoria',
            'Importo',
            'Valuta',
            `Importo (${trip.mainCurrency})`,
            'Pagato da',
            'Diviso con',
            'Luogo'
        ];

        const rows = expenses.map(exp => {
            const paidBy = members.find(m => m.id === exp.paidById)?.name || 'N/A';
            const splitWith = (exp.splitBetweenMemberIds || [])
                .map(id => members.find(m => m.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            const escapeCsvField = (field: string | undefined): string => {
                if (field === null || field === undefined) return '';
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            return [
                new Date(exp.date).toLocaleDateString('it-IT'),
                escapeCsvField(exp.description),
                exp.category,
                exp.amount.toFixed(2),
                exp.currency,
                convert(exp.amount, exp.currency, trip.mainCurrency).toFixed(2),
                paidBy,
                splitWith,
                escapeCsvField(exp.location)
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    };

    const handleDownload = () => {
        const csvContent = generateCSV();
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel compatibility
        const link = document.createElement('a');
        
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Spese_${trip.name.replace(/\s+/g, '_')}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
        >
            <header className="flex justify-between items-center p-4 border-b border-surface-variant flex-shrink-0">
                <h2 id="export-modal-title" className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">ios_share</span>
                    Esporta Spese
                </h2>
                <button onClick={onClose} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant" aria-label="Chiudi">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-on-secondary-container">summarize</span>
                </div>
                <h3 className="text-2xl font-bold text-on-surface">Pronto per l'esportazione</h3>
                <p className="mt-2 text-on-surface-variant max-w-sm">
                    Stai per esportare <span className="font-bold">{expenses.length}</span> spese dal viaggio "<span className="font-bold">{trip.name}</span>".
                    Il file sarà generato in formato CSV, compatibile con Excel, Google Sheets e altri software.
                </p>
            </main>
            
            <footer className="p-4 border-t border-surface-variant flex-shrink-0 mt-auto">
                <button
                    onClick={handleDownload}
                    className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
                >
                    Scarica File CSV
                </button>
            </footer>
        </div>
    );
};

export default ExportModal;