import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { UserData, Trip, Expense, Category, CategoryBudget, ChecklistItem, TripMember } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { fetchData, saveData as saveCloudData, isDevelopmentEnvironment } from '../services/dataService';
import { useNotification } from './NotificationContext';
import { db } from '../config';

interface DataContextProps {
    data: UserData | null;
    loading: boolean;
    addTrip: (trip: Omit<Trip, 'id' | 'expenses'>) => void;
    updateTrip: (trip: Trip) => void;
    deleteTrip: (tripId: string) => void;
    addExpense: (tripId: string, expense: Omit<Expense, 'id'>) => void;
    updateExpense: (tripId: string, expense: Expense) => void;
    deleteExpense: (tripId: string, expenseId: string) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (category: Category) => void;
    deleteCategory: (categoryId: string) => void;
    setDefaultTrip: (tripId: string | null) => void;
    addChecklistItem: (tripId: string, text: string) => void;
    updateChecklistItem: (tripId: string, item: ChecklistItem) => void;
    deleteChecklistItem: (tripId: string, itemId: string) => void;
    addChecklistFromTemplate: (tripId: string, templateItems: { text: string }[]) => void;
    clearCompletedChecklistItems: (tripId: string) => void;
    refetchData: () => Promise<void>;
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
        if (!fetchedData) {
            return defaultUserData;
        }

        let processedData = { ...fetchedData };

        if (!processedData.categories || processedData.categories.length === 0) {
            processedData.categories = DEFAULT_CATEGORIES;
        }
        const defaultIds = new Set(DEFAULT_CATEGORIES.map(c => c.id));
        const missingDefaults = DEFAULT_CATEGORIES.filter(dc => !processedData.categories.some(uc => uc.id === dc.id));
        if (missingDefaults.length > 0) {
            const customCategories = processedData.categories.filter(c => !defaultIds.has(c.id));
            processedData.categories = [...DEFAULT_CATEGORIES, ...customCategories];
        }
        
        // Data migration for group expenses
        processedData.trips = (processedData.trips || []).map(trip => {
            let members = (trip.members && trip.members.length > 0)
                ? [...trip.members] // Create a mutable copy
                : [];
        
            // MIGRATION: Rename ambiguous "Io" member to "Creatore Viaggio"
            const selfMemberIndex = members.findIndex(m => m.id === 'user-self' && m.name === 'Io');
            if (selfMemberIndex !== -1) {
                members[selfMemberIndex] = { ...members[selfMemberIndex], name: 'Creatore Viaggio' };
            }
        
            // If after potential rename, members is empty (for very old trips), add a default.
            // This is crucial for the expense migration logic below.
            if (members.length === 0) {
                members = [{ id: 'user-self', name: 'Creatore Viaggio' }];
            }

            // Migrate old expenses that don't have split data
            const expenses = (trip.expenses || []).map(exp => {
                if (exp.paidById && exp.splitBetweenMemberIds) {
                    return exp; // Already in the new format
                }
                // This is an old expense, migrate it.
                // It was paid by the user and only for the user.
                return {
                    ...exp,
                    paidById: members[0].id,
                    splitType: 'equally' as 'equally',
                    splitBetweenMemberIds: [members[0].id]
                };
            });

            return { ...trip, members, expenses };
        });

