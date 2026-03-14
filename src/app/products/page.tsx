'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Select from '@radix-ui/react-select';
import * as Popover from '@radix-ui/react-popover';
import {
  Search, LayoutGrid, List, Plus, ChevronDown, ChevronUp,
  Package, SlidersHorizontal, X, Check, ArrowUpDown,
  Sparkles, Filter,
} from 'lucide-react';
import { useAppStore, useProducts, useIngredients } from '@/lib/store';
import {
  cn, categoryColor, categoryLabel, concernLabel,
  evidenceLevelColor,
} from '@/lib/utils';
import type { Product, ProductCategory, SkinConcern, EvidenceLevel } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardBody } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { Modal } from '@/components/ui/modal';
import { ProductDetailModal } from '@/components/shelf/ProductDetailModal';

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = 'name' | 'rating' | 'dateAdded' | 'category' | 'brand';
type ViewMode = 'table' | 'grid';

const ALL_CATEGORIES: ProductCategory[] = [
  'cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'eye-cream',
  'spf', 'mask', 'exfoliant', 'oil', 'mist', 'treatment', 'lip-care', 'body-care',
];
const ALL_CONCERNS: SkinConcern[] = [
  'acne', 'hyperpigmentation', 'anti-aging', 'dryness', 'sensitivity',
  'redness', 'pores', 'texture', 'dullness', 'dark-circles', 'fine-lines', 'firmness',
];

