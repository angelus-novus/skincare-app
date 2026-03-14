'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Product,
  Ingredient,
  Procedure,
  JournalEntry,
  UserProfile,
  ProductRating,
  RoutineStep,
} from './types';
import {
  PRODUCTS,
  INGREDIENTS,
  PROCEDURES,
  JOURNAL_ENTRIES,
  DEFAULT_USER_PROFILE,
} from './mockData';

interface AppState {
  // Data
  products: Product[];
  ingredients: Ingredient[];
  procedures: Procedure[];
  journalEntries: JournalEntry[];
  userProfile: UserProfile;
  routine: { am: RoutineStep[]; pm: RoutineStep[] };

  // UI State
  onboardingComplete: boolean;

  // Product actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  rateProduct: (id: string, rating: ProductRating) => void;
  toggleWishlist: (id: string) => void;

  // Procedure actions
  addProcedure: (procedure: Procedure) => void;
  updateProcedure: (id: string, updates: Partial<Procedure>) => void;
  deleteProcedure: (id: string) => void;

  // Journal actions
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  // User profile actions
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (profile: Partial<UserProfile>) => void;

  // Routine actions
  updateRoutine: (time: 'am' | 'pm', steps: RoutineStep[]) => void;

  // Ingredient actions
  addIngredient: (ingredient: Ingredient) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      products: PRODUCTS,
      ingredients: INGREDIENTS,
      procedures: PROCEDURES,
      journalEntries: JOURNAL_ENTRIES,
      userProfile: DEFAULT_USER_PROFILE,
      onboardingComplete: false,
      routine: {
        am: PRODUCTS.filter((p) => p.routineStep === 'am' || p.routineStep === 'both')
          .sort((a, b) => (a.routineOrder || 0) - (b.routineOrder || 0))
          .map((p) => ({ productId: p.id, order: p.routineOrder || 0 })),
        pm: PRODUCTS.filter((p) => p.routineStep === 'pm' || p.routineStep === 'both')
          .sort((a, b) => (a.routineOrder || 0) - (b.routineOrder || 0))
          .map((p) => ({ productId: p.id, order: p.routineOrder || 0 })),
      },

      addProduct: (product) =>
        set((state) => ({ products: [...state.products, product] })),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      rateProduct: (id, rating) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, rating } : p)),
        })),

      toggleWishlist: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, isWishlisted: !p.isWishlisted } : p
          ),
        })),

      addProcedure: (procedure) =>
        set((state) => ({ procedures: [...state.procedures, procedure] })),

      updateProcedure: (id, updates) =>
        set((state) => ({
          procedures: state.procedures.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProcedure: (id) =>
        set((state) => ({
          procedures: state.procedures.filter((p) => p.id !== id),
        })),

      addJournalEntry: (entry) =>
        set((state) => ({ journalEntries: [entry, ...state.journalEntries] })),

      updateJournalEntry: (id, updates) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((e) => e.id !== id),
        })),

      updateUserProfile: (updates) =>
        set((state) => ({ userProfile: { ...state.userProfile, ...updates } })),

      completeOnboarding: (profile) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile, onboarded: true },
          onboardingComplete: true,
        })),

      updateRoutine: (time, steps) =>
        set((state) => ({
          routine: { ...state.routine, [time]: steps },
        })),

      addIngredient: (ingredient) =>
        set((state) => ({ ingredients: [...state.ingredients, ingredient] })),
    }),
    {
      name: 'skincare-app-storage',
      version: 1,
    }
  )
);

// Selectors
export const useProducts = () => useAppStore((s) => s.products);
export const useIngredients = () => useAppStore((s) => s.ingredients);
export const useProcedures = () => useAppStore((s) => s.procedures);
export const useJournalEntries = () => useAppStore((s) => s.journalEntries);
export const useUserProfile = () => useAppStore((s) => s.userProfile);
export const useRoutine = () => useAppStore((s) => s.routine);

export const useProductById = (id: string) =>
  useAppStore((s) => s.products.find((p) => p.id === id));
export const useIngredientById = (id: string) =>
  useAppStore((s) => s.ingredients.find((i) => i.id === id));
