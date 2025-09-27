import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

interface TravelTimeEstimatorProps {
    origin: string;
    destination: string;
}

const TravelTimeEstimator: React.FC<TravelTimeEstimatorProps> = ({ origin, destination }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [travelInfo, setTravelInfo] = useState<{ mode: string, time: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getModeIcon = (mode: string) => {
        const lowerMode = mode.toLowerCase();
        if (lowerMode.includes('walk') || lowerMode.includes('piedi')) return 'directions_walk';
        if (lowerMode.includes('metro') || lowerMode.includes('subway')) return 'subway';
        if (lowerMode.includes('bus')) return 'directions_bus';
        if (lowerMode.includes('car') || lowerMode.includes('taxi')) return 'local_taxi';
        return 'route';
    };

    const fetchTravelTime = useCallback(async () => {
        // RIABILITARE API GEMINI: Rimuovere le prossime 3 righe per riattivare la funzionalità.
        setError("AI disabilitata");
        setIsLoading(false);
        return;

        setIsLoading(true);
        setError(null);
        try {
            // FIX: The API key is sourced from an environment variable per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Stima il tempo di viaggio e il mezzo di trasporto migliore per andare da "${origin}" a "${destination}". Sii conciso.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            mode: { type: Type.STRING, description: "Mezzo di trasporto (es. A piedi, Metro, Taxi)." },
                            time: { type: Type.STRING, description: "Tempo di viaggio stimato (es. ~15 min)." }
                        },
                        required: ["mode", "time"]
                    }
                }
            });
            
            let jsonString = response.text.trim();
            if (jsonString.startsWith("```json")) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            }
            const result = JSON.parse(jsonString);

            if (result.mode && result.time) {
                setTravelInfo(result);
            } else {
                throw new Error("Risposta AI non valida.");
            }
        } catch (e: any) {
            console.error("Error fetching travel time:", e);
            setError("Errore");
        } finally {
            setIsLoading(false);
        }
    }, [origin, destination]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="w-6 h-6 border-2 border-t-primary border-surface-variant rounded-full animate-spin"></div>
            );
        }
        if (error) {
            return (
                <button onClick={fetchTravelTime} className="p-1 rounded-full text-error" aria-label="Riprova">
                    <span className="material-symbols-outlined text-base">error</span>
                </button>
            );
        }
        if (travelInfo) {
            return (
                <div className="flex flex-col items-center justify-center text-on-surface-variant animate-fade-in">
                    <span className="material-symbols-outlined text-base">{getModeIcon(travelInfo.mode)}</span>
                    <p className="text-[10px] font-bold -mt-0.5">{travelInfo.time}</p>
                </div>
            );
        }
        return (
            <button
                onClick={fetchTravelTime}
                className="w-8 h-8 rounded-full bg-surface-variant/80 hover:bg-primary-container/50 flex items-center justify-center transition-colors shadow-sm"
                aria-label="Calcola tempo di viaggio"
            >
                <span className="material-symbols-outlined text-base">more_time</span>
            </button>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="w-px flex-grow border-l border-dashed border-on-surface-variant/50"></div>
            <div className="my-1 text-on-surface-variant">
                {renderContent()}
            </div>
            <div className="w-px flex-grow border-l border-dashed border-on-surface-variant/50"></div>
        </div>
    );
};

export default TravelTimeEstimator;