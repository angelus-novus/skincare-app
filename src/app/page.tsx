'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, AlertCircle, Star, TrendingUp, Calendar, X, Heart } from 'lucide-react';
import { useAppStore, useProducts, useUserProfile, useProcedures } from '@/lib/store';
import { ProductBottle } from '@/components/shelf/ProductBottle';
import { ProductDetailModal } from '@/components/shelf/ProductDetailModal';
import { AddProductModal } from '@/components/products/AddProductModal';
import type { Product, ProductCategory } from '@/lib/types';
import { categoryLabel, categoryColor, daysUntilExpiry, getExpiryStatus, concernLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { BarcodeScanner } from '@/components/products/BarcodeScanner';
import { ConflictBanner } from '@/components/shelf/ConflictBanner';
import { addMonths, differenceInDays, parseISO, format, isBefore } from 'date-fns';

/* ─── Realistic Shelf Row ─────────────────────────────────────────────────── */

function ShelfRow({ category, products, onProductClick }: {
  category: ProductCategory;
  products: Product[];
  onProductClick: (p: Product) => void;
}) {
  if (products.length === 0) return null;
  return (
    <div className="mb-2">
      {/* Category label */}
      <div className="flex items-center gap-2 mb-2 ml-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColor(category)}`}>
          {categoryLabel(category)}
        </span>
        <span className="text-[10px] text-obsidian-400">{products.length}</span>
      </div>
      {/* Products row sitting on the shelf */}
      <div className="relative">
        {/* Product surface area */}
        <div className="flex items-end gap-3 px-6 pb-1 min-h-[110px]">
          {products.map((product, index) => (
            <ProductBottle
              key={product.id}
              product={product}
              onClick={() => onProductClick(product)}
              index={index}
            />
          ))}
        </div>
        {/* The shelf board */}
        <div className="shelf-board h-[14px] rounded-sm" />
        {/* Shadow below shelf board */}
        <div
          className="h-8 rounded-b-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(28,25,23,0.12) 0%, rgba(28,25,23,0.04) 40%, transparent 100%)',
          }}
        />
      </div>
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

  // Check if expiry alerts are snoozed
  const isExpirySnoozed = useMemo(() => {
    if (!expirySnoozedUntil) return false;
    return isBefore(new Date(), parseISO(expirySnoozedUntil));
  }, [expirySnoozedUntil]);

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

  const allCategories = [...new Set(products.map((p) => p.category))];

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

      {/* Expiry Alerts (dismissable with 7-day snooze) */}
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
              <button
                onClick={snoozeExpiryAlerts}
                className="text-xs text-obsidian-400 hover:text-obsidian-600 px-2 py-1 rounded-lg hover:bg-white/60 transition-colors flex-shrink-0"
                title="Dismiss for 7 days"
              >
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
              <button
                onClick={snoozeExpiryAlerts}
                className="text-xs text-obsidian-400 hover:text-obsidian-600 px-2 py-1 rounded-lg hover:bg-white/60 transition-colors flex-shrink-0"
                title="Dismiss for 7 days"
              >
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

      {/* ── The Shelf (realistic vanity / bathroom shelf look) ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-obsidian-800">Your Shelf</h2>
          <div className="flex items-center gap-4 text-xs text-obsidian-400">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span>Expiring soon</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /><span>Expired</span></div>
          </div>
        </div>

        {/* Shelf container — simulates a wall-mounted cabinet / open shelf unit */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #F0EAE2 0%, #E8E0D5 50%, #DED5CA 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 32px rgba(28,25,23,0.08)',
            border: '1px solid rgba(201,169,110,0.15)',
          }}
        >
          <div className="px-2 pt-6 pb-2">
            {allCategories.map((cat) => (
              <ShelfRow
                key={cat}
                category={cat}
                products={products.filter((p) => p.category === cat)}
                onProductClick={setSelectedProduct}
              />
            ))}
            {products.length === 0 && (
              <div className="text-center py-16 text-obsidian-400">
                <p className="text-sm">Your shelf is empty. Add your first product!</p>
                <Button size="sm" className="mt-3" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              </div>
            )}
          </div>
        </div>
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
