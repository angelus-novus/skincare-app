import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInDays, addMonths, format, parseISO } from 'date-fns';
import type { Product, EvidenceLevel, ProductCategory, SkinConcern } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return format(parseISO(date), 'MMM d, yyyy');
}

export function daysUntilExpiry(product: Product): number | null {
  if (product.expiryDate) {
    return differenceInDays(parseISO(product.expiryDate), new Date());
  }
  if (product.openedDate && product.paoMonths) {
    const expiry = addMonths(parseISO(product.openedDate), product.paoMonths);
    return differenceInDays(expiry, new Date());
  }
  return null;
}

export function getExpiryStatus(days: number | null): 'expired' | 'warning' | 'ok' | 'unknown' {
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days < 30) return 'warning';
  return 'ok';
}

export function evidenceLevelColor(level: EvidenceLevel) {
  const colors: Record<EvidenceLevel, string> = {
    strong: 'text-emerald-600 bg-emerald-50',
    moderate: 'text-blue-600 bg-blue-50',
    emerging: 'text-amber-600 bg-amber-50',
    limited: 'text-orange-500 bg-orange-50',
    anecdotal: 'text-slate-500 bg-slate-100',
  };
  return colors[level];
}

export function categoryColor(category: ProductCategory) {
  const colors: Record<ProductCategory, string> = {
    cleanser: 'bg-sky-100 text-sky-700',
    toner: 'bg-violet-100 text-violet-700',
    essence: 'bg-pink-100 text-pink-700',
    serum: 'bg-amber-100 text-amber-700',
    moisturizer: 'bg-emerald-100 text-emerald-700',
    'eye-cream': 'bg-indigo-100 text-indigo-700',
    spf: 'bg-yellow-100 text-yellow-700',
    mask: 'bg-purple-100 text-purple-700',
    exfoliant: 'bg-red-100 text-red-700',
    oil: 'bg-orange-100 text-orange-700',
    mist: 'bg-cyan-100 text-cyan-700',
    treatment: 'bg-rose-100 text-rose-700',
    'lip-care': 'bg-fuchsia-100 text-fuchsia-700',
    'body-care': 'bg-teal-100 text-teal-700',
  };
  return colors[category] || 'bg-slate-100 text-slate-700';
}

export function concernLabel(concern: SkinConcern) {
  const labels: Record<SkinConcern, string> = {
    acne: 'Acne',
    hyperpigmentation: 'Hyperpigmentation',
    'anti-aging': 'Anti-aging',
    dryness: 'Dryness',
    sensitivity: 'Sensitivity',
    redness: 'Redness',
    pores: 'Pores',
    texture: 'Texture',
    dullness: 'Dullness',
    'dark-circles': 'Dark Circles',
    'fine-lines': 'Fine Lines',
    firmness: 'Firmness',
  };
  return labels[concern] || concern;
}

export function categoryLabel(category: ProductCategory) {
  const labels: Record<ProductCategory, string> = {
    cleanser: 'Cleanser',
    toner: 'Toner',
    essence: 'Essence',
    serum: 'Serum',
    moisturizer: 'Moisturizer',
    'eye-cream': 'Eye Cream',
    spf: 'SPF',
    mask: 'Mask',
    exfoliant: 'Exfoliant',
    oil: 'Facial Oil',
    mist: 'Mist',
    treatment: 'Treatment',
    'lip-care': 'Lip Care',
    'body-care': 'Body Care',
  };
  return labels[category] || category;
}

export function starRating(rating: number) {
  return Math.round(rating * 2) / 2;
}
