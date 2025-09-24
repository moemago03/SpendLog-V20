import React, { useState, useCallback } from 'react';
import { Event, Trip } from '../../types';
import { GoogleGenAI } from "@google/genai";

const AIDaySummary: React.FC<{ events: Event[]; trip: Trip; }> = ({ events, trip }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSummary(null);

        const eventsSummary = events.map(e => `${e.startTime || 'Tutto il giorno'}: ${e.title} (${e.type})`).join('; ');

        try {
            // FIX: The API key is sourced from an environment variable per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Basandoti su questo programma per una giornata di viaggio a ${trip.countries.join(', ')}, crea un breve riassunto (massimo 2 frasi) che descriva l'atmosfera e il ritmo della giornata. Sii amichevole e incoraggiante. Programma: ${eventsSummary}`,
            });
            
            const text = response.text.trim();
            if (text) {
                setSummary(text);
            } else {
                throw new Error("L'AI non ha fornito un riassunto.");
            }

        } catch (e: any) {
            console.error("Error generating day summary:", e);
            setError("Analisi fallita. Riprova.");
        } finally {
            setIsLoading(false);
        }
    }, [events, trip.countries]);

    if (events.length < 2) {
        return null; // Not enough events to generate a meaningful summary
    }

    return (
        <div className="p-4 bg-surface-variant/70 rounded-2xl animate-fade-in">
            <div className="flex justify-between items-start gap-3">
                <div>
                    <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                        Riepilogo AI
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">Un'analisi della tua giornata.</p>
                </div>
                 <button 
                    onClick={generateSummary} 
                    disabled={isLoading} 
                    className="px-3 py-1.5 text-xs font-semibold bg-secondary-container text-on-secondary-container rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                    {isLoading ? 'Analizzo...' : (summary ? 'Rigenera' : 'Genera')}
                </button>
            </div>
            <div className="mt-3 min-h-[4rem] flex items-center">
                {isLoading && <p className="text-sm text-on-surface-variant animate-pulse">L'AI sta pensando...</p>}
                {error && <p className="text-sm text-error">{error}</p>}
                {summary && <p className="text-sm text-on-surface-variant leading-relaxed">{summary}</p>}
                {!summary && !isLoading && !error && <p className="text-sm text-on-surface-variant">Clicca 'Genera' per un riassunto AI della giornata.</p>}
            </div>
        </div>
    );
};

export default AIDaySummary;