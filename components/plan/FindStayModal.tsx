import React, { useState, useMemo } from 'react';
import { Stage } from '../../types';
import InAppBrowser from '../common/InAppBrowser';
import { useAccommodationFilters } from '../../hooks/useAccommodationFilters';

interface FindStayModalProps {
    stage: Stage;
    onClose: () => void;
}

const FindStayModal: React.FC<FindStayModalProps> = ({ stage, onClose }) => {
    const [viewingUrl, setViewingUrl] = useState<string | null>(null);
    const { filters } = useAccommodationFilters();

    const dateToUrlFormat = (date: Date) => {
        return date.toISOString().split('T')[0];
    };
    
    const locationParts = stage.location.split(',').map(s => s.trim());
    const city = locationParts[0];
    const country = locationParts.length > 1 ? locationParts[1] : '';

    const checkinDate = new Date(stage.startDate + 'T12:00:00Z');
    const checkoutDate = new Date(checkinDate.getTime() + stage.nights * 24 * 60 * 60 * 1000);

    const checkin = dateToUrlFormat(checkinDate);
    const checkout = dateToUrlFormat(checkoutDate);
    const adults = 2; // Default to 2 adults

    const bookingUrl = useMemo(() => {
        const baseUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&no_rooms=1&order=price`;
        
        const nfltParams: string[] = [];
        if (filters.reviewScore) {
            nfltParams.push(`review_score=${filters.reviewScore}`);
        }
        if (filters.distance) {
            nfltParams.push(`distance=${filters.distance}`);
        }
        if (filters.entirePlace) {
            nfltParams.push('privacy_type=3');
        }
        filters.propertyTypes.forEach(typeId => {
            nfltParams.push(`ht_id=${typeId}`);
        });

        if (nfltParams.length > 0) {
            // FIX: URL-encode the filter string to ensure it's correctly interpreted by Booking.com.
            return `${baseUrl}&nflt=${encodeURIComponent(nfltParams.join(';'))}`;
        }
        return baseUrl;
    }, [city, checkin, checkout, adults, filters]);

    const SiteIcon: React.FC<{ initial: string, color: string }> = ({ initial, color }) => (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-lg ${color}`}>
            {initial}
        </div>
    );

    const siteList = [
        { name: 'Booking.com', initial: 'B', color: 'bg-blue-600', url: bookingUrl },
        { name: 'Agoda', initial: 'A', color: 'bg-indigo-600', url: `https://www.agoda.com/search?text=${encodeURIComponent(city)}&checkIn=${checkin}&checkout=${checkout}&adults=${adults}&rooms=1` },
        { name: 'Trip.com', initial: 'T', color: 'bg-sky-500', url: `https://www.trip.com/hotels/list?cityname=${encodeURIComponent(city)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}` },
        { name: 'Hostelworld', initial: 'H', color: 'bg-orange-500', url: `https://www.hostelworld.com/search?search_keywords=${encodeURIComponent(stage.location)}&city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&date_from=${checkin}&date_to=${checkout}&number_of_guests=${adults}` },
    ];
    
    const formattedDateRange = `${checkinDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${checkoutDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;

    if (viewingUrl) {
        return <InAppBrowser url={viewingUrl} onClose={() => setViewingUrl(null)} />;
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={onClose}>
            <div 
                className="w-full bg-surface rounded-t-3xl p-4 animate-slide-in-up" 
                onClick={e => e.stopPropagation()}
                style={{ animationDuration: '300ms' }}
            >
                <div className="w-10 h-1.5 bg-outline/30 rounded-full mx-auto mb-4"></div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-on-surface">Cerca alloggio a {city}</h2>
                    <button onClick={onClose} className="p-2 -m-2 rounded-full"><span className="material-symbols-outlined">close</span></button>
                </div>

                <ul className="space-y-2">
                    {siteList.map(site => (
                        <li key={site.name}>
                            <button onClick={() => setViewingUrl(site.url)} className="w-full flex items-center gap-4 p-3 hover:bg-surface-variant rounded-2xl text-left">
                                <SiteIcon initial={site.initial} color={site.color} />
                                <div className="flex-grow">
                                    <p className="font-semibold text-on-surface">Trova hotel su {site.name}</p>
                                    <p className="text-sm text-on-surface-variant">{city}, {formattedDateRange}</p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default FindStayModal;