        return processedData;
    };

    useEffect(() => {
        if (!user) {
            setData(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        if (isDevelopmentEnvironment()) {
            console.warn("Ambiente di sviluppo rilevato. Verranno usati dati di prova locali (senza aggiornamenti in tempo reale).");
            const loadMockData = async () => {
                try {
                    const rawData = await fetchData(user);
                    setData(processFetchedData(rawData));
                } catch (error) {
                    console.error("Failed to load mock data", error);
                    addNotification("Impossibile caricare i dati di prova.", 'error');
                    setData(defaultUserData);
                } finally {
                    setLoading(false);
                }
            };
            loadMockData();
            return;
        }

        console.log("Ambiente di produzione rilevato. Impostazione del listener Firestore in tempo reale.");
        const docRef = db.collection("users").doc(user);
        const unsubscribe = docRef.onSnapshot(docSnap => {
            if (docSnap.exists) {
                console.log("Dati utente esistenti trovati.");
                const rawData = docSnap.data() as UserData;
                setData(processFetchedData(rawData));
                setLoading(false);
            } else {
                // Document doesn't exist, this must be a new user.
                // Let's create their document to ensure subsequent saves work.
                console.log("Documento utente non trovato, creazione in corso...");
                docRef.set(defaultUserData)
                    .then(() => {
                        console.log("Documento utente creato con successo.");
                        // Don't wait for the snapshot to fire again. We have the data.
                        // The snapshot listener is still active and will take over for subsequent updates.
                        setData(processFetchedData(defaultUserData));
                        setLoading(false);
                    })
                    .catch(error => {
                        console.error("Errore nella creazione del documento utente:", error);
                        addNotification("Impossibile creare il profilo. Le modifiche non verranno salvate.", 'error');
                        // Fallback to local data, but saving will likely fail.
                        setData(defaultUserData);
                        setLoading(false);
                    });
            }
        }, error => {
            console.error("Errore listener Firestore:", error);
            addNotification("Impossibile sincronizzare i dati in tempo reale. Controlla la connessione.", 'error');
            setData(defaultUserData);
            setLoading(false);
        });

        return () => {
            console.log("Pulizia del listener Firestore.");
            unsubscribe();
        };
    }, [user, addNotification]);

    const loadData = useCallback(async (isRefetch = false) => {
        if (!user) {
            if (!isRefetch) setLoading(false);
            return;
        }
        if (!isRefetch) setLoading(true);

        try {
            let fetchedData = await fetchData(user);
            setData(processFetchedData(fetchedData));
            
            if (isRefetch) {
                addNotification('Dati aggiornati con successo!', 'success');
            }
        } catch (error) {
            console.error("Failed to load data", error);
            addNotification("Impossibile caricare i dati. Controlla la connessione e riprova.", 'error');
            if (!isRefetch) setData(defaultUserData);
        } finally {
            if (!isRefetch) setLoading(false);
        }
    }, [user, addNotification]);


    const refetchData = useCallback(async () => {
        await loadData(true);
    }, [loadData]);

    const saveData = useCallback(async (newData: UserData, successMessage?: string) => {
        if (user) {
            setData(newData); // Optimistic update
            try {
                await saveCloudData(user, newData);
                if (successMessage) {
                    addNotification(successMessage, 'success');
                }
            } catch (error) {
                console.error("Failed to save data:", error);
                addNotification('Errore di salvataggio. Le modifiche potrebbero non essere state salvate.', 'error');
                // Optionally revert data here
                loadData(true); // Refetch to get last good state
            }
        }
    }, [user, addNotification, loadData]);

    const setDefaultTrip = useCallback((tripId: string | null) => {
        if (!data) return;
        const newData: UserData = { ...data };
        if (tripId) {
            newData.defaultTripId = tripId;
        } else {
            delete newData.defaultTripId;
        }
        saveData(newData, 'Viaggio predefinito impostato.');
    }, [data, saveData]);

    const addTrip = useCallback((trip: Omit<Trip, 'id' | 'expenses'>) => {
        if (!data) return;
        const newTrip: Trip = { 
            ...trip, 
            id: Date.now().toString(), 
            expenses: [], 
            checklist: [],
            members: trip.members || [],
            frequentExpenses: trip.frequentExpenses || [],
            enableCategoryBudgets: trip.enableCategoryBudgets || false,
            categoryBudgets: trip.categoryBudgets || []
        };
        const newData = { ...data, trips: [...data.trips, newTrip] };
        saveData(newData, 'Viaggio creato con successo.');
    }, [data, saveData]);

    const updateTrip = useCallback((updatedTrip: Trip) => {
        if (!data) return;
        const updatedTrips = data.trips.map(t => t.id === updatedTrip.id ? updatedTrip : t);
        const newData = { ...data, trips: updatedTrips };
        saveData(newData, 'Viaggio aggiornato.');
    }, [data, saveData]);

    const deleteTrip = useCallback((tripId: string) => {
        if (!data) return;
        const updatedTrips = data.trips.filter(t => t.id !== tripId);
        
        const newData: UserData = { ...data, trips: updatedTrips };
        if (data.defaultTripId === tripId) {
            delete newData.defaultTripId;
        }

        saveData(newData, 'Viaggio eliminato.');
    }, [data, saveData]);
    
    const addExpense = useCallback((tripId: string, expense: Omit<Expense, 'id'>) => {
        if (!data) return;
        const newExpense: Expense = { ...expense, id: Date.now().toString() };
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                return { ...trip, expenses: [...(trip.expenses || []), newExpense] };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData, 'Spesa aggiunta.');
    }, [data, saveData]);

    const updateExpense = useCallback((tripId: string, updatedExpense: Expense) => {
        if (!data) return;
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                const updatedExpenses = (trip.expenses || []).map(e => e.id === updatedExpense.id ? updatedExpense : e);
                return { ...trip, expenses: updatedExpenses };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData, 'Spesa aggiornata.');
    }, [data, saveData]);

    const deleteExpense = useCallback((tripId: string, expenseId: string) => {
        if (!data) return;
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                const updatedExpenses = (trip.expenses || []).filter(e => e.id !== expenseId);
                return { ...trip, expenses: updatedExpenses };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData, 'Spesa eliminata.');
    }, [data, saveData]);

    const addCategory = useCallback((category: Omit<Category, 'id'>) => {
        if (!data) return;
        const newCategory: Category = { ...category, id: `custom-cat-${Date.now().toString()}` };
        const newData = { ...data, categories: [...data.categories, newCategory] };
        saveData(newData, 'Categoria creata.');
    }, [data, saveData]);

    const updateCategory = useCallback((updatedCategory: Category) => {
        if (!data) return;
        const oldCategory = data.categories.find(c => c.id === updatedCategory.id);
        const updatedCategories = data.categories.map(c => c.id === updatedCategory.id ? updatedCategory : c);
        
        let updatedTrips = data.trips;
        if(oldCategory && oldCategory.name !== updatedCategory.name) {
            updatedTrips = data.trips.map(trip => ({
                ...trip,
                expenses: (trip.expenses || []).map(exp => exp.category === oldCategory.name ? { ...exp, category: updatedCategory.name } : exp)
            }));
        }

        const newData = { ...data, trips: updatedTrips, categories: updatedCategories };
        saveData(newData, 'Categoria aggiornata.');
    }, [data, saveData]);

    const deleteCategory = useCallback((categoryId: string) => {
        if (!data) return;
        if (DEFAULT_CATEGORIES.some(c => c.id === categoryId)) {
            addNotification("Le categorie predefinite non possono essere eliminate.", 'error');
            return;
        }

        const categoryToDelete = data.categories.find(c => c.id === categoryId);
        if (!categoryToDelete) return;

        const miscellaneousCategory = data.categories.find(c => c.id === 'cat-8');
        if (!miscellaneousCategory) {
            addNotification("Impossibile trovare la categoria 'Varie' per riassegnare le spese.", 'error');
            return;
        }
        
        const updatedTrips = data.trips.map(trip => {
            const needsUpdate = (trip.expenses || []).some(e => e.category === categoryToDelete.name);
            if (!needsUpdate) return trip;
            
            return {
                ...trip,
                expenses: (trip.expenses || []).map(expense => {
                    if (expense.category === categoryToDelete.name) {
                        return { ...expense, category: miscellaneousCategory.name };
                    }
                    return expense;
                })
            };
        });

        const updatedCategories = data.categories.filter(c => c.id !== categoryId);
        const newData = { ...data, trips: updatedTrips, categories: updatedCategories };
        saveData(newData, 'Categoria eliminata.');
    }, [data, saveData, addNotification]);

    const addChecklistItem = useCallback((tripId: string, text: string) => {
        if (!data) return;
        const newItem: ChecklistItem = { id: Date.now().toString(), text, completed: false };
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                const updatedChecklist = [...(trip.checklist || []), newItem];
                return { ...trip, checklist: updatedChecklist };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData);
    }, [data, saveData]);

    const updateChecklistItem = useCallback((tripId: string, updatedItem: ChecklistItem) => {
        if (!data) return;
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                const updatedChecklist = (trip.checklist || []).map(item =>
                    item.id === updatedItem.id ? updatedItem : item
                );
                return { ...trip, checklist: updatedChecklist };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData);
    }, [data, saveData]);

    const deleteChecklistItem = useCallback((tripId: string, itemId: string) => {
        if (!data) return;
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                const updatedChecklist = (trip.checklist || []).filter(item => item.id !== itemId);
                return { ...trip, checklist: updatedChecklist };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData);
    }, [data, saveData]);

    const clearCompletedChecklistItems = useCallback((tripId: string) => {
        if (!data) return;
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                const activeItems = (trip.checklist || []).filter(item => !item.completed);
                return { ...trip, checklist: activeItems };
            }
            return trip;
        });
        const newData = { ...data, trips: updatedTrips };
        saveData(newData, 'Elementi completati rimossi.');
    }, [data, saveData]);

    const addChecklistFromTemplate = useCallback((tripId: string, templateItems: { text: string }[]) => {
        if (!data) return;
        const newItems: ChecklistItem[] = templateItems.map(item => ({
            id: `${item.text}-${Date.now()}-${Math.random()}`,
            text: item.text,
            completed: false
        }));
        
        const updatedTrips = data.trips.map(trip => {
            if (trip.id === tripId) {
                const currentChecklist = trip.checklist || [];
                const currentTexts = new Set(currentChecklist.map(i => i.text));
                const uniqueNewItems = newItems.filter(i => !currentTexts.has(i.text));
                
                if (uniqueNewItems.length === 0) {
                    addNotification("Tutti gli elementi di questo template sono già nella tua lista.", 'info');
                    return trip;
                }

                const updatedChecklist = [...currentChecklist, ...uniqueNewItems];
                addNotification(`${uniqueNewItems.length} elementi aggiunti alla checklist.`, 'success');
                return { ...trip, checklist: updatedChecklist };
            }
            return trip;
        });

        const newData = { ...data, trips: updatedTrips };
        saveData(newData);
    }, [data, saveData, addNotification]);

    const value = {
        data,
        loading,
        addTrip,
        updateTrip,
        deleteTrip,
        addExpense,
        updateExpense,
        deleteExpense,
        addCategory,
        updateCategory,
        deleteCategory,
        setDefaultTrip,
        addChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        addChecklistFromTemplate,
        clearCompletedChecklistItems,
        refetchData,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    if (!context.data && !context.loading) {
        // This can happen if there was a major fetch error. Provide a safe default.
        return { ...context, data: defaultUserData };
    }
    return context;
};