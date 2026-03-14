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
  // sage = positive/good evidence, gold = moderate, blush = emerging/limited
  const colors: Record<EvidenceLevel, string> = {
    strong:    'text-sage-700 bg-sage-50 border border-sage-100',
    moderate:  'text-gold-700 bg-gold-50 border border-gold-100',
    emerging:  'text-brand-600 bg-brand-50 border border-brand-100',
    limited:   'text-blush-500 bg-blush-50 border border-blush-100',
    anecdotal: 'text-obsidian-400 bg-ivory-dark border border-ivory-darker',
  };
  return colors[level];
}

export function categoryColor(category: ProductCategory) {
  // All use the unified palette — varied by lightness
  const colors: Record<ProductCategory, string> = {
    cleanser:    'bg-gold-50 text-gold-700',
    toner:       'bg-blush-50 text-blush-500',
    essence:     'bg-brand-50 text-brand-600',
    serum:       'bg-gold-100 text-gold-600',
    moisturizer: 'bg-sage-50 text-sage-700',
    'eye-cream': 'bg-blush-100 text-blush-500',
    spf:         'bg-gold-50 text-gold-600',
    mask:        'bg-brand-100 text-brand-700',
    exfoliant:   'bg-brand-50 text-brand-500',
    oil:         'bg-gold-100 text-gold-700',
    mist:        'bg-sage-50 text-sage-600',
    treatment:   'bg-brand-100 text-brand-600',
    'lip-care':  'bg-blush-50 text-blush-500',
    'body-care': 'bg-sage-100 text-sage-700',
  };
  return colors[category] || 'bg-ivory-dark text-obsidian-500';
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
