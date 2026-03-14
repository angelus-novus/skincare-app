'use client';
import { useState } from 'react';
import {
  Zap, Syringe, Sparkles, Droplets, CircleDot, Sun, User, MoreHorizontal,
  Calendar, Clock, DollarSign, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, XCircle, Plus, Star, MapPin, User2, ShoppingBag, Info, Heart, CheckCircle2,
} from 'lucide-react';
import {
  differenceInDays, parseISO, format, addMonths, formatDistanceToNow,
} from 'date-fns';
import { useAppStore, useProducts, useProcedures, useUserProfile } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { cn, formatDate, concernLabel } from '@/lib/utils';
import type { Procedure, ProcedureCategory, Product } from '@/lib/types';

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<ProcedureCategory, React.ElementType> = {
  laser: Zap,
  injectables: Syringe,
  facials: Sparkles,
  peels: Droplets,
  microneedling: CircleDot,
  'light-therapy': Sun,
  body: User,
  other: MoreHorizontal,
};

const CATEGORY_COLORS: Record<ProcedureCategory, string> = {
  laser: 'bg-violet-100 text-violet-700',
  injectables: 'bg-blue-100 text-blue-700',
  facials: 'bg-pink-100 text-pink-700',
  peels: 'bg-amber-100 text-amber-700',
  microneedling: 'bg-rose-100 text-rose-700',
  'light-therapy': 'bg-yellow-100 text-yellow-700',
  body: 'bg-teal-100 text-teal-700',
  other: 'bg-ivory-darker text-obsidian-700',
};

const CATEGORY_LABELS: Record<ProcedureCategory, string> = {
  laser: 'Laser',
  injectables: 'Injectables',
  facials: 'Facials',
  peels: 'Peels',
  microneedling: 'Microneedling',
  'light-therapy': 'Light Therapy',
  body: 'Body',
  other: 'Other',
};

// ─── Pre/Post Care Configuration ─────────────────────────────────────────────

interface CarePlan {
  stopRetinoidsDays: number;
  stopAcidsDays: number;
  stopVitaminCDays: number;
  stopPhysicalExfoDays: number;
  postNoActivesDays: number;
  postSensitiveDays: number;
  postNotes: string[];
  preNotes: string[];
  recoveryTimeline: { range: string; instructions: string }[];
}

