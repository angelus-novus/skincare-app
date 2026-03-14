'use client';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as Select from '@radix-ui/react-select';
import {
  Plus, X, Check, ChevronDown, Search, Sparkles, Package,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  cn, categoryLabel, concernLabel, evidenceLevelColor,
} from '@/lib/utils';
import type { Product, ProductCategory, SkinConcern } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ALL_CATEGORIES: ProductCategory[] = [
  'cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'eye-cream',
  'spf', 'mask', 'exfoliant', 'oil', 'mist', 'treatment', 'lip-care', 'body-care',
];

const ALL_CONCERNS: SkinConcern[] = [
  'acne', 'hyperpigmentation', 'anti-aging', 'dryness', 'sensitivity',
  'redness', 'pores', 'texture', 'dullness', 'dark-circles', 'fine-lines', 'firmness',
];

const BOTTLE_COLORS = [
  '#f1a1b5', '#e8b4c8', '#c9a0dc', '#a0c4e8', '#a0d8c4',
  '#d4c9a0', '#f0c987', '#e89090', '#b0b0b0', '#8ec5e0',
  '#d4a0a0', '#c4b0d4', '#a0b8a0', '#e0c4a0', '#c0d0e0',
];

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (product: Product) => void;
}

export function AddProductModal({ open, onClose, onAdd }: AddProductModalProps) {
  const { addProduct, ingredients: allIngredients } = useAppStore();

  // Basic info
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('serum');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseUrl, setPurchaseUrl] = useState('');

  // Image
  const [imageUrl, setImageUrl] = useState('');
  const [imageColor, setImageColor] = useState('#f1a1b5');

  // Concerns & tags
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcern[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Ingredients
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientDropdownOpen, setIngredientDropdownOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedKeyIngredients, setSelectedKeyIngredients] = useState<string[]>([]);
  const ingredientSearchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Expiry / PAO
  const [paoMonths, setPaoMonths] = useState('');
  const [openedDate, setOpenedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Routine
  const [inRoutine, setInRoutine] = useState(false);
  const [routineStep, setRoutineStep] = useState<'am' | 'pm' | 'both'>('am');
  const [routineOrder, setRoutineOrder] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Close ingredient dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        ingredientSearchRef.current &&
        !ingredientSearchRef.current.contains(e.target as Node)
      ) {
        setIngredientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ingredient filtering
  const filteredIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return allIngredients.slice(0, 12);
    const q = ingredientSearch.toLowerCase();
    return allIngredients
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.inci.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [allIngredients, ingredientSearch]);

  function toggleConcern(c: SkinConcern) {
    setSelectedConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  const toggleIngredient = useCallback((id: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(id)) {
        setSelectedKeyIngredients((keys) => keys.filter((k) => k !== id));
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }, []);

  const toggleKeyIngredient = useCallback((id: string) => {
    if (!selectedIngredients.includes(id)) {
      setSelectedIngredients((prev) => [...prev, id]);
    }
    setSelectedKeyIngredients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, [selectedIngredients]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Product name is required';
    if (!brand.trim()) errs.brand = 'Brand is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function resetForm() {
    setName('');
    setBrand('');
    setCategory('serum');
    setPrice('');
    setSize('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseUrl('');
    setImageUrl('');
    setImageColor('#f1a1b5');
    setSelectedConcerns([]);
    setTags([]);
    setTagInput('');
    setIngredientSearch('');
    setIngredientDropdownOpen(false);
    setSelectedIngredients([]);
    setSelectedKeyIngredients([]);
    setPaoMonths('');
    setOpenedDate('');
    setExpiryDate('');
    setInRoutine(false);
    setRoutineStep('am');
    setRoutineOrder('');
    setErrors({});
  }

  function handleSubmit() {
    if (!validate()) return;
    const newProduct: Product = {
      id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      brand: brand.trim(),
      category,
      imageUrl: imageUrl.trim(),
      imageColor,
      price: price ? parseFloat(price) : undefined,
      size: size || undefined,
      purchaseDate: purchaseDate || undefined,
      purchaseUrl: purchaseUrl.trim() || undefined,
      openedDate: openedDate || undefined,
      expiryDate: expiryDate || undefined,
      paoMonths: paoMonths ? parseInt(paoMonths, 10) : undefined,
      concerns: selectedConcerns,
      ingredients: selectedIngredients,
      keyIngredients: selectedKeyIngredients,
      inRoutine,
      routineStep: inRoutine ? routineStep : undefined,
      routineOrder: inRoutine && routineOrder ? parseInt(routineOrder, 10) : undefined,
      tags,
    };
    addProduct(newProduct);
    onAdd?.(newProduct);
    resetForm();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Product"
      description="Add a product to your skincare shelf"
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 -mr-1">
        {/* ── Section: Basic Info ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-rose-400" />
            Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name *"
              placeholder="e.g. Advanced Night Repair"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <Input
              label="Brand *"
              placeholder="e.g. Estee Lauder"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              error={errors.brand}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
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
                  <Select.Content className="z-[100] bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
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

            <Input
              label="Price"
              type="number"
              placeholder="29.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Size"
              placeholder="e.g. 30ml"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input
              label="Purchase Date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
            <Input
              label="Purchase URL"
              placeholder="https://..."
              value={purchaseUrl}
              onChange={(e) => setPurchaseUrl(e.target.value)}
            />
          </div>
        </div>

        {/* ── Section: Image ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Image</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Image URL"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Bottle Color (fallback)</label>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {BOTTLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setImageColor(color)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-all',
                        imageColor === color
                          ? 'border-rose-500 scale-110 shadow-sm'
                          : 'border-transparent hover:border-slate-300'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={imageColor}
                  onChange={(e) => setImageColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                  title="Custom color"
                />
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: imageUrl ? undefined : imageColor }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Package className="w-6 h-6 text-white/60" />
              )}
            </div>
            <span className="text-xs text-slate-400">Preview</span>
          </div>
        </div>

        {/* ── Section: Skin Concerns ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Skin Concerns</h3>
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

        {/* ── Section: Tags ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Tags</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Type a tag and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs rounded-full px-2.5 py-1 font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Section: Ingredient Search/Autocomplete ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            Ingredients
          </h3>

          {/* Search */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={ingredientSearchRef}
                value={ingredientSearch}
                onChange={(e) => {
                  setIngredientSearch(e.target.value);
                  setIngredientDropdownOpen(true);
                }}
                onFocus={() => setIngredientDropdownOpen(true)}
                placeholder="Search ingredients by name, INCI, or category..."
                className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
              />
              {ingredientSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setIngredientSearch('');
                    setIngredientDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {ingredientDropdownOpen && filteredIngredients.length > 0 && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto"
                >
                  {filteredIngredients.map((ing) => {
                    const isSelected = selectedIngredients.includes(ing.id);
                    const isKey = selectedKeyIngredients.includes(ing.id);
                    return (
                      <div
                        key={ing.id}
                        className={cn(
                          'flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer transition-colors',
                          isSelected && 'bg-rose-50/40'
                        )}
                        onClick={() => toggleIngredient(ing.id)}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div
                            className={cn(
                              'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                              isSelected
                                ? 'bg-rose-500 border-rose-500'
                                : 'border-slate-300 hover:border-rose-400'
                            )}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-slate-700 font-medium truncate">{ing.name}</p>
                              <span className="text-xs text-slate-400 truncate hidden sm:inline">{ing.category}</span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{ing.inci}</p>
                          </div>
                          <span
                            className={cn(
                              'text-xs rounded-full px-2 py-0.5 font-medium flex-shrink-0 ml-1',
                              evidenceLevelColor(ing.evidenceLevel)
                            )}
                          >
                            {ing.evidenceLevel}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleKeyIngredient(ing.id);
                          }}
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected ingredients pills */}
          {selectedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedIngredients.map((id) => {
                const ing = allIngredients.find((i) => i.id === id);
                if (!ing) return null;
                const isKey = selectedKeyIngredients.includes(id);
                return (
                  <motion.span
                    key={id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors',
                      isKey
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                    onClick={() => toggleKeyIngredient(id)}
                    title={isKey ? 'Click to unmark as key ingredient' : 'Click to mark as key ingredient'}
                  >
                    {isKey && <Sparkles className="w-2.5 h-2.5" />}
                    {ing.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleIngredient(id);
                      }}
                      className="hover:text-red-500 ml-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                );
              })}
            </div>
          )}
          {selectedIngredients.length > 0 && (
            <p className="text-xs text-slate-400 mt-1.5">
              Click a pill to toggle key ingredient status. {selectedKeyIngredients.length} key, {selectedIngredients.length - selectedKeyIngredients.length} regular.
            </p>
          )}
        </div>

        {/* ── Section: Expiry & PAO ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Expiry & Period After Opening</h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="PAO (months)"
              type="number"
              placeholder="12"
              value={paoMonths}
              onChange={(e) => setPaoMonths(e.target.value)}
            />
            <Input
              label="Opened Date"
              type="date"
              value={openedDate}
              onChange={(e) => setOpenedDate(e.target.value)}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        {/* ── Section: Routine ── */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Routine</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  inRoutine ? 'bg-rose-500' : 'bg-slate-200'
                )}
                onClick={() => setInRoutine(!inRoutine)}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                    inRoutine ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </div>
              <span className="text-sm text-slate-700">In routine</span>
            </label>
          </div>

          <AnimatePresence>
            {inRoutine && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">When</label>
                    <div className="flex gap-1.5">
                      {(['am', 'pm', 'both'] as const).map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setRoutineStep(step)}
                          className={cn(
                            'flex-1 rounded-lg px-3 py-2 text-sm font-medium border transition-colors',
                            routineStep === step
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-rose-200'
                          )}
                        >
                          {step === 'am' ? 'AM' : step === 'pm' ? 'PM' : 'Both'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    label="Order in routine"
                    type="number"
                    placeholder="e.g. 3"
                    value={routineOrder}
                    onChange={(e) => setRoutineOrder(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>
    </Modal>
  );
}
