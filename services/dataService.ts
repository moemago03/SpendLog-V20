import { UserData, Trip, Stage } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { db } from '../config';
// FIX: Import Firebase v9 modular functions
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { dateToISOString } from '../utils/dateUtils';

// Detect if the app is running in a local/development environment
export const isDevelopmentEnvironment = (): boolean => {
    // Force mock data environment as per user request to resolve performance issues.
    // This prevents any attempts to connect to Firebase.
    return true;
};


// --- LOCAL MOCK DATA ---
const getMockData = (password: string): UserData => {
    // Generate dynamic dates so the trip always starts tomorrow and lasts 14 days.
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Normalize time

    const tripStart = new Date(today);
    tripStart.setDate(today.getDate() + 1); // Trip starts tomorrow

    const tripEnd = new Date(tripStart);
    tripEnd.setDate(tripStart.getDate() + 13); // Trip ends 13 days after it starts, for a total of 14 days.

    const getDateAfter = (startDate: Date, days: number): Date => {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    };

    // Split 13 nights across stages: 5 + 4 + 4 = 13 nights
    const stage1Nights = 5;
    const stage2Nights = 4;
    const stage3Nights = 4;

    const stage1Start = tripStart;
    const stage2Start = getDateAfter(stage1Start, stage1Nights);
    const stage3Start = getDateAfter(stage2Start, stage2Nights);

    // Spread expenses and events throughout the trip dates
    const eventDate1 = getDateAfter(tripStart, 1); // 2nd day of trip
    const eventDate2 = getDateAfter(tripStart, 2); // 3rd day of trip
    
    const expDate1 = getDateAfter(tripStart, 0);   // Day 1
    const expDate2 = getDateAfter(tripStart, 1);   // Day 2
    const expDate3 = getDateAfter(stage2Start, 1); // Day 7 (in Vietnam)
    const expDate4 = getDateAfter(stage3Start, 1); // Day 11 (in Cambodia)


    const MOCK_USER_DATA: UserData = {
        name: 'Utente Demo',
        email: 'demo@spendilog.com',
        dataviaggio: dateToISOString(today),
        trips: [
            {
                id: 'mock-trip-1',
                name: 'Sud-est Asiatico',
                // FIX: Add missing properties to satisfy the Trip interface.
                startDate: tripStart.toISOString(),
                endDate: tripEnd.toISOString(),
                countries: ['Thailandia', 'Vietnam', 'Cambogia'],
                stages: [
                    {
                        id: 'stage-1',
                        location: 'Bangkok, Thailandia',
                        startDate: dateToISOString(stage1Start),
                        nights: stage1Nights,
                        events: [
                            // FIX: Add tripId to all mock events
                            { eventId: 'evt-today-1', tripId: 'mock-trip-1', eventDate: dateToISOString(eventDate1), title: 'Colazione al bar', type: 'Cibo', startTime: '08:30', endTime: '09:15', description: 'Cappuccino e cornetto per iniziare la giornata.', status: 'planned', location: 'Bar del Corso, Roma, Italia' },
                            { eventId: 'evt-today-2', tripId: 'mock-trip-1', eventDate: dateToISOString(eventDate1), title: 'Visita al Museo d\'Arte', type: 'Attività', startTime: '10:00', endTime: '12:30', description: 'Mostra temporanea di arte moderna.', status: 'planned', location: 'Museo d\'Arte Moderna, Roma, Italia' },
                            { eventId: 'evt-1', tripId: 'mock-trip-1', eventDate: dateToISOString(eventDate2), title: 'Grande Palazzo Reale', type: 'Attività', startTime: '09:00', endTime: '12:00', description: 'Visita il complesso di templi più sacro.', status: 'planned', location: 'Na Phra Lan Rd, Bangkok' },
                        ]
                    },
                    {
                        id: 'stage-2',
                        location: 'Hanoi, Vietnam',
                        startDate: dateToISOString(stage2Start),
                        nights: stage2Nights,
                        events: [
                             { eventId: 'evt-3', tripId: 'mock-trip-1', eventDate: dateToISOString(stage2Start), title: 'Volo per Hanoi', type: 'Trasporti', startTime: '15:30', description: 'Volo BKK -> HAN, VietJet Air VJ902.', status: 'planned' },
                        ]
                    },
                     {
                        id: 'stage-3',
                        location: 'Phnom Penh, Cambogia',
                        startDate: dateToISOString(stage3Start),
                        nights: stage3Nights,
                        events: []
                    }
                ],
                totalBudget: 3000,
                preferredCurrencies: ['EUR', 'THB', 'VND', 'USD'],
                mainCurrency: 'EUR',
                members: [
                    { id: 'user-self', name: 'Io' },
                    { id: 'member-moeez', name: 'Moeez' },
                    { id: 'member-chiara', name: 'Chiara' },
                    { id: 'member-asad', name: 'Asad' },
                ],
                expenses: [
                    { id: 'exp1', amount: 30, currency: 'EUR', category: 'Cibo', date: expDate1.toISOString(), country: 'Area Euro', paymentMethod: 'Carta di Credito', paidById: 'user-self', splitType: 'equally', splitBetweenMemberIds: ['user-self', 'member-moeez', 'member-chiara', 'member-asad'], location: 'Trastevere, Roma, Italia' },
                    { id: 'exp2', amount: 1200, currency: 'THB', category: 'Alloggio', date: expDate1.toISOString(), country: 'Thailandia', paymentMethod: 'Booking.com', paidById: 'member-chiara', splitType: 'equally', splitBetweenMemberIds: ['user-self', 'member-moeez', 'member-chiara', 'member-asad'], location: 'Khaosan Road, Bangkok, Thailandia' },
                    { id: 'exp3', amount: 500000, currency: 'VND', category: 'Attività', description: 'Tour Ha Long Bay', date: expDate3.toISOString(), country: 'Vietnam', paymentMethod: 'Contanti', paidById: 'member-moeez', splitType: 'equally', splitBetweenMemberIds: ['member-moeez', 'member-asad'], location: 'Baia di Ha Long, Vietnam' },
                    { id: 'exp4', amount: 25, currency: 'USD', category: 'Visti', description: 'Visto per la Cambogia', date: expDate4.toISOString(), country: 'Cambogia', paymentMethod: 'Contanti', paidById: 'member-asad', splitType: 'equally', splitBetweenMemberIds: ['member-asad', 'user-self'] },
                    { id: 'exp5', amount: 80, currency: 'THB', category: 'Cibo', description: 'Pad Thai da strada', date: expDate2.toISOString(), country: 'Thailandia', paymentMethod: 'Contanti', paidById: 'user-self', splitType: 'equally', splitBetweenMemberIds: ['user-self'], location: 'Yaowarat Road, Bangkok, Thailandia' },
                    { id: 'exp6', amount: 45, currency: 'THB', category: 'Trasporti', description: 'Biglietto Skytrain', date: expDate2.toISOString(), country: 'Thailandia', paymentMethod: 'Contanti', paidById: 'user-self', splitType: 'equally', splitBetweenMemberIds: ['user-self'], location: 'Siam BTS Station, Bangkok' },
                    { id: 'exp7', amount: 70000, currency: 'VND', category: 'Cibo', description: 'Caffè e Pho', date: expDate3.toISOString(), country: 'Vietnam', paymentMethod: 'Contanti', paidById: 'member-chiara', splitType: 'equally', splitBetweenMemberIds: ['user-self', 'member-chiara'], location: 'Hanoi Old Quarter, Vietnam' },
                ],
                documents: [
                    { id: 'doc-1', tripId: 'mock-trip-1', eventId: 'evt-3', name: 'Biglietto Aereo VJ902.pdf', type: 'application/pdf', data: '' },
                    { id: 'doc-2', tripId: 'mock-trip-1', name: 'Copia Passaporto.jpg', type: 'image/jpeg', data: '' }
                ],
                color: '#3B82F6',
                enableCategoryBudgets: true,
                categoryBudgets: [ { categoryName: 'Cibo', amount: 1000 }, { categoryName: 'Alloggio', amount: 1200 } ],
                frequentExpenses: [
                    { id: 'freq-1', name: 'Pranzo', icon: '🍽️', category: 'Cibo', amount: 10, paidById: 'user-self', splitBetweenMemberIds: ['user-self'] },
                    { id: 'freq-2', name: 'Grab Bike', icon: '🛵', category: 'Trasporti', amount: 2, paidById: 'user-self', splitBetweenMemberIds: ['user-self'] },
                ]
            }
        ],
        categories: DEFAULT_CATEGORIES,
        defaultTripId: 'mock-trip-1',
    };
    
    try {
        const storedData = localStorage.getItem(`mock_data_${password}`);
        if (storedData) {
            // FIX: Ensure stored data dates are also dynamic on subsequent loads if needed,
            // or just rely on fresh mock data for simplicity. For now, fresh is better.
            // return JSON.parse(storedData);
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