'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Plus, X, Trash2, ExternalLink, Package, Syringe,
  ChevronDown, Star, DollarSign,
} from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { useAppStore } from '@/lib/store';
import { categoryLabel, concernLabel, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import type { WishlistItem, ProcedureWishlistItem, ProductCategory, ProcedureCategory, SkinConcern } from '@/lib/types';

const PRODUCT_CATEGORIES: ProductCategory[] = [
  'cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'eye-cream',
  'spf', 'mask', 'exfoliant', 'oil', 'mist', 'treatment', 'lip-care', 'body-care',
];

const PROCEDURE_CATEGORIES: ProcedureCategory[] = [
  'laser', 'injectables', 'facials', 'peels', 'microneedling', 'light-therapy', 'body', 'other',
];

const CONCERNS: SkinConcern[] = [
  'acne', 'hyperpigmentation', 'anti-aging', 'dryness', 'sensitivity',
  'redness', 'pores', 'texture', 'dullness', 'dark-circles', 'fine-lines', 'firmness',
];

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-sage-100 text-sage-700',
};

function PriorityLabel({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  return <Badge className={PRIORITY_COLORS[priority]}>{priority}</Badge>;
}

export default function WishlistPage() {
  const wishlist = useAppStore((s) => s.wishlist);
  const procedureWishlist = useAppStore((s) => s.procedureWishlist);
  const addWishlistItem = useAppStore((s) => s.addWishlistItem);
  const removeWishlistItem = useAppStore((s) => s.removeWishlistItem);
  const addProcedureWishlistItem = useAppStore((s) => s.addProcedureWishlistItem);
  const removeProcedureWishlistItem = useAppStore((s) => s.removeProcedureWishlistItem);

  const [tab, setTab] = useState<'products' | 'procedures'>('products');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddProcedure, setShowAddProcedure] = useState(false);

  // Add product form
  const [pName, setPName] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pCategory, setPCategory] = useState<ProductCategory>('serum');
  const [pPrice, setPPrice] = useState('');
  const [pUrl, setPUrl] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [pPriority, setPPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [pImageUrl, setPImageUrl] = useState('');

  // Add procedure form
  const [prName, setPrName] = useState('');
  const [prCategory, setPrCategory] = useState<ProcedureCategory>('facials');
  const [prCost, setPrCost] = useState('');
  const [prClinic, setPrClinic] = useState('');
  const [prNotes, setPrNotes] = useState('');
  const [prPriority, setPrPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [prConcerns, setPrConcerns] = useState<SkinConcern[]>([]);

  function handleAddProduct() {
    if (!pName.trim()) return;
    addWishlistItem({
      id: `wish-${Date.now()}`,
      name: pName.trim(),
      brand: pBrand.trim(),
      category: pCategory,
      imageUrl: pImageUrl.trim() || undefined,
      price: pPrice ? parseFloat(pPrice) : undefined,
      purchaseUrl: pUrl.trim() || undefined,
      notes: pNotes.trim() || undefined,
      addedDate: new Date().toISOString().split('T')[0],
      priority: pPriority,
    });
    setPName(''); setPBrand(''); setPPrice(''); setPUrl(''); setPNotes(''); setPImageUrl('');
    setShowAddProduct(false);
  }

  function handleAddProcedure() {
    if (!prName.trim()) return;
    addProcedureWishlistItem({
      id: `pwish-${Date.now()}`,
      name: prName.trim(),
      category: prCategory,
      estimatedCost: prCost ? parseFloat(prCost) : undefined,
      clinic: prClinic.trim() || undefined,
      notes: prNotes.trim() || undefined,
      addedDate: new Date().toISOString().split('T')[0],
      priority: prPriority,
      concerns: prConcerns,
    });
    setPrName(''); setPrCost(''); setPrClinic(''); setPrNotes(''); setPrConcerns([]);
    setShowAddProcedure(false);
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-obsidian-800">Wishlist</h1>
          <p className="text-obsidian-500 mt-1">Products and procedures you want to try</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-ivory-dark rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('products')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'products' ? 'bg-white shadow-sm text-obsidian-800' : 'text-obsidian-400 hover:text-obsidian-600'
          )}
        >
          <Package className="w-4 h-4" /> Products ({wishlist.length})
        </button>
        <button
          onClick={() => setTab('procedures')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'procedures' ? 'bg-white shadow-sm text-obsidian-800' : 'text-obsidian-400 hover:text-obsidian-600'
          )}
        >
          <Syringe className="w-4 h-4" /> Procedures ({procedureWishlist.length})
        </button>
      </div>

      {/* Products Wishlist */}
      {tab === 'products' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowAddProduct(true)}>
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </div>
          {wishlist.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <Heart className="w-8 h-8 text-obsidian-300 mx-auto mb-3" />
                <p className="text-sm text-obsidian-400">Your product wishlist is empty</p>
                <Button size="sm" className="mt-3" onClick={() => setShowAddProduct(true)}>
                  <Plus className="w-4 h-4" /> Add your first item
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className="grid gap-3">
              {wishlist.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardBody className="flex items-center gap-4 p-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-ivory-darker flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-obsidian-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-obsidian-800 truncate">{item.name}</span>
                          <PriorityLabel priority={item.priority} />
                        </div>
                        <div className="text-xs text-obsidian-500 mt-0.5">{item.brand} · {categoryLabel(item.category)}</div>
                        {item.notes && <div className="text-xs text-obsidian-400 mt-1 truncate">{item.notes}</div>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {item.price && (
                          <span className="text-sm font-medium text-obsidian-600">${item.price}</span>
                        )}
                        {item.purchaseUrl && (
                          <a href={item.purchaseUrl} target="_blank" rel="noopener noreferrer" className="text-obsidian-400 hover:text-brand-500">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => removeWishlistItem(item.id)} className="text-obsidian-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Procedures Wishlist */}
      {tab === 'procedures' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowAddProcedure(true)}>
              <Plus className="w-4 h-4" /> Add Procedure
            </Button>
          </div>
          {procedureWishlist.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <Syringe className="w-8 h-8 text-obsidian-300 mx-auto mb-3" />
                <p className="text-sm text-obsidian-400">Your procedure wishlist is empty</p>
                <Button size="sm" className="mt-3" onClick={() => setShowAddProcedure(true)}>
                  <Plus className="w-4 h-4" /> Add your first procedure
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className="grid gap-3">
              {procedureWishlist.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardBody className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-berry-50 flex items-center justify-center flex-shrink-0">
                        <Syringe className="w-5 h-5 text-berry-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-obsidian-800">{item.name}</span>
                          <PriorityLabel priority={item.priority} />
                          <Badge className="bg-berry-100 text-berry-700">{item.category}</Badge>
                        </div>
                        {item.clinic && <div className="text-xs text-obsidian-500 mt-0.5">{item.clinic}</div>}
                        {item.concerns.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {item.concerns.map((c) => (
                              <span key={c} className="text-[10px] bg-ivory-darker text-obsidian-500 rounded-full px-1.5 py-0.5">{concernLabel(c)}</span>
                            ))}
                          </div>
                        )}
                        {item.notes && <div className="text-xs text-obsidian-400 mt-1 truncate">{item.notes}</div>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {item.estimatedCost && (
                          <span className="text-sm font-medium text-obsidian-600">${item.estimatedCost}</span>
                        )}
                        <button onClick={() => removeProcedureWishlistItem(item.id)} className="text-obsidian-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Product Wishlist Modal */}
      <Modal open={showAddProduct} onClose={() => setShowAddProduct(false)} title="Add to Product Wishlist">
        <div className="space-y-4">
          <Input label="Product Name *" placeholder="e.g. La Mer Moisturizing Cream" value={pName} onChange={(e) => setPName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Brand" placeholder="e.g. La Mer" value={pBrand} onChange={(e) => setPBrand(e.target.value)} />
            <div className="space-y-1">
              <label className="text-sm font-medium text-obsidian-700">Category</label>
              <select
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value as ProductCategory)}
                className="w-full rounded-lg border border-ivory-darker px-3 py-2 text-sm text-obsidian-800 bg-white"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price" type="number" placeholder="65.00" value={pPrice} onChange={(e) => setPPrice(e.target.value)} />
            <div className="space-y-1">
              <label className="text-sm font-medium text-obsidian-700">Priority</label>
              <div className="flex gap-1.5">
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <button key={p} onClick={() => setPPriority(p)} className={cn(
                    'flex-1 rounded-lg px-3 py-2 text-sm font-medium border capitalize transition-colors',
                    pPriority === p ? PRIORITY_COLORS[p] + ' border-current' : 'bg-white text-obsidian-500 border-ivory-darker'
                  )}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Input label="Image URL" placeholder="https://..." value={pImageUrl} onChange={(e) => setPImageUrl(e.target.value)} />
          <Input label="Purchase URL" placeholder="https://..." value={pUrl} onChange={(e) => setPUrl(e.target.value)} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-obsidian-700">Notes</label>
            <textarea
              value={pNotes}
              onChange={(e) => setPNotes(e.target.value)}
              placeholder="Why do you want this product?"
              rows={2}
              className="w-full rounded-lg border border-ivory-darker px-3 py-2 text-sm text-obsidian-800 placeholder:text-obsidian-400 bg-white resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-ivory-darker">
          <Button variant="secondary" onClick={() => setShowAddProduct(false)}>Cancel</Button>
          <Button onClick={handleAddProduct}><Plus className="w-4 h-4" /> Add</Button>
        </div>
      </Modal>

      {/* Add Procedure Wishlist Modal */}
      <Modal open={showAddProcedure} onClose={() => setShowAddProcedure(false)} title="Add to Procedure Wishlist">
        <div className="space-y-4">
          <Input label="Procedure Name *" placeholder="e.g. IPL Photofacial" value={prName} onChange={(e) => setPrName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-obsidian-700">Category</label>
              <select
                value={prCategory}
                onChange={(e) => setPrCategory(e.target.value as ProcedureCategory)}
                className="w-full rounded-lg border border-ivory-darker px-3 py-2 text-sm text-obsidian-800 bg-white"
              >
                {PROCEDURE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-obsidian-700">Priority</label>
              <div className="flex gap-1.5">
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <button key={p} onClick={() => setPrPriority(p)} className={cn(
                    'flex-1 rounded-lg px-3 py-2 text-sm font-medium border capitalize transition-colors',
                    prPriority === p ? PRIORITY_COLORS[p] + ' border-current' : 'bg-white text-obsidian-500 border-ivory-darker'
                  )}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Estimated Cost" type="number" placeholder="300" value={prCost} onChange={(e) => setPrCost(e.target.value)} />
            <Input label="Clinic" placeholder="e.g. SkinLab NYC" value={prClinic} onChange={(e) => setPrClinic(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-obsidian-700 mb-2 block">Concerns</label>
            <div className="flex flex-wrap gap-1.5">
              {CONCERNS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPrConcerns((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])}
                  className={cn(
                    'text-xs rounded-full px-2.5 py-1 border font-medium transition-colors',
                    prConcerns.includes(c)
                      ? 'bg-berry-100 text-berry-700 border-berry-200'
                      : 'bg-white text-obsidian-500 border-ivory-darker hover:border-berry-200'
                  )}
                >
                  {concernLabel(c)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-obsidian-700">Notes</label>
            <textarea
              value={prNotes}
              onChange={(e) => setPrNotes(e.target.value)}
              placeholder="Research notes, questions for consultation..."
              rows={2}
              className="w-full rounded-lg border border-ivory-darker px-3 py-2 text-sm text-obsidian-800 placeholder:text-obsidian-400 bg-white resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-ivory-darker">
          <Button variant="secondary" onClick={() => setShowAddProcedure(false)}>Cancel</Button>
          <Button onClick={handleAddProcedure}><Plus className="w-4 h-4" /> Add</Button>
        </div>
      </Modal>
    </div>
  );
}
