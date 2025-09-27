import { useCallback } from 'react';
import { useData } from '../context/DataContext';

// The structure is already defined in types.ts, so we can import it.
import { AccommodationFilters } from '../types';

const defaultFilters: AccommodationFilters = {
    propertyTypes: [],
    reviewScore: null,
    distance: null,
    entirePlace: false,
};

export const useAccommodationFilters = () => {
    const { data, updateAccommodationFilters } = useData();

    // The filters are now read directly from the synchronized user data.
    // If they don't exist, we use the default values.
    const filters = data?.accommodationFilters || defaultFilters;

    // The saveFilters function now calls the central update function from DataContext.
    const saveFilters = useCallback((newFilters: AccommodationFilters) => {
        if (updateAccommodationFilters) { // check if function exists before calling
            updateAccommodationFilters(newFilters);
        }
    }, [updateAccommodationFilters]);
    
    // The resetFilters function also uses the central update function.
    const resetFilters = useCallback(() => {
        if (updateAccommodationFilters) { // check if function exists before calling
            updateAccommodationFilters(defaultFilters);
        }
    }, [updateAccommodationFilters]);

    return { filters, saveFilters, resetFilters };
};
