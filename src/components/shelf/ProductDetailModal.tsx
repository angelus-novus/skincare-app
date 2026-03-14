'use client';
import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { Textarea, Input } from '@/components/ui/input';
import type { Product, ProductRating, ProductCategory, SkinConcern } from '@/lib/types';
import { useAppStore, useIngredients } from '@/lib/store';
import { categoryLabel, concernLabel, formatDate, daysUntilExpiry, getExpiryStatus, categoryColor } from '@/lib/utils';
import {
  Star, ThumbsUp, ThumbsDown, AlertTriangle, Calendar, Package,
  DollarSign, Clock, ExternalLink, RefreshCw, Trash2, Edit2, CheckCircle2,
  Pencil, Save, X, Camera, Loader2, Wand2,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

const BLANK_RATING: ProductRating = {
  overall: 0,
  texture: 0,
  efficacy: 0,
  value: 0,
  pros: [],
  cons: [],
  notes: '',
  adverseReactions: [],
  wouldRepurchase: true,
  reviewDate: new Date().toISOString().split('T')[0],
};

const ALL_CATEGORIES: ProductCategory[] = [
  'cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'eye-cream',
  'spf', 'mask', 'exfoliant', 'oil', 'mist', 'treatment', 'lip-care', 'body-care',
];

export function ProductDetailModal({ product, open, onClose }: ProductDetailModalProps) {
  const [tab, setTab] = useState<'overview' | 'ingredients' | 'review'>('overview');
  const [editing, setEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false);
  const [draft, setDraft] = useState<ProductRating>(product.rating || BLANK_RATING);
  const [prosInput, setProsInput] = useState('');
  const [consInput, setConsInput] = useState('');
  const [adverseInput, setAdverseInput] = useState('');
  const ingredients = useIngredients();
  const { rateProduct, deleteProduct, updateProduct } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Edit product form state
  const [editName, setEditName] = useState(product.name);
  const [editBrand, setEditBrand] = useState(product.brand);
  const [editCategory, setEditCategory] = useState(product.category);
  const [editPrice, setEditPrice] = useState(product.price ? String(product.price) : '');
  const [editSize, setEditSize] = useState(product.size || '');
  const [editImageUrl, setEditImageUrl] = useState(product.imageUrl);
  const [editPurchaseUrl, setEditPurchaseUrl] = useState(product.purchaseUrl || '');
  const [editPaoMonths, setEditPaoMonths] = useState(product.paoMonths ? String(product.paoMonths) : '');
  const [editOpenedDate, setEditOpenedDate] = useState(product.openedDate || '');
  const [editExpiryDate, setEditExpiryDate] = useState(product.expiryDate || '');

  function startEditingProduct() {
    setEditName(product.name);
    setEditBrand(product.brand);
    setEditCategory(product.category);
    setEditPrice(product.price ? String(product.price) : '');
    setEditSize(product.size || '');
    setEditImageUrl(product.imageUrl);
    setEditPurchaseUrl(product.purchaseUrl || '');
    setEditPaoMonths(product.paoMonths ? String(product.paoMonths) : '');
    setEditOpenedDate(product.openedDate || '');
    setEditExpiryDate(product.expiryDate || '');
    setEditingProduct(true);
  }

  function saveProductEdits() {
    updateProduct(product.id, {
      name: editName.trim(),
      brand: editBrand.trim(),
      category: editCategory,
      price: editPrice ? parseFloat(editPrice) : undefined,
      size: editSize || undefined,
      imageUrl: editImageUrl,
      purchaseUrl: editPurchaseUrl.trim() || undefined,
      paoMonths: editPaoMonths ? parseInt(editPaoMonths, 10) : undefined,
      openedDate: editOpenedDate || undefined,
      expiryDate: editExpiryDate || undefined,
    });
    setEditingProduct(false);
  }

  function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 600;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize; }
          else { width = (width / height) * maxSize; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        setEditImageUrl(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function autoFillProduct() {
    if (!editName.trim() && !editBrand.trim()) return;
    setIsFetching(true);
    try {
      const res = await fetch('/api/product-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), brand: editBrand.trim() }),
      });
      if (!res.ok) throw new Error('Lookup failed');
      const data = await res.json();
      if (data.size && !editSize) setEditSize(data.size);
      if (data.price && !editPrice) setEditPrice(String(data.price));
      if (data.paoMonths && !editPaoMonths) setEditPaoMonths(String(data.paoMonths));
      if (data.category && ALL_CATEGORIES.includes(data.category)) setEditCategory(data.category);
    } catch {
      // silently fail
    } finally {
      setIsFetching(false);
    }
  }

  const expiryDays = daysUntilExpiry(product);
  const expiryStatus = getExpiryStatus(expiryDays);

  const productIngredients = ingredients.filter((i) => product.ingredients.includes(i.id));
  const keyIngredients = productIngredients.filter((i) => product.keyIngredients.includes(i.id));

  function saveRating() {
    rateProduct(product.id, { ...draft, reviewDate: new Date().toISOString().split('T')[0] });
    setEditing(false);
  }

  function addTag(field: 'pros' | 'cons' | 'adverseReactions', value: string, setter: (v: string) => void) {
    if (!value.trim()) return;
    setDraft((d) => ({ ...d, [field]: [...d[field], value.trim()] }));
    setter('');
  }

  function removeTag(field: 'pros' | 'cons' | 'adverseReactions', index: number) {
    setDraft((d) => ({ ...d, [field]: d[field].filter((_, i) => i !== index) }));
  }

  const evidenceColors = {
    strong: 'bg-emerald-100 text-emerald-700',
    moderate: 'bg-blue-100 text-blue-700',
    emerging: 'bg-amber-100 text-amber-700',
    limited: 'bg-orange-100 text-orange-700',
    anecdotal: 'bg-ivory-darker text-obsidian-600',
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="flex gap-6">
        {/* Left: Product image and quick info */}
        <div className="w-48 flex-shrink-0">
          {editingProduct ? (
            <>
              {/* Editable image */}
              <div
                className="relative w-full aspect-square rounded-2xl overflow-hidden bg-ivory-dark mb-4 border border-ivory-darker cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {editImageUrl ? (
                  <>
                    <img src={editImageUrl} alt={editName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: product.imageColor }}>
                    <Camera className="w-8 h-8 text-white/60" />
                    <span className="text-xs text-white/50 mt-1">Upload</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditImageUpload} />
              </div>

              {/* Editable fields */}
              <div className="space-y-2">
                <Input label="Price" type="number" placeholder="29.99" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                <Input label="Size" placeholder="30ml" value={editSize} onChange={(e) => setEditSize(e.target.value)} />
                <Input label="PAO (months)" type="number" placeholder="12" value={editPaoMonths} onChange={(e) => setEditPaoMonths(e.target.value)} />
                <Input label="Opened Date" type="date" value={editOpenedDate} onChange={(e) => setEditOpenedDate(e.target.value)} />
                <Input label="Expiry Date" type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} />
                <Input label="Purchase URL" placeholder="https://..." value={editPurchaseUrl} onChange={(e) => setEditPurchaseUrl(e.target.value)} />
              </div>

              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1" onClick={saveProductEdits}>
                  <Save className="w-3.5 h-3.5" /> Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingProduct(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-ivory-dark mb-4 border border-ivory-darker">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: product.imageColor }}>
                    <Package className="w-12 h-12 text-white/50" />
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="space-y-2 text-sm">
                {product.price && (
                  <div className="flex items-center gap-2 text-obsidian-600">
                    <DollarSign className="w-3.5 h-3.5 text-obsidian-400" />
                    <span>${product.price}</span>
                  </div>
                )}
                {product.size && (
                  <div className="flex items-center gap-2 text-obsidian-600">
                    <Package className="w-3.5 h-3.5 text-obsidian-400" />
                    <span>{product.size}</span>
                  </div>
                )}
                {product.purchaseDate && (
                  <div className="flex items-center gap-2 text-obsidian-600">
                    <Calendar className="w-3.5 h-3.5 text-obsidian-400" />
                    <span>Bought {formatDate(product.purchaseDate)}</span>
                  </div>
                )}
                {expiryDays !== null && (
                  <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${
                    expiryStatus === 'expired' ? 'bg-red-50 text-red-600' :
                    expiryStatus === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-ivory-dark text-obsidian-600'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {expiryStatus === 'expired'
                        ? `Expired ${Math.abs(expiryDays)}d ago`
                        : `${expiryDays}d left`}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={startEditingProduct}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Product
              </Button>

              {product.purchaseUrl && (
                <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buy Again
                  </Button>
                </a>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-red-500 hover:bg-red-50"
                onClick={() => { deleteProduct(product.id); onClose(); }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </Button>
            </>
          )}
        </div>

        {/* Right: Details */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            {editingProduct ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Button variant="gold" size="sm" className="mt-5 flex-shrink-0" onClick={autoFillProduct} disabled={isFetching}>
                    {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Wand2 className="w-3.5 h-3.5" /> Auto-Fill</>}
                  </Button>
                </div>
                <Input label="Brand" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-obsidian-700">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                    className="w-full rounded-lg border border-ivory-darker px-3 py-2 text-sm text-obsidian-800 bg-white"
                  >
                    {ALL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{categoryLabel(c)}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-block text-xs rounded-full px-2 py-0.5 font-medium mb-1 ${categoryColor(product.category)}`}>
                      {categoryLabel(product.category)}
                    </span>
                    <h2 className="text-xl font-bold text-obsidian-800">{product.name}</h2>
                    <p className="text-obsidian-500 text-sm mt-0.5">{product.brand}</p>
                  </div>
                  {product.rating && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-obsidian-800">{product.rating.overall.toFixed(1)}</div>
                      <StarRating value={product.rating.overall} size="sm" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {product.concerns.map((c) => (
                    <Badge key={c} className="bg-rose-50 text-rose-600">{concernLabel(c)}</Badge>
                  ))}
                  {product.tags.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-ivory-darker mb-4">
            {(['overview', 'ingredients', 'review'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${
                  tab === t ? 'text-rose-600 border-b-2 border-rose-500' : 'text-obsidian-500 hover:text-obsidian-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Rating breakdown */}
              {product.rating && !editing && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-obsidian-700">Rating Breakdown</h4>
                    <button onClick={() => setEditing(true)} className="text-xs text-rose-500 flex items-center gap-1 hover:text-rose-600">
                      <Edit2 className="w-3 h-3" /> Edit Review
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Overall', value: product.rating.overall },
                      { label: 'Texture', value: product.rating.texture },
                      { label: 'Efficacy', value: product.rating.efficacy },
                      { label: 'Value', value: product.rating.value },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-ivory-dark rounded-xl p-2.5 text-center">
                        <div className="text-lg font-bold text-obsidian-800">{value.toFixed(1)}</div>
                        <div className="text-xs text-obsidian-500">{label}</div>
                        <StarRating value={value} size="sm" className="justify-center mt-1" />
                      </div>
                    ))}
                    <div className={`rounded-xl p-2.5 text-center ${product.rating.wouldRepurchase ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {product.rating.wouldRepurchase
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        : <AlertTriangle className="w-5 h-5 text-red-400 mx-auto" />}
                      <div className="text-xs text-obsidian-600 mt-1">
                        {product.rating.wouldRepurchase ? 'Would repurchase' : 'Won\'t repurchase'}
                      </div>
                    </div>
                  </div>

                  {product.rating.pros.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mb-1.5">
                        <ThumbsUp className="w-3 h-3" /> Pros
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.rating.pros.map((p, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-700 text-xs rounded-full px-2.5 py-1">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.rating.cons.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1 text-rose-500 text-xs font-medium mb-1.5">
                        <ThumbsDown className="w-3 h-3" /> Cons
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.rating.cons.map((c, i) => (
                          <span key={i} className="bg-rose-50 text-rose-600 text-xs rounded-full px-2.5 py-1">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.rating.adverseReactions.length > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold mb-1.5">
                        <AlertTriangle className="w-3 h-3" /> Adverse Reactions
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.rating.adverseReactions.map((r, i) => (
                          <span key={i} className="bg-amber-100 text-amber-700 text-xs rounded-full px-2.5 py-1">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.rating.notes && (
                    <div className="mt-3 bg-ivory-dark rounded-xl p-3 text-sm text-obsidian-600 italic">
                      "{product.rating.notes}"
                    </div>
                  )}
                </div>
              )}

              {!product.rating && !editing && (
                <div className="text-center py-8 bg-ivory-dark rounded-2xl">
                  <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-obsidian-500 text-sm mb-3">No review yet</p>
                  <Button size="sm" onClick={() => setEditing(true)}>Add Your Review</Button>
                </div>
              )}
            </div>
          )}

          {tab === 'ingredients' && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-obsidian-700">Key Active Ingredients</h4>
              {keyIngredients.map((ing) => (
                <div key={ing.id} className="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-obsidian-800">{ing.name}</div>
                      <div className="text-xs text-obsidian-500 mt-0.5">{ing.inci}</div>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium flex-shrink-0 ${evidenceColors[ing.evidenceLevel]}`}>
                      {ing.evidenceLevel} evidence
                    </span>
                  </div>
                  <p className="text-xs text-obsidian-600 mt-2">{ing.whatItDoes}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ing.benefits.slice(0, 4).map((b) => (
                      <span key={b} className="bg-white text-obsidian-600 text-xs rounded-full px-2 py-0.5 border border-rose-100">{b}</span>
                    ))}
                  </div>
                </div>
              ))}

              {productIngredients.filter(i => !product.keyIngredients.includes(i.id)).length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-obsidian-700 mt-4">Other Tracked Ingredients</h4>
                  {productIngredients.filter(i => !product.keyIngredients.includes(i.id)).map((ing) => (
                    <div key={ing.id} className="bg-ivory-dark rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm text-obsidian-700">{ing.name}</div>
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${evidenceColors[ing.evidenceLevel]}`}>
                          {ing.evidenceLevel}
                        </span>
                      </div>
                      <p className="text-xs text-obsidian-500 mt-1">{ing.whatItDoes}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'review' || editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Overall Rating', field: 'overall' as const },
                  { label: 'Texture', field: 'texture' as const },
                  { label: 'Efficacy', field: 'efficacy' as const },
                  { label: 'Value for Money', field: 'value' as const },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-obsidian-600 block mb-1">{label}</label>
                    <StarRating
                      value={draft[field]}
                      interactive
                      onChange={(v) => setDraft((d) => ({ ...d, [field]: v }))}
                    />
                  </div>
                ))}
              </div>

              <Textarea
                label="Your notes"
                placeholder="How has this product worked for you?"
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                rows={3}
              />

              {/* Pros */}
              <div>
                <label className="text-xs font-medium text-obsidian-600 block mb-1">Pros</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a pro..."
                    value={prosInput}
                    onChange={(e) => setProsInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag('pros', prosInput, setProsInput)}
                  />
                  <Button size="sm" variant="secondary" onClick={() => addTag('pros', prosInput, setProsInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {draft.pros.map((p, i) => (
                    <span key={i} className="bg-emerald-50 text-emerald-700 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                      {p}
                      <button onClick={() => removeTag('pros', i)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Cons */}
              <div>
                <label className="text-xs font-medium text-obsidian-600 block mb-1">Cons</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a con..."
                    value={consInput}
                    onChange={(e) => setConsInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag('cons', consInput, setConsInput)}
                  />
                  <Button size="sm" variant="secondary" onClick={() => addTag('cons', consInput, setConsInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {draft.cons.map((c, i) => (
                    <span key={i} className="bg-rose-50 text-rose-600 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                      {c}
                      <button onClick={() => removeTag('cons', i)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Adverse reactions */}
              <div>
                <label className="text-xs font-medium text-obsidian-600 block mb-1">Adverse Reactions</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. redness, breakout..."
                    value={adverseInput}
                    onChange={(e) => setAdverseInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag('adverseReactions', adverseInput, setAdverseInput)}
                  />
                  <Button size="sm" variant="secondary" onClick={() => addTag('adverseReactions', adverseInput, setAdverseInput)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {draft.adverseReactions.map((r, i) => (
                    <span key={i} className="bg-amber-50 text-amber-700 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                      {r}
                      <button onClick={() => removeTag('adverseReactions', i)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.wouldRepurchase}
                    onChange={(e) => setDraft((d) => ({ ...d, wouldRepurchase: e.target.checked }))}
                    className="w-4 h-4 accent-rose-500"
                  />
                  <span className="text-sm text-obsidian-700">Would repurchase</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {editing && (
                  <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                )}
                <Button onClick={saveRating}>
                  <RefreshCw className="w-4 h-4" />
                  Save Review
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
