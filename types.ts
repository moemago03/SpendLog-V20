// FIX: Removed circular self-import and added ChecklistItem interface definition.
export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface Attraction {
    name: string;
    type: string;
    estimatedCost: string;
    description: string;
    lat?: number;
    lng?: number;
}

export interface ExploreCity {
    name: string;
    country: string;
    image: string;
    description: string;
    attractions: Attraction[];
    activities: string[];
    dailyCostEstimate: {
        low: string;
        medium: string;
        high: string;
    };
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