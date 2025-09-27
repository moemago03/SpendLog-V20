import React, { useState } from 'react';
import { Trip, Stage, PlanItem } from '../../types';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';

interface AddEditPlanItemFormProps {
    tripId: string;
    stageId: string;
    category: PlanItem['category'];
    itemToEdit?: PlanItem;
    onClose: () => void;
}

const AddEditPlanItemForm: React.FC<AddEditPlanItemFormProps> = ({ tripId, stageId, category, itemToEdit, onClose }) => {
    const { addPlanItem, updatePlanItem } = useData();
    const { addNotification } = useNotification();
    const isEditing = !!itemToEdit;

    // Generic fields
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [description, setDescription] = useState(itemToEdit?.description || '');
    const [link, setLink] = useState(itemToEdit?.link || '');

    // Accommodation-specific fields
    const [address, setAddress] = useState(itemToEdit?.address || '');
    const [checkInDate, setCheckInDate] = useState(itemToEdit?.checkInDate || '');
    const [checkOutDate, setCheckOutDate] = useState(itemToEdit?.checkOutDate || '');
    const [bookingDetails, setBookingDetails] = useState(itemToEdit?.bookingDetails || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            addNotification("Il titolo è obbligatorio.", 'error');
            return;
        }

        let itemData: Omit<PlanItem, 'id'> | PlanItem = {
            ...(isEditing ? itemToEdit : {}),
            category,
            title: title.trim(),
            description: description.trim() || undefined,
            link: link.trim() || undefined,
            status: itemToEdit?.status || 'idea',
        };

        if (category === 'Sleep') {
            itemData = {
                ...itemData,
                address: address.trim() || undefined,
                checkInDate: checkInDate || undefined,
                checkOutDate: checkOutDate || undefined,
                bookingDetails: bookingDetails.trim() || undefined,
            };
        }

        if (isEditing) {
            updatePlanItem(tripId, stageId, itemData as PlanItem);
        } else {
            addPlanItem(tripId, stageId, itemData as Omit<PlanItem, 'id'>);
        }
        
        onClose();
    };
    
    const inputClasses = "mt-1 block w-full bg-surface-variant border-transparent rounded-lg py-3 px-3 focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClasses = "block text-sm font-medium text-on-surface-variant";

    const renderAccommodationFields = () => (
        <div className='space-y-4'>
            <hr className='border-surface-variant'/>
            <h3 className='text-lg font-semibold text-on-surface'>Dettagli Alloggio</h3>
            <div>
                <label htmlFor="address" className={labelClasses}>Indirizzo</label>
                <input id="address" type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputClasses}/>
            </div>
            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <label htmlFor="checkInDate" className={labelClasses}>Check-in</label>
                    <input id="checkInDate" type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} className={inputClasses}/>
                </div>
                <div>
                    <label htmlFor="checkOutDate" className={labelClasses}>Check-out</label>
                    <input id="checkOutDate" type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} min={checkInDate} className={inputClasses}/>
                </div>
            </div>
             <div>
                <label htmlFor="bookingDetails" className={labelClasses}>Dettagli Prenotazione (es. n. conferma)</label>
                <textarea id="bookingDetails" value={bookingDetails} onChange={e => setBookingDetails(e.target.value)} rows={2} className={inputClasses}></textarea>
            </div>
        </div>
    );

    return (
         <div className="fixed inset-0 bg-background z-[51] flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-surface-variant">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">{isEditing ? 'Modifica' : 'Aggiungi'} {category === 'Sleep' ? 'Alloggio' : category.replace(' & ', ' & ')}</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="title" className={labelClasses}>Titolo (es. Nome dell'Hotel, Museo, Ristorante)</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClasses}/>
                    </div>
                     <div>
                        <label htmlFor="description" className={labelClasses}>Descrizione (Opzionale)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses}></textarea>
                    </div>
                    <div>
                        <label htmlFor="link" className={labelClasses}>Link (Opzionale)</label>
                        <input id="link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className={inputClasses}/>
                    </div>

                    {category === 'Sleep' && renderAccommodationFields()}

                 </form>
            </main>
             <footer className="p-4 border-t border-surface-variant mt-auto flex-shrink-0">
                <button type="submit" onClick={handleSubmit} className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md">
                    {isEditing ? 'Salva Modifiche' : 'Salva'}
                </button>
            </footer>
        </div>
    );
};

export default AddEditPlanItemForm;