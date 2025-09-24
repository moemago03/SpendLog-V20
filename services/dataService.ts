import { UserData } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { db } from '../config';
// FIX: Import Firebase v9 modular functions
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Detect if the app is running in a local/development environment
export const isDevelopmentEnvironment = (): boolean => {
    // Force mock data environment as per user request to resolve performance issues.
    // This prevents any attempts to connect to Firebase.
    return true;
};


// --- LOCAL MOCK DATA ---
const getMockData = (password: string): UserData => {
    const MOCK_USER_DATA: UserData = {
        name: 'Utente Demo',
        email: 'demo@spendilog.com',
        dataviaggio: new Date().toISOString().split('T')[0],
        trips: [
            {
                id: 'mock-trip-1',
                name: 'Sud-est Asiatico',
                startDate: '2024-08-01T00:00:00.000Z',
                endDate: '2024-08-30T00:00:00.000Z',
                totalBudget: 3000,
                countries: ['Thailandia', 'Vietnam', 'Cambogia'],
                preferredCurrencies: ['EUR', 'THB', 'VND'],
                mainCurrency: 'EUR',
                members: [
                    { id: 'user-self', name: 'Io' },
                    { id: 'member-moeez', name: 'Moeez' },
                    { id: 'member-chiara', name: 'Chiara' },
                    { id: 'member-asad', name: 'Asad' },
                ],
                expenses: [
                    { id: 'exp1', amount: 30, currency: 'EUR', category: 'Cibo', date: new Date(Date.now() - 2 * 86400000).toISOString(), paidById: 'user-self', splitType: 'equally', splitBetweenMemberIds: ['user-self', 'member-moeez', 'member-chiara', 'member-asad'] },
                    { id: 'exp2', amount: 1200, currency: 'THB', category: 'Alloggio', date: new Date(Date.now() - 2 * 86400000).toISOString(), paidById: 'member-chiara', splitType: 'equally', splitBetweenMemberIds: ['user-self', 'member-moeez', 'member-chiara', 'member-asad'] },
                    { id: 'exp3', amount: 500000, currency: 'VND', category: 'Attività', date: new Date(Date.now() - 1 * 86400000).toISOString(), paidById: 'member-moeez', splitType: 'equally', splitBetweenMemberIds: ['member-moeez', 'member-asad'] },
                    { id: 'exp4', amount: 25, currency: 'EUR', category: 'Trasporti', date: new Date().toISOString(), paidById: 'member-asad', splitType: 'equally', splitBetweenMemberIds: ['member-asad', 'user-self'] },
                    { id: 'exp5', amount: 5, currency: 'EUR', category: 'Cibo', date: new Date().toISOString(), paidById: 'user-self', splitType: 'equally', splitBetweenMemberIds: ['user-self'] },
                ],
                color: '#3B82F6',
                enableCategoryBudgets: true,
                categoryBudgets: [
                    { categoryName: 'Cibo', amount: 1000 },
                    { categoryName: 'Alloggio', amount: 1200 },
                ],
                frequentExpenses: [
                    { id: 'freq-1', name: 'Pranzo', icon: '🍽️', category: 'Cibo', amount: 10 },
                    { id: 'freq-2', name: 'Grab Bike', icon: '🛵', category: 'Trasporti', amount: 2 },
                ]
            }
        ],
        categories: DEFAULT_CATEGORIES,
        defaultTripId: 'mock-trip-1',
    };
    
    try {
        const storedData = localStorage.getItem(`mock_data_${password}`);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (e) {
        console.error("Failed to parse mock data from localStorage", e);
    }
    
    return MOCK_USER_DATA;
};

// --- FIRESTORE DATA ---
const fetchFirestoreData = async (password: string): Promise<UserData | null> => {
    if (!db) {
        throw new Error('Firebase DB not initialized. Check configuration in config.ts.');
    }
    try {
        const docRef = doc(db, "users", password);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        throw new Error('Failed to fetch data from Firestore. Check your configuration and permissions.');
    }
}

const saveFirestoreData = async (password: string, data: UserData): Promise<void> => {
    if (!db) {
        throw new Error('Firebase DB not initialized. Check configuration in config.ts.');
    }
     try {
        await setDoc(doc(db, "users", password), data);
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        throw new Error('Failed to save data to Firestore. Check your configuration and permissions.');
    }
}

// --- UNIFIED DATA SERVICE ---
export const fetchData = async (password: string): Promise<UserData | null> => {
    console.log(`[DEBUG] Data fetch initiated from: ${window.location.href}`);
    if (isDevelopmentEnvironment()) {
        console.warn("Ambiente di sviluppo rilevato. Verranno usati dati di prova locali.");
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        return getMockData(password);
    } else {
        return await fetchFirestoreData(password);
    }
};

export const saveData = async (password: string, data: UserData): Promise<void> => {
    console.log(`[DEBUG] Data save initiated from: ${window.location.href}`);
    if (isDevelopmentEnvironment()) {
        console.warn("Ambiente di sviluppo rilevato. Salvataggio locale dei dati di prova.");
        try {
            localStorage.setItem(`mock_data_${password}`, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save mock data to localStorage", e);
        }
    } else {
        await saveFirestoreData(password, data);
    }
};