'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, AlertCircle, Star, TrendingUp, Calendar } from 'lucide-react';
import { useProducts, useUserProfile, useProcedures } from '@/lib/store';
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
import { addMonths, differenceInDays, parseISO, format } from 'date-fns';

function ShelfSection({ category, products, onProductClick }: {
  category: ProductCategory;
  products: Product[];
  onProductClick: (p: Product) => void;
}) {
  if (products.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2 ml-1">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor(category)}`}>
          {categoryLabel(category)}
        </span>
        <span className="text-xs text-obsidian-400">{products.length} product{products.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="relative">
        <div className="bg-gradient-to-b from-rose-50/60 to-white rounded-2xl pt-4 pb-0 px-6 border border-rose-100/50 min-h-[120px]">
          <div className="flex items-end gap-4 flex-wrap pb-5">
            {products.map((product, index) => (
              <ProductBottle
                key={product.id}
                product={product}
                onClick={() => onProductClick(product)}
                index={index}
              />
            ))}
          </div>
        </div>
        <div className="shelf-board h-4 rounded-b-xl" />
        <div className="h-3 bg-gradient-to-b from-black/8 to-transparent rounded-b-xl" />
      </div>
    </div>
  );
}

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

export default function HomePage() {
  const products = useProducts();
  const profile = useUserProfile();
  const procedures = useProcedures();
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
            {profile.name ? `Hello, ${profile.name} ✨` : 'Your Skincare Shelf ✨'}
          </h1>
          <p className="text-obsidian-500 mt-1">
            {products.length} products · {ratedProducts.length} reviewed · {profile.skinType} skin
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Alerts */}
      {(expiringProducts.length > 0 || expiredProducts.length > 0) && (
        <div className="mb-6 space-y-2">
          {expiredProducts.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-red-700">
                  {expiredProducts.length} product{expiredProducts.length > 1 ? 's' : ''} expired
                </div>
                <div className="text-xs text-red-500 mt-0.5">
                  {expiredProducts.map((p) => p.name).join(', ')}
                </div>
              </div>
            </div>
          )}
          {expiringProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-amber-700">
                  {expiringProducts.length} product{expiringProducts.length > 1 ? 's' : ''} expiring soon
                </div>
                <div className="text-xs text-amber-600 mt-0.5">
                  {expiringProducts.map((p) => `${p.name} (${daysUntilExpiry(p)}d)`).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 mb-8">
        <StatCard label="Products" value={products.length} sub={`${products.filter((p) => p.inRoutine).length} in routine`} icon={TrendingUp} color="bg-rose-50 text-rose-500" />
        <StatCard label="Avg Rating" value={avgRating} sub={`${ratedProducts.length} reviewed`} icon={Star} color="bg-amber-50 text-amber-500" />
        <StatCard label="Procedures" value={procedures.length} sub={upcomingProcedures.length > 0 ? `${upcomingProcedures[0].name} in ${upcomingProcedures[0].daysUntil}d` : 'No upcoming'} icon={Calendar} color="bg-purple-50 text-purple-500" />
        <StatCard label="Concerns" value={profile.skinConcerns.length} sub={profile.skinConcerns.slice(0, 2).map(concernLabel).join(', ')} icon={Sparkles} color="bg-emerald-50 text-emerald-500" />
      </div>

      {/* Routine Conflict Warnings */}
      <ConflictBanner />

      {/* The Shelf */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-obsidian-800">Your Shelf</h2>
          <div className="flex items-center gap-4 text-xs text-obsidian-400">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span>Expiring soon</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /><span>Expired</span></div>
          </div>
        </div>
        <div
          className="rounded-3xl p-6 min-h-96"
          style={{
            background: 'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 30%, #fff1f2 60%, #fdf4ff 100%)',
            boxShadow: 'inset 0 2px 20px rgba(244, 63, 94, 0.05)',
          }}
        >
          {allCategories.map((cat) => (
            <ShelfSection
              key={cat}
              category={cat}
              products={products.filter((p) => p.category === cat)}
              onProductClick={setSelectedProduct}
            />
          ))}
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
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${p.daysUntil < 14 ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
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
