// constants.ts
import { Category, ChecklistTemplate } from "./types";

export const ADJUSTMENT_CATEGORY = "Rettifica Saldo";

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'cat-1', name: 'Cibo', icon: '🍔', color: '#FF6347', isItineraryCategory: true },
    { id: 'cat-2', name: 'Trasporti', icon: '🚆', color: '#4682B4', isItineraryCategory: true },
    { id: 'cat-3', name: 'Alloggio', icon: '🏠', color: '#32CD32', isItineraryCategory: true },
    { id: 'cat-4', name: 'Attività', icon: '🎉', color: '#FFD700', isItineraryCategory: true },
    { id: 'cat-5', name: 'Shopping', icon: '🛍️', color: '#9370DB', isItineraryCategory: false },
    { id: 'cat-6', name: 'Voli', icon: '✈️', color: '#1E90FF', isItineraryCategory: true },
    { id: 'cat-7', name: 'Salute', icon: '💊', color: '#FF4500', isItineraryCategory: false },
    { id: 'cat-8', name: 'Varie', icon: '💸', color: '#808080', isItineraryCategory: false },
    { id: 'cat-9', name: 'Visti', icon: '🛂', color: '#008080', isItineraryCategory: false },
    { id: 'cat-10', name: ADJUSTMENT_CATEGORY, icon: '⚖️', color: '#2F4F4F', isItineraryCategory: false },
];

export const TRIP_CARD_COLORS = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', 
    '#F59E0B', '#EF4444', '#6366F1', '#D946EF'
];

export const COUNTRIES_CURRENCIES: { [key: string]: string } = {
    'Thailandia': 'THB',
    'Vietnam': 'VND',
    'Cambogia': 'USD', // KHR is local but USD is widely used
    'Italia': 'EUR',
    'Stati Uniti': 'USD',
    'Regno Unito': 'GBP',
    'Giappone': 'JPY',
    'Australia': 'AUD',
};

export const ALL_CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'THB', 'VND'];

export const CURRENCY_TO_COUNTRY: { [key: string]: string } = {
    'EUR': 'Area Euro',
    'USD': 'Stati Uniti',
    'GBP': 'Regno Unito',
    'JPY': 'Giappone',
    'AUD': 'Australia',
    'THB': 'Thailandia',
    'VND': 'Vietnam',
};

export const MOCK_EXCHANGE_RATES: { [key: string]: number } = {
    'EUR': 1,
    'USD': 1.08,
    'GBP': 0.85,
    'JPY': 169.5,
    'AUD': 1.63,
    'CAD': 1.48,
    'CHF': 0.97,
    'CNY': 7.8,
    'THB': 39.8,
    'VND': 27500,
};

export const CATEGORY_ICONS = [
    '🍔', '🚆', '🏠', '🎉', '🛍️', '✈️', '💊', '💸', '🛂', '⚖️',
    '🎟️', '🏛️', '🏞️', '🍽️', '☕', '🍺', '🎁', '📸', '🗺️', '⛽',
    '🅿️', '🏨', '🏪', '💊', '🚑', '⚓', '🚢', ' ferry', '🚤'
];

export const CATEGORY_COLORS = [
    '#FF6347', '#4682B4', '#32CD32', '#FFD700', '#9370DB', '#1E90FF', 
    '#FF4500', '#808080', '#008080', '#2F4F4F', '#FFB6C1', '#20B2AA'
];

export const CURRENCY_INFO: { [key: string]: { name: string, flag: string } } = {
    'EUR': { name: 'Euro', flag: 'eu' },
    'USD': { name: 'US Dollar', flag: 'us' },
    'GBP': { name: 'British Pound', flag: 'gb' },
    'JPY': { name: 'Japanese Yen', flag: 'jp' },
    'AUD': { name: 'Australian Dollar', flag: 'au' },
    'CAD': { name: 'Canadian Dollar', flag: 'ca' },
    'CHF': { name: 'Swiss Franc', flag: 'ch' },
    'CNY': { name: 'Chinese Yuan', flag: 'cn' },
    'THB': { name: 'Thai Baht', flag: 'th' },
    'VND': { name: 'Vietnamese Dong', flag: 'vn' },
};

export const FLAG_SVGS: { [key: string]: string } = {
    'EU': 'https://flagcdn.com/eu.svg',
    'US': 'https://flagcdn.com/us.svg',
    'GB': 'https://flagcdn.com/gb.svg',
    'JP': 'https://flagcdn.com/jp.svg',
    'AU': 'https://flagcdn.com/au.svg',
    'CA': 'https://flagcdn.com/ca.svg',
    'CH': 'https://flagcdn.com/ch.svg',
    'CN': 'https://flagcdn.com/cn.svg',
    'TH': 'https://flagcdn.com/th.svg',
    'VN': 'https://flagcdn.com/vn.svg',
};

export const CHECKLIST_TEMPLATES: { [key: string]: ChecklistTemplate } = {
    'Essenziali': { icon: 'luggage', items: [{ text: 'Passaporto' }, { text: 'Visto (se necessario)' }, { text: 'Biglietti aerei' }, { text: 'Conferma hotel' }] },
    'Elettronica': { icon: 'devices', items: [{ text: 'Caricabatterie telefono' }, { text: 'Power bank' }, { text: 'Adattatore universale' }] },
    'Salute': { icon: 'health_and_safety', items: [{ text: 'Kit pronto soccorso' }, { text: 'Repellente per insetti' }, { text: 'Crema solare' }] },
    'Mare': { icon: 'beach_access', items: [{ text: 'Costume da bagno' }, { text: 'Telo mare' }, { text: 'Occhiali da sole' }] },
};

export const VIAGGIARE_SICURI_COUNTRY_SLUGS: { [key: string]: string } = {
    'Thailandia': 'thailandia',
    'Vietnam': 'vietnam',
    'Cambogia': 'cambogia',
};

export const TRAVEL_INFO_DATA: { [key: string]: { visaInfo: string, healthInfo: string, safetyTips: string[] } } = {
    'Thailandia': {
        visaInfo: "Esente da visto per soggiorni turistici fino a 30 giorni se si arriva in aereo.",
        healthInfo: "Nessuna vaccinazione obbligatoria. Consigliate Epatite A e B, Tifo.",
        safetyTips: ["Fai attenzione ai borseggiatori nelle aree affollate.", "Non accettare bevande da sconosciuti.", "Usa taxi con tassametro o app come Grab."]
    },
    'Vietnam': {
        visaInfo: "Esente da visto per soggiorni fino a 15 giorni. Per soggiorni più lunghi è necessario un e-visa.",
        healthInfo: "Nessuna vaccinazione obbligatoria. Rischio di dengue presente.",
        safetyTips: ["Attenzione alle truffe con i taxi, accordati sul prezzo prima di partire.", "Guarda bene prima di attraversare la strada, il traffico è caotico."]
    },
    'Cambogia': {
        visaInfo: "Visto necessario, ottenibile all'arrivo (Visa on Arrival) o online (e-visa).",
        healthInfo: "Consigliata profilassi antimalarica per alcune aree rurali.",
        safetyTips: ["Evita di camminare da solo di notte nelle aree poco illuminate.", "Contratta sempre i prezzi con i tuk-tuk."]
    }
};
