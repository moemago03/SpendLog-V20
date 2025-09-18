import { Category, ChecklistTemplate } from './types';

export const CATEGORY_COLORS = [
    '#3B82F6', '#2563EB', '#06B6D4', '#8B5CF6', '#EF4444', '#EC4899', '#F59E0B', '#10B981'
];

export const CATEGORY_ICONS = [
    '💰', '🛒', '🛍️', '🍽️', '🚌', '✈️', '🎮', '🏠', '❤️', '💼', '↔️', '🧾', '☂️', '✉️', '📊', '✨', '📄', '🏀', '☕️', '💊', '🎁', '🎟️', '🏥', '⛽️'
];

export const TRIP_CARD_COLORS = [
    '#3B82F6', // Blue
    '#705574', // Mauve
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#EF4444', // Red
    '#06B6D4', // Cyan
];

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'cat-1', name: 'Cibo', icon: '🍔', color: '#FF9800' },
    { id: 'cat-2', name: 'Alloggio', icon: '🏠', color: '#795548' },
    { id: 'cat-3', name: 'Trasporti', icon: '🚆', color: '#2196F3' },
    { id: 'cat-4', name: 'Attività', icon: '🏞️', color: '#4CAF50' },
    { id: 'cat-5', name: 'Shopping', icon: '🛍️', color: '#E91E63' },
    { id: 'cat-6', name: 'Visti', icon: '🛂', color: '#607D8B' },
    { id: 'cat-7', name: 'Assicurazione', icon: '🛡️', color: '#00BCD4' },
    { id: 'cat-8', name: 'Varie', icon: '📦', color: '#9E9E9E' },
];

export const ADJUSTMENT_CATEGORY = 'Aggiustamento Saldo';

export const COUNTRIES_CURRENCIES: { [key: string]: string } = {
    'Thailandia': 'THB',
    'Vietnam': 'VND',
    'Cambogia': 'KHR',
    'Laos': 'LAK',
    'Malesia': 'MYR',
    'Singapore': 'SGD',
    'Indonesia': 'IDR',
    'Filippine': 'PHP',
    'Giappone': 'JPY',
    'Corea del Sud': 'KRW',
    'Cina': 'CNY',
    'Stati Uniti': 'USD',
    'Area Euro': 'EUR',
    'Regno Unito': 'GBP',
};

// New constant for flag colors
export const COUNTRY_FLAG_COLORS: { [key: string]: string } = {
    'Thailandia': '#00247D', // Blue
    'Vietnam': '#DA251D',    // Red
    'Cambogia': '#002B7F',   // Blue
    'Laos': '#002868',       // Blue
    'Malesia': '#0032A0',    // Blue
    'Singapore': '#ED2939',  // Red
    'Indonesia': '#CE1126',  // Red
    'Filippine': '#0038A8',  // Blue
    'Giappone': '#BC002D',   // Red circle color
    'Corea del Sud': '#0047A0', // Blue
    'Cina': '#EE1C25',       // Red
    'Stati Uniti': '#B22234', // Red
    'Area Euro': '#003399',  // EU Blue
    'Regno Unito': '#012169',// Blue
};


export const CURRENCY_TO_COUNTRY: { [key: string]: string } = Object.entries(
    COUNTRIES_CURRENCIES
).reduce((acc, [country, currency]) => {
    if (!acc[currency]) {
        acc[currency] = country;
    }
    return acc;
}, {} as { [key: string]: string });


export const ALL_CURRENCIES = ['EUR', 'USD', 'GBP', 'THB', 'VND', 'KHR', 'LAK', 'MYR', 'SGD', 'IDR', 'PHP', 'JPY', 'KRW', 'CNY'];

// Mock exchange rates relative to EUR
export const MOCK_EXCHANGE_RATES: { [key: string]: number } = {
    'EUR': 1,
    'USD': 1.08,
    'GBP': 0.85,
    'THB': 39.50,
    'VND': 27500,
    'KHR': 4400,
    'LAK': 23500,
    'MYR': 5.10,
    'SGD': 1.46,
    'IDR': 17500,
    'PHP': 63.50,
    'JPY': 168.0,
    'KRW': 1480,
    'CNY': 7.80,
};

// New constant for currency details including flag codes
export const CURRENCY_INFO: { [key: string]: { name: string; flag: string; } } = {
    'EUR': { name: 'Area Euro', flag: 'eu' },
    'USD': { name: 'Stati Uniti', flag: 'us' },
    'GBP': { name: 'Regno Unito', flag: 'gb' },
    'THB': { name: 'Thailandia', flag: 'th' },
    'VND': { name: 'Vietnam', flag: 'vn' },
    'KHR': { name: 'Cambogia', flag: 'kh' },
    'LAK': { name: 'Laos', flag: 'la' },
    'MYR': { name: 'Malesia', flag: 'my' },
    'SGD': { name: 'Singapore', flag: 'sg' },
    'IDR': { name: 'Indonesia', flag: 'id' },
    'PHP': { name: 'Filippine', flag: 'ph' },
    'JPY': { name: 'Giappone', flag: 'jp' },
    'KRW': { name: 'Corea del Sud', flag: 'kr' },
    'CNY': { name: 'Cina', flag: 'cn' },
};

