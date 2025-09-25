import React from 'react';
import { Stage } from '../../types';

interface FindStayModalProps {
    stage: Stage;
    onClose: () => void;
}

const FindStayModal: React.FC<FindStayModalProps> = ({ stage, onClose }) => {
    // Helper function to format dates correctly for URLs, ensuring UTC time.
    const dateToUrlFormat = (date: Date) => {
        return date.toISOString().split('T')[0];
    };
    
    // Parse city and country from stage location for more accurate links.
    const locationParts = stage.location.split(',').map(s => s.trim());
    const city = locationParts[0];
    const country = locationParts.length > 1 ? locationParts[1] : '';

    // Explicitly parse the start date as UTC to avoid timezone issues.
    const checkinDate = new Date(stage.startDate + 'T12:00:00Z');

    // Calculate checkout date by adding milliseconds for the number of nights.
    const checkoutDate = new Date(checkinDate.getTime() + stage.nights * 24 * 60 * 60 * 1000);

    const checkin = dateToUrlFormat(checkinDate);
    const checkout = dateToUrlFormat(checkoutDate);
    const adults = 4; // As per screenshot

    const SiteIcon: React.FC<{ initial: string, color: string }> = ({ initial, color }) => (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-lg ${color}`}>
            {initial}
        </div>
    );

    // Updated list with corrected URL structures
    const siteList = [
        { name: 'Booking.com', initial: 'B', color: 'bg-blue-600', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&no_rooms=1` },
        { name: 'Expedia', initial: 'E', color: 'bg-gray-800', url: `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(city)}&startDate=${checkin}&endDate=${checkout}&adults=${adults}&rooms=1` },
        { name: 'Agoda', initial: 'A', color: 'bg-indigo-600', url: `https://www.agoda.com/search?text=${encodeURIComponent(city)}&checkIn=${checkin}&checkout=${checkout}&adults=${adults}&rooms=1` },
        { name: 'Hotels.com', initial: 'H', color: 'bg-red-600', url: `https://it.hotels.com/Hotel-Search?destination.name=${encodeURIComponent(city)}&startDate=${checkin}&endDate=${checkout}&adults=${adults}` },
        { name: 'Vio.com', initial: 'V', color: 'bg-purple-500', url: `https://www.google.com/search?q=Vio.com+hotels+in+${encodeURIComponent(city)}` },
        { name: 'Trip.com', initial: 'T', color: 'bg-sky-500', url: `https://www.trip.com/hotels/list?cityname=${encodeURIComponent(city)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}` },
        { name: 'Hostelworld', initial: 'H', color: 'bg-orange-500', url: `https://www.hostelworld.com/search?search_keywords=${encodeURIComponent(stage.location)}&city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&date_from=${checkin}&date_to=${checkout}&number_of_guests=${adults}` },
    ];
    
    const formattedDateRange = `${checkinDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${checkoutDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={onClose}>
            <div 
                className="w-full bg-surface rounded-t-3xl p-4 animate-slide-in-up" 
                onClick={e => e.stopPropagation()}
                style={{ animationDuration: '300ms' }}
            >
                <div className="w-10 h-1.5 bg-outline/30 rounded-full mx-auto mb-4"></div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-on-surface">Find place to sleep in {city}</h2>
                    <button onClick={onClose} className="p-2 -m-2 rounded-full"><span className="material-symbols-outlined">close</span></button>
                </div>

                <ul className="space-y-2">
                    {siteList.map(site => (
                        <li key={site.name}>
                            <a href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 hover:bg-surface-variant rounded-2xl">
                                <SiteIcon initial={site.initial} color={site.color} />
                                <div className="flex-grow">
                                    <p className="font-semibold text-on-surface">Find hotels on {site.name}</p>
                                    <p className="text-sm text-on-surface-variant">{city}, {formattedDateRange}</p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default FindStayModal;