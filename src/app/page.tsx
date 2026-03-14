'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, AlertCircle, Star, TrendingUp, Calendar, X, Heart, Sun, Moon, CalendarDays, ShoppingBag, Syringe, ChevronRight, RefreshCw } from 'lucide-react';
import { useAppStore, useProducts, useUserProfile, useProcedures } from '@/lib/store';
import { ProductBottle } from '@/components/shelf/ProductBottle';
import { ProductDetailModal } from '@/components/shelf/ProductDetailModal';
import { AddProductModal } from '@/components/products/AddProductModal';
import type { Product } from '@/lib/types';
import { categoryLabel, categoryColor, daysUntilExpiry, getExpiryStatus, concernLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { BarcodeScanner } from '@/components/products/BarcodeScanner';
import { ConflictBanner } from '@/components/shelf/ConflictBanner';
import { addMonths, differenceInDays, parseISO, format, isBefore } from 'date-fns';

/* ─── Cabinet Shelf Row ───────────────────────────────────────────────────── */

function CabinetShelfRow({
  label,
  icon: Icon,
  products,
  onProductClick,
  isLast,
}: {
  label: string;
  icon: React.ElementType;
  products: Product[];
  onProductClick: (p: Product) => void;
  isLast?: boolean;
}) {
  return (
    <div className="relative">
      {/* Shelf label */}
      <div className="flex items-center gap-2 px-5 pt-3 pb-1">
        <Icon className="w-4 h-4" style={{ color: '#B5622A' }} />
        <span className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: '#8B6340', fontFamily: 'var(--font-display)' }}>
          {label}
        </span>
        <span className="text-[10px]" style={{ color: '#B5A08A' }}>{products.length} items</span>
      </div>

      {/* Products area — inside the cabinet */}
      <div
        className="flex items-end gap-3 flex-wrap px-5 pb-2 min-h-[120px]"
      >
        {products.map((product, index) => (
          <ProductBottle
            key={product.id}
            product={product}
            onClick={() => onProductClick(product)}
            index={index}
          />
        ))}
        {products.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-6">
            <span className="text-xs italic" style={{ color: '#B5A08A' }}>No products yet</span>
          </div>
        )}
      </div>

      {/* Glass shelf with shine and shadow */}
      {!isLast && (
        <div className="relative mx-2">
          {/* Shelf surface */}
          <div
            className="h-[6px] rounded-[1px]"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(230,225,218,0.9) 50%, rgba(210,203,194,0.8) 100%)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.6), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          />
          {/* Under-shelf shadow */}
          <div
            className="h-4"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 40%, transparent 100%)',
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Medicine Cabinet ────────────────────────────────────────────────────── */

