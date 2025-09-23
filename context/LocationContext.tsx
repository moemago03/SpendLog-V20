import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';

interface LocationData {
    city: string | null;
    country: string | null;
}

interface LocationContextProps {
    location: LocationData | null;
    isLoadingLocation: boolean;
    locationError: string | null;
    refreshLocation: () => void;
}

const LocationContext = createContext<LocationContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'vsc_location_data';
const LOCATION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);

    const refreshLocation = useCallback(() => {
        setIsLoadingLocation(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError("La geolocalizzazione non è supportata da questo browser.");
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=it`);
                    if (!response.ok) {
                        throw new Error('Impossibile contattare il servizio di geolocalizzazione.');
                    }
                    const data = await response.json();

                    if (data && data.address) {
                        const newLocation: LocationData = {
                            city: data.address.city || data.address.town || data.address.village || null,
                            country: data.address.country || null,
                        };
                        
                        setLocation(newLocation);
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...newLocation, timestamp: Date.now() }));
                    } else {
                        throw new Error('Risposta di geolocalizzazione non valida.');
                    }
                } catch (err: any) {
                    setLocationError(err.message || "Impossibile determinare la città.");
                } finally {
                    setIsLoadingLocation(false);
                }
            },
            (error) => {
                setLocationError(`Accesso alla posizione negato: ${error.message}`);
                setIsLoadingLocation(false);
                const storedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...storedData, timestamp: Date.now() }));
            }
        );
    }, []);

    useEffect(() => {
        const checkLocation = () => {
            try {
                const storedDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (storedDataRaw) {
                    const storedData = JSON.parse(storedDataRaw);
                    const lastCheck = storedData.timestamp || 0;
                    
                    if (Date.now() - lastCheck < LOCATION_CHECK_INTERVAL) {
                        setLocation({ city: storedData.city, country: storedData.country });
                        setIsLoadingLocation(false);
                        return;
                    }
                }
                refreshLocation();
            } catch (e) {
                console.error("Failed to read location from storage.", e);
                refreshLocation();
            }
        };

        checkLocation();
    }, [refreshLocation]);

    const value = { location, isLoadingLocation, locationError, refreshLocation };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};