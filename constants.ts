import { Category, ChecklistTemplate, ExploreCity } from './types';

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

// NEW: Data for the Explore tab feature
export const EXPLORE_CITY_DATA: Record<string, ExploreCity> = {
    'Bangkok': {
        name: 'Bangkok',
        country: 'Thailandia',
        image: 'https://images.unsplash.com/photo-1563492065599-3520f775ee09?q=80&w=3174&auto=format&fit=crop',
        description: 'La vibrante capitale della Thailandia, un mix di tradizione e modernità.',
        attractions: [
            { name: 'Grande Palazzo Reale', type: 'Cultura', estimatedCost: '500 THB', description: 'Il complesso di edifici sacri più importante della Thailandia.', lat: 13.7500, lng: 100.4915 },
            { name: 'Wat Arun', type: 'Tempio', estimatedCost: '100 THB', description: 'Il Tempio dell\'Alba, magnifico al tramonto.', lat: 13.7441, lng: 100.4889 },
            { name: 'Mercato di Chatuchak', type: 'Shopping', estimatedCost: 'Vario', description: 'Uno dei mercati all\'aperto più grandi al mondo.', lat: 13.8013, lng: 100.5506 },
            { name: 'Khao San Road', type: 'Vita Notturna', estimatedCost: 'Vario', description: 'La celebre strada dei backpacker, piena di bar e ristoranti.', lat: 13.7588, lng: 100.4975 },
        ],
        activities: [
            'Fare un tour in barca sui canali (khlong).',
            'Provare lo street food locale in quartieri come Yaowarat (Chinatown).',
            'Rilassarsi con un massaggio thailandese tradizionale.',
        ],
        dailyCostEstimate: { low: '800-1200 THB', medium: '1500-2500 THB', high: '3000+ THB' }
    },
    'Tokyo': {
        name: 'Tokyo',
        country: 'Giappone',
        image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=3272&auto=format&fit=crop',
        description: 'La metropoli futuristica dove la cultura pop incontra antiche tradizioni.',
        attractions: [
            { name: 'Incrocio di Shibuya', type: 'Attrazione', estimatedCost: 'Gratuito', description: 'L\'attraversamento pedonale più trafficato del mondo, un\'esperienza iconica.', lat: 35.6595, lng: 139.7005 },
            { name: 'Tempio Senso-ji', type: 'Tempio', estimatedCost: 'Gratuito', description: 'Il tempio più antico di Tokyo, situato nel quartiere di Asakusa.', lat: 35.7148, lng: 139.7967 },
            { name: 'Tokyo Skytree', type: 'Panorama', estimatedCost: '2100-3100 JPY', description: 'Torre panoramica con una vista mozzafiato sulla città.', lat: 35.7101, lng: 139.8107 },
            { name: 'Mercato del pesce di Toyosu', type: 'Mercato', estimatedCost: 'Gratuito (accesso)', description: 'Succede al famoso Tsukiji, ottimo per sushi fresco.', lat: 35.6450, lng: 139.7825 },
        ],
        activities: [
            'Esplorare i quartieri a tema come Akihabara (elettronica) e Harajuku (moda).',
            'Visitare il Ghibli Museum (prenotazione obbligatoria).',
            'Passeggiare nei giardini del Palazzo Imperiale.',
        ],
        dailyCostEstimate: { low: '7,000-10,000 JPY', medium: '12,000-18,000 JPY', high: '25,000+ JPY' }
    },
    'Roma': {
        name: 'Roma',
        country: 'Area Euro',
        image: 'https://images.unsplash.com/photo-1529260830199-42c24129f196?q=80&w=3270&auto=format&fit=crop',
        description: 'La Città Eterna, un museo a cielo aperto di storia, arte e cultura.',
        attractions: [
            { name: 'Colosseo', type: 'Storia', estimatedCost: '18 EUR', description: 'L\'iconico anfiteatro romano, simbolo della città.', lat: 41.8902, lng: 12.4922 },
            { name: 'Città del Vaticano', type: 'Cultura', estimatedCost: 'Vario', description: 'Visita la Basilica di San Pietro e i Musei Vaticani.', lat: 41.9022, lng: 12.4539 },
            { name: 'Fontana di Trevi', type: 'Attrazione', estimatedCost: 'Gratuito', description: 'Lancia una moneta per assicurarti il ritorno a Roma.', lat: 41.9009, lng: 12.4833 },
            { name: 'Pantheon', type: 'Storia', estimatedCost: '5 EUR', description: 'Un capolavoro di architettura romana antica.', lat: 41.8986, lng: 12.4769 },
        ],
        activities: [
            'Passeggiare per i vicoli di Trastevere.',
            'Gustare la cucina romana: carbonara, cacio e pepe, supplì.',
            'Visitare Villa Borghese e la sua galleria d\'arte.',
        ],
        dailyCostEstimate: { low: '50-70 EUR', medium: '80-150 EUR', high: '200+ EUR' }
    },
};