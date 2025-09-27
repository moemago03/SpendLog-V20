import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { MOCK_EXCHANGE_RATES } from '../constants';
import { useNotification } from './NotificationContext';

interface ExchangeRates {
    rates: { [key: string]: number };
    lastUpdated: string;
}

interface CurrencyContextProps {
    rates: { [key: string]: number };
    lastUpdated: string | null;
    isUpdating: boolean;
    updateRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'vsc_exchange_rates';
const API_URL = 'https://open.er-api.com/v6/latest/EUR';

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rates, setRates] = useState<{ [key: string]: number }>(MOCK_EXCHANGE_RATES);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const { addNotification } = useNotification();

    const updateRates = useCallback(async (isSilent = false) => {
        setIsUpdating(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Network response was not ok for exchange rates.');
            }
            const data = await response.json();

            if (data.result === 'success') {
                const newRates = data.rates;
                const newLastUpdated = new Date().toISOString();

                const dataToStore: ExchangeRates = {
                    rates: newRates,
                    lastUpdated: newLastUpdated
                };
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
                setRates(newRates);
                setLastUpdated(newLastUpdated);
                if (!isSilent) {
                    addNotification('Tassi di cambio aggiornati con successo.', 'success');
                }
            } else {
                throw new Error('API did not return success for exchange rates.');
            }
        } catch (error) {
            console.error("Failed to fetch or save exchange rates:", error);
            if (!isSilent) {
                addNotification("Impossibile aggiornare i tassi. Verranno usati dati offline.", 'warning');
            }
        } finally {
            setIsUpdating(false);
        }
    }, [addNotification]);

    useEffect(() => {
        const initializeAndRefreshRates = async () => {
            const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedData) {
                try {
                    const parsedData: ExchangeRates = JSON.parse(storedData);
                    setRates(parsedData.rates);
                    setLastUpdated(parsedData.lastUpdated);

                    const lastUpdatedDate = new Date(parsedData.lastUpdated);
                    const now = new Date();
                    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

                    if (now.getTime() - lastUpdatedDate.getTime() > oneDay) {
                        // Data is stale, update in the background silently
                        await updateRates(true);
                    }
                } catch (error) {
                    console.error("Corrupted exchange rate data in local storage. Refetching...", error);
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                    await updateRates(true); // Fetch fresh data silently
                }
            } else {
                // No data in storage, fetch immediately
                await updateRates(true);
            }
        };

        initializeAndRefreshRates();
    }, [updateRates]);

    const value = { rates, lastUpdated, isUpdating, updateRates };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
