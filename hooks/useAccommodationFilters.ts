import { useState, useCallback } from 'react';

export interface AccommodationFilters {
    propertyTypes: string[];
    reviewScore: number | null;
    distance: number | null;
    entirePlace: boolean;
}

const LOCAL_STORAGE_KEY = 'vsc_accommodation_filters';

const defaultFilters: AccommodationFilters = {
    propertyTypes: [],
    reviewScore: null,
    distance: null,
    entirePlace: false,
};

export const useAccommodationFilters = () => {
    const [filters, setFilters] = useState<AccommodationFilters>(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            return stored ? JSON.parse(stored) : defaultFilters;
        } catch (error) {
            console.error("Failed to load accommodation filters from storage", error);
            return defaultFilters;
        }
    });

    const saveFilters = useCallback((newFilters: AccommodationFilters) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFilters));
            setFilters(newFilters);
        } catch (error) {
            console.error("Failed to save accommodation filters", error);
        }
    }, []);
    
    const resetFilters = useCallback(() => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setFilters(defaultFilters);
    }, []);

    return { filters, saveFilters, resetFilters };
};
