// types.ts

// FIX: Moved AppView type here to avoid circular dependencies
export type AppView = 'summary' | 'stats' | 'group' | 'itinerary' | 'profile' | 'plan';

export interface UserData {
    name: string;
    email: string;
    dataviaggio: string;
    trips: Trip[];
    categories: Category[];
    defaultTripId?: string;
}

export interface Document {
    id: string;
    name: string;
    type: string; // Mime type like 'image/jpeg', 'application/pdf'
    data: string; // base64 data URL
    eventId?: string; // Link to an itinerary event
    tripId: string;
}

export interface PlanItem {
    id: string;
    category: 'Sleep' | 'See & Do' | 'Eat & Drink' | 'Articles & Guides' | 'Notes';
    title: string;
    description?: string;
    link?: string;
    imageUrl?: string;
    status: 'planned' | 'booked' | 'idea';
}

export interface Stage {
    id: string;
    location: string; // "City, Country"
    startDate: string; // YYYY-MM-DD
    nights: number;
    events?: Event[];
    planItems?: PlanItem[];
    notes?: string;
}

export interface Trip {
    id: string;
    name: string;
    stages: Stage[];
    totalBudget: number;
    mainCurrency: string;
    preferredCurrencies: string[];
    color: string;
    expenses: Expense[];
    checklist?: ChecklistItem[];
    members?: TripMember[];
    frequentExpenses?: FrequentExpense[];
    enableCategoryBudgets?: boolean;
    categoryBudgets?: CategoryBudget[];
    documents?: Document[];
    // FIX: Add missing properties to the Trip interface to align with usage across the app.
    startDate: string;
    endDate: string;
    countries: string[];
    events?: Event[];
}

export interface Expense {
    id: string;
    amount: number;
    currency: string;
    category: string;
    description?: string;
    date: string;
    country?: string;
    paymentMethod?: string;
    location?: string;
    // FIX: Add eventId to link an expense to an itinerary event.
    // This resolves a type error in ExpenseForm.tsx.
    eventId?: string;
    // For group expenses
    paidById?: string;
    splitType?: 'equally' | 'unequally' | 'by_shares';
    splitBetweenMemberIds?: string[];
    createdAt?: number; // timestamp
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    isItineraryCategory?: boolean;
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    expenseId?: string;
    isGroupItem?: boolean;
    assignedToMemberId?: string;
    reminderEventId?: string;
}

export interface TripMember {
    id: string;
    name: string;
}

export interface CategoryBudget {
    categoryName: string;
    amount: number;
}

export interface FrequentExpense {
    id: string;
    name: string;
    icon: string;
    amount: number;
    category: string;
    paidById: string;
    splitBetweenMemberIds: string[];
}

export interface ChecklistTemplate {
    icon: string;
    items: { text: string }[];
}

// Types for Explore/Guides feature
export interface Manifest {
    cities: ManifestCity[];
    countryFileMap: { [countryCode: string]: string };
}

export interface ManifestCity {
    id: string;
    name: string;
    country: string;
    image: string;
}

export interface CityGuide {
    cityName: string;
    countryCode: string;
    image: string;
    generalInfo: {
        bestTimeToVisit: string;
        quickDescription: string;
    };
    arrivalInfo: {
        description: string;
        options: {
            method: string;
            details: string;
            cost: string;
            time: string;
        }[];
    };
    gettingAround: {
        method: string;
        details: string;
    }[];
    mainAttractions: {
        name: string;
        type: string;
        description: string;
        estimatedCost: string;
        location?: string;
    }[];

    foodExperience: {
        name: string;
        description: string;
        priceRange: string;
    }[];
    dayTrips: {
        name: string;
        description: string;
        travelTime: string;
    }[];
    suggestedItineraries: {
        title: string;
        days: {
            day: number;
            theme: string;
            activities: string[];
        }[];
    }[];
    estimatedBudget: {
        description: string;
        backpacker: string;
        midRange: string;
    };
    travelerTips: {
        families: string;
        couples: string;
    }
}

export interface CountryGuide {
    countryName: string;
    entryRequirements: {
        visaInfo: string;
        passportValidity: string;
    };
    healthAndVaccinations: {
        disclaimer: string;
        recommendedVaccines: {
            vaccine: string;
            details: string;
        }[];
    };
    lawsAndCustoms: {
        points: {
            topic: string;
            details: string;
        }[];
    };
    safetyAndSecurity: {
        emergencyNumbers: {
            police: string;
            touristPolice: string;
        };
        commonScams: string;
        generalSafety: string;
    };
}

export interface Event {
    eventId: string;
    // FIX: Add tripId to event to resolve type errors
    tripId: string;
    eventDate: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD for multi-day events
    title: string;
    type: string; // Corresponds to a Category name
    startTime?: string; // HH:MM
    endTime?: string; // HH:MM
    description?: string;
    status: 'planned' | 'completed' | 'cancelled';
    location?: string;
    estimatedCost?: {
        amount: number;
        currency: string;
    };
    participantIds?: string[];
}