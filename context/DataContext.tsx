import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
// FIX: Import Stage to use in processing
import { UserData, Trip, Expense, Category, Event, Document, ChecklistItem, Stage, PlanItem, GroupMessage } from '../types';
import { DEFAULT_CATEGORIES, ADJUSTMENT_CATEGORY } from '../constants';
import { fetchData, saveData as saveCloudData, isDevelopmentEnvironment } from '../services/dataService';
import { useNotification } from './NotificationContext';
import { db } from '../config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
// FIX: Import utility to derive trip properties
import { getTripProperties } from '../utils/tripUtils';

interface DataContextProps {
    data: UserData | null;
    loading: boolean;
    addTrip: (trip: Omit<Trip, 'id' | 'expenses' | 'events' | 'documents' | 'checklist' | 'frequentExpenses' | 'pinboardItems' | 'groupMessages'>) => void;
    updateTrip: (trip: Trip) => void;
    deleteTrip: (tripId: string) => void;
    addExpense: (tripId: string, expense: Omit<Expense, 'id'>, checklistItemId?: string) => string;
    updateExpense: (tripId: string, expense: Expense) => void;
    deleteExpense: (tripId: string, expenseId: string) => void;
    // FIX: Update addAdjustment signature to not require category
    addAdjustment: (tripId: string, adjustment: Omit<Expense, 'id' | 'category'>) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (category: Category) => void;
    deleteCategory: (categoryId: string) => void;
    setDefaultTrip: (tripId: string | null) => void;
    addChecklistItem: (tripId: string, text: string, isGroupItem: boolean) => void;
    updateChecklistItem: (tripId: string, item: ChecklistItem) => void;
    deleteChecklistItem: (tripId: string, itemId: string) => void;
    addChecklistFromTemplate: (tripId: string, templateItems: { text: string }[], isGroupItem: boolean) => void;
    clearCompletedChecklistItems: (tripId: string) => void;
    addEvent: (tripId: string, eventData: Omit<Event, 'eventId' | 'tripId'>) => void;
    updateEvent: (tripId: string, eventId: string, updates: Partial<Omit<Event, 'eventId'>>) => void;
    deleteEvent: (tripId: string, eventId: string) => void;
    addDocument: (tripId: string, documentData: Omit<Document, 'id'>) => void;
    deleteDocument: (tripId: string, documentId: string) => void;
    refetchData: () => Promise<void>;
    addStage: (tripId: string, newStageData: Omit<Stage, 'id' | 'startDate'>, afterStageId?: string | null) => void;
    updateStage: (tripId: string, updatedStage: Stage) => void;
    updateStages: (tripId: string, stages: Stage[]) => void;
    deleteStage: (tripId: string, stageId: string) => void;
    addPlanItem: (tripId: string, stageId: string, item: Omit<PlanItem, 'id'>) => void;
    addPlanItems: (tripId: string, stageId: string, items: Omit<PlanItem, 'id'>[]) => void;
    updatePlanItem: (tripId: string, stageId: string, item: PlanItem) => void;
    deletePlanItem: (tripId: string, stageId: string, itemId: string) => void;
    addPinboardItem: (tripId: string, item: Omit<PlanItem, 'id'>) => void;
    updatePinboardItem: (tripId: string, item: PlanItem) => void;
    deletePinboardItem: (tripId: string, itemId: string) => void;
    addGroupMessage: (tripId: string, message: Omit<GroupMessage, 'id' | 'timestamp'>) => void;
    updateGroupMessage: (tripId: string, message: GroupMessage) => void;
    deleteGroupMessage: (tripId: string, messageId: string) => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

const defaultUserData: UserData = {
    name: '',
    email: '',
    dataviaggio: '',
    trips: [],
    categories: DEFAULT_CATEGORIES,
};

interface DataProviderProps {
    children: ReactNode;
    user: string;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, user }) => {
    const [data, setData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotification();

    const processFetchedData = (fetchedData: UserData | null): UserData => {
        if (!fetchedData) return defaultUserData;
        let processedData = { ...fetchedData };
        if (!processedData.categories || processedData.categories.length === 0) processedData.categories = DEFAULT_CATEGORIES;
        const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
        const missingDefaults = DEFAULT_CATEGORIES.filter(dc => !processedData.categories.some(uc => uc.id === dc.id));
        if (missingDefaults.length > 0) {
            const customCategories = processedData.categories.filter(c => !defaultIds.has(c.id));
            processedData.categories = [...DEFAULT_CATEGORIES, ...customCategories];
        }
        processedData.trips = (processedData.trips || []).map(trip => {
            let members = (trip.members && trip.members.length > 0) ? [...trip.members] : [];
            if (members.length === 0) members = [{ id: 'user-self', name: 'Creatore Viaggio' }];
            const selfMemberIndex = members.findIndex(m => m.id === 'user-self' && m.name === 'Io');
            if (selfMemberIndex !== -1) members[selfMemberIndex] = { ...members[selfMemberIndex], name: 'Creatore Viaggio' };
            const expenses = (trip.expenses || []).map(exp => {
                let finalExp = { ...exp };
                if (!finalExp.paidById || !finalExp.splitBetweenMemberIds) {
                    finalExp = { ...finalExp, paidById: members[0].id, splitType: 'equally', splitBetweenMemberIds: [members[0].id] };
                }
                if (!finalExp.createdAt) {
                    const idAsTimestamp = parseInt(finalExp.id, 10);
                    finalExp.createdAt = (!isNaN(idAsTimestamp) && finalExp.id.length > 10) ? idAsTimestamp : new Date(finalExp.date).getTime();
                }
                return finalExp;
            });
            const checklist = (trip.checklist || []).map(item => ({ ...item, isGroupItem: item.isGroupItem ?? false }));
            
            // FIX: Aggregate events from stages and derive trip properties to resolve type errors
            const events = (trip.stages || []).flatMap((stage: Stage) => stage.events || []).map(e => ({...e, tripId: trip.id}));
            const derivedProps = getTripProperties(trip);

            return {
                ...trip,
                members,
                expenses,
                checklist,
                events: events,
                documents: trip.documents || [],
                pinboardItems: trip.pinboardItems || [],
                groupMessages: trip.groupMessages || [],
                startDate: derivedProps.startDate,
                endDate: derivedProps.endDate,
                countries: derivedProps.countries,
            };
        });
        return processedData;
    };

    useEffect(() => {
        if (!user) { setData(null); setLoading(false); return; }
        setLoading(true);
        if (isDevelopmentEnvironment()) {
            const loadMockData = async () => {
                try {
                    const rawData = await fetchData(user);
                    setData(processFetchedData(rawData));
                } catch (error) { console.error("Failed to load mock data", error); addNotification("Impossibile caricare i dati di prova.", 'error'); setData(defaultUserData); } finally { setLoading(false); }
            };
            loadMockData();
            return;
        }
        if (!db) { console.error("Firestore not configured."); addNotification("Connessione al database non riuscita.", 'error'); setData(defaultUserData); setLoading(false); return; }
        const docRef = doc(db, "users", user);
        const unsubscribe = onSnapshot(docRef, docSnap => {
            if (docSnap.exists()) { setData(processFetchedData(docSnap.data() as UserData)); } else {
                setDoc(docRef, defaultUserData).then(() => { setData(processFetchedData(defaultUserData)); }).catch(error => { console.error("Errore creazione documento:", error); addNotification("Impossibile creare il profilo.", 'error'); setData(defaultUserData); });
            }
            setLoading(false);
        }, error => { console.error("Errore listener Firestore:", error); addNotification("Impossibile sincronizzare i dati.", 'error'); setData(defaultUserData); setLoading(false); });
        return () => unsubscribe();
    }, [user, addNotification]);

    const saveData = useCallback(async (newData: UserData, successMessage?: string) => {
        if (user) {
            setData(newData);
            try {
                await saveCloudData(user, newData);
                if (successMessage) addNotification(successMessage, 'success');
            } catch (error) { console.error("Failed to save data:", error); addNotification('Errore di salvataggio.', 'error'); }
        }
    }, [user, addNotification]);

    const updateTripData = (tripId: string, update: (trip: Trip) => Trip) => {
        if (!data) return;
        const updatedTrips = data.trips.map(t => t.id === tripId ? update(t) : t);
        return { ...data, trips: updatedTrips };
    };
    
    const addTrip = useCallback((tripData: Omit<Trip, 'id' | 'expenses' | 'events' | 'documents' | 'checklist' | 'frequentExpenses' | 'pinboardItems' | 'groupMessages'>) => {
        if (!data) return;
        const newTrip: Trip = {
            ...tripData,
            id: `trip-${Date.now()}`,
            expenses: [],
            events: [],
            documents: [],
            checklist: [],
            frequentExpenses: [],
            pinboardItems: [],
            groupMessages: [],
        };
        const newData = { ...data, trips: [...data.trips, newTrip] };
        saveData(newData, 'Viaggio creato!');
    }, [data, saveData]);

    const updateTrip = useCallback((updatedTrip: Trip) => {
        if (!data) return;
        const updatedTrips = data.trips.map(t => t.id === updatedTrip.id ? updatedTrip : t);
        saveData({ ...data, trips: updatedTrips }, 'Viaggio aggiornato.');
    }, [data, saveData]);

    const deleteTrip = useCallback((tripId: string) => {
        if (!data) return;
        let newData = { ...data, trips: data.trips.filter(t => t.id !== tripId) };
        if (data.defaultTripId === tripId) {
            newData.defaultTripId = newData.trips[0]?.id || undefined;
        }
        saveData(newData, 'Viaggio eliminato.');
    }, [data, saveData]);

    const addExpense = useCallback((tripId: string, expense: Omit<Expense, 'id'>, checklistItemId?: string): string => {
        if (!data) return '';
        const newExpense: Expense = {
            ...expense,
            id: `${Date.now()}`,
            createdAt: Date.now()
        };

        const newData = updateTripData(tripId, trip => {
            let updatedChecklist = trip.checklist || [];
            if (checklistItemId) {
                updatedChecklist = updatedChecklist.map(item =>
                    item.id === checklistItemId ? { ...item, completed: true, expenseId: newExpense.id } : item
                );
            }
            return {
                ...trip,
                expenses: [newExpense, ...(trip.expenses || [])],
                checklist: updatedChecklist
            };
        });
        if (newData) saveData(newData);
        return newExpense.id;
    }, [data, saveData]);
    
    // FIX: Update addAdjustment signature to not require category
    const addAdjustment = useCallback((tripId: string, adjustment: Omit<Expense, 'id' | 'category'>) => {
        if (!data) return;
        const newAdjustment: Expense = {
            ...adjustment,
            id: `${Date.now()}`,
            createdAt: Date.now(),
            category: ADJUSTMENT_CATEGORY,
        };
        const newData = updateTripData(tripId, trip => ({
            ...trip,
            expenses: [newAdjustment, ...(trip.expenses || [])],
        }));
        if (newData) saveData(newData, 'Saldo registrato!');
    }, [data, saveData]);

    const updateExpense = useCallback((tripId: string, updatedExpense: Expense) => {
        const newData = updateTripData(tripId, trip => ({
            ...trip,
            expenses: (trip.expenses || []).map(e => e.id === updatedExpense.id ? updatedExpense : e)
        }));
        if (newData) saveData(newData);
    }, [data, saveData]);

    const deleteExpense = useCallback((tripId: string, expenseId: string) => {
        const newData = updateTripData(tripId, trip => ({
            ...trip,
            expenses: (trip.expenses || []).filter(e => e.id !== expenseId)
        }));
        if (newData) saveData(newData, 'Spesa eliminata.');
    }, [data, saveData]);

    const addCategory = useCallback((category: Omit<Category, 'id'>) => {
        if (!data) return;
        const newCategory: Category = { ...category, id: `cat-${Date.now()}` };
        saveData({ ...data, categories: [...data.categories, newCategory] }, 'Categoria aggiunta.');
    }, [data, saveData]);
    
    const updateCategory = useCallback((updatedCategory: Category) => {
        if (!data) return;
        saveData({ ...data, categories: data.categories.map(c => c.id === updatedCategory.id ? updatedCategory : c) }, 'Categoria aggiornata.');
    }, [data, saveData]);
    
    const deleteCategory = useCallback((categoryId: string) => {
        if (!data) return;
        const updatedCategories = data.categories.filter(c => c.id !== categoryId);
        const updatedTrips = data.trips.map(trip => ({
            ...trip,
            expenses: (trip.expenses || []).map(exp => exp.category === data.categories.find(c => c.id === categoryId)?.name ? { ...exp, category: 'Varie' } : exp)
        }));
        saveData({ ...data, categories: updatedCategories, trips: updatedTrips }, 'Categoria eliminata.');
    }, [data, saveData]);

    const setDefaultTrip = useCallback((tripId: string | null) => {
        if (!data) return;
        saveData({ ...data, defaultTripId: tripId || undefined });
    }, [data, saveData]);

    const addChecklistItem = useCallback((tripId: string, text: string, isGroupItem: boolean) => {
        const newItem: ChecklistItem = { id: `item-${Date.now()}`, text, completed: false, isGroupItem };
        const newData = updateTripData(tripId, trip => ({ ...trip, checklist: [...(trip.checklist || []), newItem] }));
        if (newData) saveData(newData, 'Elemento aggiunto alla checklist.');
    }, [data, saveData]);

    const updateChecklistItem = useCallback((tripId: string, updatedItem: ChecklistItem) => {
        const newData = updateTripData(tripId, trip => ({ ...trip, checklist: (trip.checklist || []).map(item => item.id === updatedItem.id ? updatedItem : item) }));
        if (newData) saveData(newData);
    }, [data, saveData]);

    const deleteChecklistItem = useCallback((tripId: string, itemId: string) => {
        const newData = updateTripData(tripId, trip => ({ ...trip, checklist: (trip.checklist || []).filter(item => item.id !== itemId) }));
        if (newData) saveData(newData);
    }, [data, saveData]);
    
    const addChecklistFromTemplate = useCallback((tripId: string, templateItems: { text: string }[], isGroupItem: boolean) => {
        const newItems: ChecklistItem[] = templateItems.map((item, index) => ({
            id: `item-${Date.now()}-${index}`,
            text: item.text,
            completed: false,
            isGroupItem: isGroupItem,
        }));
        const newData = updateTripData(tripId, trip => ({ ...trip, checklist: [...(trip.checklist || []), ...newItems] }));
        if (newData) saveData(newData, `Template aggiunto alla checklist.`);
    }, [data, saveData]);
    
    const clearCompletedChecklistItems = useCallback((tripId: string) => {
        const newData = updateTripData(tripId, trip => ({ ...trip, checklist: (trip.checklist || []).filter(item => !item.completed) }));
        if (newData) saveData(newData, 'Elementi completati rimossi.');
    }, [data, saveData]);
    
    const addEvent = useCallback((tripId: string, eventData: Omit<Event, 'eventId' | 'tripId'>) => {
        // FIX: Add tripId to the new event object to align with updated type
        const newEvent: Event = { ...eventData, eventId: crypto.randomUUID(), tripId };
        const newData = updateTripData(tripId, trip => ({ ...trip, events: [...(trip.events || []), newEvent] }));
        if (newData) saveData(newData, 'Evento aggiunto.');
    }, [data, saveData]);

    const updateEvent = useCallback((tripId: string, eventId: string, updates: Partial<Omit<Event, 'eventId'>>) => {
        const newData = updateTripData(tripId, trip => ({ ...trip, events: (trip.events || []).map(e => e.eventId === eventId ? { ...e, ...updates } : e) }));
        if (newData) saveData(newData, 'Evento aggiornato.');
    }, [data, saveData]);

    const deleteEvent = useCallback((tripId: string, eventId: string) => {
        const newData = updateTripData(tripId, trip => {
            const updatedEvents = (trip.events || []).filter(e => e.eventId !== eventId);
            const updatedDocuments = (trip.documents || []).filter(d => d.eventId !== eventId);
            return { ...trip, events: updatedEvents, documents: updatedDocuments };
        });
        if (newData) saveData(newData, 'Evento eliminato.');
    }, [data, saveData]);
    
    const addDocument = useCallback((tripId: string, documentData: Omit<Document, 'id'>) => {
        const newDocument: Document = { ...documentData, id: crypto.randomUUID() };
        const newData = updateTripData(tripId, trip => ({ ...trip, documents: [...(trip.documents || []), newDocument] }));
        if (newData) saveData(newData, 'Documento caricato.');
    }, [data, saveData]);

    const deleteDocument = useCallback((tripId: string, documentId: string) => {
        const newData = updateTripData(tripId, trip => ({ ...trip, documents: (trip.documents || []).filter(d => d.id !== documentId) }));
        if (newData) saveData(newData, 'Documento eliminato.');
    }, [data, saveData]);

    const updateStageInTrip = (tripId: string, stageId: string, update: (stage: Stage) => Stage) => {
        if (!data) return;
        return updateTripData(tripId, trip => {
            const newStages = (trip.stages || []).map(s => s.id === stageId ? update(s) : s);
            return { ...trip, stages: newStages };
        });
    };

    const addPlanItem = useCallback((tripId: string, stageId: string, itemData: Omit<PlanItem, 'id'>) => {
        const newItem: PlanItem = { ...itemData, id: `plan-${Date.now()}` };
        const newData = updateStageInTrip(tripId, stageId, stage => ({
            ...stage,
            planItems: [...(stage.planItems || []), newItem]
        }));
        if (newData) saveData(newData, 'Elemento aggiunto al piano.');
    }, [data, saveData]);

    const addPlanItems = useCallback((tripId: string, stageId: string, itemsData: Omit<PlanItem, 'id'>[]) => {
        if (!data || itemsData.length === 0) return;
        const newItems: PlanItem[] = itemsData.map((itemData, index) => ({
            ...itemData,
            id: `plan-${Date.now()}-${index}`
        }));
        const newData = updateStageInTrip(tripId, stageId, stage => ({
            ...stage,
            planItems: [...(stage.planItems || []), ...newItems]
        }));
        if (newData) saveData(newData, `${itemsData.length} elementi aggiunti al piano.`);
    }, [data, saveData]);
    
    const updatePlanItem = useCallback((tripId: string, stageId: string, updatedItem: PlanItem) => {
        const newData = updateStageInTrip(tripId, stageId, stage => ({
            ...stage,
            planItems: (stage.planItems || []).map(item => item.id === updatedItem.id ? updatedItem : item)
        }));
        if (newData) saveData(newData);
    }, [data, saveData]);

    const deletePlanItem = useCallback((tripId: string, stageId: string, itemId: string) => {
        const newData = updateStageInTrip(tripId, stageId, stage => ({
            ...stage,
            planItems: (stage.planItems || []).filter(item => item.id !== itemId)
        }));
        if (newData) saveData(newData);
    }, [data, saveData]);

    const addPinboardItem = useCallback((tripId: string, itemData: Omit<PlanItem, 'id'>) => {
        const newItem: PlanItem = { ...itemData, id: `pin-${Date.now()}` };
        const newData = updateTripData(tripId, trip => ({
            ...trip,
            pinboardItems: [...(trip.pinboardItems || []), newItem]
        }));
        if (newData) saveData(newData, 'Elemento aggiunto alla bacheca.');
    }, [data, saveData]);

    const updatePinboardItem = useCallback((tripId: string, updatedItem: PlanItem) => {
        const newData = updateTripData(tripId, trip => ({
            ...trip,
            pinboardItems: (trip.pinboardItems || []).map(item => item.id === updatedItem.id ? updatedItem : item)
        }));
        if (newData) saveData(newData);
    }, [data, saveData]);

    const deletePinboardItem = useCallback((tripId: string, itemId: string) => {
        const newData = updateTripData(tripId, trip => ({
            ...trip,
            pinboardItems: (trip.pinboardItems || []).filter(item => item.id !== itemId)
        }));
        if (newData) saveData(newData, 'Elemento rimosso dalla bacheca.');
    }, [data, saveData]);
    
    const addGroupMessage = useCallback((tripId: string, message: Omit<GroupMessage, 'id' | 'timestamp'>) => {
        if (!data) return;
        const newMessage: GroupMessage = { ...message, id: `msg-${Date.now()}`, timestamp: Date.now() };
        const newData = updateTripData(tripId, trip => ({ ...trip, groupMessages: [...(trip.groupMessages || []), newMessage] }));
        if (newData) saveData(newData);
    }, [data, saveData]);

    const updateGroupMessage = useCallback((tripId: string, updatedMessage: GroupMessage) => {
        const newData = updateTripData(tripId, trip => ({ ...trip, groupMessages: (trip.groupMessages || []).map(m => m.id === updatedMessage.id ? updatedMessage : m) }));
        if (newData) saveData(newData);
    }, [data, saveData]);

    const deleteGroupMessage = useCallback((tripId: string, messageId: string) => {
        const newData = updateTripData(tripId, trip => ({ ...trip, groupMessages: (trip.groupMessages || []).filter(m => m.id !== messageId) }));
        if (newData) saveData(newData);
    }, [data, saveData]);

    const addStage = useCallback((tripId: string, newStageData: Omit<Stage, 'id' | 'startDate'>, afterStageId?: string | null) => {
        const newData = updateTripData(tripId, trip => {
            const newStages = [...(trip.stages || [])];
            const insertionIndex = afterStageId ? newStages.findIndex(s => s.id === afterStageId) + 1 : (newStages.length > 0 ? newStages.length : 0);
            const newStage: Stage = { ...newStageData, id: `stage-${Date.now()}`, startDate: '' };
            if (insertionIndex > 0) {
                const prevStage = newStages[insertionIndex - 1];
                const prevStageStartDate = new Date(prevStage.startDate + 'T12:00:00Z');
                prevStageStartDate.setDate(prevStageStartDate.getDate() + prevStage.nights);
                newStage.startDate = prevStageStartDate.toISOString().split('T')[0];
            } else { newStage.startDate = trip.startDate.split('T')[0]; }
            newStages.splice(insertionIndex, 0, newStage);
            for (let i = insertionIndex + 1; i < newStages.length; i++) {
                const prevStage = newStages[i-1];
                const prevStageStartDate = new Date(prevStage.startDate + 'T12:00:00Z');
                prevStageStartDate.setDate(prevStageStartDate.getDate() + prevStage.nights);
                newStages[i].startDate = prevStageStartDate.toISOString().split('T')[0];
            }
            return { ...trip, stages: newStages };
        });
        if (newData) saveData(newData, 'Destinazione aggiunta.');
    }, [data, saveData]);

    const updateStage = useCallback((tripId: string, updatedStage: Stage) => {
        const newData = updateTripData(tripId, trip => {
            const stageIndex = (trip.stages || []).findIndex(s => s.id === updatedStage.id);
            if (stageIndex === -1) return trip;
            
            const newStages = [...trip.stages];
            newStages[stageIndex] = updatedStage;

            // Always propagate date changes to subsequent stages.
            for (let i = stageIndex + 1; i < newStages.length; i++) {
                const prevStage = newStages[i-1];
                const prevStageStartDate = new Date(prevStage.startDate + 'T12:00:00Z');
                prevStageStartDate.setDate(prevStageStartDate.getDate() + prevStage.nights);
                newStages[i].startDate = prevStageStartDate.toISOString().split('T')[0];
            }
            return { ...trip, stages: newStages };
        });
        if (newData) saveData(newData);
    }, [data, saveData]);
    
    const updateStages = useCallback((tripId: string, reorderedStages: Stage[]) => {
        const newData = updateTripData(tripId, trip => {
            const newStages = [...reorderedStages];
            // Recalculate start dates based on the new order
            for (let i = 0; i < newStages.length; i++) {
                if (i === 0) {
                    // The first stage always starts on the trip's start date
                    newStages[i].startDate = trip.startDate.split('T')[0];
                } else {
                    // Subsequent stages start after the previous one ends
                    const prevStage = newStages[i - 1];
                    const prevStageStartDate = new Date(prevStage.startDate + 'T12:00:00Z');
                    prevStageStartDate.setDate(prevStageStartDate.getDate() + prevStage.nights);
                    newStages[i].startDate = prevStageStartDate.toISOString().split('T')[0];
                }
            }
            return { ...trip, stages: newStages };
        });
        if (newData) saveData(newData); // No notification to keep UI quiet
    }, [data, saveData]);

    const deleteStage = useCallback((tripId: string, stageId: string) => {
         const newData = updateTripData(tripId, trip => {
            const stageIndex = (trip.stages || []).findIndex(s => s.id === stageId);
            if (stageIndex === -1) return trip;
            const newStages = (trip.stages || []).filter(s => s.id !== stageId);
            if (newStages.length > 0 && stageIndex > 0) {
                 for (let i = stageIndex; i < newStages.length; i++) {
                    const prevStage = newStages[i-1];
                    const prevStageStartDate = new Date(prevStage.startDate + 'T12:00:00Z');
                    prevStageStartDate.setDate(prevStageStartDate.getDate() + prevStage.nights);
                    newStages[i].startDate = prevStageStartDate.toISOString().split('T')[0];
                }
            } else if (newStages.length > 0) {
                 newStages[0].startDate = trip.startDate.split('T')[0];
                 for (let i = 1; i < newStages.length; i++) {
                    const prevStage = newStages[i-1];
                    const prevStageStartDate = new Date(prevStage.startDate + 'T12:00:00Z');
                    prevStageStartDate.setDate(prevStageStartDate.getDate() + prevStage.nights);
                    newStages[i].startDate = prevStageStartDate.toISOString().split('T')[0];
                }
            }
            return { ...trip, stages: newStages };
        });
        if (newData) saveData(newData, 'Destinazione rimossa.');
    }, [data, saveData]);

    const refetchData = async () => { /* ... */ };

    const value = { data, loading, addTrip, updateTrip, deleteTrip, addExpense, updateExpense, deleteExpense, addAdjustment, addCategory, updateCategory, deleteCategory, setDefaultTrip, addChecklistItem, updateChecklistItem, deleteChecklistItem, addChecklistFromTemplate, clearCompletedChecklistItems, refetchData, addEvent, updateEvent, deleteEvent, addDocument, deleteDocument, addStage, updateStage, updateStages, deleteStage, addPlanItem, addPlanItems, updatePlanItem, deletePlanItem, addPinboardItem, updatePinboardItem, deletePinboardItem, addGroupMessage, updateGroupMessage, deleteGroupMessage };
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
export const useData = () => { const context = useContext(DataContext); if (!context) throw new Error('useData must be used within a DataProvider'); if (!context.data && !context.loading) return { ...context, data: defaultUserData }; return context; };