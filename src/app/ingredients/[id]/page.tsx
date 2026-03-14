'use client';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FlaskConical, Sparkles, Shield, AlertTriangle,
  Check, Package, ChevronLeft, Info, ExternalLink,
} from 'lucide-react';
import { useProducts, useIngredients } from '@/lib/store';
import { cn, concernLabel } from '@/lib/utils';
import type { EvidenceLevel, SkinType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';

// ─── Evidence meta ────────────────────────────────────────────────────────────

const EVIDENCE_META: Record<
  EvidenceLevel,
  { label: string; description: string; bg: string; text: string; border: string; icon: string }
> = {
  strong: {
    label: 'Strong Evidence',
    description:
      'Backed by multiple rigorous clinical trials with consistent, reproducible results. Considered gold-standard for efficacy.',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: '✓✓✓',
  },
  moderate: {
    label: 'Moderate Evidence',
    description:
      'Supported by several well-designed studies. Results are promising and generally consistent.',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: '✓✓',
  },
  emerging: {
    label: 'Emerging Evidence',
    description:
      'Early-stage research looks promising. Larger or longer-term studies are still needed.',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: '✓',
  },
  limited: {
    label: 'Limited Evidence',
    description:
      'Some in-vitro or small-scale studies exist, but comprehensive human clinical data is lacking.',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: '~',
  },
  anecdotal: {
    label: 'Anecdotal',
    description:
      'Primarily based on user reports and traditional use. Scientific clinical evidence is minimal.',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: '?',
  },
};

// ─── Conflict data ────────────────────────────────────────────────────────────

interface IngredientConflict {
  a: string;
  b: string;
  severity: 'avoid' | 'caution';
  explanation: string;
  tip: string;
}

const INGREDIENT_CONFLICTS: IngredientConflict[] = [
  {
    a: 'retinol',
    b: 'AHA',
    severity: 'avoid',
    explanation:
      'Retinol and AHAs (like glycolic or lactic acid) together can cause significant irritation, redness, and peeling by over-exfoliating the skin barrier.',
    tip: 'Use AHAs in your AM routine and retinol in your PM routine on alternate nights.',
  },
  {
    a: 'retinol',
    b: 'BHA',
    severity: 'avoid',
    explanation:
      'Combining retinol with BHAs (like salicylic acid) leads to excessive exfoliation, potentially compromising the skin barrier and causing sensitivity.',
    tip: 'Alternate usage — apply BHA in the morning and retinol at night, not on the same day.',
  },
  {
    a: 'Vitamin C',
    b: 'Niacinamide',
    severity: 'caution',
    explanation:
      'High concentrations of Vitamin C (ascorbic acid) and niacinamide may form niacin when combined, potentially causing temporary flushing.',
    tip: 'Use them in separate steps with time between application, or choose a stabilized Vitamin C form.',
  },
  {
    a: 'Vitamin C',
    b: 'retinol',
    severity: 'caution',
    explanation:
      'Both are potent actives. Using them together can cause irritation, and they work best at different pH levels.',
    tip: 'Use Vitamin C in your AM routine and retinol in your PM routine.',
  },
  {
    a: 'benzoyl peroxide',
    b: 'retinol',
    severity: 'avoid',
    explanation:
      'Benzoyl peroxide can oxidize and inactivate retinol/retinoids, rendering them ineffective, while also increasing irritation risk.',
    tip: 'Use benzoyl peroxide in the morning and retinol at night.',
  },
  {
    a: 'AHA',
    b: 'BHA',
    severity: 'caution',
    explanation:
      'Using AHAs and BHAs together can lead to over-exfoliation, causing dryness, irritation, and a compromised skin barrier.',
    tip: 'Alternate them on different days or use a pre-formulated combination at safe concentrations.',
  },
  {
    a: 'Vitamin C',
    b: 'AHA',
    severity: 'caution',
    explanation:
      'Both are acidic and may cause excessive irritation and pH imbalance together.',
    tip: 'Apply Vitamin C first, wait 20-30 minutes, then apply your AHA — or use at different times of day.',
  },
];

// ─── Static recommended products ──────────────────────────────────────────────

const RECOMMENDED_PRODUCTS: Record<string, { name: string; brand: string; note: string; price?: string }[]> = {
  default: [
    {
      name: 'The Ordinary Hyaluronic Acid 2% + B5',
      brand: 'The Ordinary',
      note: 'Affordable, effective hydration',
      price: '$6.80',
    },
    {
      name: 'CeraVe Moisturizing Cream',
      brand: 'CeraVe',
      note: 'Dermatologist recommended, barrier support',
      price: '$19.99',
    },
    {
      name: 'La Roche-Posay Toleriane Double Repair',
      brand: 'La Roche-Posay',
      note: 'Great for sensitive skin',
      price: '$21.99',
    },
  ],
  retinol: [
    {
      name: 'Retinol 0.2% in Squalane',
      brand: 'The Ordinary',
      note: 'Gentle entry-level retinol',
      price: '$5.80',
    },
    {
      name: 'Advanced Night Repair Serum',
      brand: 'Estée Lauder',
      note: 'Iconic anti-aging serum',
      price: '$115.00',
    },
    {
      name: 'Retinol Correxion Line Smoothing Serum',
      brand: 'RoC',
      note: 'Clinically proven results',
      price: '$24.97',
    },
    {
      name: 'Neutrogena Rapid Wrinkle Repair',
      brand: 'Neutrogena',
      note: 'Drugstore favorite',
      price: '$18.97',
    },
  ],
  vitamin_c: [
    {
      name: 'C E Ferulic',
      brand: 'SkinCeuticals',
      note: 'Gold standard Vitamin C serum',
      price: '$182.00',
    },
    {
      name: 'Vitamin C Suspension 23% + HA Spheres 2%',
      brand: 'The Ordinary',
      note: 'High potency, budget-friendly',
      price: '$6.50',
    },
    {
      name: 'Guava Vitamin C Dark Spot Serum',
      brand: 'Glow Recipe',
      note: 'Brightening + hydrating',
      price: '$42.00',
    },
    {
      name: "Powerful-Strength Line-Reducing Concentrate",
      brand: "Kiehl's",
      note: 'Smoothing + brightening',
      price: '$82.00',
    },
  ],
  niacinamide: [
    {
      name: 'Niacinamide 10% + Zinc 1%',
      brand: 'The Ordinary',
      note: 'Pore-minimizing classic',
      price: '$6.50',
    },
    {
      name: 'Niacinamide Serum 12% Plus Zinc 2%',
      brand: 'Naturium',
      note: 'High concentration, affordable',
      price: '$19.99',
    },
    {
      name: '10% Niacinamide Booster',
      brand: "Paula's Choice",
      note: 'Customizable strength',
      price: '$47.00',
    },
    {
      name: 'Super Niacinamide Moisturizer SPF 40',
      brand: 'Neutrogena',
      note: 'SPF + niacinamide combo',
      price: '$21.99',
    },
  ],
  hyaluronic_acid: [
    {
      name: 'Hyaluronic Acid 2% + B5',
      brand: 'The Ordinary',
      note: 'Multi-weight HA hydration',
      price: '$6.80',
    },
    {
      name: 'Hydro Boost Water Gel',
      brand: 'Neutrogena',
      note: 'Lightweight gel moisturizer',
      price: '$23.99',
    },
    {
      name: 'HA5 Rejuvenating Hydrator',
      brand: 'SkinMedica',
      note: 'Five forms of HA',
      price: '$178.00',
    },
    {
      name: 'Minéral 89 Hyaluronic Acid Serum',
      brand: 'Vichy',
      note: 'Soothing + plumping',
      price: '$29.50',
    },
  ],
  glycolic_acid: [
    {
      name: 'Glycolic Acid 7% Toning Solution',
      brand: 'The Ordinary',
      note: 'Gentle daily exfoliant',
      price: '$9.90',
    },
    {
      name: 'Glow Tonic',
      brand: 'Pixi',
      note: 'Cult-favorite toner',
      price: '$15.00',
    },
    {
      name: 'Restore Lotion PHA 15',
      brand: 'NeoStrata',
      note: 'Gentle exfoliation + hydration',
      price: '$36.00',
    },
    {
      name: 'Glycolic Foaming Cleanser',
      brand: 'Mario Badescu',
      note: 'Exfoliating cleanser',
      price: '$14.00',
    },
  ],
  salicylic_acid: [
    {
      name: 'Salicylic Acid 2% Solution',
      brand: 'The Ordinary',
      note: 'Simple, targeted BHA',
      price: '$6.00',
    },
    {
      name: 'SA Smoothing Cleanser',
      brand: 'CeraVe',
      note: 'Daily cleanser with BHA',
      price: '$13.99',
    },
    {
      name: 'Skin Perfecting 2% BHA Liquid Exfoliant',
      brand: "Paula's Choice",
      note: 'Editor favorite',
      price: '$34.00',
    },
    {
      name: 'Effaclar Medicated Gel Cleanser',
      brand: 'La Roche-Posay',
      note: 'Acne-fighting cleanser',
      price: '$19.99',
    },
  ],
};

function getRecommendedProducts(name: string, inci: string) {
  const n = name.toLowerCase();
  const i = inci.toLowerCase();
  if (n.includes('retinol') || n.includes('retinoid') || i.includes('retinol')) return RECOMMENDED_PRODUCTS.retinol;
  if (n.includes('vitamin c') || n.includes('ascorbic') || i.includes('ascorbic')) return RECOMMENDED_PRODUCTS.vitamin_c;
  if (n.includes('niacinamide') || i.includes('niacinamide')) return RECOMMENDED_PRODUCTS.niacinamide;
  if (n.includes('hyaluronic') || i.includes('hyaluronic')) return RECOMMENDED_PRODUCTS.hyaluronic_acid;
  if (n.includes('glycolic') || i.includes('glycolic')) return RECOMMENDED_PRODUCTS.glycolic_acid;
  if (n.includes('salicylic') || i.includes('salicylic')) return RECOMMENDED_PRODUCTS.salicylic_acid;
  return RECOMMENDED_PRODUCTS.default;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IngredientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ingredients = useIngredients();
  const products = useProducts();

  const ingredient = ingredients.find((i) => i.id === id);

  const productsWithIngredient = useMemo(
    () =>
      ingredient
        ? products.filter(
            (p) =>
              p.ingredients.includes(ingredient.id) ||
              p.keyIngredients.includes(ingredient.id)
          )
        : [],
    [products, ingredient]
  );

  const recommendedProducts = useMemo(
    () => (ingredient ? getRecommendedProducts(ingredient.name, ingredient.inci) : []),
    [ingredient]
  );

  const relatedConflicts = useMemo(() => {
    if (!ingredient) return [];
    const nameLower = ingredient.name.toLowerCase();
    const catLower = ingredient.category.toLowerCase();
    return INGREDIENT_CONFLICTS.filter(
      (c) =>
        nameLower.includes(c.a.toLowerCase()) ||
        nameLower.includes(c.b.toLowerCase()) ||
        catLower.includes(c.a.toLowerCase()) ||
        catLower.includes(c.b.toLowerCase())
    );
  }, [ingredient]);

  if (!ingredient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FlaskConical className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Ingredient Not Found</h2>
          <p className="text-slate-400 mb-6">This ingredient doesn&apos;t exist in your database.</p>
          <Button onClick={() => router.push('/ingredients')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Ingredients
          </Button>
        </div>
      </div>
    );
  }

  const meta = EVIDENCE_META[ingredient.evidenceLevel];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 sticky top-0 z-10">
        <button
          onClick={() => router.push('/ingredients')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-500 transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Ingredients Encyclopedia
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                meta.bg
              )}
            >
              <FlaskConical className={cn('w-7 h-7', meta.text)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {ingredient.isActive && (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
                <h1 className="text-2xl font-bold text-slate-800">{ingredient.name}</h1>
              </div>
              <p className="text-slate-400 italic text-sm mt-0.5">{ingredient.inci}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border',
                meta.bg,
                meta.text,
                meta.border
              )}
            >
              {meta.label}
            </span>
            <span className="bg-rose-100 text-rose-700 text-sm rounded-full px-3 py-1 font-medium border border-rose-200">
              {ingredient.category}
            </span>
            {ingredient.isActive && (
              <span className="bg-amber-100 text-amber-700 text-sm rounded-full px-3 py-1 font-medium border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Active
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-6xl">
        <div className="grid grid-cols-3 gap-6">
          {/* Main content — left 2 columns */}
          <div className="col-span-2 space-y-6">
            {/* Evidence level card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl border p-6', meta.bg, meta.border)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/70',
                    meta.text
                  )}
                >
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className={cn('font-semibold text-base', meta.text)}>{meta.label}</p>
                  <p className={cn('text-sm mt-1 leading-relaxed', meta.text, 'opacity-80')}>
                    {meta.description}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* What it does */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
            >
              <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-400" />
                What It Does
              </h2>
              <p className="text-slate-600 leading-relaxed">{ingredient.whatItDoes}</p>
            </motion.div>

            {/* Benefits & Concerns */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {ingredient.benefits.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Benefits
                  </h3>
                  <ul className="space-y-2">
                    {ingredient.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ingredient.potentialConcerns.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Potential Concerns
                  </h3>
                  <ul className="space-y-2">
                    {ingredient.potentialConcerns.map((c) => (
                      <li key={c} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            {/* Skin types & concerns */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-2 gap-5"
            >
              {ingredient.skinTypes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-3 text-sm">Best For Skin Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {ingredient.skinTypes.map((st) => (
                      <span
                        key={st}
                        className="bg-blue-50 text-blue-700 text-sm rounded-full px-3 py-1 font-medium border border-blue-100 capitalize"
                      >
                        {st} skin
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ingredient.concerns.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-3 text-sm">Targets Concerns</h3>
                  <div className="flex flex-wrap gap-2">
                    {ingredient.concerns.map((c) => (
                      <span
                        key={c}
                        className="bg-rose-50 text-rose-600 text-sm rounded-full px-3 py-1 font-medium border border-rose-100"
                      >
                        {concernLabel(c)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {ingredient.notes && (
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <p className="text-sm text-slate-500 italic flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                  {ingredient.notes}
                </p>
              </div>
            )}

            {/* Compatibility warnings */}
            {relatedConflicts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-amber-50 rounded-2xl border border-amber-100 p-6"
              >
                <h2 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Compatibility Warnings
                </h2>
                <div className="space-y-4">
                  {relatedConflicts.map((conflict, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-amber-900 capitalize">
                          {conflict.a}
                        </span>
                        <span className="text-amber-400 text-xs font-bold">+</span>
                        <span className="font-semibold text-sm text-amber-900 capitalize">
                          {conflict.b}
                        </span>
                        <span
                          className={cn(
                            'ml-1 text-xs rounded-full px-2.5 py-0.5 font-semibold',
                            conflict.severity === 'avoid'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          )}
                        >
                          {conflict.severity === 'avoid' ? 'Avoid Together' : 'Use with Caution'}
                        </span>
                      </div>
                      <p className="text-sm text-amber-700 leading-relaxed pl-0">
                        {conflict.explanation}
                      </p>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                        <p className="text-xs text-emerald-700 font-medium flex items-start gap-1.5">
                          <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {conflict.tip}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar — right column */}
          <div className="col-span-1 space-y-5">
            {/* Your products */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-rose-400" />
                Your Products
                <span className="ml-auto bg-rose-100 text-rose-600 text-xs rounded-full px-2 py-0.5 font-semibold">
                  {productsWithIngredient.length}
                </span>
              </h3>

              {productsWithIngredient.length === 0 ? (
                <div className="text-center py-6">
                  <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    None of your shelf products contain this ingredient yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {productsWithIngredient.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2.5 rounded-xl p-2.5 border border-slate-100 hover:border-rose-100 hover:bg-rose-50/30 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: product.imageColor || '#f1f5f9' }}
                          >
                            <Package className="w-4 h-4 text-white/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-400">{product.brand}</p>
                        {product.rating && (
                          <StarRating value={product.rating.overall} size="sm" className="mt-0.5" />
                        )}
                      </div>
                      {product.keyIngredients.includes(ingredient.id) && (
                        <Sparkles className="w-3 h-3 text-rose-400 flex-shrink-0" aria-label="Key ingredient" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Recommended products */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Recommended Products
              </h3>
              <div className="space-y-3">
                {recommendedProducts.map((rp) => (
                  <div
                    key={rp.name}
                    className="rounded-xl border border-rose-50 bg-gradient-to-r from-rose-50 to-white p-3 space-y-1"
                  >
                    <p className="text-xs font-semibold text-slate-700 leading-tight">{rp.name}</p>
                    <p className="text-xs text-slate-400">{rp.brand}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-rose-600">{rp.note}</span>
                      {rp.price && (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-50 rounded-full px-2 py-0.5 border border-slate-100">
                          {rp.price}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick facts */}
            {ingredient.concentration && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">Quick Facts</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Typical Concentration</span>
                    <span className="font-medium text-slate-700">{ingredient.concentration}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
