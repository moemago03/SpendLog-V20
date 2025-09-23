import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

interface LocationData {
    city: string | null;
    country: string | null;
}

interface LocationContextProps {
    location: LocationData | null;
    isLoadingLocation: boolean;
    locationError: string | null;
}

const LocationContext = createContext<LocationContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'vsc_location_data';
const LOCATION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndSetLocation = async () => {
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
                        // Using Google's Geocoding API
                        const apiKey = process.env.API_KEY;
                        if (!apiKey) {
                             throw new Error("API key for geocoding is missing.");
                        }

                        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&result_type=locality&language=it`);
                        if (!response.ok) {
                            throw new Error('Failed to fetch location data.');
                        }
                        const data = await response.json();

                        if (data.status === 'OK' && data.results.length > 0) {
                            const result = data.results[0];
                            const cityComponent = result.address_components.find((c: any) => c.types.includes('locality'));
                            const countryComponent = result.address_components.find((c: any) => c.types.includes('country'));
                            
                            const newLocation: LocationData = {
                                city: cityComponent?.long_name || null,
                                country: countryComponent?.long_name || null
                            };
                            
                            setLocation(newLocation);
                            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...newLocation, timestamp: Date.now() }));
                        } else {
                            throw new Error(data.error_message || 'No results found from geocoding API.');
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
                    // Still update timestamp to avoid asking again too soon if user permanently denied
                    const storedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...storedData, timestamp: Date.now() }));
                }
            );
        };

        const checkLocation = () => {
            try {
                const storedDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (storedDataRaw) {
                    const storedData = JSON.parse(storedDataRaw);
                    const lastCheck = storedData.timestamp || 0;
                    
                    if (Date.now() - lastCheck < LOCATION_CHECK_INTERVAL) {
                        // Data is recent, use it
                        setLocation({ city: storedData.city, country: storedData.country });
                        setIsLoadingLocation(false);
                        return; // Don't fetch new data
                    }
                }
                // Data is old or doesn't exist, fetch new
                fetchAndSetLocation();
            } catch (e) {
                console.error("Failed to read location from storage.", e);
                // Fallback to fetching
                fetchAndSetLocation();
            }
        };

        checkLocation();
    }, []);

    const value = { location, isLoadingLocation, locationError };

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
