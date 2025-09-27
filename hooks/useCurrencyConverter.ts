import { useCallback } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export const useCurrencyConverter = () => {
    const { rates } = useCurrency(); // Get rates from our new context

    const convert = useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
        if (fromCurrency === toCurrency) return amount;

        // Use the rates from the context (local storage or fallback mocks)
        const fromRate = rates[fromCurrency];
        const toRate = rates[toCurrency];

        if (!fromRate || !toRate) {
            // If a rate is not found, log a warning and return 0 to prevent calculation errors and crashes.
            // Returning the original amount would lead to incorrect totals.
            console.warn(`Cannot convert from ${fromCurrency} to ${toCurrency}. Rate not found. The amount will be treated as 0.`);
            return 0;
        }

        const amountInEur = amount / fromRate;
        const convertedAmount = amountInEur * toRate;

        return convertedAmount;
    }, [rates]); // The conversion logic now depends on the centrally managed rates

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return { convert, formatCurrency };
};
