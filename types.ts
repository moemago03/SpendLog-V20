// FIX: Removed circular self-import and added ChecklistItem interface definition.
export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface CategoryBudget {
  categoryName: string;
  amount: number;
}

export interface FrequentExpense {
  id: string;
  name: string;
  icon: string;
  category: string;
  amount: number;
}

// NEW: For group travel
export interface TripMember {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  createdAt?: number; // Timestamp of creation for precise sorting
  amount: number;
  currency: string;
  category: string;
  date: string; // ISO string
  country?: string;
  description?: string; // Field for notes/description

  // NEW: Fields for shared expenses
  paidById?: string; // ID of the TripMember who paid. Optional for backward compatibility.
  splitType?: 'equally';
  splitBetweenMemberIds?: string[];
}

export interface Trip {
  id: string;
  name: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  totalBudget: number;
  countries: string[];
  preferredCurrencies: string[];
  mainCurrency: string;
  expenses: Expense[];
  frequentExpenses?: FrequentExpense[];
  enableCategoryBudgets?: boolean;
  categoryBudgets?: CategoryBudget[];
  checklist?: ChecklistItem[];
  color?: string;
  
  // NEW: Field for trip members
  members?: TripMember[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface UserData {
  name?: string;
  email?: string;
  dataviaggio?: string;
  trips: Trip[];
  categories: Category[];
  defaultTripId?: string;
}

export interface ChecklistTemplateItem {
    text: string;
}

export interface ChecklistTemplate {
    icon: string;
    items: ChecklistTemplateItem[];
}


// --- NEW TYPES FOR EXPLORE GUIDES ---

export interface ManifestCity {
  id: string;
  name: string;
  country: string;
  image: string;
}

export interface Manifest {
  cities: ManifestCity[];
  countryFileMap: { [key: string]: string };
}

export interface CityGuide {
  cityName: string;
  countryCode: string;
  countryName: string;
  image: string;
  generalInfo: {
    quickDescription: string;
    bestTimeToVisit: string;
  };
  arrivalInfo: {
    airport: string;
    options: { method: string; details: string; cost: string; time: string }[];
  };
  estimatedBudget: {
    description: string;
    backpacker: string;
    midRange: string;
  };
  gettingAround: { method: string; details: string }[];
  mainAttractions: { name: string; description: string; estimatedCost: string; type: string }[];
  foodExperience: { name: string; description: string; priceRange: string }[];
  suggestedItineraries: {
    title: string;
    days: { day: number; theme: string; activities: string[] }[];
  }[];
  dayTrips: { name: string; description: string; travelTime: string }[];
  travelerTips: {
    families: string;
    couples: string;
  };
}

export interface CountryGuide {
  countryName: string;
  countryCode: string;
  entryRequirements: {
    visaInfo: string;
    passportValidity: string;
  };
  healthAndVaccinations: {
    recommendedVaccines: { vaccine: string; details: string }[];
    disclaimer: string;
    generalHealthTips: string[];
  };
  moneyAndCosts: {
    currency: string;
    atmsAndCards: string;
    tippingCulture: string;
  };
  safetyAndSecurity: {
    emergencyNumbers: {
      police: string;
      touristPolice: string;
      ambulance: string;
    };
    commonScams: string;
    generalSafety: string;
  };
  lawsAndCustoms: {
    title: string;
    points: { topic: string; details: string }[];
  };
  connectivity: {
    simCards: string;
    wifi: string;
  };
  powerAndPlugs: {
    voltage: string;
    frequency: string;
    plugTypes: string;
  };
  usefulApps: { name: string; description: string }[];
  climateByMonth: { month: string; summary: string }[];
}