const PROCEDURE_CARE_CONFIG: Record<ProcedureCategory, CarePlan> = {
  laser: {
    stopRetinoidsDays: 7,
    stopAcidsDays: 5,
    stopVitaminCDays: 2,
    stopPhysicalExfoDays: 5,
    postNoActivesDays: 14,
    postSensitiveDays: 14,
    preNotes: [
      'Avoid sun exposure and tanning beds for 2 weeks before',
      'Stay well hydrated leading up to your appointment',
      'Arrive with clean, product-free skin',
      'Inform your provider of all active ingredients you use',
    ],
    postNotes: [
      'Do not touch or rub treated area',
      'Sleep on a clean pillowcase',
      'Avoid heat (sauna, hot yoga, steam) for 1 week',
      'Reapply SPF 50+ every 2 hours when outdoors',
    ],
    recoveryTimeline: [
      { range: 'Days 1–3', instructions: 'Gentle cleanser + plain moisturizer + SPF only. No actives. Expect redness and possible swelling.' },
      { range: 'Days 4–7', instructions: 'Skin will feel dry and may flake. Continue gentle routine. Add hyaluronic acid serum if needed.' },
      { range: 'Week 2', instructions: 'Redness subsides. You may gently reintroduce niacinamide or peptides.' },
      { range: 'Week 3+', instructions: 'Slowly reintroduce actives one at a time. Retinoids last.' },
    ],
  },
  microneedling: {
    stopRetinoidsDays: 5,
    stopAcidsDays: 3,
    stopVitaminCDays: 2,
    stopPhysicalExfoDays: 3,
    postNoActivesDays: 7,
    postSensitiveDays: 5,
    preNotes: [
      'Avoid anti-inflammatory medications (ibuprofen, aspirin) 3 days before if possible',
      'Arrive with clean skin — no makeup or sunscreen',
      'Numbing cream will be applied 30–45 minutes before',
    ],
    postNotes: [
      'Do not wash face for 6 hours post-treatment',
      'Avoid makeup for 24 hours',
      'Avoid sweat-inducing activities for 48 hours',
      'Do not pick at flaking skin — let it shed naturally',
    ],
    recoveryTimeline: [
      { range: 'Days 1–2', instructions: 'Redness and possible pinpoint bleeding. Gentle cleanser + barrier repair moisturizer + SPF only.' },
      { range: 'Days 3–5', instructions: 'Skin may feel tight or dry. Focus on hydration — hyaluronic acid + ceramide-rich moisturizer.' },
      { range: 'Day 6–7', instructions: 'Redness should be resolved. Can reintroduce mild niacinamide serum.' },
      { range: 'Week 2+', instructions: 'Slowly layer back actives. Acids before retinoids. Wait 2 full weeks for retinoids.' },
    ],
  },
  injectables: {
    stopRetinoidsDays: 3,
    stopAcidsDays: 3,
    stopVitaminCDays: 0,
    stopPhysicalExfoDays: 2,
    postNoActivesDays: 1,
    postSensitiveDays: 1,
    preNotes: [
      'Avoid blood thinners (aspirin, fish oil, vitamin E) 1 week before if safe to do so',
      'Arrive with clean, makeup-free skin around injection sites',
      'Stay well hydrated',
    ],
    postNotes: [
      'Do not touch, rub, or massage injection sites for 24 hours',
      'Avoid exercise and heat for 24 hours (prevents migration)',
      'Do not lie down for 4 hours after Botox',
      'Avoid makeup on injection sites for 24 hours',
      'Bruising is normal — arnica gel can help',
    ],
    recoveryTimeline: [
      { range: '24 hours', instructions: 'Avoid touching, exercise, and makeup at injection sites.' },
      { range: 'Days 2–3', instructions: 'Any bruising will peak. Resume normal skincare routine.' },
      { range: 'Day 4+', instructions: 'Fully resume all actives and normal routine. Botox results appear at days 3–5.' },
    ],
  },
  peels: {
    stopRetinoidsDays: 7,
    stopAcidsDays: 7,
    stopVitaminCDays: 2,
    stopPhysicalExfoDays: 7,
    postNoActivesDays: 10,
    postSensitiveDays: 10,
    preNotes: [
      'No waxing or hair removal 1 week before',
      'Avoid sun exposure 2 weeks before',
      'Tell your provider if you have a history of cold sores (prophylactic antivirals may be recommended)',
      'Arrive with completely clean, product-free skin',
    ],
    postNotes: [
      'Do not pick or pull peeling skin — let it shed naturally',
      'Stay out of direct sun completely during peeling phase',
      'Use a gentle, bland moisturizer frequently',
      'Absolutely no actives until peeling is complete (typically 5–10 days)',
      'SPF 50+ is non-negotiable post-peel',
    ],
    recoveryTimeline: [
      { range: 'Days 1–3', instructions: 'Skin will feel tight and may look red. Cleanse gently, apply thick moisturizer, and SPF outdoors.' },
      { range: 'Days 4–7', instructions: 'Peeling begins. Do NOT pick. Apply moisturizer generously and keep skin protected.' },
      { range: 'Days 8–10', instructions: 'Most peeling resolved. Skin is fresh and sensitive. Begin gentle reintroduction.' },
      { range: 'Week 2+', instructions: 'Resume actives slowly — niacinamide first, then vitamin C, acids after 2 weeks, retinoids at week 3.' },
    ],
  },
  facials: {
    stopRetinoidsDays: 2,
    stopAcidsDays: 2,
    stopVitaminCDays: 0,
    stopPhysicalExfoDays: 2,
    postNoActivesDays: 2,
    postSensitiveDays: 1,
    preNotes: [
      'Avoid heavy actives 2 nights before',
      'Arrive with clean skin if possible',
      'Let the esthetician know about any sensitivities',
    ],
    postNotes: [
      'Let any serum applied during facial fully absorb — do not cleanse for several hours if possible',
      'Avoid heavy actives for 24–48 hours if skin is sensitized',
      'Stay out of strong sun for 24 hours, especially after extractions',
    ],
    recoveryTimeline: [
      { range: '24 hours', instructions: 'Keep it simple. Gentle cleanser, moisturizer, SPF. Skin may be slightly flushed.' },
      { range: 'Day 2+', instructions: 'Resume normal routine. Skin should look refreshed and glowing.' },
    ],
  },
  'light-therapy': {
    stopRetinoidsDays: 1,
    stopAcidsDays: 1,
    stopVitaminCDays: 0,
    stopPhysicalExfoDays: 1,
    postNoActivesDays: 1,
    postSensitiveDays: 1,
    preNotes: [
      'Arrive with clean skin — no sunscreen, makeup, or serums',
      'Remove all jewelry',
      'Inform provider if you take photosensitizing medications',
    ],
    postNotes: [
      'Apply recommended post-procedure serum immediately',
      'SPF is important — phototherapy can increase photosensitivity briefly',
    ],
    recoveryTimeline: [
      { range: '24 hours', instructions: 'Skin may feel warm. Use calming moisturizer. SPF outdoors.' },
      { range: 'Day 2+', instructions: 'Resume normal routine.' },
    ],
  },
  body: {
    stopRetinoidsDays: 3,
    stopAcidsDays: 3,
    stopVitaminCDays: 0,
    stopPhysicalExfoDays: 3,
    postNoActivesDays: 5,
    postSensitiveDays: 5,
    preNotes: ['Avoid shaving treated area 48 hours before', 'Stay hydrated'],
    postNotes: [
      'Keep treated area moisturized',
      'Avoid tight clothing if there is inflammation',
      'SPF on any treated areas exposed to sun',
    ],
    recoveryTimeline: [
      { range: 'Days 1–3', instructions: 'Keep area clean and moisturized. Avoid friction.' },
      { range: 'Week 1+', instructions: 'Gradually resume normal topical products.' },
    ],
  },
  other: {
    stopRetinoidsDays: 3,
    stopAcidsDays: 3,
    stopVitaminCDays: 1,
    stopPhysicalExfoDays: 3,
    postNoActivesDays: 5,
    postSensitiveDays: 3,
    preNotes: ['Follow your provider\'s specific instructions'],
    postNotes: ['Follow your provider\'s specific aftercare instructions'],
    recoveryTimeline: [
      { range: 'Days 1–3', instructions: 'Gentle routine only.' },
      { range: 'Week 1+', instructions: 'Resume actives gradually per your provider\'s guidance.' },
    ],
  },
};

// ─── Ingredient Classification Helpers ───────────────────────────────────────

