import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Trip, ChecklistItem } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";

interface AIResponseItem {
    text: string;
    category: string;
}

interface AIChecklistGeneratorProps {
    trip: Trip;
    onClose: () => void;
    // FIX: Add checklistView to determine if items are for personal or group list
    checklistView: 'personal' | 'group';
}

const AIChecklistGenerator: React.FC<AIChecklistGeneratorProps> = ({ trip, onClose, checklistView }) => {
    const { addChecklistFromTemplate } = useData();
    const { addNotification } = useNotification();

    const [isLoading, setIsLoading] = useState(false);
    const [generatedItems, setGeneratedItems] = useState<AIResponseItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<AIResponseItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const prompt = useMemo(() => {
        const duration = Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 3600 * 24));
        return `Crea una checklist di viaggio essenziale per un viaggio di ${duration} giorni in ${trip.countries.join(', ')}. Includi documenti, elettronica e abbigliamento di base.`;
    }, [trip]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedItems([]);
        setSelectedItems([]);

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            checklist: {
                                type: Type.ARRAY,
                                description: "Lista di elementi della checklist.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        text: { type: Type.STRING, description: "Il testo dell'elemento della checklist." },
                                        category: { type: Type.STRING, description: "Categoria come 'Documenti', 'Elettronica', 'Abbigliamento'." }
                                    },
                                    required: ["text", "category"]
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

            if (result.checklist && result.checklist.length > 0) {
                setGeneratedItems(result.checklist);
                setSelectedItems(result.checklist);
            } else {
                throw new Error("L'AI non ha generato una checklist valida.");
            }
        } catch (e: any) {
            console.error("Error generating checklist:", e);
            setError(e.message || "Si è verificato un errore. Riprova.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleItem = (item: AIResponseItem) => {
        setSelectedItems(prev =>
            prev.some(i => i.text === item.text)
                ? prev.filter(i => i.text !== item.text)
                : [...prev, item]
        );
    };

    const handleAddSelected = () => {
        const itemsToAdd = selectedItems.map(item => ({ text: item.text }));
        if (itemsToAdd.length > 0) {
            // FIX: Pass the isGroupItem boolean as the third argument
            addChecklistFromTemplate(trip.id, itemsToAdd, checklistView === 'group');
        }
        onClose();
    };

    const groupedItems = useMemo(() => {
        return generatedItems.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {} as Record<string, AIResponseItem[]>);
    }, [generatedItems]);

    return (
        <div className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-xl font-bold ml-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                    Generatore Checklist AI
                </h1>
            </header>
            <main className="flex-1 overflow-y-auto px-6 pb-24">
                 <div className="max-w-2xl mx-auto">
                    {generatedItems.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-on-surface-variant mb-4">{prompt}</p>
                            <button onClick={handleGenerate} disabled={isLoading} className="px-6 py-3 bg-primary text-on-primary font-bold rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto">
                                {isLoading ? "Generando..." : "Genera Suggerimenti"}
                            </button>
                            {error && <p className="text-error text-center mt-4 text-sm">{error}</p>}
                        </div>
                    ) : (
                         <div className="space-y-6">
                            {Object.entries(groupedItems).map(([category, items]) => (
                                <div key={category}>
                                    <h3 className="font-semibold text-on-surface mb-2">{category}</h3>
                                    <div className="space-y-2">
                                        {(items as AIResponseItem[]).map((item, index) => {
                                            const isSelected = selectedItems.some(i => i.text === item.text);
                                            return (
                                                <div key={index} onClick={() => handleToggleItem(item)} className={`p-3 rounded-xl border-2 cursor-pointer flex items-start gap-3 transition-colors ${isSelected ? 'border-primary bg-primary-container/30' : 'border-transparent bg-surface-variant'}`}>
                                                    <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-outline'}`}>
                                                        {isSelected && <span className="material-symbols-outlined text-xs text-on-primary">check</span>}
                                                    </div>
                                                    <p className="text-sm font-medium text-on-surface">{item.text}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
             {selectedItems.length > 0 && !isLoading && (
                <footer className="p-4 bg-surface/80 backdrop-blur-sm border-t border-surface-variant mt-auto">
                    <button onClick={handleAddSelected} className="w-full max-w-2xl mx-auto bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                        Aggiungi {selectedItems.length} Elementi
                    </button>
                </footer>
            )}
        </div>
    );
};

export default AIChecklistGenerator;