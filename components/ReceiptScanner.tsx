import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trip, Expense } from '../types';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { GoogleGenAI, Type } from "@google/genai";

interface ReceiptScannerProps {
    onClose: () => void;
    onScanComplete: (expense: Partial<Expense>) => void;
    trip: Trip;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onClose, onScanComplete, trip }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { data } = useData();
    const { addNotification } = useNotification();

    useEffect(() => {
        let stream: MediaStream | null = null;
        
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                addNotification("Impossibile accedere alla fotocamera. Controlla i permessi.", 'error');
                onClose();
            }
        };

        startCamera();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [addNotification, onClose]);

    const handleCapture = async () => {
        // RIABILITARE API GEMINI: Rimuovere le prossime 4 righe per riattivare la funzionalità.
        addNotification("Scansione AI disabilitata in ambiente di sviluppo.", 'info');
        setIsLoading(false);
        onClose();
        return;

        if (!videoRef.current || !canvasRef.current) return;
        setIsLoading(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            setIsLoading(false);
            return;
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = imageDataUrl.split(',')[1];

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = {
                inlineData: { mimeType: 'image/jpeg', data: base64Data },
            };
            const availableCategories = data.categories.map(c => c.name);
            const textPart = {
                text: `Estrai l'importo totale, la valuta e una categoria adatta da questa ricevuta. La valuta deve essere una di queste: ${trip.preferredCurrencies.join(', ')}. La categoria deve essere una di queste: ${availableCategories.join(', ')}. Estrai anche una breve descrizione se possibile.`
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            amount: { type: Type.NUMBER },
                            currency: { type: Type.STRING },
                            category: { type: Type.STRING },
                            description: { type: Type.STRING },
                        }
                    }
                }
            });

            let jsonString = response.text.trim();
             if (jsonString.startsWith("```json")) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            }
            const result = JSON.parse(jsonString);

            if (result.amount && result.category && result.currency) {
                onScanComplete({
                    amount: result.amount,
                    currency: trip.preferredCurrencies.includes(result.currency.toUpperCase()) ? result.currency.toUpperCase() : trip.mainCurrency,
                    category: availableCategories.includes(result.category) ? result.category : 'Varie',
                    description: result.description || 'Spesa da ricevuta',
                    date: new Date().toISOString()
                });
            } else {
                throw new Error("Dati non estratti correttamente.");
            }
        } catch (e: any) {
            addNotification(`Scansione fallita: ${e.message || 'Riprova'}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

            <div className="absolute inset-0 bg-black/20 flex flex-col justify-between p-6">
                <div className="flex justify-end">
                    <button onClick={onClose} className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors" aria-label="Chiudi scanner">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <button
                        onClick={handleCapture}
                        disabled={isLoading}
                        className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl transition-transform active:scale-95 disabled:opacity-50"
                        aria-label="Scatta foto"
                    >
                        {isLoading ? (
                             <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                             <div className="w-16 h-16 rounded-full bg-white border-4 border-black/30"></div>
                        )}
                       
                    </button>
                    <p className="text-white text-center mt-4 font-medium">Inquadra la ricevuta e scatta</p>
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default ReceiptScanner;