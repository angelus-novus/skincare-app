'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { AdminGate } from '@/components/admin/AdminGate';
import { useAppStore, useProducts } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import type { Product, ProductCategory } from '@/lib/types';

const CATEGORIES: ProductCategory[] = [
  'cleanser','toner','essence','serum','moisturizer','eye-cream',
  'spf','mask','exfoliant','oil','mist','treatment','lip-care','body-care',
];

const BOTTLE_COLORS = ['#E8C4A0','#B5D5C5','#C9A96E','#E8B4B8','#A8C5DA','#D4B8E0','#F0E6D3','#B8D4B8'];

const EMPTY_FORM = {
  name: '',
  brand: '',
  category: 'serum' as ProductCategory,
  price: '',
  size: '',
  imageColor: '#E8C4A0',
  imageUrl: '',
  purchaseUrl: '',
  tags: '',
};

function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: typeof EMPTY_FORM;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Product Name" placeholder="e.g. Vitamin C Serum" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <Input label="Brand" placeholder="e.g. The Ordinary" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium tracking-wider uppercase text-obsidian-500">Category</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm text-obsidian-800 bg-white border border-ivory-darker focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</option>
            ))}
          </select>
        </div>
        <Input label="Price (optional)" placeholder="e.g. 29.99" value={form.price} onChange={(e) => set('price', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Size (optional)" placeholder="e.g. 30ml" value={form.size} onChange={(e) => set('size', e.target.value)} />
        <Input label="Purchase URL (optional)" placeholder="https://..." value={form.purchaseUrl} onChange={(e) => set('purchaseUrl', e.target.value)} />
      </div>
      <Input label="Image URL (optional)" placeholder="https://images.unsplash.com/..." value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
      <div className="space-y-1.5">
        <label className="text-xs font-medium tracking-wider uppercase text-obsidian-500">Bottle Color</label>
        <div className="flex gap-2 flex-wrap">
          {BOTTLE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => set('imageColor', color)}
              className={cn('w-8 h-8 rounded-full border-2 transition-all', form.imageColor === color ? 'border-obsidian-800 scale-110' : 'border-transparent')}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <Input label="Tags (comma-separated)" placeholder="e.g. vitamin-c, brightening" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.brand.trim()}>Save Product</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ProductsAdmin() {
  const products = useProducts();
  const { addProduct, updateProduct, deleteProduct } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (form: typeof EMPTY_FORM) => {
    if (editing) {
      updateProduct(editing.id, {
        name: form.name,
        brand: form.brand,
        category: form.category,
        price: form.price ? parseFloat(form.price) : undefined,
        size: form.size || undefined,
        imageColor: form.imageColor,
        imageUrl: form.imageUrl || '',
        purchaseUrl: form.purchaseUrl || undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setEditing(null);
    } else {
      addProduct({
        id: `product-${Date.now()}`,
        name: form.name,
        brand: form.brand,
        category: form.category,
        price: form.price ? parseFloat(form.price) : undefined,
        size: form.size || undefined,
        imageColor: form.imageColor,
        imageUrl: form.imageUrl || '',
        purchaseUrl: form.purchaseUrl || undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        concerns: [],
        ingredients: [],
        keyIngredients: [],
        inRoutine: false,
      });
      setShowForm(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /> Admin</Button>
        </Link>
        <h1 className="text-2xl font-bold text-obsidian-800 flex-1">Products</h1>
        {!showForm && !editing && (
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Add Product</Button>
        )}
      </div>

      {(showForm || editing) && (
        <Card className="mb-8">
          <CardBody className="p-6">
            <h2 className="text-lg font-semibold text-obsidian-800 mb-4">{editing ? 'Edit Product' : 'Add Product'}</h2>
            <ProductForm
              initial={editing ? {
                name: editing.name,
                brand: editing.brand,
                category: editing.category,
                price: editing.price?.toString() ?? '',
                size: editing.size ?? '',
                imageColor: editing.imageColor,
                imageUrl: editing.imageUrl,
                purchaseUrl: editing.purchaseUrl ?? '',
                tags: editing.tags.join(', '),
              } : undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          </CardBody>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-obsidian-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search ? 'No products found' : 'No products yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => (
            <Card key={product.id}>
              <CardBody className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: product.imageColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-obsidian-800 truncate">{product.name}</span>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <p className="text-xs text-obsidian-400">{product.brand}{product.price ? ` · $${product.price}` : ''}{product.size ? ` · ${product.size}` : ''}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(product); setShowForm(false); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-50" onClick={() => setConfirmDelete(product.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Product">
        <p className="text-sm text-obsidian-600 mb-6">Are you sure you want to delete this product? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { deleteProduct(confirmDelete!); setConfirmDelete(null); }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminProductsPage() {
  return <AdminGate><ProductsAdmin /></AdminGate>;
}
