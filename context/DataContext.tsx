import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { UserData, Trip, Expense, Category, Event, Document, ChecklistItem, Stage, PlanItem, GroupMessage } from '../types';
import { DEFAULT_CATEGORIES, ADJUSTMENT_CATEGORY } from '../constants';
import { useNotification } from './NotificationContext';
import { db } from '../config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getTripProperties } from '../utils/tripUtils';

// Helper function to recursively convert undefined to null for Firebase compatibility
const sanitizeForFirebase = (obj: any): any => {
    if (obj === undefined) {
        return null;
    }
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirebase(item));
    }
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = sanitizeForFirebase(obj[key]);
        }
    }
    return newObj;
};

type FirebaseStatus = {
    status: 'initializing' | 'connecting' | 'connected' | 'error' | 'not_configured';
    message: string;
};

interface DataContextProps {
    data: UserData | null;
    loading: boolean;
    firebaseStatus: FirebaseStatus;
    addTrip: (trip: Omit<Trip, 'id' | 'expenses' | 'events' | 'documents' | 'checklist' | 'frequentExpenses' | 'pinboardItems' | 'groupMessages' | 'stages' | 'members'>) => void;
    updateTrip: (trip: Trip) => void;
    deleteTrip: (tripId: string) => void;
    addExpense: (tripId: string, expense: Omit<Expense, 'id'>, checklistItemId?: string) => string;
    updateExpense: (tripId: string, expense: Expense) => void;
    deleteExpense: (tripId: string, expenseId: string) => void;
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
    const [firebaseStatus, setFirebaseStatus] = useState<FirebaseStatus>({
        status: 'initializing',
        message: 'Avvio del Data Provider...',
    });
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
        if (!user) { 
            setData(null); 
            setLoading(false); 
            setFirebaseStatus({ status: 'not_configured', message: 'Nessun utente loggato.'});
            return; 
        }

        setLoading(true);

        if (!db) { 
            console.error("Firestore not configured."); 
            addNotification("Connessione al database non riuscita.", 'error'); 
            setData(defaultUserData); 
            setLoading(false); 
            setFirebaseStatus({ 
                status: 'not_configured', 
                message: 'Firestore non configurato. FIREBASE_API_KEY non è impostata.' 
            }); 
            return; 
        }

        const docRef = doc(db, "users", user);
        setFirebaseStatus({ status: 'connecting', message: `Connessione a Firestore per l'utente: ${user}` });

        const unsubscribe = onSnapshot(docRef, docSnap => {
            if (docSnap.exists()) { 
                setData(processFetchedData(docSnap.data() as UserData)); 
                setFirebaseStatus({ status: 'connected', message: 'Sincronizzazione Live Attiva.' }); 
            } else {
                setDoc(docRef, defaultUserData).then(() => { 
                    setData(processFetchedData(defaultUserData)); 
                    setFirebaseStatus({ status: 'connected', message: 'Profilo creato. Sincronizzazione Live Attiva.' }); 
                }).catch(error => { 
                    console.error("Errore creazione documento:", error); 
                    addNotification("Impossibile creare il profilo.", 'error'); 
                    setData(defaultUserData); 
                    setFirebaseStatus({ status: 'error', message: `Creazione profilo fallita: ${error.message}` }); 
                });
            }
            setLoading(false);
        }, error => { 
            console.error("Errore listener Firestore:", error); 
            addNotification("Impossibile sincronizzare i dati.", 'error'); 
            setData(defaultUserData); 
            setLoading(false); 
            setFirebaseStatus({ status: 'error', message: `Errore di connessione: ${error.message}` }); 
        });