function MedicineCabinet({
  amProducts,
  pmProducts,
  weeklyProducts,
  onProductClick,
}: {
  amProducts: Product[];
  pmProducts: Product[];
  weeklyProducts: Product[];
  onProductClick: (p: Product) => void;
}) {
  return (
    <div className="relative inline-block w-full max-w-3xl mx-auto">
      {/* ── Crown molding ── */}
      <div className="relative">
        {/* Top decorative piece */}
        <div
          className="h-3 mx-1 rounded-t-sm"
          style={{
            background: 'linear-gradient(180deg, #FAF8F5 0%, #F0EDE8 100%)',
            boxShadow: '0 -1px 0 rgba(255,255,255,0.95), inset 0 -1px 2px rgba(0,0,0,0.03)',
          }}
        />
        {/* Molding profile */}
        <div
          className="h-[10px] -mx-1"
          style={{
            background: 'linear-gradient(180deg, #FDFCFA 0%, #F5F2ED 30%, #EDE9E3 70%, #E8E3DC 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)',
            borderRadius: '2px 2px 0 0',
          }}
        />
        {/* Thinner sub-molding */}
        <div
          className="h-[5px] mx-0"
          style={{
            background: 'linear-gradient(180deg, #F2EFEA 0%, #EBE7E1 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 3px rgba(0,0,0,0.04)',
          }}
        />
      </div>

      {/* ── Cabinet body ── */}
      <div className="relative flex">
        {/* Left side panel */}
        <div
          className="w-[14px] flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, #EBE7E2 0%, #F3F0EC 40%, #EEEAE5 100%)',
            boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.03), inset 1px 0 0 rgba(255,255,255,0.8)',
          }}
        />

        {/* Interior */}
        <div
          className="flex-1"
          style={{
            background: 'linear-gradient(180deg, #FDFCFA 0%, #F8F5F1 50%, #F3EFEA 100%)',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.03), inset 0 0 30px rgba(0,0,0,0.015)',
          }}
        >
          {/* ── AM Shelf ── */}
          <CabinetShelfRow
            label="Morning"
            icon={Sun}
            products={amProducts}
            onProductClick={onProductClick}
          />

          {/* ── PM Shelf ── */}
          <CabinetShelfRow
            label="Evening"
            icon={Moon}
            products={pmProducts}
            onProductClick={onProductClick}
          />

          {/* ── Weekly Shelf ── */}
          <CabinetShelfRow
            label="Weekly"
            icon={CalendarDays}
            products={weeklyProducts}
            onProductClick={onProductClick}
            isLast
          />

          {/* Bottom padding */}
          <div className="h-3" />
        </div>

        {/* Right side panel */}
        <div
          className="w-[14px] flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, #EEEAE5 0%, #F3F0EC 60%, #EBE7E2 100%)',
            boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.03), inset -1px 0 0 rgba(255,255,255,0.8)',
          }}
        />
      </div>

      {/* ── Bottom frame ── */}
      <div
        className="h-[8px] mx-0"
        style={{
          background: 'linear-gradient(180deg, #F0EDE8 0%, #E8E3DC 50%, #E2DCD5 100%)',
          boxShadow: '0 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
          borderRadius: '0 0 3px 3px',
        }}
      />

      {/* Cabinet outer shadow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-sm"
        style={{
          boxShadow: '0 8px 30px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)',
        }}
      />
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="flex-1">
      <CardBody className="flex items-center gap-4 p-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-obsidian-800">{value}</div>
          <div className="text-xs text-obsidian-500">{label}</div>
          {sub && <div className="text-xs text-obsidian-400 mt-0.5">{sub}</div>}
        </div>
      </CardBody>
    </Card>
  );
}

/* ─── Product & Procedure Recommendations ─────────────────────────────────── */

interface ProductRec {
  name: string;
  brand: string;
  category: import('@/lib/types').ProductCategory;
  why: string;
  price?: number;
  concerns: import('@/lib/types').SkinConcern[];
}

interface ProcedureRec {
  name: string;
  category: import('@/lib/types').ProcedureCategory;
  why: string;
  estimatedCost?: number;
  concerns: import('@/lib/types').SkinConcern[];
}

const PRODUCT_RECS: Record<string, ProductRec[]> = {
  'hyperpigmentation': [
    { name: 'Discoloration Defense', brand: 'SkinCeuticals', category: 'serum', why: 'Tranexamic acid + niacinamide targets stubborn dark spots', price: 98, concerns: ['hyperpigmentation', 'dullness'] },
    { name: 'Alpha Arbutin 2% + HA', brand: 'The Ordinary', category: 'serum', why: 'Affordable brightening with alpha arbutin', price: 9, concerns: ['hyperpigmentation', 'dullness'] },
  ],
  'acne': [
    { name: 'Adapalene Gel 0.1%', brand: 'Differin', category: 'treatment', why: 'OTC retinoid proven for acne prevention', price: 15, concerns: ['acne', 'texture', 'pores'] },
    { name: 'BHA Liquid Exfoliant', brand: "Paula's Choice", category: 'exfoliant', why: '2% salicylic acid clears pores without over-drying', price: 34, concerns: ['acne', 'pores', 'texture'] },
  ],
  'anti-aging': [
    { name: 'A-Passioni Retinol Cream', brand: 'Drunk Elephant', category: 'treatment', why: '1% retinol in a nourishing, peptide-rich formula', price: 74, concerns: ['anti-aging', 'fine-lines', 'firmness'] },
    { name: 'Peptide Complex Serum', brand: 'Peter Thomas Roth', category: 'serum', why: 'Multi-peptide blend for collagen support', price: 52, concerns: ['anti-aging', 'firmness', 'fine-lines'] },
  ],
  'dryness': [
    { name: 'Moisture Surge Intense', brand: 'Clinique', category: 'moisturizer', why: '72-hour hydration with auto-replenishing technology', price: 42, concerns: ['dryness', 'sensitivity'] },
    { name: 'Hyaluronic Acid 2% + B5', brand: 'The Ordinary', category: 'serum', why: 'Multi-weight HA for deep hydration', price: 8, concerns: ['dryness', 'fine-lines'] },
  ],
  'sensitivity': [
    { name: 'Cicaplast Baume B5+', brand: 'La Roche-Posay', category: 'moisturizer', why: 'Barrier repair with madecassoside + panthenol', price: 17, concerns: ['sensitivity', 'redness', 'dryness'] },
  ],
  'pores': [
    { name: 'Pore Tightening Toner', brand: 'COSRX', category: 'toner', why: 'BHA + willow bark minimizes pore appearance', price: 18, concerns: ['pores', 'acne', 'texture'] },
  ],
  'texture': [
    { name: 'Good Genes Lactic Acid', brand: 'Sunday Riley', category: 'treatment', why: 'Lactic acid + licorice for smooth, bright skin', price: 85, concerns: ['texture', 'dullness', 'hyperpigmentation'] },
  ],
  'dullness': [
    { name: 'Glow Recipe Toner', brand: 'Glow Recipe', category: 'toner', why: 'PHA + watermelon for gentle glow without irritation', price: 34, concerns: ['dullness', 'texture'] },
  ],
  'fine-lines': [
    { name: 'Retinal 0.05%', brand: 'Avène', category: 'treatment', why: 'Retinaldehyde — stronger than retinol, less irritation', price: 48, concerns: ['fine-lines', 'anti-aging', 'firmness'] },
  ],
  'redness': [
    { name: 'Azelaic Acid Suspension 10%', brand: 'The Ordinary', category: 'treatment', why: 'Azelaic acid calms redness and rosacea', price: 8, concerns: ['redness', 'sensitivity', 'acne'] },
  ],
  'firmness': [
    { name: 'Firming Peptide Cream', brand: 'Naturium', category: 'moisturizer', why: 'Multi-peptide + bakuchiol for firming', price: 22, concerns: ['firmness', 'anti-aging', 'fine-lines'] },
  ],
};

const PROCEDURE_RECS: Record<string, ProcedureRec[]> = {
  'hyperpigmentation': [
    { name: 'IPL Photofacial', category: 'light-therapy', why: 'Targets melanin deposits for even tone', estimatedCost: 400, concerns: ['hyperpigmentation', 'redness'] },
    { name: 'VI Peel', category: 'peels', why: 'Medical-grade peel for stubborn discoloration', estimatedCost: 300, concerns: ['hyperpigmentation', 'texture'] },
  ],
  'anti-aging': [
    { name: 'Microneedling with PRP', category: 'microneedling', why: 'Stimulates collagen with your own growth factors', estimatedCost: 600, concerns: ['anti-aging', 'firmness', 'texture'] },
    { name: 'Ultherapy', category: 'other', why: 'Non-invasive ultrasound lifting for jowls and brows', estimatedCost: 3000, concerns: ['anti-aging', 'firmness'] },
  ],
  'acne': [
    { name: 'Blue LED Light Therapy', category: 'light-therapy', why: 'Kills acne bacteria without chemicals', estimatedCost: 75, concerns: ['acne'] },
    { name: 'Chemical Peel (Salicylic)', category: 'peels', why: 'Deep pore cleansing for persistent breakouts', estimatedCost: 200, concerns: ['acne', 'pores', 'texture'] },
  ],
  'texture': [
    { name: 'Fractional CO2 Laser', category: 'laser', why: 'Gold standard for texture and scarring', estimatedCost: 1200, concerns: ['texture', 'anti-aging'] },
  ],
  'pores': [
    { name: 'HydraFacial', category: 'facials', why: 'Deep extraction + hydration for refined pores', estimatedCost: 200, concerns: ['pores', 'dullness'] },
  ],
  'fine-lines': [
    { name: 'Botox / Dysport', category: 'injectables', why: 'Prevents and smooths dynamic wrinkles', estimatedCost: 400, concerns: ['fine-lines', 'anti-aging'] },
  ],
  'firmness': [
    { name: 'Sculptra', category: 'injectables', why: 'Stimulates your own collagen over months', estimatedCost: 800, concerns: ['firmness', 'anti-aging'] },
  ],
};

function getRoutineGaps(
  products: Product[],
  concerns: import('@/lib/types').SkinConcern[]
): { missingCategories: import('@/lib/types').ProductCategory[]; uncoveredConcerns: import('@/lib/types').SkinConcern[] } {
  const categories = new Set(products.map((p) => p.category));
  const coveredConcerns = new Set(products.flatMap((p) => p.concerns));

  const essentialCategories: import('@/lib/types').ProductCategory[] = ['cleanser', 'moisturizer', 'spf', 'serum'];
  const missingCategories = essentialCategories.filter((c) => !categories.has(c));
  const uncoveredConcerns = concerns.filter((c) => !coveredConcerns.has(c));

  return { missingCategories, uncoveredConcerns };
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const products = useProducts();
  const profile = useUserProfile();
  const procedures = useProcedures();
  const routine = useAppStore((s) => s.routine);
  const expirySnoozedUntil = useAppStore((s) => s.expirySnoozedUntil);
  const snoozeExpiryAlerts = useAppStore((s) => s.snoozeExpiryAlerts);
  const wishlist = useAppStore((s) => s.wishlist);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [recSeed, setRecSeed] = useState(0);

  const ratedProducts = products.filter((p) => p.rating);
  const avgRating = ratedProducts.length
    ? (ratedProducts.reduce((sum, p) => sum + (p.rating?.overall || 0), 0) / ratedProducts.length).toFixed(1)
    : '—';

  const expiringProducts = products.filter((p) => {
    const days = daysUntilExpiry(p);
    return days !== null && days < 30 && days >= 0;
  });
  const expiredProducts = products.filter((p) => getExpiryStatus(daysUntilExpiry(p)) === 'expired');

  const isExpirySnoozed = useMemo(() => {
    if (!expirySnoozedUntil) return false;
    return isBefore(new Date(), parseISO(expirySnoozedUntil));
  }, [expirySnoozedUntil]);

  // Group products by routine time
  const amProductIds = new Set(routine.am.map((s) => s.productId));
  const pmProductIds = new Set(routine.pm.map((s) => s.productId));
  const weeklyProductIds = new Set(routine.weekly.map((s) => s.productId));

  const amProducts = products.filter((p) => amProductIds.has(p.id));
  const pmProducts = products.filter((p) => pmProductIds.has(p.id) && !amProductIds.has(p.id));
  const weeklyProducts = products.filter((p) => weeklyProductIds.has(p.id));

  // Products not in any routine go into the shelf based on their routineStep field
  const unassigned = products.filter(
    (p) => !amProductIds.has(p.id) && !pmProductIds.has(p.id) && !weeklyProductIds.has(p.id)
  );
  // Merge unassigned into appropriate shelves
  const amAll = [
    ...amProducts,
    ...unassigned.filter((p) => p.routineStep === 'am' || p.routineStep === 'both'),
  ];
  const pmAll = [
    ...pmProducts,
    ...unassigned.filter((p) => p.routineStep === 'pm' || (!p.routineStep && !p.inRoutine)),
  ];
  const weeklyAll = [
    ...weeklyProducts,
    ...unassigned.filter((p) => p.routineStep === 'weekly'),
  ];

  // Any truly unassigned products go on the PM shelf as a default
  const allAssigned = new Set([...amAll, ...pmAll, ...weeklyAll].map((p) => p.id));
  const leftover = products.filter((p) => !allAssigned.has(p.id));
  const pmFinal = [...pmAll, ...leftover];

  const upcomingProcedures = procedures
    .filter((p) => p.nextAppointment)
    .map((p) => ({
      ...p,
      daysUntil: differenceInDays(parseISO(p.nextAppointment!), new Date()),
    }))
    .filter((p) => p.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  const overdueProcedures = procedures
    .filter((p) => p.recommendedIntervalMonths && !p.nextAppointment)
    .map((p) => {
      const dueDate = addMonths(parseISO(p.date), p.recommendedIntervalMonths!);
      const days = differenceInDays(dueDate, new Date());
      return { ...p, daysOverdue: -days };
    })
    .filter((p) => p.daysOverdue > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const addWishlistItem = useAppStore((s) => s.addWishlistItem);
  const addProcedureWishlistItem = useAppStore((s) => s.addProcedureWishlistItem);

  // Recommendations based on user concerns and routine gaps
  const { missingCategories, uncoveredConcerns } = useMemo(
    () => getRoutineGaps(products, profile.skinConcerns),
    [products, profile.skinConcerns]
  );

  const productRecs = useMemo(() => {
    const recs: ProductRec[] = [];
    const seen = new Set<string>();
    const ownedNames = new Set(products.map((p) => p.name.toLowerCase()));
    const wishlistNames = new Set(wishlist.map((w) => w.name.toLowerCase()));

    for (const concern of profile.skinConcerns) {
      for (const rec of PRODUCT_RECS[concern] || []) {
        const key = `${rec.brand}-${rec.name}`;
        if (!seen.has(key) && !ownedNames.has(rec.name.toLowerCase()) && !wishlistNames.has(rec.name.toLowerCase())) {
          seen.add(key);
          recs.push(rec);
        }
      }
    }
    // Rotate based on recSeed
    const offset = (recSeed * 2) % Math.max(recs.length, 1);
    const rotated = [...recs.slice(offset), ...recs.slice(0, offset)];
    return rotated.slice(0, 4);
  }, [products, profile.skinConcerns, wishlist, recSeed]);

  const procedureRecs = useMemo(() => {
    const recs: ProcedureRec[] = [];
    const seen = new Set<string>();
    const ownedNames = new Set(procedures.map((p) => p.name.toLowerCase()));

    for (const concern of profile.skinConcerns) {
      for (const rec of PROCEDURE_RECS[concern] || []) {
        if (!seen.has(rec.name) && !ownedNames.has(rec.name.toLowerCase())) {
          seen.add(rec.name);
          recs.push(rec);
        }
      }
    }
    const offset = (recSeed * 1) % Math.max(recs.length, 1);
    const rotated = [...recs.slice(offset), ...recs.slice(0, offset)];
    return rotated.slice(0, 3);
  }, [procedures, profile.skinConcerns, recSeed]);

  function quickAddProductToWishlist(rec: ProductRec) {
    addWishlistItem({
      id: `wish-${Date.now()}`,
      name: rec.name,
      brand: rec.brand,
      category: rec.category,
      price: rec.price,
      notes: rec.why,
      addedDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
    });
  }

  function quickAddProcedureToWishlist(rec: ProcedureRec) {
    addProcedureWishlistItem({
      id: `pwish-${Date.now()}`,
      name: rec.name,
      category: rec.category,
      estimatedCost: rec.estimatedCost,
      notes: rec.why,
      addedDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      concerns: rec.concerns,
    });
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl min-h-screen" style={{ background: '#DED5C8' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-obsidian-800">
            {profile.name ? `Hello, ${profile.name}` : 'Your Skincare Shelf'}
          </h1>
          <p className="text-obsidian-500 mt-1 text-sm">
            {products.length} products · {ratedProducts.length} reviewed · {profile.skinType} skin
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/wishlist'}>
            <Heart className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">Wishlist{wishlist.length > 0 && ` (${wishlist.length})`}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/insights'}>
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">AI Insights</span>
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
          </Button>
        </div>
      </div>

      {/* Expiry Alerts */}
      {!isExpirySnoozed && (expiringProducts.length > 0 || expiredProducts.length > 0) && (
        <div className="mb-6 space-y-2">
          {expiredProducts.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-700">
                  {expiredProducts.length} product{expiredProducts.length > 1 ? 's' : ''} expired
                </div>
                <div className="text-xs text-red-500 mt-0.5">
                  {expiredProducts.map((p) => p.name).join(', ')}
                </div>
              </div>
              <button onClick={snoozeExpiryAlerts} className="text-xs text-obsidian-400 hover:text-obsidian-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors" title="Dismiss for 7 days">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {expiringProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-amber-700">
                  {expiringProducts.length} product{expiringProducts.length > 1 ? 's' : ''} expiring soon
                </div>
                <div className="text-xs text-amber-600 mt-0.5">
                  {expiringProducts.map((p) => `${p.name} (${daysUntilExpiry(p)}d)`).join(', ')}
                </div>
              </div>
              <button onClick={snoozeExpiryAlerts} className="text-xs text-obsidian-400 hover:text-obsidian-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors" title="Dismiss for 7 days">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Products" value={products.length} sub={`${products.filter((p) => p.inRoutine).length} in routine`} icon={TrendingUp} color="bg-rose-50 text-rose-500" />
        <StatCard label="Avg Rating" value={avgRating} sub={`${ratedProducts.length} reviewed`} icon={Star} color="bg-amber-50 text-amber-500" />
        <StatCard label="Procedures" value={procedures.length} sub={upcomingProcedures.length > 0 ? `${upcomingProcedures[0].name} in ${upcomingProcedures[0].daysUntil}d` : 'No upcoming'} icon={Calendar} color="bg-berry-50 text-berry-500" />
        <StatCard label="Concerns" value={profile.skinConcerns.length} sub={profile.skinConcerns.slice(0, 2).map(concernLabel).join(', ')} icon={Sparkles} color="bg-emerald-50 text-emerald-500" />
      </div>

      {/* Routine Conflict Warnings */}
      <ConflictBanner />

      {/* ── The Medicine Cabinet ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-obsidian-800">Your Cabinet</h2>
          <div className="flex items-center gap-4 text-xs text-obsidian-400">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span>Expiring soon</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /><span>Expired</span></div>
          </div>
        </div>

        <MedicineCabinet
          amProducts={amAll}
          pmProducts={pmFinal}
          weeklyProducts={weeklyAll}
          onProductClick={setSelectedProduct}
        />
      </div>

      {/* ── Recommendations ── */}
      {(productRecs.length > 0 || procedureRecs.length > 0) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-obsidian-800">Recommended for You</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-obsidian-400">Based on your skin goals</span>
              <button
                onClick={() => setRecSeed((s) => s + 1)}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Routine gap notice */}
          {(missingCategories.length > 0 || uncoveredConcerns.length > 0) && (
            <div className="bg-gold-50 border border-gold-100 rounded-2xl p-4 mb-4">
              <div className="text-sm font-medium text-gold-700 mb-1">Routine Gaps</div>
              <div className="text-xs text-gold-600">
                {missingCategories.length > 0 && (
                  <span>Missing: {missingCategories.map(categoryLabel).join(', ')}. </span>
                )}
                {uncoveredConcerns.length > 0 && (
                  <span>No products targeting: {uncoveredConcerns.map(concernLabel).join(', ')}.</span>
                )}
              </div>
            </div>
          )}

          {/* Product Recs */}
          {productRecs.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-semibold text-obsidian-700">Products</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {productRecs.map((rec) => (
                  <Card key={`${rec.brand}-${rec.name}`} className="hover:shadow-md transition-shadow">
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-obsidian-800">{rec.name}</div>
                          <div className="text-xs text-obsidian-500">{rec.brand} · {categoryLabel(rec.category)}</div>
                          <div className="text-xs text-obsidian-400 mt-1">{rec.why}</div>
                          {rec.price && (
                            <div className="text-xs font-medium text-obsidian-600 mt-1.5">${rec.price}</div>
                          )}
                        </div>
                        <button
                          onClick={() => quickAddProductToWishlist(rec)}
                          className="flex-shrink-0 p-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                          title="Add to wishlist"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {rec.concerns.map((c) => (
                          <span key={c} className="text-[10px] bg-ivory-darker text-obsidian-500 rounded-full px-1.5 py-0.5">
                            {concernLabel(c)}
                          </span>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Procedure Recs */}
          {procedureRecs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Syringe className="w-4 h-4 text-berry-500" />
                <span className="text-sm font-semibold text-obsidian-700">Procedures</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {procedureRecs.map((rec) => (
                  <Card key={rec.name} className="hover:shadow-md transition-shadow">
                    <CardBody className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-obsidian-800">{rec.name}</div>
                          <div className="text-xs text-obsidian-500 capitalize">{rec.category}</div>
                          <div className="text-xs text-obsidian-400 mt-1">{rec.why}</div>
                          {rec.estimatedCost && (
                            <div className="text-xs font-medium text-obsidian-600 mt-1.5">~${rec.estimatedCost}</div>
                          )}
                        </div>
                        <button
                          onClick={() => quickAddProcedureToWishlist(rec)}
                          className="flex-shrink-0 p-2 rounded-xl bg-berry-50 text-berry-500 hover:bg-berry-100 transition-colors"
                          title="Add to procedure wishlist"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {rec.concerns.map((c) => (
                          <span key={c} className="text-[10px] bg-ivory-darker text-obsidian-500 rounded-full px-1.5 py-0.5">
                            {concernLabel(c)}
                          </span>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-obsidian-700 mb-3">Concerns Coverage</h3>
            <div className="space-y-2.5">
              {profile.skinConcerns.map((concern) => {
                const covered = products.filter((p) => p.concerns.includes(concern)).length;
                return (
                  <div key={concern} className="flex items-center gap-3">
                    <div className="text-xs text-obsidian-600 w-32 flex-shrink-0">{concernLabel(concern)}</div>
                    <div className="flex-1 bg-ivory-darker rounded-full h-1.5">
                      <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, covered * 33)}%` }} />
                    </div>
                    <div className="text-xs text-obsidian-400 w-16 text-right">{covered} products</div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-obsidian-700 mb-3">Procedure Schedule</h3>
            {upcomingProcedures.length === 0 && overdueProcedures.length === 0 ? (
              <p className="text-xs text-obsidian-400 text-center py-4">No upcoming procedures scheduled</p>
            ) : (
              <div className="space-y-2">
                {upcomingProcedures.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-ivory-dark">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${p.daysUntil < 14 ? 'bg-rose-100 text-rose-600' : 'bg-ivory-darker text-obsidian-500'}`}>
                      {p.daysUntil}d
                    </div>
                    <div>
                      <div className="text-xs font-medium text-obsidian-700">{p.name}</div>
                      <div className="text-xs text-obsidian-400">{format(parseISO(p.nextAppointment!), 'MMM d, yyyy')}</div>
                    </div>
                  </div>
                ))}
                {overdueProcedures.slice(0, 2).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold bg-amber-100 text-amber-600">!</div>
                    <div>
                      <div className="text-xs font-medium text-obsidian-700">{p.name}</div>
                      <div className="text-xs text-amber-500">Due {p.daysOverdue}d ago</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <BarcodeScanner />
    </div>
  );
}
