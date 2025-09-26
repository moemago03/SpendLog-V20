import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps {
    src?: string;
    alt: string;
    className?: string;
    fallbackIcon: string;
    iconClassName?: string;
    containerClassName?: string;
}

// Abilita la modalità di debug per mostrare informazioni sull'immagine
const DEBUG_MODE = false; 

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, className, fallbackIcon, iconClassName, containerClassName }) => {
    const [hasError, setHasError] = useState(false);

    // Resetta lo stato di errore quando l'URL dell'immagine cambia
    useEffect(() => {
        setHasError(false);
    }, [src]);

    const handleError = () => {
        setHasError(true);
    };

    const renderDebugInfo = () => {
        if (!DEBUG_MODE) return null;
        return (
            <div 
                className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-white text-[8px] font-mono pointer-events-none"
                style={{ lineHeight: '1.2' }}
            >
                <p className="truncate">URL: {src || 'N/A'}</p>
                <p style={{ color: hasError || !src ? '#FF8A80' : '#89B4FA' }}>
                    Status: {hasError || !src ? 'Error / Fallback' : 'OK'}
                </p>
            </div>
        );
    };

    if (hasError || !src) {
        return (
            <div className={`relative flex items-center justify-center bg-surface-variant ${containerClassName}`}>
                <span className={`material-symbols-outlined ${iconClassName}`}>{fallbackIcon}</span>
                {renderDebugInfo()}
            </div>
        );
    }

    return (
        <div className={`relative ${containerClassName || ''}`}>
            <img src={src} alt={alt} className={className} onError={handleError} />
            {renderDebugInfo()}
        </div>
    );
};

export default ImageWithFallback;