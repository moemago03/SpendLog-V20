import React, { useState, useMemo } from 'react';
import { Trip, Stage, PlanItem } from '../../types';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { GoogleGenAI, Type } from "@google/genai";
import { getContrastColor } from '../../utils/colorUtils';

interface GenerateDayPlanModalProps {
    trip: Trip;
    stage: Stage;
    onClose: () => void;
}

interface GeneratedItem {
    title: string;
    type: string;
    startTime: string;
    description: string;
    location?: string;
}

const GenerateDayPlanModal: React.FC<GenerateDayPlanModalProps> = ({ trip, stage, onClose }) => {
    const { data, addPlanItems } = useData();
    const { addNotification } = useNotification();

    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<GeneratedItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const itineraryCategories = useMemo(() => {
        return data.categories.filter(c => c.isItineraryCategory).map(c => c.name);
    }, [data.categories]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedItems([]);
        setSelectedItems([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const contents = `Basandoti sulla richiesta "${prompt}", genera un itinerario di una giornata per la città di ${stage.location.split(',')[0]}. Il tipo di evento deve essere uno dei seguenti: ${itineraryCategories.join(', ')}. Fornisci orari di inizio realistici.`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents,
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
                                        startTime: { type: Type.STRING, format: "HH:MM" },
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
                const sorted = result.events.sort((a: GeneratedItem, b: GeneratedItem) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99"));
                setGeneratedItems(sorted);
                setSelectedItems(sorted);
            } else {
                throw new Error("L'AI non ha generato eventi validi. Prova a essere più specifico.");
            }
        } catch (e: any) {
            setError(e.message || "Si è verificato un errore.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleItem = (item: GeneratedItem) => {
        setSelectedItems(prev =>
            prev.some(i => i.title === item.title)
                ? prev.filter(i => i.title !== item.title)
                : [...prev, item]
        );
    };

    const handleAddSelected = () => {
        if (selectedItems.length === 0) {
            onClose();
            return;
        }

        const itemsToAdd: Omit<PlanItem, 'id'>[] = selectedItems.map(item => ({
            category: 'See & Do',
            title: `${item.startTime} - ${item.title}`,
            description: item.description,
            status: 'idea',
            link: item.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}` : undefined,
        }));

        addPlanItems(trip.id, stage.id, itemsToAdd);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant"><span className="material-symbols-outlined">close</span></button>
                <h1 className="text-xl font-bold ml-4">Genera Piano del Giorno</h1>
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-24">
                 <div className="max-w-2xl mx-auto">
                    <p className="text-sm text-on-surface-variant mb-4">Descrivi la giornata ideale, e l'AI creerà un piano per te a {stage.location.split(',')[0]}.</p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Es: una giornata rilassante con visita a un museo, pranzo tipico e passeggiata al tramonto..."
                        rows={3}
                        className="w-full bg-surface-variant rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                    />
                     <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="mt-4 w-full py-3 bg-primary text-on-primary font-bold rounded-full shadow-md disabled:opacity-50">
                        {isLoading ? "Generando..." : "Genera Piano"}
                    </button>
                     {error && <p className="text-error text-center mt-4 text-sm">{error}</p>}

                    {generatedItems.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-on-surface mb-4">Suggerimenti dell'AI</h3>
                            <div className="space-y-3">
                                {generatedItems.map((item, index) => {
                                    const isSelected = selectedItems.some(i => i.title === item.title);
                                    const category = data.categories.find(c => c.name === item.type);
                                    return (
                                        <div key={index} onClick={() => handleToggleItem(item)} className={`p-3 rounded-xl border-2 cursor-pointer ${isSelected ? 'border-primary bg-primary-container/30' : 'border-transparent bg-surface-variant'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 mt-0.5 ${isSelected ? 'bg-primary border-primary' : 'border-outline'}`}/>
                                                <div>
                                                    <p className="font-bold text-on-surface">{item.startTime} - {item.title}</p>
                                                    <p className="text-sm text-on-surface-variant">{item.description}</p>
                                                    {category && <span className="mt-2 text-xs font-semibold px-2 py-0.5 rounded-full inline-block" style={{backgroundColor: category.color, color: getContrastColor(category.color)}}>{item.type}</span>}
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

            {selectedItems.length > 0 && !isLoading && (
                <footer className="p-4 bg-surface/80 backdrop-blur-sm border-t border-surface-variant">
                    <button onClick={handleAddSelected} className="w-full max-w-2xl mx-auto bg-primary text-on-primary font-bold py-4 rounded-2xl">
                        Aggiungi {selectedItems.length} elementi al Piano
                    </button>
                </footer>
            )}
        </div>
    );
};

export default GenerateDayPlanModal;