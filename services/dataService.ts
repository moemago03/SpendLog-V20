import { UserData } from '../types';
import { db } from '../config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Fetches user data from Firestore.
 * @param userId The UID of the user to fetch data for.
 * @returns A Promise that resolves to the UserData object or null if not found.
 */
export const fetchData = async (userId: string): Promise<UserData | null> => {
    if (!db) {
        console.warn("Firestore is not initialized. Cannot fetch data.");
        return null;
    }

    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        } else {
            console.log(`No document found for user ${userId}. A new one will be created on first data save.`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        // It might be better to throw the error to let the caller handle it
        throw error;
    }
};

/**
 * Saves user data to Firestore.
 * @param userId The UID of the user to save data for.
 * @param data The UserData object to save.
 */
export const saveData = async (userId: string, data: UserData) => {
    if (!db) {
        console.error("Firestore is not initialized. Cannot save data.");
        throw new Error("Database not connected");
    }

    try {
        const docRef = doc(db, "users", userId);
        // Using setDoc with merge: true is often safer to avoid accidentally overwriting fields 
        // if the local data object is not complete. However, since we manage the full state,
        // a direct setDoc is what we've implemented in the DataContext.
        await setDoc(docRef, data);
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        throw error;
    }
};
