import React, { useState, useMemo, useEffect } from 'react';
import { useItinerary } from '../../context/ItineraryContext';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { GoogleGenAI, Type } from "@google/genai";
import { getContrastColor } from '../../utils/colorUtils';
import { useLocation } from '../../context/LocationContext';

interface AIItineraryGeneratorProps {
    tripId: string;
    selectedDate: string;
    onClose: () => void;
}

interface GeneratedEvent {
    title: string;
    type: string;
    startTime?: string;
    endTime?: string;
    description?: string;
    location?: string;
}

const AIItineraryGenerator: React.FC<AIItineraryGeneratorProps> = ({ tripId, selectedDate, onClose }) => {
    const { addEvent } = useItinerary();
    const { addNotification } = useNotification();
    const { data } = useData();
    const { location } = useLocation();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedEvents, setGeneratedEvents] = useState<GeneratedEvent[]>([]);
    const [selectedEvents, setSelectedEvents] = useState<GeneratedEvent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [dayStyle, setDayStyle] = useState<string | null>(null);

    useEffect(() => {
        // Pre-fill prompt with location context, but only if it's empty
        // to avoid overwriting user input.
        if (location?.city && !prompt) {
            setPrompt(`Una giornata a ${location.city}, visitando i luoghi più famosi.`);
        }
    }, [location?.city, prompt]);

    const itineraryCategories = useMemo(() => {
        return data.categories.filter(c => c.isItineraryCategory).map(c => c.name);
    }, [data.categories]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedEvents([]);
        setSelectedEvents([]);

        try {
            // FIX: The API key is sourced from an environment variable per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            let contextPrompt = `Basandoti sulla richiesta "${prompt}", genera una lista di eventi per un itinerario di viaggio.`;
            if (location?.city) {
                contextPrompt = `Crea un itinerario per la città di ${location.city}. Richiesta utente: "${prompt}"`;
            }
            if (dayStyle) {
                contextPrompt = `${contextPrompt} Lo stile della giornata deve essere: "${dayStyle}".`;
            }
            
            const baseInstruction = `Gli orari devono essere plausibili. Il tipo di evento deve essere uno dei seguenti: ${itineraryCategories.join(', ')}. Rispondi in italiano.`;
            const finalContents = `${contextPrompt} ${baseInstruction}`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: finalContents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            events: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        type: { type: Type.STRING, enum: itineraryCategories },
                                        startTime: { type: Type.STRING, format: "HH:MM", description: "Orario di inizio nel formato HH:MM" },
                                        endTime: { type: Type.STRING, format: "HH:MM", description: "Orario di fine nel formato HH:MM" },
                                        description: { type: Type.STRING },
                                        location: { type: Type.STRING }
                                    },
                                    required: ["title", "type", "startTime"]
                                }
                            }
                        }
                    }
                }
            });

            let jsonString = response.text.trim();
            if (jsonString.startsWith("```json")) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            }
            const result = JSON.parse(jsonString);

            if (result.events && result.events.length > 0) {
                const sortedEvents = result.events.sort((a: GeneratedEvent, b: GeneratedEvent) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99"));
                setGeneratedEvents(sortedEvents);
                setSelectedEvents(sortedEvents); // Pre-select all generated events
            } else {
                throw new Error("L'AI non ha generato eventi validi. Prova a essere più specifico.");
            }
        } catch (e: any) {
            console.error("Error generating itinerary:", e);
            setError(e.message || "Si è verificato un errore. Riprova.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleEvent = (event: GeneratedEvent) => {
        setSelectedEvents(prev =>
            prev.some(e => e.title === event.title)
                ? prev.filter(e => e.title !== event.title)
                : [...prev, event]
        );
    };

    const handleAddSelectedEvents = () => {
        selectedEvents.forEach(event => {
            addEvent({
                tripId,
                eventDate: selectedDate,
                title: event.title,
                type: event.type,
                startTime: event.startTime,
                endTime: event.endTime,
                description: event.description,
                location: event.location,
                status: 'planned'
            });
        });
        addNotification(`${selectedEvents.length} eventi aggiunti al tuo programma!`, 'success');
        onClose();
    };

    const SuggestionChip: React.FC<{ text: string }> = ({ text }) => (
        <button onClick={() => setPrompt(text)} className="px-3 py-1.5 bg-surface-variant text-on-surface-variant text-sm font-medium rounded-full hover:bg-primary-container/60 transition-colors">
            {text}
        </button>
    );
    
    const dayStyles = [
        { label: "Rilassante", icon: "self_improvement" },
        { label: "Culturale", icon: "museum" },
        { label: "Avventura", icon: "hiking" },
        { label: "Gastronomica", icon: "restaurant" },
    ];

    return (
        <div className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-xl font-bold ml-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                    Genera Itinerario AI
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-24">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-6">
                        <label className="text-sm font-semibold text-on-surface-variant mb-3 block">Stile della Giornata</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {dayStyles.map(style => (
                                <button
                                    key={style.label}
                                    onClick={() => setDayStyle(current => current === style.label ? null : style.label)}
                                    className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${dayStyle === style.label ? 'bg-primary-container text-on-primary-container ring-2 ring-primary' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/70'}`}
                                >
                                    <span className="material-symbols-outlined">{style.icon}</span>
                                    <span className="text-xs font-bold">{style.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <h2 className="text-lg font-semibold text-on-surface mb-2">Cosa ti piacerebbe fare?</h2>
                    <p className="text-sm text-on-surface-variant mb-4">Descrivi la giornata che vorresti. Più sei specifico, migliore sarà il risultato.</p>
                    
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Es: una mattinata con visita a un museo, seguita da un pranzo tipico..."
                        rows={3}
                        className="w-full bg-surface-variant rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                    />
                    <div className="flex flex-wrap gap-2 my-4">
                        <SuggestionChip text={location?.city ? `Tour dei templi di ${location.city}` : "Tour dei templi principali"} />
                        <SuggestionChip text={location?.city ? `Pomeriggio di shopping a ${location.city}` : "Pomeriggio di shopping"} />
                        <SuggestionChip text="Mattinata in spiaggia" />
                    </div>

                    <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full py-3 bg-primary text-on-primary font-bold rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Generando...
                            </>
                        ) : "Genera Programma"}
                    </button>

                    {error && <p className="text-error text-center mt-4 text-sm">{error}</p>}

                    {generatedEvents.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-on-surface mb-2">Eventi Suggeriti</h3>
                            <p className="text-sm text-on-surface-variant mb-4">Seleziona gli eventi che vuoi aggiungere al tuo programma per il {new Date(selectedDate + "T12:00:00").toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}.</p>
                            <div className="space-y-3">
                                {generatedEvents.map((event, index) => {
                                    const isSelected = selectedEvents.some(e => e.title === event.title);
                                    const category = data.categories.find(c => c.name === event.type);
                                    return (
                                        <div key={index} onClick={() => handleToggleEvent(event)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary-container/30' : 'border-transparent bg-surface-variant'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 mt-1 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-outline'}`}>
                                                    {isSelected && <span className="material-symbols-outlined text-sm text-on-primary">check</span>}
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-bold text-on-surface">{event.startTime} - {event.title}</p>
                                                    <p className="text-sm text-on-surface-variant">{event.description}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {category && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{backgroundColor: category.color, color: getContrastColor(category.color)}}>{category.name}</span>}
                                                        {event.location && <p className="text-xs text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span>{event.location}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {selectedEvents.length > 0 && !isLoading && (
                <footer className="p-4 bg-surface/80 backdrop-blur-sm border-t border-surface-variant mt-auto">
                    <button onClick={handleAddSelectedEvents} className="w-full max-w-2xl mx-auto bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                        Aggiungi {selectedEvents.length} Eventi al Programma
                    </button>
                </footer>
            )}
        </div>
    );
};

export default AIItineraryGenerator;