// FIX: Add FLAG_SVGS constant to provide flag image URLs.
// This resolves missing import errors in other components.
export const FLAG_SVGS: { [key: string]: string } = {
    'EU': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/eu.svg`,
    'US': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/us.svg`,
    'GB': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/gb.svg`,
    'TH': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/th.svg`,
    'VN': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/vn.svg`,
    'KH': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/kh.svg`,
    'LA': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/la.svg`,
    'MY': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/my.svg`,
    'SG': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/sg.svg`,
    'ID': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/id.svg`,
    'PH': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/ph.svg`,
    'JP': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/jp.svg`,
    'KR': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/kr.svg`,
    'CN': `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/cn.svg`,
};

export const CHECKLIST_TEMPLATES: { [key: string]: ChecklistTemplate } = {
    "Documenti": {
        icon: "folder_shared",
        items: [
            { text: "Passaporto" },
            { text: "Visto (se necessario)" },
            { text: "Patente di guida / internazionale" },
            { text: "Biglietti aerei / treno" },
            { text: "Prenotazioni hotel / alloggi" },
            { text: "Assicurazione di viaggio" },
            { text: "Fotocopie documenti importanti" }
        ]
    },
    "Elettronica": {
        icon: "electrical_services",
        items: [
            { text: "Smartphone e caricatore" },
            { text: "Power bank" },
            { text: "Adattatore universale" },
            { text: "Cuffie" },
            { text: "Macchina fotografica e batterie" }
        ]
    },
    "Abbigliamento": {
        icon: "checkroom",
        items: [
             { text: "Intimo e calze" },
             { text: "Magliette / top" },
             { text: "Pantaloni / gonne" },
        ]
    }
};

// FIX: Add VIAGGIARE_SICURI_COUNTRY_SLUGS constant to provide country-specific URL slugs.
// This resolves missing import errors in other components.
export const VIAGGIARE_SICURI_COUNTRY_SLUGS: { [key: string]: string } = {
    'Thailandia': 'thailandia',
    'Vietnam': 'vietnam',
    'Cambogia': 'cambogia',
    'Laos': 'laos',
    'Malesia': 'malesia',
    'Singapore': 'singapore',
    'Indonesia': 'indonesia',
    'Filippine': 'filippine',
    'Giappone': 'giappone',
    'Corea del Sud': 'corea-del-sud',
    'Cina': 'cina',
    'Stati Uniti': 'stati-uniti',
    'Regno Unito': 'regno-unito',
};

// NEW: Static travel info data to display directly in the app
export const TRAVEL_INFO_DATA: { [key: string]: { visaInfo: string; healthInfo: string; safetyTips: string[] } } = {
    'Thailandia': {
        visaInfo: "Per soggiorni turistici fino a 30 giorni, non è necessario un visto per i cittadini italiani. È richiesto un passaporto con validità residua di almeno 6 mesi.",
        healthInfo: "Nessuna vaccinazione obbligatoria. Consigliate le vaccinazioni contro epatite A e B. Bere solo acqua in bottiglia.",
        safetyTips: ["Attenzione ai borseggiatori nelle zone turistiche.", "Rispetta la cultura locale e la famiglia reale.", "Usa solo taxi con tassametro."]
    },
    'Vietnam': {
        visaInfo: "È necessario un visto d'ingresso (e-visa) da richiedere online prima della partenza per soggiorni fino a 30 giorni.",
        healthInfo: "Consigliata la vaccinazione contro il tifo e l'epatite A. La profilassi antimalarica è raccomandata per le aree rurali.",
        safetyTips: ["Fai attenzione al traffico caotico, specialmente nelle grandi città.", "Contratta i prezzi prima di acquistare beni o servizi.", "Evita di bere acqua dal rubinetto."]
    },
    'Cambogia': {
        visaInfo: "Il visto turistico può essere ottenuto all'arrivo in aeroporto o online (e-visa) ed è valido per 30 giorni.",
        healthInfo: "Vaccinazioni consigliate: epatite A, tifo. Rischio di dengue presente in tutto il paese.",
        safetyTips: ["Non avventurarti in zone rurali non segnalate a causa del rischio di mine inesplose.", "Vesti in modo rispettoso quando visiti i templi.", "Fai attenzione alle truffe nei principali siti turistici."]
    },
    'Giappone': {
        visaInfo: "I cittadini italiani non necessitano di visto per soggiorni turistici fino a 90 giorni.",
        healthInfo: "Il sistema sanitario è eccellente. Non sono richieste vaccinazioni specifiche. È consigliabile stipulare un'assicurazione sanitaria.",
        safetyTips: ["Il Giappone è un paese estremamente sicuro, ma è sempre bene usare il buon senso.", "Porta con te contanti, non tutti i negozi accettano carte.", "Impara alcune frasi base in giapponese per cortesia."]
    },
    'Stati Uniti': {
        visaInfo: "Necessario l'ESTA (Electronic System for Travel Authorization) da richiedere online prima della partenza, valido per 90 giorni.",
        healthInfo: "I costi sanitari sono molto elevati, è indispensabile un'assicurazione di viaggio con massimali adeguati.",
        safetyTips: ["Tieni sempre con te un documento d'identità.", "Le mance (tips) sono praticamente obbligatorie (15-20%).", "Sii consapevole delle leggi locali che possono variare da stato a stato."]
    },
     'Area Euro': {
        visaInfo: "Nessun visto richiesto per i cittadini dell'Unione Europea.",
        healthInfo: "Porta con te la Tessera Europea di Assicurazione Malattia (TEAM).",
        safetyTips: ["Le normative e la sicurezza variano da paese a paese, ma generalmente sono elevate.", "Attenzione ai borseggiatori nelle principali capitali turistiche."]
    },
    'Regno Unito': {
        visaInfo: "Non è richiesto il visto per soggiorni turistici fino a 6 mesi. È necessario il passaporto.",
        healthInfo: "Il sistema sanitario (NHS) è pubblico. È consigliata un'assicurazione di viaggio integrativa.",
        safetyTips: ["Guida a sinistra!", "Le prese elettriche sono di tipo G, porta un adattatore.", "Sii preparato a tempo variabile."]
    },
};