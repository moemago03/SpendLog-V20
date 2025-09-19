import React from 'react';
import { ExploreCity } from '../../types';

interface CityCardProps {
    city: ExploreCity;
    onClick: () => void;
}

const CityCard: React.FC<CityCardProps> = ({ city, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="relative flex-shrink-0 w-64 h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg transform transition-transform duration-300 hover:scale-105 active:scale-95"
            role="button"
            aria-label={`Scopri di più su ${city.name}`}
        >
            <img 
                src={city.image} 
                alt={city.name} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-5">
                <h2 className="text-white text-3xl font-bold">{city.name}</h2>
            </div>
        </div>
    );
};

export default CityCard;