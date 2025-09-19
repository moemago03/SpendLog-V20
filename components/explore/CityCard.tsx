import React from 'react';
import { ManifestCity } from '../../types';

interface CityCardProps {
    city: ManifestCity;
    onClick: () => void;
}

const CityCard: React.FC<CityCardProps> = ({ city, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="relative w-full h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg group"
            role="button"
            aria-label={`Scopri di più su ${city.name}`}
        >
            <img 
                src={city.image} 
                alt={city.name} 
                className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-5">
                <h2 className="text-white text-2xl font-bold">{city.name}</h2>
                <p className="text-white/80 text-sm font-medium">{city.country}</p>
            </div>
            <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out">
                <span className="material-symbols-outlined">arrow_forward</span>
            </div>
        </div>
    );
};

export default CityCard;
