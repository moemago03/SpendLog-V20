import React, { useMemo } from 'react';
import { Trip } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';
import { useNotification } from '../../context/NotificationContext';
import { getDaysArray } from '../../utils/dateUtils';
import { ALL_CURRENCIES } from '../../constants';

interface AddToItineraryModalProps {
    trip: Trip;
    attraction: { name: string; description: string; location?: string, estimatedCost: string };
    onClose: () => void;
}

const parseCost = (costString: string, tripMainCurrency: string): { amount: number, currency: string } | undefined => {
    if (!costString || costString.toLowerCase().includes('gratuito') || costString.toLowerCase().includes('free')) {
        return { amount: 0, currency: tripMainCurrency };
    }
    
    // Regex potenziato per trovare numeri (con . o ,) e valute (THB, €, $, ecc.)
    const match = costString.match(/(\d[\d,.]*)\s*([A-Z]{3}|€|\$|฿)?/i);
    
    if (!match) return undefined;

    const amount = parseFloat(match[1].replace(',', '.'));
    if (isNaN(amount)) return undefined;

    let currencySymbol = match[2];
    let currency = tripMainCurrency;

    if (currencySymbol) {
        currencySymbol = currencySymbol.toUpperCase();
        if (ALL_CURRENCIES.includes(currencySymbol)) {
            currency = currencySymbol;
        } else if (currencySymbol === '€') {
            currency = 'EUR';
        } else if (currencySymbol === '$') {
            currency = 'USD';
        } else if (currencySymbol === '฿') {
            currency = 'THB';
        }
    } else {
        // Se non c'è un simbolo, cerchiamo un codice valuta nel resto della stringa
        const knownCurrency = ALL_CURRENCIES.find(c => costString.toUpperCase().includes(c));
        if (knownCurrency) currency = knownCurrency;
    }

    return { amount, currency };
};


const AddToItineraryModal: React.FC<AddToItineraryModalProps> = ({ trip, attraction, onClose }) => {
    const { addEvent } = useItinerary();
    const { addNotification } = useNotification();

    const tripDays = useMemo(() => {
        return getDaysArray(trip.startDate, trip.endDate);
    }, [trip.startDate, trip.endDate]);

    const handleSelectDate = (date: string) => { // date is YYYY-MM-DD
        const estimatedCost = parseCost(attraction.estimatedCost, trip.mainCurrency);

        addEvent({
            tripId: trip.id,
            eventDate: date,
            title: attraction.name,
            description: attraction.description,
            type: 'Attività', // Categoria predefinita per le attrazioni
            status: 'planned',
            location: attraction.location,
            estimatedCost: estimatedCost,
        });
        addNotification(`${attraction.name} aggiunto all'itinerario!`, 'success');
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="itinerary-modal-title"
        >
            <header className="flex items-center p-4 flex-shrink-0 border-b border-surface-variant">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 id="itinerary-modal-title" className="text-xl font-bold ml-4">Aggiungi all'Itinerario</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-2">
                 <h2 className="text-center font-semibold text-on-surface p-4">Seleziona un giorno</h2>
                <ul className="space-y-1">
                    {tripDays.map(dateObj => (
                        <li key={dateObj.iso}>
                            <button
                                onClick={() => handleSelectDate(dateObj.iso)}
                                className="w-full p-4 rounded-2xl hover:bg-surface-variant text-left flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold text-on-surface">
                                        {dateObj.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-on-surface-variant">
                                        {dateObj.date.toLocaleDateString('it-IT', { weekday: 'long' })}
                                    </p>
                                </div>
                                 <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
};

export default AddToItineraryModal;