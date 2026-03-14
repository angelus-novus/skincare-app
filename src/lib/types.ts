export type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
export type SkinConcern =
  | 'acne'
  | 'hyperpigmentation'
  | 'anti-aging'
  | 'dryness'
  | 'sensitivity'
  | 'redness'
  | 'pores'
  | 'texture'
  | 'dullness'
  | 'dark-circles'
  | 'fine-lines'
  | 'firmness';

export type ProductCategory =
  | 'cleanser'
  | 'toner'
  | 'essence'
  | 'serum'
  | 'moisturizer'
  | 'eye-cream'
  | 'spf'
  | 'mask'
  | 'exfoliant'
  | 'oil'
  | 'mist'
  | 'treatment'
  | 'lip-care'
  | 'body-care';

export type EvidenceLevel = 'strong' | 'moderate' | 'emerging' | 'limited' | 'anecdotal';
export type ProcedureCategory =
  | 'laser'
  | 'injectables'
  | 'facials'
  | 'peels'
  | 'microneedling'
  | 'light-therapy'
  | 'body'
  | 'other';

export interface Ingredient {
  id: string;
  name: string;
  inci: string; // INCI name
  category: string;
  whatItDoes: string;
  benefits: string[];
  potentialConcerns: string[];
  evidenceLevel: EvidenceLevel;
  concentration?: string;
  isActive: boolean;
  skinTypes: SkinType[];
  concerns: SkinConcern[];
  notes?: string;
}

export interface ProductRating {
  overall: number; // 1-5
  texture: number;
  efficacy: number;
  value: number;
  pros: string[];
  cons: string[];
  notes: string;
  adverseReactions: string[];
  wouldRepurchase: boolean;
  reviewDate: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  imageUrl: string;
  imageColor: string; // fallback color
  price?: number;
  size?: string;
  purchaseDate?: string;
  openedDate?: string;
  expiryDate?: string;
  paoMonths?: number; // period after opening
  concerns: SkinConcern[];
  ingredients: string[]; // ingredient ids
  keyIngredients: string[]; // highlighted ingredient ids
  rating?: ProductRating;
  inRoutine: boolean;
  routineStep?: 'am' | 'pm' | 'both';
  routineOrder?: number;
  tags: string[];
  purchaseUrl?: string;
  isWishlisted?: boolean;
  isDiscontinued?: boolean;
}

export interface Procedure {
  id: string;
  name: string;
  category: ProcedureCategory;
  date: string;
  provider?: string;
  clinic?: string;
  cost?: number;
  notes?: string;
  rating?: number;
  results?: string;
  nextAppointment?: string;
  recommendedIntervalMonths?: number;
  sideEffects?: string[];
  concerns: SkinConcern[];
  imageUrl?: string;
  downtime?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  imageUrl?: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  skinCondition: number; // 1-10
  notes?: string;
  products: string[]; // product ids used
  concerns: SkinConcern[];
  environment?: {
    weather?: string;
    humidity?: string;
    stress?: 'low' | 'medium' | 'high';
    sleep?: number; // hours
    diet?: string;
  };
}

export interface UserProfile {
  name: string;
  skinType: SkinType;
  skinConcerns: SkinConcern[];
  allergies: string[];
  knownIrritants: string[];
  budget?: 'budget' | 'mid-range' | 'luxury' | 'mixed';
  onboarded: boolean;
  goals: string[];
  procedureInterests: string[];
  location?: string;
}

export interface RoutineStep {
  productId: string;
  order: number;
  notes?: string;
}

export interface Routine {
  am: RoutineStep[];
  pm: RoutineStep[];
}