        return () => unsubscribe();
    }, [user, addNotification]);

    const saveData = useCallback(async (newData: UserData): Promise<boolean> => {
        if (!user || !db) return false;
        const sanitizedData = sanitizeForFirebase(newData);
        try {
            await setDoc(doc(db, "users", user), sanitizedData, { merge: true });
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("DEBUG - Failed to save data:", errorMessage); 
            addNotification(`Debug - Errore salvataggio: ${errorMessage}`, 'error');
            return false;
        }
    }, [user, addNotification]);
    
    const updateAndSaveData = useCallback(async (updater: (currentData: UserData) => UserData, successMessage?: string) => {
      setData(prevData => {
        if (!prevData) return null;
        const newData = updater(prevData);
        saveData(newData).then(success => {
          if (success && successMessage) {
            addNotification(successMessage, 'success');
          }
        });
        return newData;
      });
    }, [saveData, addNotification]);

    const addTrip = useCallback((tripData: Omit<Trip, 'id' | 'expenses' | 'events' | 'documents' | 'checklist' | 'frequentExpenses' | 'pinboardItems' | 'groupMessages' | 'stages' | 'members'>) => {
        updateAndSaveData(currentData => {
            const newTrip: Trip = {
                ...tripData,
                id: `trip-${Date.now()}`,
                members: [{ id: 'user-self', name: 'Creatore Viaggio' }],
                expenses: [],
                events: [],
                documents: [],
                checklist: [],
                frequentExpenses: [],
                pinboardItems: [],
                groupMessages: [],
                stages: [],
            };
            return { ...currentData, trips: [...currentData.trips, newTrip] };
        }, 'Viaggio creato!');
    }, [updateAndSaveData]);

    const updateTrip = useCallback((updatedTrip: Trip) => {
        updateAndSaveData(currentData => ({
            ...currentData,
            trips: currentData.trips.map(t => t.id === updatedTrip.id ? updatedTrip : t)
        }), 'Viaggio aggiornato.');
    }, [updateAndSaveData]);

    const deleteTrip = useCallback((tripId: string) => {
        updateAndSaveData(currentData => {
            let updatedData = { ...currentData, trips: currentData.trips.filter(t => t.id !== tripId) };
            if (currentData.defaultTripId === tripId) {
                updatedData.defaultTripId = updatedData.trips[0]?.id || null;
            }
            return updatedData;
        }, 'Viaggio eliminato.');
    }, [updateAndSaveData]);

    const updateTripData = (tripId: string, update: (trip: Trip) => Trip) => {
        updateAndSaveData(currentData => ({
            ...currentData,
            trips: currentData.trips.map(t => t.id === tripId ? update(t) : t)
        }));
    };

    const addExpense = useCallback((tripId: string, expense: Omit<Expense, 'id'>, checklistItemId?: string): string => {
        const newExpenseId = `${Date.now()}`;
        updateAndSaveData(currentData => {
             const newExpense: Expense = {
                ...expense,
                id: newExpenseId,
                createdAt: Date.now()
            };
            const updatedTrips = currentData.trips.map(trip => {
                if (trip.id !== tripId) return trip;
                
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
            return { ...currentData, trips: updatedTrips };
        }, 'Spesa aggiunta!');
       return newExpenseId;
    }, [updateAndSaveData]);

    const addAdjustment = useCallback((tripId: string, adjustment: Omit<Expense, 'id' | 'category'>) => {
        const newAdjustment: Expense = {
            ...adjustment,
            id: `${Date.now()}`,
            createdAt: Date.now(),
            category: ADJUSTMENT_CATEGORY,
        };
        updateTripData(tripId, trip => ({ ...trip, expenses: [newAdjustment, ...(trip.expenses || [])] }));
        addNotification('Saldo registrato!', 'success');
    }, [updateTripData, addNotification]);

    const updateExpense = useCallback((tripId: string, updatedExpense: Expense) => {
        updateTripData(tripId, trip => ({
            ...trip,
            expenses: (trip.expenses || []).map(e => e.id === updatedExpense.id ? updatedExpense : e)
        }));
    }, [updateTripData]);

    const deleteExpense = useCallback((tripId: string, expenseId: string) => {
        updateTripData(tripId, trip => ({
            ...trip,
            expenses: (trip.expenses || []).filter(e => e.id !== expenseId)
        }));
        addNotification('Spesa eliminata.', 'success');
    }, [updateTripData, addNotification]);

    const addCategory = useCallback((category: Omit<Category, 'id'>) => {
        updateAndSaveData(currentData => {
            const newCategory: Category = { ...category, id: `cat-${Date.now()}` };
            return { ...currentData, categories: [...currentData.categories, newCategory] };
        }, 'Categoria aggiunta.');
    }, [updateAndSaveData]);
    
    const updateCategory = useCallback((updatedCategory: Category) => {
        updateAndSaveData(currentData => ({
            ...currentData,
            categories: currentData.categories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
        }), 'Categoria aggiornata.');
    }, [updateAndSaveData]);
    
    const deleteCategory = useCallback((categoryId: string) => {
        updateAndSaveData(currentData => {
            const updatedCategories = currentData.categories.filter(c => c.id !== categoryId);
            const categoryToDelete = currentData.categories.find(c => c.id === categoryId)?.name;
            const updatedTrips = currentData.trips.map(trip => ({
                ...trip,
                expenses: (trip.expenses || []).map(exp => exp.category === categoryToDelete ? { ...exp, category: 'Varie' } : exp)
            }));
            return { ...currentData, categories: updatedCategories, trips: updatedTrips };
        }, 'Categoria eliminata.');
    }, [updateAndSaveData]);

    const setDefaultTrip = useCallback((tripId: string | null) => {
        updateAndSaveData(currentData => ({ ...currentData, defaultTripId: tripId || null }));
    }, [updateAndSaveData]);

    const addChecklistItem = (tripId: string, text: string, isGroupItem: boolean) => updateTripData(tripId, trip => ({ ...trip, checklist: [...(trip.checklist || []), { id: `item-${Date.now()}`, text, completed: false, isGroupItem }] }));
    const updateChecklistItem = (tripId: string, updatedItem: ChecklistItem) => updateTripData(tripId, trip => ({ ...trip, checklist: (trip.checklist || []).map(i => i.id === updatedItem.id ? updatedItem : i) }));
    const deleteChecklistItem = (tripId: string, itemId: string) => updateTripData(tripId, trip => ({ ...trip, checklist: (trip.checklist || []).filter(i => i.id !== itemId)}));
    const addChecklistFromTemplate = (tripId: string, templateItems: { text: string }[], isGroupItem: boolean) => updateTripData(tripId, trip => ({ ...trip, checklist: [...(trip.checklist || []), ...templateItems.map((item, i) => ({ id: `item-${Date.now()}-${i}`, text: item.text, completed: false, isGroupItem }))] }));
    const clearCompletedChecklistItems = (tripId: string) => updateTripData(tripId, trip => ({ ...trip, checklist: (trip.checklist || []).filter(item => !item.completed)}));
    const addEvent = (tripId: string, eventData: Omit<Event, 'eventId' | 'tripId'>) => updateTripData(tripId, trip => ({ ...trip, events: [...(trip.events || []), { ...eventData, eventId: crypto.randomUUID(), tripId }]}));
    const updateEvent = (tripId: string, eventId: string, updates: Partial<Omit<Event, 'eventId'>>) => updateTripData(tripId, trip => ({ ...trip, events: (trip.events || []).map(e => e.eventId === eventId ? { ...e, ...updates } : e)}));
    const deleteEvent = (tripId: string, eventId: string) => updateTripData(tripId, trip => ({ ...trip, events: (trip.events || []).filter(e => e.eventId !== eventId), documents: (trip.documents || []).filter(d => d.eventId !== eventId)}));
    const addDocument = (tripId: string, documentData: Omit<Document, 'id'>) => updateTripData(tripId, trip => ({ ...trip, documents: [...(trip.documents || []), { ...documentData, id: crypto.randomUUID() }]}));
    const deleteDocument = (tripId: string, documentId: string) => updateTripData(tripId, trip => ({ ...trip, documents: (trip.documents || []).filter(d => d.id !== documentId)}));
    const addStage = (tripId: string, newStageData: Omit<Stage, 'id' | 'startDate'>, afterStageId?: string | null) => updateTripData(tripId, trip => {
        const newStages = [...(trip.stages || [])];
        const insertionIndex = afterStageId ? newStages.findIndex(s => s.id === afterStageId) + 1 : (newStages.length > 0 ? newStages.length : 0);
        const newStage: Stage = { ...newStageData, id: `stage-${Date.now()}`, startDate: '' };
        newStages.splice(insertionIndex, 0, newStage);
        return { ...trip, stages: newStages };
    });
    const updateStage = (tripId: string, updatedStage: Stage) => updateTripData(tripId, trip => {
        const newStages = (trip.stages || []).map(s => s.id === updatedStage.id ? updatedStage : s);
        return { ...trip, stages: newStages };
    });
    const updateStages = (tripId: string, reorderedStages: Stage[]) => updateTripData(tripId, trip => ({ ...trip, stages: reorderedStages }));
    const deleteStage = (tripId: string, stageId: string) => updateTripData(tripId, trip => {
        const newStages = (trip.stages || []).filter(s => s.id !== stageId);
        return { ...trip, stages: newStages };
    });
    const addPlanItem = (tripId: string, stageId: string, item: Omit<PlanItem, 'id'>) => updateTripData(tripId, trip => ({ ...trip, stages: (trip.stages || []).map(s => s.id === stageId ? { ...s, planItems: [...(s.planItems || []), { ...item, id: `plan-${Date.now()}` }] } : s) }));
    const addPlanItems = (tripId: string, stageId: string, items: Omit<PlanItem, 'id'>[]) => updateTripData(tripId, trip => ({ ...trip, stages: (trip.stages || []).map(s => s.id === stageId ? { ...s, planItems: [...(s.planItems || []), ...items.map((it, i) => ({...it, id: `plan-${Date.now()}-${i}`}))] } : s) }));
    const updatePlanItem = (tripId: string, stageId: string, item: PlanItem) => updateTripData(tripId, trip => ({ ...trip, stages: (trip.stages || []).map(s => s.id === stageId ? { ...s, planItems: (s.planItems || []).map(p => p.id === item.id ? item : p) } : s) }));
    const deletePlanItem = (tripId: string, stageId: string, itemId: string) => updateTripData(tripId, trip => ({ ...trip, stages: (trip.stages || []).map(s => s.id === stageId ? { ...s, planItems: (s.planItems || []).filter(p => p.id !== itemId) } : s) }));
    const addPinboardItem = (tripId: string, item: Omit<PlanItem, 'id'>) => updateTripData(tripId, trip => ({ ...trip, pinboardItems: [...(trip.pinboardItems || []), { ...item, id: `pin-${Date.now()}` }] }));
    const updatePinboardItem = (tripId: string, item: PlanItem) => updateTripData(tripId, trip => ({ ...trip, pinboardItems: (trip.pinboardItems || []).map(p => p.id === item.id ? item : p) }));
    const deletePinboardItem = (tripId: string, itemId: string) => updateTripData(tripId, trip => ({ ...trip, pinboardItems: (trip.pinboardItems || []).filter(p => p.id !== itemId) }));
    const addGroupMessage = (tripId: string, message: Omit<GroupMessage, 'id' | 'timestamp'>) => updateTripData(tripId, trip => ({ ...trip, groupMessages: [...(trip.groupMessages || []), { ...message, id: `msg-${Date.now()}`, timestamp: Date.now() }] }));
    const updateGroupMessage = (tripId: string, message: GroupMessage) => updateTripData(tripId, trip => ({ ...trip, groupMessages: (trip.groupMessages || []).map(m => m.id === message.id ? message : m) }));
    const deleteGroupMessage = (tripId: string, messageId: string) => updateTripData(tripId, trip => ({ ...trip, groupMessages: (trip.groupMessages || []).filter(m => m.id !== messageId) }));

    const refetchData = async () => {};

    const value = { data, loading, firebaseStatus, addTrip, updateTrip, deleteTrip, addExpense, updateExpense, deleteExpense, addAdjustment, addCategory, updateCategory, deleteCategory, setDefaultTrip, addChecklistItem, updateChecklistItem, addChecklistFromTemplate, clearCompletedChecklistItems, refetchData, addEvent, updateEvent, deleteEvent, addDocument, deleteDocument, addStage, updateStage, updateStages, deleteStage, addPlanItem, addPlanItems, updatePlanItem, deletePlanItem, addPinboardItem, updatePinboardItem, deletePinboardItem, addGroupMessage, updateGroupMessage, deleteGroupMessage, deleteChecklistItem };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    if (!context.data && !context.loading) {
        return { ...context, data: defaultUserData };
    }
    return context;
};