// ─── Ingredient Popover ───────────────────────────────────────────────────────
function IngredientBadge({
  ingredientId,
  isKey,
}: {
  ingredientId: string;
  isKey: boolean;
}) {
  const ingredients = useIngredients();
  const ingredient = ingredients.find((i) => i.id === ingredientId);
  if (!ingredient) return null;

  const evidenceColors: Record<EvidenceLevel, string> = {
    strong: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    moderate: 'bg-blue-100 text-blue-700 border-blue-200',
    emerging: 'bg-amber-100 text-amber-700 border-amber-200',
    limited: 'bg-orange-100 text-orange-700 border-orange-200',
    anecdotal: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors hover:opacity-80',
            isKey
              ? 'bg-rose-100 text-rose-700 border-rose-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          )}
        >
          {isKey && <Sparkles className="w-2.5 h-2.5 mr-1" />}
          {ingredient.name}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 bg-white rounded-xl shadow-lg border border-slate-100 p-4 max-w-xs w-72"
          sideOffset={6}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-slate-800">{ingredient.name}</p>
                <p className="text-xs text-slate-400 italic">{ingredient.inci}</p>
              </div>
              <span
                className={cn(
                  'text-xs rounded-full px-2 py-0.5 font-medium border flex-shrink-0',
                  evidenceColors[ingredient.evidenceLevel]
                )}
              >
                {ingredient.evidenceLevel}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{ingredient.whatItDoes}</p>
            {ingredient.benefits.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {ingredient.benefits.slice(0, 4).map((b) => (
                  <span
                    key={b}
                    className="bg-rose-50 text-rose-600 text-xs rounded-full px-2 py-0.5"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ─── Product Card (grid view) ─────────────────────────────────────────────────
function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  const ingredients = useIngredients();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-40 bg-slate-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: product.imageColor || '#f1f5f9' }}
          >
            <Package className="w-10 h-10 text-white/50" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span
            className={cn(
              'text-xs rounded-full px-2 py-0.5 font-medium',
              categoryColor(product.category)
            )}
          >
            {categoryLabel(product.category)}
          </span>
        </div>
        {product.inRoutine && (
          <div className="absolute top-2 left-2">
            <span className="bg-emerald-100 text-emerald-700 text-xs rounded-full px-2 py-0.5 font-medium">
              In Routine
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{product.brand}</p>
        <h3 className="font-semibold text-slate-800 text-sm mt-0.5 leading-tight line-clamp-2">
          {product.name}
        </h3>

        {product.rating && (
          <div className="flex items-center gap-1.5 mt-2">
            <StarRating value={product.rating.overall} size="sm" />
            <span className="text-xs text-slate-500">{product.rating.overall.toFixed(1)}</span>
          </div>
        )}

        {product.keyIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {product.keyIngredients.slice(0, 3).map((id) => {
              const ing = ingredients.find((i) => i.id === id);
              return ing ? (
                <IngredientBadge key={id} ingredientId={id} isKey={true} />
              ) : null;
            })}
            {product.keyIngredients.length > 3 && (
              <span className="text-xs text-slate-400 self-center">
                +{product.keyIngredients.length - 3} more
              </span>
            )}
          </div>
        )}

        {product.concerns.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.concerns.slice(0, 2).map((c) => (
              <span
                key={c}
                className="bg-slate-50 text-slate-500 text-xs rounded-full px-2 py-0.5 border border-slate-100"
              >
                {concernLabel(c)}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Add Product Modal ────────────────────────────────────────────────────────
function AddProductModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addProduct, ingredients: allIngredients } = useAppStore();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('serum');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcern[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedKeyIngredients, setSelectedKeyIngredients] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return allIngredients.slice(0, 10);
    return allIngredients
      .filter(
        (i) =>
          i.name.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
          i.inci.toLowerCase().includes(ingredientSearch.toLowerCase())
      )
      .slice(0, 10);
  }, [allIngredients, ingredientSearch]);

  function toggleConcern(c: SkinConcern) {
    setSelectedConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function toggleIngredient(id: string) {
    setSelectedIngredients((prev) => {
      if (prev.includes(id)) {
        setSelectedKeyIngredients((keys) => keys.filter((k) => k !== id));
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function toggleKeyIngredient(id: string) {
    if (!selectedIngredients.includes(id)) {
      setSelectedIngredients((prev) => [...prev, id]);
    }
    setSelectedKeyIngredients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Product name is required';
    if (!brand.trim()) errs.brand = 'Brand is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: name.trim(),
      brand: brand.trim(),
      category,
      imageUrl: '',
      imageColor: '#f1a1b5',
      price: price ? parseFloat(price) : undefined,
      size: size || undefined,
      purchaseDate: new Date().toISOString().split('T')[0],
      concerns: selectedConcerns,
      ingredients: selectedIngredients,
      keyIngredients: selectedKeyIngredients,
      inRoutine: false,
      tags: [],
    };
    addProduct(newProduct);
    onClose();
    // Reset
    setName('');
    setBrand('');
    setCategory('serum');
    setPrice('');
    setSize('');
    setSelectedConcerns([]);
    setSelectedIngredients([]);
    setSelectedKeyIngredients([]);
    setErrors({});
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Product" description="Add a product to your shelf" size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Product Name"
            placeholder="e.g. Advanced Night Repair"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            label="Brand"
            placeholder="e.g. Estée Lauder"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            error={errors.brand}
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Category</label>
          <Select.Root value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
            <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <Select.Viewport className="p-1 max-h-60 overflow-y-auto">
                  {ALL_CATEGORIES.map((cat) => (
                    <Select.Item
                      key={cat}
                      value={cat}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-rose-50 hover:text-rose-700 outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                    >
                      <Select.ItemText>{categoryLabel(cat)}</Select.ItemText>
                      <Select.ItemIndicator className="ml-auto">
                        <Check className="w-3.5 h-3.5 text-rose-500" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price (optional)"
            type="number"
            placeholder="29.99"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label="Size (optional)"
            placeholder="e.g. 30ml, 1.7 fl oz"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </div>

        {/* Concerns */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Skin Concerns</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CONCERNS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleConcern(c)}
                className={cn(
                  'text-xs rounded-full px-2.5 py-1 border font-medium transition-colors',
                  selectedConcerns.includes(c)
                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-rose-200 hover:text-rose-600'
                )}
              >
                {concernLabel(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Key Ingredients</label>
          <Input
            placeholder="Search ingredients..."
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
          />
          {filteredIngredients.length > 0 && (
            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
              {filteredIngredients.map((ing) => {
                const isSelected = selectedIngredients.includes(ing.id);
                const isKey = selectedKeyIngredients.includes(ing.id);
                return (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleIngredient(ing.id)}
                        className={cn(
                          'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-rose-500 border-rose-500'
                            : 'border-slate-300 hover:border-rose-400'
                        )}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 font-medium truncate">{ing.name}</p>
                        <p className="text-xs text-slate-400 truncate">{ing.inci}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleKeyIngredient(ing.id)}
                      className={cn(
                        'text-xs rounded-full px-2 py-0.5 border font-medium ml-2 flex-shrink-0 transition-colors',
                        isKey
                          ? 'bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-rose-200 hover:text-rose-600'
                      )}
                    >
                      {isKey ? 'Key' : 'Set key'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {selectedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIngredients.map((id) => {
                const ing = allIngredients.find((i) => i.id === id);
                if (!ing) return null;
                return (
                  <span
                    key={id}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                      selectedKeyIngredients.includes(id)
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {selectedKeyIngredients.includes(id) && <Sparkles className="w-2.5 h-2.5" />}
                    {ing.name}
                    <button
                      type="button"
                      onClick={() => toggleIngredient(id)}
                      className="hover:text-red-500 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const products = useProducts();
  const ingredients = useIngredients();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');
  const [filterConcern, setFilterConcern] = useState<SkinConcern | 'all'>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterInRoutine, setFilterInRoutine] = useState<'all' | 'yes' | 'no'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const counts: Partial<Record<ProductCategory, number>> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const topCategories = useMemo(() => {
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6) as [ProductCategory, number][];
  }, [stats]);

  // Filtering
  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter((p) => p.category === filterCategory);
    }
    if (filterConcern !== 'all') {
      result = result.filter((p) => p.concerns.includes(filterConcern));
    }
    if (filterRating > 0) {
      result = result.filter((p) => (p.rating?.overall || 0) >= filterRating);
    }
    if (filterInRoutine === 'yes') {
      result = result.filter((p) => p.inRoutine);
    } else if (filterInRoutine === 'no') {
      result = result.filter((p) => !p.inRoutine);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'brand') cmp = a.brand.localeCompare(b.brand);
      else if (sortKey === 'rating') cmp = (a.rating?.overall || 0) - (b.rating?.overall || 0);
      else if (sortKey === 'dateAdded')
        cmp = (a.purchaseDate || '').localeCompare(b.purchaseDate || '');
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [products, search, filterCategory, filterConcern, filterRating, filterInRoutine, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const activeFilterCount = [
    filterCategory !== 'all',
    filterConcern !== 'all',
    filterRating > 0,
    filterInRoutine !== 'all',
  ].filter(Boolean).length;

  function clearFilters() {
    setFilterCategory('all');
    setFilterConcern('all');
    setFilterRating(0);
    setFilterInRoutine('all');
    setSearch('');
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-rose-500" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-rose-500" />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Products</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {products.length} product{products.length !== 1 ? 's' : ''} on your shelf
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Stats bar */}
        {topCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {topCategories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() =>
                  setFilterCategory((prev) => (prev === cat ? 'all' : cat))
                }
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all',
                  filterCategory === cat
                    ? cn(categoryColor(cat), 'border-current')
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block w-2 h-2 rounded-full',
                    filterCategory === cat ? '' : 'bg-slate-300'
                  )}
                  style={filterCategory !== cat ? {} : undefined}
                />
                {categoryLabel(cat)}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-bold',
                    filterCategory === cat ? 'bg-white/50' : 'bg-slate-100'
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
            <span className="inline-flex items-center text-xs text-slate-400 px-2">
              {products.length} total
            </span>
          </div>
        )}
      </div>

      <div className="px-8 py-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, tags..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters((v) => !v)}
            className="relative"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Sort */}
          <Select.Root value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <Select.Trigger className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <Select.Value />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-50 bg-white rounded-xl shadow-lg border border-slate-100">
                <Select.Viewport className="p-1">
                  {[
                    { value: 'name', label: 'Sort by Name' },
                    { value: 'brand', label: 'Sort by Brand' },
                    { value: 'rating', label: 'Sort by Rating' },
                    { value: 'dateAdded', label: 'Sort by Date Added' },
                    { value: 'category', label: 'Sort by Category' },
                  ].map((opt) => (
                    <Select.Item
                      key={opt.value}
                      value={opt.value}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                    >
                      <Select.ItemText>{opt.label}</Select.ItemText>
                      <Select.ItemIndicator className="ml-auto">
                        <Check className="w-3.5 h-3.5 text-rose-500" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          <button
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* View toggle */}
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'table'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Category filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Category
                    </label>
                    <Select.Root
                      value={filterCategory}
                      onValueChange={(v) => setFilterCategory(v as ProductCategory | 'all')}
                    >
                      <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300">
                        <Select.Value />
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-50 bg-white rounded-xl shadow-lg border border-slate-100 max-h-64 overflow-y-auto">
                          <Select.Viewport className="p-1">
                            <Select.Item
                              value="all"
                              className="flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                            >
                              <Select.ItemText>All Categories</Select.ItemText>
                            </Select.Item>
                            {ALL_CATEGORIES.map((cat) => (
                              <Select.Item
                                key={cat}
                                value={cat}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                              >
                                <Select.ItemText>{categoryLabel(cat)}</Select.ItemText>
                                <Select.ItemIndicator className="ml-auto">
                                  <Check className="w-3.5 h-3.5 text-rose-500" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  {/* Concern filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Concern
                    </label>
                    <Select.Root
                      value={filterConcern}
                      onValueChange={(v) => setFilterConcern(v as SkinConcern | 'all')}
                    >
                      <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300">
                        <Select.Value />
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-50 bg-white rounded-xl shadow-lg border border-slate-100 max-h-64 overflow-y-auto">
                          <Select.Viewport className="p-1">
                            <Select.Item
                              value="all"
                              className="flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                            >
                              <Select.ItemText>All Concerns</Select.ItemText>
                            </Select.Item>
                            {ALL_CONCERNS.map((c) => (
                              <Select.Item
                                key={c}
                                value={c}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                              >
                                <Select.ItemText>{concernLabel(c)}</Select.ItemText>
                                <Select.ItemIndicator className="ml-auto">
                                  <Check className="w-3.5 h-3.5 text-rose-500" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  {/* Rating filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Min Rating
                    </label>
                    <Select.Root
                      value={String(filterRating)}
                      onValueChange={(v) => setFilterRating(Number(v))}
                    >
                      <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300">
                        <Select.Value />
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-50 bg-white rounded-xl shadow-lg border border-slate-100">
                          <Select.Viewport className="p-1">
                            {[
                              { value: '0', label: 'Any Rating' },
                              { value: '3', label: '3+ Stars' },
                              { value: '3.5', label: '3.5+ Stars' },
                              { value: '4', label: '4+ Stars' },
                              { value: '4.5', label: '4.5+ Stars' },
                              { value: '5', label: '5 Stars' },
                            ].map((opt) => (
                              <Select.Item
                                key={opt.value}
                                value={opt.value}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                              >
                                <Select.ItemText>{opt.label}</Select.ItemText>
                                <Select.ItemIndicator className="ml-auto">
                                  <Check className="w-3.5 h-3.5 text-rose-500" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  {/* In routine filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      In Routine
                    </label>
                    <Select.Root
                      value={filterInRoutine}
                      onValueChange={(v) => setFilterInRoutine(v as 'all' | 'yes' | 'no')}
                    >
                      <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300">
                        <Select.Value />
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-50 bg-white rounded-xl shadow-lg border border-slate-100">
                          <Select.Viewport className="p-1">
                            {[
                              { value: 'all', label: 'All Products' },
                              { value: 'yes', label: 'In Routine' },
                              { value: 'no', label: 'Not in Routine' },
                            ].map((opt) => (
                              <Select.Item
                                key={opt.value}
                                value={opt.value}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700"
                              >
                                <Select.ItemText>{opt.label}</Select.ItemText>
                                <Select.ItemIndicator className="ml-auto">
                                  <Check className="w-3.5 h-3.5 text-rose-500" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
            {products.length} products
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-2xl border border-slate-100"
          >
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No products found</h3>
            <p className="text-sm text-slate-400 mb-4">
              {search || activeFilterCount > 0
                ? 'Try adjusting your search or filters'
                : 'Add your first product to get started'}
            </p>
            {(search || activeFilterCount > 0) ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            )}
          </motion.div>
        )}

        {/* Table view */}
        {viewMode === 'table' && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3">
                      <button
                        onClick={() => toggleSort('name')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700 transition-colors"
                      >
                        Product
                        <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button
                        onClick={() => toggleSort('category')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700 transition-colors"
                      >
                        Category
                        <SortIcon col="category" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Key Ingredients
                      </span>
                    </th>
                    <th className="text-left px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Concerns
                      </span>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button
                        onClick={() => toggleSort('rating')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700 transition-colors"
                      >
                        Rating
                        <SortIcon col="rating" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        In Routine
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {filtered.map((product) => (
                      <motion.tr
                        key={product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedProduct(product)}
                        className="group hover:bg-rose-50/30 cursor-pointer transition-colors"
                      >
                        {/* Product */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
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
                                  <Package className="w-5 h-5 text-white/50" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-800 truncate max-w-40">
                                {product.name}
                              </p>
                              <p className="text-xs text-slate-400">{product.brand}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-xs rounded-full px-2.5 py-0.5 font-medium',
                              categoryColor(product.category)
                            )}
                          >
                            {categoryLabel(product.category)}
                          </span>
                        </td>

                        {/* Key Ingredients */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-52">
                            {product.keyIngredients.slice(0, 3).map((id) => (
                              <IngredientBadge key={id} ingredientId={id} isKey={true} />
                            ))}
                            {product.ingredients
                              .filter((id) => !product.keyIngredients.includes(id))
                              .slice(0, 2)
                              .map((id) => (
                                <IngredientBadge key={id} ingredientId={id} isKey={false} />
                              ))}
                            {product.keyIngredients.length > 3 && (
                              <span className="text-xs text-slate-400">
                                +{product.keyIngredients.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Concerns */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-40">
                            {product.concerns.slice(0, 2).map((c) => (
                              <span
                                key={c}
                                className="bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5"
                              >
                                {concernLabel(c)}
                              </span>
                            ))}
                            {product.concerns.length > 2 && (
                              <span className="text-xs text-slate-400">
                                +{product.concerns.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-3">
                          {product.rating ? (
                            <div className="flex items-center gap-1.5">
                              <StarRating value={product.rating.overall} size="sm" />
                              <span className="text-xs font-medium text-slate-600">
                                {product.rating.overall.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 italic">Unrated</span>
                          )}
                        </td>

                        {/* In Routine */}
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-xs rounded-full px-2.5 py-0.5 font-medium',
                              product.inRoutine
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            {product.inRoutine ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Grid view */}
        {viewMode === 'grid' && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            <AnimatePresence>
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Add product modal */}
      <AddProductModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
