'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Select from '@radix-ui/react-select';
import { useRouter } from 'next/navigation';
import {
  Search, ChevronDown, Check, X, Beaker, AlertTriangle,
  Sparkles, ExternalLink, Package, Shield, Info, ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { useProducts, useIngredients } from '@/lib/store';
import { cn, evidenceLevelColor, categoryColor, concernLabel } from '@/lib/utils';
import type { Ingredient, EvidenceLevel, SkinType, SkinConcern, Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

// ─── Constants ─────────────────────────────────────────────────────────────────

const EVIDENCE_LEVELS: EvidenceLevel[] = ['strong', 'moderate', 'emerging', 'limited', 'anecdotal'];
const SKIN_TYPES: SkinType[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];

const INGREDIENT_CATEGORIES = [
  'AHA', 'BHA', 'Vitamin', 'Retinoid', 'Humectant', 'Emollient', 'Occlusant',
  'Antioxidant', 'Peptide', 'Niacinamide', 'SPF Filter', 'Enzyme', 'Botanical',
  'Ceramide', 'Hyaluronic Acid', 'Collagen', 'Growth Factor', 'Brightener',
];

const EVIDENCE_META: Record<EvidenceLevel, { label: string; description: string; bg: string; text: string; border: string }> = {
  strong: {
    label: 'Strong Evidence',
    description: 'Backed by multiple rigorous clinical trials with consistent results.',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  moderate: {
    label: 'Moderate Evidence',
    description: 'Supported by several studies, though more research may be needed.',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  emerging: {
    label: 'Emerging Evidence',
    description: 'Promising early research, but larger studies are still underway.',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  limited: {
    label: 'Limited Evidence',
    description: 'Some in-vitro or small-scale studies, but human data is sparse.',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  anecdotal: {
    label: 'Anecdotal',
    description: 'Based primarily on user reports and traditional use, limited clinical data.',
    bg: 'bg-ivory-darker',
    text: 'text-obsidian-600',
    border: 'border-ivory-darker',
  },
};

// ─── Conflict pairs ─────────────────────────────────────────────────────────────

interface IngredientConflict {
  a: string; // partial name match
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
    explanation: 'Retinol and AHAs (like glycolic or lactic acid) together can cause significant irritation, redness, and peeling by over-exfoliating the skin barrier.',
    tip: 'Use AHAs in your AM routine and retinol in your PM routine on alternate nights.',
  },
  {
    a: 'retinol',
    b: 'BHA',
    severity: 'avoid',
    explanation: 'Combining retinol with BHAs (like salicylic acid) leads to excessive exfoliation, potentially compromising the skin barrier and causing sensitivity.',
    tip: 'Alternate usage — apply BHA in the morning and retinol at night, not on the same day.',
  },
  {
    a: 'Vitamin C',
    b: 'Niacinamide',
    severity: 'caution',
    explanation: 'High concentrations of Vitamin C (ascorbic acid) and niacinamide may form niacin when combined, potentially causing temporary flushing. Modern formulations often minimize this risk.',
    tip: 'Use them in separate steps with time between application, or choose a stabilized Vitamin C form.',
  },
  {
    a: 'Vitamin C',
    b: 'retinol',
    severity: 'caution',
    explanation: 'Both are potent actives and using them together can cause irritation. Vitamin C is also best used at a lower pH while retinol performs best at a higher pH.',
    tip: 'Use Vitamin C in your AM routine and retinol in your PM routine.',
  },
  {
    a: 'benzoyl peroxide',
    b: 'retinol',
    severity: 'avoid',
    explanation: 'Benzoyl peroxide can oxidize and inactivate retinol/retinoids, rendering them ineffective, while also increasing irritation risk.',
    tip: 'Use benzoyl peroxide in the morning and retinol at night.',
  },
  {
    a: 'AHA',
    b: 'BHA',
    severity: 'caution',
    explanation: 'Using AHAs and BHAs together can lead to over-exfoliation, causing dryness, irritation, and a compromised skin barrier.',
    tip: 'Alternate them on different days or use a pre-formulated combination product at safe concentrations.',
  },
  {
    a: 'Vitamin C',
    b: 'AHA',
    severity: 'caution',
    explanation: 'Both are acidic and using together may cause excessive irritation and pH imbalance. They can also degrade each other.',
    tip: 'Apply Vitamin C first, wait 20-30 minutes, then apply your AHA — or use at different times of day.',
  },
];

// ─── Static product suggestions per ingredient keyword ──────────────────────

const RECOMMENDED_PRODUCTS: Record<string, { name: string; brand: string; note: string }[]> = {
  default: [
    { name: 'The Ordinary Hyaluronic Acid 2% + B5', brand: 'The Ordinary', note: 'Affordable, effective hydration' },
    { name: 'CeraVe Moisturizing Cream', brand: 'CeraVe', note: 'Dermatologist recommended, barrier support' },
    { name: 'La Roche-Posay Toleriane Double Repair', brand: 'La Roche-Posay', note: 'Great for sensitive skin' },
  ],
  retinol: [
    { name: 'Retinol 0.2% in Squalane', brand: 'The Ordinary', note: 'Gentle entry-level retinol' },
    { name: 'Advanced Night Repair', brand: 'Estée Lauder', note: 'Iconic anti-aging serum' },
    { name: 'Retinol Correxion Line Smoothing Serum', brand: "RoC", note: 'Clinically proven results' },
    { name: 'Neutrogena Rapid Wrinkle Repair', brand: 'Neutrogena', note: 'Drugstore favorite' },
  ],
  vitamin_c: [
    { name: 'C E Ferulic', brand: 'SkinCeuticals', note: 'Gold standard Vitamin C serum' },
    { name: 'Vitamin C Suspension 23% + HA Spheres 2%', brand: 'The Ordinary', note: 'High potency, budget-friendly' },
    { name: 'Glow Recipe Guava Vitamin C Dark Spot Serum', brand: 'Glow Recipe', note: 'Brightening + hydrating' },
    { name: 'Kiehl\'s Powerful-Strength Line-Reducing Concentrate', brand: 'Kiehl\'s', note: 'Smoothing + brightening' },
  ],
  niacinamide: [
    { name: 'Niacinamide 10% + Zinc 1%', brand: 'The Ordinary', note: 'Pore-minimizing classic' },
    { name: 'Good Genes All-In-One Lactic Acid Treatment', brand: 'Sunday Riley', note: 'Multi-action brightening' },
    { name: 'Naturium Niacinamide Serum 12% Plus Zinc 2%', brand: 'Naturium', note: 'High concentration, affordable' },
    { name: 'Paula\'s Choice 10% Niacinamide Booster', brand: "Paula's Choice", note: 'Customizable strength' },
  ],
  hyaluronic_acid: [
    { name: 'Hyaluronic Acid 2% + B5', brand: 'The Ordinary', note: 'Multi-weight HA hydration' },
    { name: 'Neutrogena Hydro Boost Water Gel', brand: 'Neutrogena', note: 'Lightweight gel moisturizer' },
    { name: 'SkinMedica HA5 Rejuvenating Hydrator', brand: 'SkinMedica', note: 'Five forms of HA' },
    { name: 'Vichy Minéral 89 Hyaluronic Acid Serum', brand: 'Vichy', note: 'Soothing + plumping' },
  ],
  glycolic_acid: [
    { name: 'Glycolic Acid 7% Toning Solution', brand: 'The Ordinary', note: 'Gentle daily exfoliant' },
    { name: 'Pixi Glow Tonic', brand: 'Pixi', note: 'Cult favorite toner' },
    { name: 'NeoStrata Restore Lotion PHA 15', brand: 'NeoStrata', note: 'Gentle exfoliation + hydration' },
    { name: 'Mario Badescu Glycolic Foaming Cleanser', brand: 'Mario Badescu', note: 'Exfoliating cleanser' },
  ],
  salicylic_acid: [
    { name: 'Salicylic Acid 2% Solution', brand: 'The Ordinary', note: 'Simple, targeted BHA' },
    { name: 'CeraVe SA Smoothing Cleanser', brand: 'CeraVe', note: 'Daily cleanser with BHA' },
    { name: 'Paula\'s Choice Skin Perfecting 2% BHA Liquid Exfoliant', brand: "Paula's Choice", note: 'Editor favorite' },
    { name: 'La Roche-Posay Effaclar Medicated Gel Cleanser', brand: 'La Roche-Posay', note: 'Acne-fighting cleanser' },
  ],
};

function getRecommendedProducts(ingredient: Ingredient) {
  const nameLower = ingredient.name.toLowerCase();
  const inciLower = ingredient.inci.toLowerCase();

  if (nameLower.includes('retinol') || nameLower.includes('retinoid') || inciLower.includes('retinol')) {
    return RECOMMENDED_PRODUCTS.retinol;
  }
  if (nameLower.includes('vitamin c') || nameLower.includes('ascorbic') || inciLower.includes('ascorbic')) {
    return RECOMMENDED_PRODUCTS.vitamin_c;
  }
  if (nameLower.includes('niacinamide') || inciLower.includes('niacinamide')) {
    return RECOMMENDED_PRODUCTS.niacinamide;
  }
  if (nameLower.includes('hyaluronic') || inciLower.includes('hyaluronic')) {
    return RECOMMENDED_PRODUCTS.hyaluronic_acid;
  }
  if (nameLower.includes('glycolic') || inciLower.includes('glycolic')) {
    return RECOMMENDED_PRODUCTS.glycolic_acid;
  }
  if (nameLower.includes('salicylic') || inciLower.includes('salicylic')) {
    return RECOMMENDED_PRODUCTS.salicylic_acid;
  }
  return RECOMMENDED_PRODUCTS.default;
}

// ─── Evidence badge ───────────────────────────────────────────────────────────

function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  const meta = EVIDENCE_META[level];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
        meta.bg,
        meta.text,
        meta.border
      )}
    >
      {meta.label}
    </span>
  );
}

// ─── Ingredient Detail Modal ──────────────────────────────────────────────────

function IngredientDetailModal({
  ingredient,
  open,
  onClose,
}: {
  ingredient: Ingredient;
  open: boolean;
  onClose: () => void;
}) {
  const products = useProducts();
  const meta = EVIDENCE_META[ingredient.evidenceLevel];

  const productsWithIngredient = useMemo(
    () =>
      products.filter(
        (p) =>
          p.ingredients.includes(ingredient.id) || p.keyIngredients.includes(ingredient.id)
      ),
    [products, ingredient.id]
  );

  const recommendedProducts = useMemo(
    () => getRecommendedProducts(ingredient),
    [ingredient]
  );

  const relatedConflicts = useMemo(() => {
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

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
              meta.bg
            )}
          >
            <FlaskConical className={cn('w-7 h-7', meta.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-obsidian-800">{ingredient.name}</h2>
            <p className="text-sm text-obsidian-400 italic mt-0.5">{ingredient.inci}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <EvidenceBadge level={ingredient.evidenceLevel} />
              <span className="bg-rose-100 text-rose-700 text-xs rounded-full px-2.5 py-0.5 font-medium border border-rose-200">
                {ingredient.category}
              </span>
              {ingredient.isActive && (
                <span className="bg-amber-100 text-amber-700 text-xs rounded-full px-2.5 py-0.5 font-medium border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Active Ingredient
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Evidence level explanation */}
        <div className={cn('rounded-xl p-4 border', meta.bg, meta.border)}>
          <div className="flex items-start gap-2">
            <Shield className={cn('w-4 h-4 mt-0.5 flex-shrink-0', meta.text)} />
            <div>
              <p className={cn('text-sm font-semibold', meta.text)}>{meta.label}</p>
              <p className={cn('text-xs mt-0.5', meta.text, 'opacity-80')}>{meta.description}</p>
            </div>
          </div>
        </div>

        {/* What it does */}
        <div>
          <h3 className="text-sm font-semibold text-obsidian-700 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-400" />
            What It Does
          </h3>
          <p className="text-sm text-obsidian-600 leading-relaxed bg-ivory-dark rounded-xl p-3">
            {ingredient.whatItDoes}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Benefits */}
          {ingredient.benefits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-obsidian-700 mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Benefits
              </h3>
              <div className="space-y-1.5">
                {ingredient.benefits.map((b) => (
                  <div key={b} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-obsidian-600">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {ingredient.potentialConcerns.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-obsidian-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Potential Concerns
              </h3>
              <div className="space-y-1.5">
                {ingredient.potentialConcerns.map((c) => (
                  <div key={c} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-sm text-obsidian-600">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Best for skin types */}
          {ingredient.skinTypes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-obsidian-700 mb-2">Best For</h3>
              <div className="flex flex-wrap gap-1.5">
                {ingredient.skinTypes.map((st) => (
                  <span
                    key={st}
                    className="bg-blue-50 text-blue-700 text-xs rounded-full px-2.5 py-1 font-medium border border-blue-100 capitalize"
                  >
                    {st} skin
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Targets concerns */}
          {ingredient.concerns.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-obsidian-700 mb-2">Targets</h3>
              <div className="flex flex-wrap gap-1.5">
                {ingredient.concerns.map((c) => (
                  <span
                    key={c}
                    className="bg-rose-50 text-rose-600 text-xs rounded-full px-2.5 py-1 font-medium border border-rose-100"
                  >
                    {concernLabel(c)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {ingredient.notes && (
          <div className="bg-ivory-dark rounded-xl p-3 border border-ivory-darker">
            <p className="text-xs text-obsidian-500 italic">Note: {ingredient.notes}</p>
          </div>
        )}

        {/* Your products with this ingredient */}
        <div>
          <h3 className="text-sm font-semibold text-obsidian-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-rose-400" />
            Your Products with {ingredient.name}
            <span className="bg-rose-100 text-rose-600 text-xs rounded-full px-2 py-0.5 font-medium ml-auto">
              {productsWithIngredient.length}
            </span>
          </h3>
          {productsWithIngredient.length === 0 ? (
            <div className="text-center py-6 bg-ivory-dark rounded-xl border border-ivory-darker">
              <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-obsidian-400">None of your shelf products contain this ingredient.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {productsWithIngredient.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-2.5 bg-ivory-dark rounded-xl p-2.5 border border-ivory-darker hover:border-rose-100 hover:bg-rose-50/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex-shrink-0">
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
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-obsidian-700 truncate">{product.name}</p>
                    <p className="text-xs text-obsidian-400 truncate">{product.brand}</p>
                  </div>
                  {product.keyIngredients.includes(ingredient.id) && (
                    <Sparkles className="w-3 h-3 text-rose-400 flex-shrink-0 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended products */}
        <div>
          <h3 className="text-sm font-semibold text-obsidian-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Recommended Products to Try
          </h3>
          <div className="space-y-2">
            {recommendedProducts.map((rp) => (
              <div
                key={rp.name}
                className="flex items-center justify-between gap-3 bg-gradient-to-r from-rose-50 to-white rounded-xl p-3 border border-rose-100/60"
              >
                <div>
                  <p className="text-sm font-semibold text-obsidian-700">{rp.name}</p>
                  <p className="text-xs text-obsidian-400">{rp.brand}</p>
                </div>
                <span className="text-xs text-rose-600 bg-rose-50 rounded-full px-2.5 py-0.5 flex-shrink-0 border border-rose-100">
                  {rp.note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Related conflicts */}
        {relatedConflicts.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Compatibility Warnings
            </h3>
            <div className="space-y-3">
              {relatedConflicts.map((conflict, i) => (
                <div key={i} className="text-xs text-amber-800 space-y-1">
                  <p className="font-semibold capitalize">
                    {conflict.a} + {conflict.b}
                    <span
                      className={cn(
                        'ml-2 rounded-full px-2 py-0.5 font-medium',
                        conflict.severity === 'avoid'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-700'
                      )}
                    >
                      {conflict.severity === 'avoid' ? 'Avoid' : 'Use with caution'}
                    </span>
                  </p>
                  <p className="text-amber-700 leading-relaxed">{conflict.explanation}</p>
                  <p className="text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 border border-emerald-100">
                    Tip: {conflict.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Ingredient Card ──────────────────────────────────────────────────────────

function IngredientCard({
  ingredient,
  productCount,
  onClick,
}: {
  ingredient: Ingredient;
  productCount: number;
  onClick: () => void;
}) {
  const meta = EVIDENCE_META[ingredient.evidenceLevel];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-ivory-darker shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group p-5"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {ingredient.isActive && (
              <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
            )}
            <h3 className="font-semibold text-obsidian-800 text-sm leading-tight">
              {ingredient.name}
            </h3>
          </div>
          <p className="text-xs text-obsidian-400 italic mt-0.5 truncate">{ingredient.inci}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-obsidian-300 group-hover:text-rose-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
            meta.bg,
            meta.text,
            meta.border
          )}
        >
          {meta.label}
        </span>
        <span className="bg-rose-50 text-rose-600 text-xs rounded-full px-2 py-0.5 font-medium border border-rose-100">
          {ingredient.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-obsidian-500 leading-relaxed line-clamp-2 mb-3">
        {ingredient.whatItDoes}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {ingredient.benefits.slice(0, 2).map((b) => (
            <span key={b} className="bg-ivory-dark text-obsidian-500 text-xs rounded-full px-2 py-0.5">
              {b}
            </span>
          ))}
          {ingredient.benefits.length > 2 && (
            <span className="text-xs text-obsidian-300">+{ingredient.benefits.length - 2}</span>
          )}
        </div>
        {productCount > 0 ? (
          <span className="text-xs font-semibold text-rose-500 bg-rose-50 rounded-full px-2.5 py-0.5 border border-rose-100 flex-shrink-0">
            {productCount} product{productCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-obsidian-300 flex-shrink-0">Not in shelf</span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IngredientsPage() {
  const ingredients = useIngredients();
  const products = useProducts();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterEvidence, setFilterEvidence] = useState<EvidenceLevel | 'all'>('all');
  const [filterSkinType, setFilterSkinType] = useState<SkinType | 'all'>('all');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Count products per ingredient
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    ingredients.forEach((ing) => {
      map[ing.id] = products.filter(
        (p) => p.ingredients.includes(ing.id) || p.keyIngredients.includes(ing.id)
      ).length;
    });
    return map;
  }, [ingredients, products]);

  // Available categories from data
  const availableCategories = useMemo(() => {
    const cats = new Set(ingredients.map((i) => i.category));
    return Array.from(cats).sort();
  }, [ingredients]);

  // Filtering
  const filtered = useMemo(() => {
    let result = [...ingredients];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.inci.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.whatItDoes.toLowerCase().includes(q) ||
          i.benefits.some((b) => b.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter((i) => i.category === filterCategory);
    }
    if (filterEvidence !== 'all') {
      result = result.filter((i) => i.evidenceLevel === filterEvidence);
    }
    if (filterSkinType !== 'all') {
      result = result.filter((i) => i.skinTypes.includes(filterSkinType));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [ingredients, search, filterCategory, filterEvidence, filterSkinType]);

  const activeFilterCount = [
    filterCategory !== 'all',
    filterEvidence !== 'all',
    filterSkinType !== 'all',
  ].filter(Boolean).length;

  function clearFilters() {
    setFilterCategory('all');
    setFilterEvidence('all');
    setFilterSkinType('all');
    setSearch('');
  }

  // Stats
  const stats = useMemo(() => {
    const byEvidence: Partial<Record<EvidenceLevel, number>> = {};
    ingredients.forEach((i) => {
      byEvidence[i.evidenceLevel] = (byEvidence[i.evidenceLevel] || 0) + 1;
    });
    const inShelf = ingredients.filter((i) => (productCountMap[i.id] || 0) > 0).length;
    return { byEvidence, inShelf };
  }, [ingredients, productCountMap]);

  return (
    <div className="min-h-screen bg-ivory-dark">
      {/* Header */}
      <div className="bg-white border-b border-ivory-darker px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-obsidian-800 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-rose-500" />
              Ingredients Encyclopedia
            </h1>
            <p className="text-obsidian-500 text-sm mt-1">
              {ingredients.length} ingredients tracked &middot; {stats.inShelf} in your shelf
            </p>
          </div>
        </div>

        {/* Evidence level overview */}
        <div className="flex flex-wrap gap-2 mt-4">
          {EVIDENCE_LEVELS.map((level) => {
            const count = stats.byEvidence[level] || 0;
            if (count === 0) return null;
            const meta = EVIDENCE_META[level];
            return (
              <button
                key={level}
                onClick={() =>
                  setFilterEvidence((prev) => (prev === level ? 'all' : level))
                }
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all',
                  filterEvidence === level
                    ? cn(meta.bg, meta.text, meta.border)
                    : 'bg-white text-obsidian-500 border-ivory-darker hover:border-slate-300'
                )}
              >
                {meta.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-bold',
                    filterEvidence === level ? 'bg-white/60' : 'bg-ivory-darker'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-8 py-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredients, INCI names, benefits..."
              className="w-full rounded-lg border border-ivory-darker pl-9 pr-4 py-2 text-sm text-obsidian-800 placeholder:text-obsidian-400 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <Select.Root value={filterCategory} onValueChange={setFilterCategory}>
            <Select.Trigger className="flex items-center gap-2 rounded-lg border border-ivory-darker px-3 py-2 text-sm text-obsidian-700 bg-white hover:bg-ivory-dark focus:outline-none focus:ring-2 focus:ring-rose-300 min-w-36">
              <Beaker className="w-3.5 h-3.5 text-obsidian-400" />
              <Select.Value placeholder="Category" />
              <ChevronDown className="w-3.5 h-3.5 text-obsidian-400 ml-auto" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 bg-white rounded-xl shadow-lg border border-ivory-darker max-h-64 overflow-y-auto">
                <Select.Viewport className="p-1">
                  <Select.Item
                    value="all"
                    className="flex items-center px-3 py-2 text-sm text-obsidian-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                  >
                    <Select.ItemText>All Categories</Select.ItemText>
                  </Select.Item>
                  {availableCategories.map((cat) => (
                    <Select.Item
                      key={cat}
                      value={cat}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-obsidian-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                    >
                      <Select.ItemText>{cat}</Select.ItemText>
                      <Select.ItemIndicator className="ml-auto">
                        <Check className="w-3.5 h-3.5 text-rose-500" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          {/* Evidence filter */}
          <Select.Root value={filterEvidence} onValueChange={(v) => setFilterEvidence(v as EvidenceLevel | 'all')}>
            <Select.Trigger className="flex items-center gap-2 rounded-lg border border-ivory-darker px-3 py-2 text-sm text-obsidian-700 bg-white hover:bg-ivory-dark focus:outline-none focus:ring-2 focus:ring-rose-300 min-w-36">
              <Shield className="w-3.5 h-3.5 text-obsidian-400" />
              <Select.Value placeholder="Evidence" />
              <ChevronDown className="w-3.5 h-3.5 text-obsidian-400 ml-auto" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 bg-white rounded-xl shadow-lg border border-ivory-darker">
                <Select.Viewport className="p-1">
                  <Select.Item
                    value="all"
                    className="flex items-center px-3 py-2 text-sm text-obsidian-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                  >
                    <Select.ItemText>All Evidence Levels</Select.ItemText>
                  </Select.Item>
                  {EVIDENCE_LEVELS.map((level) => {
                    const meta = EVIDENCE_META[level];
                    return (
                      <Select.Item
                        key={level}
                        value={level}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-obsidian-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                      >
                        <span className={cn('w-2 h-2 rounded-full', meta.bg, 'border', meta.border)} />
                        <Select.ItemText>{meta.label}</Select.ItemText>
                        <Select.ItemIndicator className="ml-auto">
                          <Check className="w-3.5 h-3.5 text-rose-500" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    );
                  })}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          {/* Skin type filter */}
          <Select.Root value={filterSkinType} onValueChange={(v) => setFilterSkinType(v as SkinType | 'all')}>
            <Select.Trigger className="flex items-center gap-2 rounded-lg border border-ivory-darker px-3 py-2 text-sm text-obsidian-700 bg-white hover:bg-ivory-dark focus:outline-none focus:ring-2 focus:ring-rose-300 min-w-36">
              <Select.Value placeholder="Skin Type" />
              <ChevronDown className="w-3.5 h-3.5 text-obsidian-400 ml-auto" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 bg-white rounded-xl shadow-lg border border-ivory-darker">
                <Select.Viewport className="p-1">
                  <Select.Item
                    value="all"
                    className="flex items-center px-3 py-2 text-sm text-obsidian-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                  >
                    <Select.ItemText>All Skin Types</Select.ItemText>
                  </Select.Item>
                  {SKIN_TYPES.map((st) => (
                    <Select.Item
                      key={st}
                      value={st}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-obsidian-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700 capitalize"
                    >
                      <Select.ItemText className="capitalize">{st} skin</Select.ItemText>
                      <Select.ItemIndicator className="ml-auto">
                        <Check className="w-3.5 h-3.5 text-rose-500" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-obsidian-500">
          Showing <span className="font-semibold text-obsidian-700">{filtered.length}</span> of{' '}
          {ingredients.length} ingredients
        </p>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-2xl border border-ivory-darker"
          >
            <FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="font-semibold text-obsidian-700 mb-1">No ingredients found</h3>
            <p className="text-sm text-obsidian-400 mb-4">Try adjusting your search or filters</p>
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </motion.div>
        )}

        {/* Ingredient grid */}
        {filtered.length > 0 && (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {filtered.map((ingredient) => (
                <IngredientCard
                  key={ingredient.id}
                  ingredient={ingredient}
                  productCount={productCountMap[ingredient.id] || 0}
                  onClick={() => setSelectedIngredient(ingredient)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ─── Ingredient Conflict Warnings ─────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-obsidian-800">Ingredient Compatibility Guide</h2>
          </div>
          <p className="text-sm text-obsidian-500 mb-5">
            Some ingredients can interact negatively when used together. Here are common combinations
            to be aware of.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INGREDIENT_CONFLICTS.map((conflict, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'rounded-2xl border p-5',
                  conflict.severity === 'avoid'
                    ? 'bg-red-50/60 border-red-100'
                    : 'bg-amber-50/60 border-amber-100'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-obsidian-800 capitalize">
                      {conflict.a}
                    </span>
                    <span className="text-obsidian-400 text-xs">+</span>
                    <span className="font-semibold text-sm text-obsidian-800 capitalize">
                      {conflict.b}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-xs rounded-full px-2.5 py-0.5 font-semibold flex-shrink-0',
                      conflict.severity === 'avoid'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    )}
                  >
                    {conflict.severity === 'avoid' ? 'Avoid Together' : 'Use with Caution'}
                  </span>
                </div>

                <p className="text-xs text-obsidian-600 leading-relaxed mb-3">
                  {conflict.explanation}
                </p>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-emerald-700 font-medium flex items-start gap-1.5">
                    <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {conflict.tip}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Ingredient detail modal */}
      {selectedIngredient && (
        <IngredientDetailModal
          ingredient={selectedIngredient}
          open={!!selectedIngredient}
          onClose={() => setSelectedIngredient(null)}
        />
      )}
    </div>
  );
}