function isRetinoid(product: Product): boolean {
  const retinoidIngredients = ['retinol', 'retinal', 'tretinoin', 'retinoid'];
  const retinoidTags = ['retinol', 'retinoid', 'anti-aging'];
  return (
    product.ingredients.some((i) => retinoidIngredients.includes(i)) ||
    product.keyIngredients.some((i) => retinoidIngredients.includes(i)) ||
    (product.tags.some((t) => t.includes('retinol') || t.includes('retinoid')) &&
      product.category === 'treatment')
  ) && retinoidTags.some(t => product.tags.includes(t) || product.keyIngredients.includes('retinol') || product.keyIngredients.includes('retinal'));
}

function isChemicalExfoliant(product: Product): boolean {
  return (
    product.category === 'exfoliant' ||
    product.ingredients.some((i) =>
      ['glycolic-acid', 'salicylic-acid', 'lactic-acid', 'mandelic-acid', 'pha'].includes(i)
    ) ||
    product.tags.some((t) => ['aha', 'bha', 'exfoliant', 'chemical-peel', 'acid'].includes(t))
  );
}

function isVitaminC(product: Product): boolean {
  return (
    product.ingredients.includes('vitamin-c') ||
    product.keyIngredients.includes('vitamin-c') ||
    product.tags.includes('brightening') && product.tags.includes('antioxidant')
  );
}

function isPhysicalExfoliant(product: Product): boolean {
  return (
    (product.category === 'exfoliant' && !isChemicalExfoliant(product)) ||
    product.tags.some((t) => ['scrub', 'physical-exfoliant', 'gommage'].includes(t))
  );
}

function isSafeBarrier(product: Product): boolean {
  const safeCategories = ['cleanser', 'moisturizer', 'eye-cream'];
  const safeIngredients = ['ceramides', 'hyaluronic-acid', 'centella', 'squalane'];
  const safeTags = ['gentle', 'fragrance-free', 'calming', 'hydrating', 'sensitive'];
  return (
    (safeCategories.includes(product.category) &&
      !isRetinoid(product) &&
      !isChemicalExfoliant(product) &&
      !isVitaminC(product)) ||
    (product.category === 'toner' && safeTags.some((t) => product.tags.includes(t))) ||
    safeIngredients.some((i) => product.ingredients.includes(i) || product.keyIngredients.includes(i))
  );
}

function isSPF(product: Product): boolean {
  return product.category === 'spf';
}

// ─── Procedure Suggestions ────────────────────────────────────────────────────

const PROCEDURE_SUGGESTIONS = [
  {
    name: 'Clear + Brilliant',
    category: 'laser' as ProcedureCategory,
    description: 'A gentle fractional laser that improves skin texture, tone, and luminosity with minimal downtime.',
    typicalCost: '$300–$500 per session',
    downtime: '2–3 days',
    frequency: 'Every 4–6 weeks (series), then maintenance every 3–6 months',
    bestFor: ['texture', 'dullness', 'pores', 'anti-aging'] as string[],
  },
  {
    name: 'Fraxel Restore',
    category: 'laser' as ProcedureCategory,
    description: 'A fractional resurfacing laser for significant texture improvement, hyperpigmentation, and fine lines.',
    typicalCost: '$1,000–$2,000 per session',
    downtime: '5–7 days',
    frequency: 'Series of 3–5, then annually',
    bestFor: ['hyperpigmentation', 'texture', 'fine-lines', 'anti-aging'] as string[],
  },
  {
    name: 'Botox / Dysport',
    category: 'injectables' as ProcedureCategory,
    description: 'Neurotoxin injections that temporarily relax muscles to smooth dynamic wrinkles.',
    typicalCost: '$400–$800 per treatment',
    downtime: 'None',
    frequency: 'Every 3–4 months',
    bestFor: ['fine-lines', 'anti-aging', 'firmness'] as string[],
  },
  {
    name: 'Hyaluronic Acid Filler',
    category: 'injectables' as ProcedureCategory,
    description: 'Dermal filler to restore volume, soften deep lines, and enhance facial contours.',
    typicalCost: '$600–$1,200 per syringe',
    downtime: '1–3 days (bruising possible)',
    frequency: 'Every 6–18 months depending on area',
    bestFor: ['anti-aging', 'firmness', 'fine-lines'] as string[],
  },
  {
    name: 'HydraFacial',
    category: 'facials' as ProcedureCategory,
    description: 'A multi-step hydradermabrasion treatment that cleanses, extracts, and hydrates simultaneously.',
    typicalCost: '$150–$300',
    downtime: 'None',
    frequency: 'Monthly',
    bestFor: ['pores', 'dullness', 'dryness', 'texture'] as string[],
  },
  {
    name: 'VI Peel / TCA Peel',
    category: 'peels' as ProcedureCategory,
    description: 'A medium-depth chemical peel that dramatically improves hyperpigmentation, acne scarring, and texture.',
    typicalCost: '$200–$500',
    downtime: '5–10 days peeling',
    frequency: 'Every 4–6 weeks (series) or quarterly',
    bestFor: ['hyperpigmentation', 'acne', 'texture', 'dullness'] as string[],
  },
  {
    name: 'Microneedling with PRP',
    category: 'microneedling' as ProcedureCategory,
    description: 'Collagen induction therapy combined with platelet-rich plasma for accelerated healing and results.',
    typicalCost: '$400–$800',
    downtime: '3–5 days',
    frequency: 'Series of 3–6, spaced 4–6 weeks apart',
    bestFor: ['texture', 'anti-aging', 'firmness', 'pores', 'acne'] as string[],
  },
  {
    name: 'LED Light Therapy',
    category: 'light-therapy' as ProcedureCategory,
    description: 'Non-invasive treatment using specific wavelengths to target acne, stimulate collagen, and reduce inflammation.',
    typicalCost: '$75–$200',
    downtime: 'None',
    frequency: 'Weekly or bi-weekly series, then monthly maintenance',
    bestFor: ['acne', 'redness', 'sensitivity', 'anti-aging', 'firmness'] as string[],
  },
];

