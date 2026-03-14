'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, AlertCircle, Star, TrendingUp, Calendar, X, Heart, Sun, Moon, CalendarDays } from 'lucide-react';
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
        <Icon className="w-3.5 h-3.5" style={{ color: '#B5622A' }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8B6340', fontFamily: 'var(--font-display)' }}>
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
            background: 'linear-gradient(180deg, #E8E0D5 0%, #DDD5C8 100%)',
            boxShadow: '0 -1px 0 rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.04)',
          }}
        />
        {/* Molding profile */}
        <div
          className="h-[10px] -mx-1"
          style={{
            background: 'linear-gradient(180deg, #F0EAE2 0%, #E6DFD5 30%, #DDD5CA 70%, #D5CCBF 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
            borderRadius: '2px 2px 0 0',
          }}
        />
        {/* Thinner sub-molding */}
        <div
          className="h-[5px] mx-0"
          style={{
            background: 'linear-gradient(180deg, #E2DCD4 0%, #DCD5CC 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.05)',
          }}
        />
      </div>

      {/* ── Cabinet body ── */}
      <div className="relative flex">
        {/* Left side panel */}
        <div
          className="w-[14px] flex-shrink-0"
          style={{
            background: 'linear-gradient(90deg, #D8D0C5 0%, #E4DCD2 40%, #DFD7CC 100%)',
            boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.04), inset 1px 0 0 rgba(255,255,255,0.5)',
          }}
        />

        {/* Interior */}
        <div
          className="flex-1"
          style={{
            background: 'linear-gradient(180deg, #F5F0EA 0%, #EDE6DD 50%, #E8E0D6 100%)',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.04), inset 0 0 30px rgba(0,0,0,0.02)',
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
            background: 'linear-gradient(90deg, #DFD7CC 0%, #E4DCD2 60%, #D8D0C5 100%)',
            boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.04), inset -1px 0 0 rgba(255,255,255,0.5)',
          }}
        />
      </div>

      {/* ── Bottom frame ── */}
      <div
        className="h-[8px] mx-0"
        style={{
          background: 'linear-gradient(180deg, #DCD5CC 0%, #D5CCBF 50%, #CFC5B8 100%)',
          boxShadow: '0 3px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
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

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-obsidian-800">
            {profile.name ? `Hello, ${profile.name}` : 'Your Skincare Shelf'}
          </h1>
          <p className="text-obsidian-500 mt-1">
            {products.length} products · {ratedProducts.length} reviewed · {profile.skinType} skin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/wishlist'}>
            <Heart className="w-4 h-4 text-brand-400" />
            Wishlist{wishlist.length > 0 && ` (${wishlist.length})`}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/insights'}>
            <Sparkles className="w-4 h-4 text-rose-400" />
            AI Insights
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Product
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
      <div className="flex gap-4 mb-8">
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

      {/* Bottom panels */}
      <div className="grid grid-cols-2 gap-6">
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