// ─── Pre/Post Care Panel ──────────────────────────────────────────────────────

function PrePostCarePanel({ procedure, products }: { procedure: Procedure; products: Product[] }) {
  const config = PROCEDURE_CARE_CONFIG[procedure.category];

  const retinoids = products.filter(isRetinoid);
  const chemExfoliants = products.filter(isChemicalExfoliant);
  const vitaminCs = products.filter(isVitaminC);
  const physExfoliants = products.filter(isPhysicalExfoliant);

  const safeProducts = products.filter(
    (p) =>
      isSafeBarrier(p) &&
      !isRetinoid(p) &&
      !isChemicalExfoliant(p) &&
      !isPhysicalExfoliant(p) &&
      (procedure.category === 'laser' || procedure.category === 'peels'
        ? !isVitaminC(p)
        : true)
  );
  const spfProducts = products.filter(isSPF);

  const hasGentleCleanser = products.some((p) => p.category === 'cleanser' && p.tags.includes('gentle'));
  const hasBasicMoisturizer = products.some((p) => p.category === 'moisturizer');
  const hasSPF = products.some((p) => p.category === 'spf');

  const missingEssentials: { name: string; why: string; examples: string }[] = [];
  if (!hasGentleCleanser)
    missingEssentials.push({
      name: 'Gentle Fragrance-Free Cleanser',
      why: 'Essential for keeping skin clean without stripping the barrier during recovery',
      examples: 'CeraVe Hydrating Cleanser ($16), La Roche-Posay Toleriane Hydrating Gentle Cleanser ($17), Vanicream Gentle Facial Cleanser ($9)',
    });
  if (!hasBasicMoisturizer)
    missingEssentials.push({
      name: 'Ceramide Moisturizer',
      why: 'Barrier repair and hydration are critical post-procedure',
      examples: 'CeraVe Moisturizing Cream ($18), Vanicream Moisturizing Skin Cream ($14), Cetaphil Moisturizing Cream ($14)',
    });
  if (!hasSPF)
    missingEssentials.push({
      name: 'Broad Spectrum SPF 50+',
      why: 'Non-negotiable after any procedure — new skin is highly sun-sensitive',
      examples: 'La Roche-Posay Anthelios Melt-In SPF 100 ($36), EltaMD UV Clear SPF 46 ($39), Supergoop Unseen Sunscreen SPF 40 ($38)',
    });

  const productsToStopPre: { product: Product; days: number; reason: string }[] = [
    ...retinoids.map((p) => ({ product: p, days: config.stopRetinoidsDays, reason: 'Retinoids increase skin sensitivity and can cause adverse reactions with this procedure' })),
    ...chemExfoliants.map((p) => ({ product: p, days: config.stopAcidsDays, reason: 'Chemical exfoliants compromise the skin barrier and increase risk of irritation or burns' })),
    ...(config.stopVitaminCDays > 0 ? vitaminCs.map((p) => ({ product: p, days: config.stopVitaminCDays, reason: 'Vitamin C at high concentrations can interact with some energy-based treatments' })) : []),
    ...physExfoliants.map((p) => ({ product: p, days: config.stopPhysicalExfoDays, reason: 'Physical exfoliation thins the skin barrier before procedures' })),
  ];

  const productsToAvoidPost = [
    ...retinoids.map((p) => ({ product: p, avoidDays: config.postNoActivesDays, reason: 'Retinoids are too harsh on healing/sensitized skin' })),
    ...chemExfoliants.map((p) => ({ product: p, avoidDays: config.postNoActivesDays, reason: 'Acids can damage compromised post-procedure skin' })),
    ...vitaminCs.map((p) => ({ product: p, avoidDays: Math.max(Math.floor(config.postSensitiveDays / 2), 3), reason: 'May cause stinging or irritation on sensitized skin' })),
  ];

  return (
    <div className="mt-4 space-y-5">
      {/* PRE-PROCEDURE */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/50 overflow-hidden">
        <div className="px-4 py-3 bg-violet-100/60 border-b border-violet-100">
          <h4 className="font-semibold text-violet-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pre-Procedure Preparation
          </h4>
        </div>
        <div className="p-4 space-y-4">
          {/* Products to PAUSE */}
          {productsToStopPre.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Products to PAUSE</span>
              </div>
              <div className="space-y-2">
                {productsToStopPre.map(({ product, days, reason }) => (
                  <div key={product.id} className="flex items-start gap-3 bg-white rounded-lg p-2.5 border border-red-100">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                      style={{ backgroundColor: product.imageColor }}>
                      <span className="text-xs">✕</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-obsidian-700 truncate">{product.name}</div>
                      <div className="text-xs text-obsidian-500">{product.brand}</div>
                      <div className="text-xs text-red-600 mt-0.5">Stop {days} days before · {reason}</div>
                    </div>
                    <Badge variant="destructive" className="flex-shrink-0">{days}d before</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safe to continue */}
          {safeProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Safe to Continue Pre-Procedure</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {safeProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: p.imageColor }} />
                    <span className="text-xs font-medium text-emerald-800">{p.name}</span>
                  </div>
                ))}
                {spfProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: p.imageColor }} />
                    <span className="text-xs font-medium text-emerald-800">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pre-procedure notes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Prep Tips</span>
            </div>
            <ul className="space-y-1">
              {config.preNotes.map((note, i) => (
                <li key={i} className="text-xs text-obsidian-600 flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* Simplified pre-routine */}
          <div className="bg-white rounded-lg border border-violet-100 p-3">
            <div className="text-xs font-semibold text-violet-700 mb-2">Simplified Pre-Procedure Routine</div>
            <div className="flex flex-wrap gap-2 items-center">
              {hasGentleCleanser ? (
                <span className="bg-sky-50 text-sky-700 border border-sky-100 text-xs px-2 py-1 rounded-full">1. Gentle Cleanser</span>
              ) : (
                <span className="bg-red-50 text-red-600 border border-red-100 text-xs px-2 py-1 rounded-full">1. Get a gentle cleanser !</span>
              )}
              {safeProducts.filter(p => p.category === 'toner' || p.category === 'essence').slice(0, 1).map(p => (
                <span key={p.id} className="bg-violet-50 text-violet-700 border border-violet-100 text-xs px-2 py-1 rounded-full">2. {p.name}</span>
              ))}
              {hasBasicMoisturizer ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2 py-1 rounded-full">{safeProducts.filter(p => p.category === 'toner' || p.category === 'essence').length > 0 ? '3' : '2'}. Basic Moisturizer</span>
              ) : (
                <span className="bg-red-50 text-red-600 border border-red-100 text-xs px-2 py-1 rounded-full">Get a plain moisturizer !</span>
              )}
              {hasSPF && (
                <span className="bg-yellow-50 text-yellow-700 border border-yellow-100 text-xs px-2 py-1 rounded-full">SPF (AM only)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POST-PROCEDURE */}
      <div className="rounded-xl border border-rose-100 bg-rose-50/40 overflow-hidden">
        <div className="px-4 py-3 bg-rose-100/60 border-b border-rose-100">
          <h4 className="font-semibold text-rose-800 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Post-Procedure Recovery
          </h4>
        </div>
        <div className="p-4 space-y-4">
          {/* Recovery timeline */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Recovery Timeline</span>
            </div>
            <div className="space-y-2">
              {config.recoveryTimeline.map((phase, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-rose-700">{phase.range}: </span>
                    <span className="text-xs text-obsidian-600">{phase.instructions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safe products post */}
          {(safeProducts.length > 0 || spfProducts.length > 0) && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Safe Immediately Post-Procedure</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {safeProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: p.imageColor }} />
                    <span className="text-xs font-medium text-emerald-800">{p.name}</span>
                  </div>
                ))}
                {spfProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-100 rounded-lg px-2.5 py-1.5">
                    <Sun className="w-3 h-3 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-800">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products to avoid post */}
          {productsToAvoidPost.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Avoid Post-Procedure (from your shelf)</span>
              </div>
              <div className="space-y-2">
                {productsToAvoidPost.map(({ product, avoidDays, reason }) => (
                  <div key={product.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-red-100">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: product.imageColor }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-obsidian-700 truncate">{product.name}</div>
                      <div className="text-xs text-red-600">{reason}</div>
                    </div>
                    <Badge variant="destructive">{avoidDays}d wait</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post-procedure notes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Recovery Tips</span>
            </div>
            <ul className="space-y-1">
              {config.postNotes.map((note, i) => (
                <li key={i} className="text-xs text-obsidian-600 flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* Missing essentials for recovery */}
          {missingEssentials.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Missing Recovery Essentials</span>
              </div>
              <div className="space-y-3">
                {missingEssentials.map((item, i) => (
                  <div key={i} className="bg-white rounded-lg p-2.5 border border-amber-100">
                    <div className="text-xs font-semibold text-amber-800">{item.name}</div>
                    <div className="text-xs text-obsidian-500 mt-0.5">{item.why}</div>
                    <div className="text-xs text-amber-700 mt-1">
                      <span className="font-medium">Recommended: </span>{item.examples}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Procedure Card ───────────────────────────────────────────────────────────

function ProcedureCard({ procedure, products }: { procedure: Procedure; products: Product[] }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[procedure.category];
  const colorClass = CATEGORY_COLORS[procedure.category];

  const daysUntilNext = procedure.nextAppointment
    ? differenceInDays(parseISO(procedure.nextAppointment), new Date())
    : null;

  const dueDate = !procedure.nextAppointment && procedure.recommendedIntervalMonths
    ? addMonths(parseISO(procedure.date), procedure.recommendedIntervalMonths)
    : null;

  const daysSinceDue = dueDate ? differenceInDays(new Date(), dueDate) : null;
  const isOverdue = daysSinceDue !== null && daysSinceDue > 0;

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-obsidian-800">{procedure.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={cn('text-xs', colorClass)}>{CATEGORY_LABELS[procedure.category]}</Badge>
                  <span className="text-xs text-obsidian-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(procedure.date)}
                  </span>
                </div>
              </div>
              {procedure.rating && (
                <StarRating value={procedure.rating} size="sm" />
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {procedure.provider && (
            <div className="flex items-center gap-1.5 text-obsidian-600">
              <User2 className="w-3 h-3 text-obsidian-400 flex-shrink-0" />
              {procedure.provider}
            </div>
          )}
          {procedure.clinic && (
            <div className="flex items-center gap-1.5 text-obsidian-600">
              <MapPin className="w-3 h-3 text-obsidian-400 flex-shrink-0" />
              {procedure.clinic}
            </div>
          )}
          {procedure.cost !== undefined && (
            <div className="flex items-center gap-1.5 text-obsidian-600">
              <DollarSign className="w-3 h-3 text-obsidian-400 flex-shrink-0" />
              ${procedure.cost.toLocaleString()}
            </div>
          )}
          {procedure.downtime && (
            <div className="flex items-center gap-1.5 text-obsidian-600">
              <Clock className="w-3 h-3 text-obsidian-400 flex-shrink-0" />
              {procedure.downtime} downtime
            </div>
          )}
          {procedure.recommendedIntervalMonths && (
            <div className="flex items-center gap-1.5 text-obsidian-600 col-span-2">
              <Calendar className="w-3 h-3 text-obsidian-400 flex-shrink-0" />
              Recommended every {procedure.recommendedIntervalMonths} month{procedure.recommendedIntervalMonths !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Results */}
        {procedure.results && (
          <div className="mt-3 text-xs text-obsidian-600 bg-ivory-dark rounded-lg p-2.5 border border-ivory-darker">
            <span className="font-medium text-obsidian-700">Results: </span>{procedure.results}
          </div>
        )}

        {/* Side effects */}
        {procedure.sideEffects && procedure.sideEffects.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {procedure.sideEffects.map((effect, i) => (
              <Badge key={i} variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                {effect}
              </Badge>
            ))}
          </div>
        )}

        {/* Next appointment */}
        <div className="mt-4">
          {procedure.nextAppointment && daysUntilNext !== null ? (
            daysUntilNext >= 0 ? (
              <div className={cn(
                'rounded-xl px-3.5 py-2.5 flex items-center justify-between',
                daysUntilNext < 14 ? 'bg-rose-50 border border-rose-100' : 'bg-blue-50 border border-blue-100'
              )}>
                <div>
                  <div className={cn('text-xs font-semibold', daysUntilNext < 14 ? 'text-rose-700' : 'text-blue-700')}>
                    Next appointment: {format(parseISO(procedure.nextAppointment), 'MMM d, yyyy')}
                  </div>
                  <div className={cn('text-xs mt-0.5', daysUntilNext < 14 ? 'text-rose-500' : 'text-blue-500')}>
                    {daysUntilNext === 0 ? 'Today!' : `in ${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''}`}
                  </div>
                </div>
                <Calendar className={cn('w-5 h-5 flex-shrink-0', daysUntilNext < 14 ? 'text-rose-400' : 'text-blue-400')} />
              </div>
            ) : (
              <div className="rounded-xl px-3.5 py-2.5 flex items-center justify-between bg-ivory-dark border border-ivory-darker">
                <div>
                  <div className="text-xs font-medium text-obsidian-600">
                    Past appointment: {format(parseISO(procedure.nextAppointment), 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-obsidian-400 mt-0.5">
                    {Math.abs(daysUntilNext)} days ago
                  </div>
                </div>
              </div>
            )
          ) : isOverdue ? (
            <div className="rounded-xl px-3.5 py-2.5 flex items-center justify-between bg-amber-50 border border-amber-100">
              <div>
                <div className="text-xs font-semibold text-amber-700">Overdue by {daysSinceDue} days</div>
                <div className="text-xs text-amber-500">Was due {formatDistanceToNow(dueDate!, { addSuffix: true })}</div>
              </div>
              <Button size="sm" variant="primary" className="text-xs h-7">
                Schedule Now
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="text-xs w-full">
              <Calendar className="w-3.5 h-3.5" />
              Schedule Appointment
            </Button>
          )}
        </div>

        {/* Expand accordion */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r from-violet-50 to-rose-50 border border-violet-100/60 hover:from-violet-100 hover:to-rose-100 transition-colors"
        >
          <span className="text-xs font-semibold text-violet-700">Pre & Post Procedure Care</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-violet-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
          )}
        </button>

        {expanded && <PrePostCarePanel procedure={procedure} products={products} />}
      </div>
    </Card>
  );
}

// ─── Log Procedure Modal ──────────────────────────────────────────────────────

const CATEGORIES: ProcedureCategory[] = [
  'laser', 'injectables', 'facials', 'peels', 'microneedling', 'light-therapy', 'body', 'other'
];

const SKIN_CONCERNS_LIST = [
  'acne', 'hyperpigmentation', 'anti-aging', 'dryness', 'sensitivity',
  'redness', 'pores', 'texture', 'dullness', 'dark-circles', 'fine-lines', 'firmness'
] as const;

function LogProcedureModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (p: Procedure) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProcedureCategory>('facials');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [provider, setProvider] = useState('');
  const [clinic, setClinic] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [results, setResults] = useState('');
  const [rating, setRating] = useState(0);
  const [sideEffects, setSideEffects] = useState('');
  const [nextAppt, setNextAppt] = useState('');
  const [interval, setInterval] = useState('');
  const [downtime, setDowntime] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  function toggleConcern(c: string) {
    setSelectedConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const procedure: Procedure = {
      id: `proc-${Date.now()}`,
      name: name.trim(),
      category,
      date,
      provider: provider.trim() || undefined,
      clinic: clinic.trim() || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      notes: notes.trim() || undefined,
      results: results.trim() || undefined,
      rating: rating || undefined,
      sideEffects: sideEffects.trim() ? sideEffects.split(',').map((s) => s.trim()).filter(Boolean) : [],
      nextAppointment: nextAppt || undefined,
      recommendedIntervalMonths: interval ? parseInt(interval) : undefined,
      downtime: downtime.trim() || undefined,
      concerns: selectedConcerns as Procedure['concerns'],
    };
    onSave(procedure);
    onClose();
    // Reset
    setName(''); setCategory('facials'); setDate(format(new Date(), 'yyyy-MM-dd'));
    setProvider(''); setClinic(''); setCost(''); setNotes(''); setResults('');
    setRating(0); setSideEffects(''); setNextAppt(''); setInterval(''); setDowntime('');
    setSelectedConcerns([]);
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Procedure" description="Record a new aesthetic procedure or treatment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Procedure Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Clear + Brilliant Laser" required />
          </div>
          <div>
            <label className="text-sm font-medium text-obsidian-700 block mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProcedureCategory)}
              className="w-full rounded-lg border border-ivory-darker px-3 py-2 text-sm text-obsidian-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <Input label="Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input label="Provider / Doctor" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Dr. Jane Smith" />
          <Input label="Clinic / Spa" value={clinic} onChange={(e) => setClinic(e.target.value)} placeholder="Glow Dermatology" />
          <Input label="Cost ($)" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="350" />
          <Input label="Downtime" value={downtime} onChange={(e) => setDowntime(e.target.value)} placeholder="2-3 days" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-obsidian-700 block">Your Rating</label>
          <StarRating value={rating} interactive onChange={setRating} size="lg" />
        </div>

        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it go? Any observations..." rows={2} />
        <Textarea label="Results" value={results} onChange={(e) => setResults(e.target.value)} placeholder="What improvements did you notice?" rows={2} />
        <Input label="Side Effects (comma separated)" value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} placeholder="Redness (2 days), mild peeling" />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Next Appointment Date" type="date" value={nextAppt} onChange={(e) => setNextAppt(e.target.value)} />
          <Input label="Recommended Interval (months)" type="number" min="1" max="24" value={interval} onChange={(e) => setInterval(e.target.value)} placeholder="3" />
        </div>

        <div>
          <label className="text-sm font-medium text-obsidian-700 block mb-2">Skin Concerns Addressed</label>
          <div className="flex flex-wrap gap-1.5">
            {SKIN_CONCERNS_LIST.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleConcern(c)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  selectedConcerns.includes(c)
                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                    : 'bg-ivory-dark border-ivory-darker text-obsidian-600 hover:bg-ivory-darker'
                )}
              >
                {concernLabel(c)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" className="flex-1">
            <Plus className="w-4 h-4" />
            Log Procedure
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProceduresPage() {
  const products = useProducts();
  const procedures = useProcedures();
  const userProfile = useUserProfile();
  const { addProcedure, addProcedureWishlistItem, procedureWishlist } = useAppStore();
  const [logOpen, setLogOpen] = useState(false);

  const sorted = [...procedures].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
  );

  const upcoming = procedures
    .filter((p) => p.nextAppointment && differenceInDays(parseISO(p.nextAppointment), new Date()) >= 0)
    .sort((a, b) =>
      differenceInDays(parseISO(a.nextAppointment!), new Date()) -
      differenceInDays(parseISO(b.nextAppointment!), new Date())
    );

  const suggestions = PROCEDURE_SUGGESTIONS.filter((s) =>
    s.bestFor.some((c) => userProfile.skinConcerns.includes(c as Procedure['concerns'][number]))
  );

  const totalSpent = procedures.reduce((sum, p) => sum + (p.cost || 0), 0);

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-obsidian-800">Procedures</h1>
          <p className="text-obsidian-500 mt-1">
            {procedures.length} procedures logged · ${totalSpent.toLocaleString()} total invested
          </p>
        </div>
        <Button onClick={() => setLogOpen(true)}>
          <Plus className="w-4 h-4" />
          Log Procedure
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Logged', value: procedures.length, sub: 'procedures', color: 'bg-violet-50 text-violet-600' },
          { label: 'Upcoming', value: upcoming.length, sub: upcoming[0] ? `Next: ${upcoming[0].name}` : 'None scheduled', color: 'bg-blue-50 text-blue-600' },
          {
            label: 'Avg Rating',
            value: procedures.filter(p => p.rating).length
              ? (procedures.reduce((s, p) => s + (p.rating || 0), 0) / procedures.filter(p => p.rating).length).toFixed(1)
              : '—',
            sub: `${procedures.filter(p => p.rating).length} rated`,
            color: 'bg-amber-50 text-amber-600',
          },
          { label: 'Invested', value: `$${totalSpent.toLocaleString()}`, sub: 'total spent', color: 'bg-emerald-50 text-emerald-600' },
        ].map((s, i) => (
          <Card key={i}>
            <CardBody className="p-4">
              <div className={cn('text-2xl font-bold', s.color.split(' ')[1])}>{s.value}</div>
              <div className="text-xs font-medium text-obsidian-600 mt-0.5">{s.label}</div>
              <div className="text-xs text-obsidian-400">{s.sub}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Upcoming appointments */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-obsidian-800 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-400" />
                Upcoming Appointments
              </h2>
              <div className="space-y-3">
                {upcoming.map((p) => {
                  const days = differenceInDays(parseISO(p.nextAppointment!), new Date());
                  const Icon = CATEGORY_ICONS[p.category];
                  return (
                    <Card key={p.id} className="overflow-hidden">
                      <CardBody className="p-4 flex items-center gap-4">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', CATEGORY_COLORS[p.category])}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-obsidian-800 text-sm">{p.name}</div>
                          <div className="text-xs text-obsidian-500 mt-0.5">
                            {format(parseISO(p.nextAppointment!), 'EEEE, MMMM d, yyyy')}
                            {p.clinic && ` · ${p.clinic}`}
                          </div>
                        </div>
                        <div className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0',
                          days === 0 ? 'bg-rose-100 text-rose-700' :
                          days <= 7 ? 'bg-orange-100 text-orange-700' :
                          days <= 14 ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-50 text-blue-700'
                        )}>
                          {days === 0 ? 'Today' : `${days}d away`}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Procedure history */}
          <div>
            <h2 className="text-base font-bold text-obsidian-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-obsidian-400" />
              Procedure History
            </h2>
            {sorted.length === 0 ? (
              <Card>
                <CardBody className="py-12 text-center">
                  <div className="text-4xl mb-3">✨</div>
                  <div className="text-obsidian-600 font-medium">No procedures logged yet</div>
                  <div className="text-obsidian-400 text-sm mt-1">Log your first procedure to get personalized pre & post care guidance</div>
                  <Button className="mt-4" onClick={() => setLogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Log Procedure
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-4">
                {sorted.map((p) => (
                  <ProcedureCard key={p.id} procedure={p} products={products} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Suggestions based on concerns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                Suggested for Your Concerns
              </CardTitle>
              <p className="text-xs text-obsidian-400 mt-0.5">
                Based on: {userProfile.skinConcerns.slice(0, 3).map(concernLabel).join(', ')}
              </p>
            </CardHeader>
            <CardBody className="pt-0 space-y-3">
              {suggestions.slice(0, 5).map((s, i) => {
                const Icon = CATEGORY_ICONS[s.category];
                const alreadyWishlisted = procedureWishlist.some((w) => w.name === s.name);
                return (
                  <div key={i} className="border border-ivory-darker rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', CATEGORY_COLORS[s.category])}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-obsidian-800 flex-1">{s.name}</span>
                      <button
                        onClick={() => {
                          if (alreadyWishlisted) return;
                          addProcedureWishlistItem({
                            id: `pwish-${Date.now()}-${i}`,
                            name: s.name,
                            category: s.category,
                            description: s.description,
                            typicalCost: s.typicalCost,
                            downtime: s.downtime,
                            frequency: s.frequency,
                            addedDate: new Date().toISOString().split('T')[0],
                            priority: 'medium',
                            concerns: s.bestFor.filter(c => userProfile.skinConcerns.includes(c as Procedure['concerns'][number])) as typeof userProfile.skinConcerns,
                          });
                        }}
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors',
                          alreadyWishlisted
                            ? 'text-emerald-600 bg-emerald-50'
                            : 'text-rose-500 hover:bg-rose-50'
                        )}
                        title={alreadyWishlisted ? 'Already in wishlist' : 'Add to wishlist'}
                      >
                        {alreadyWishlisted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs text-obsidian-500 mb-2">{s.description}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="text-obsidian-500"><span className="text-obsidian-400">Cost: </span>{s.typicalCost}</div>
                      <div className="text-obsidian-500"><span className="text-obsidian-400">Downtime: </span>{s.downtime}</div>
                    </div>
                    <div className="text-xs text-obsidian-500 mt-1">
                      <span className="text-obsidian-400">Frequency: </span>{s.frequency}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.bestFor.filter(c => userProfile.skinConcerns.includes(c as Procedure['concerns'][number])).map((c) => (
                        <Badge key={c} variant="default" className="text-xs">{concernLabel(c as Procedure['concerns'][number])}</Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
              {suggestions.length === 0 && (
                <p className="text-xs text-obsidian-400 py-2 text-center">Add skin concerns in your profile to see suggestions</p>
              )}
            </CardBody>
          </Card>

          {/* Quick reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pre-Procedure Quick Reference</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-2">
                {(
                  [
                    ['laser', '7d retinoids, 5d acids, 2d vit C'],
                    ['peels', '7d retinoids, 7d acids'],
                    ['microneedling', '5d retinoids, 3d acids'],
                    ['injectables', '3d retinoids, 3d acids'],
                    ['facials', '2d retinoids, 2d acids'],
                  ] as [ProcedureCategory, string][]
                ).map(([cat, rule]) => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <div key={cat} className="flex items-start gap-2 text-xs">
                      <div className={cn('w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5', CATEGORY_COLORS[cat])}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="font-medium text-obsidian-700">{CATEGORY_LABELS[cat]}: </span>
                        <span className="text-obsidian-500">Stop {rule}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Categories breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">By Category</CardTitle>
            </CardHeader>
            <CardBody className="pt-0 space-y-2">
              {CATEGORIES.filter((cat) => procedures.some((p) => p.category === cat)).map((cat) => {
                const count = procedures.filter((p) => p.category === cat).length;
                const Icon = CATEGORY_ICONS[cat];
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0', CATEGORY_COLORS[cat])}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs font-medium text-obsidian-700">{CATEGORY_LABELS[cat]}</span>
                        <span className="text-xs text-obsidian-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-ivory-darker rounded-full">
                        <div
                          className="h-1.5 bg-rose-400 rounded-full"
                          style={{ width: `${(count / procedures.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      </div>

      <LogProcedureModal open={logOpen} onClose={() => setLogOpen(false)} onSave={addProcedure} />
    </div>
  );
}
