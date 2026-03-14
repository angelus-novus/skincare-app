'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Package, DollarSign, Calendar, Clock, ExternalLink,
  Star, ThumbsUp, ThumbsDown, AlertTriangle, Trash2, Edit2,
  CheckCircle2, RefreshCw, Sparkles, Home, FlaskConical,
} from 'lucide-react';
import { useAppStore, useIngredients } from '@/lib/store';
import type { ProductRating } from '@/lib/types';
import {
  cn, categoryLabel, categoryColor, concernLabel, formatDate,
  daysUntilExpiry, getExpiryStatus, evidenceLevelColor,
} from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const product = useAppStore((s) => s.products.find((p) => p.id === id));
  const { rateProduct, deleteProduct } = useAppStore();
  const allIngredients = useIngredients();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProductRating>(BLANK_RATING);
  const [prosInput, setProsInput] = useState('');
  const [consInput, setConsInput] = useState('');
  const [adverseInput, setAdverseInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // If product not found
  if (!product) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-50 flex items-center justify-center"
      >
        <Card className="max-w-md w-full mx-4">
          <CardBody className="text-center py-12">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Product Not Found</h2>
            <p className="text-slate-500 text-sm mb-6">
              This product may have been removed or the link is invalid.
            </p>
            <Link href="/products">
              <Button>
                <ArrowLeft className="w-4 h-4" />
                Back to Products
              </Button>
            </Link>
          </CardBody>
        </Card>
      </motion.div>
    );
  }

  // Initialize draft from product rating when editing starts
  function startEditing() {
    setDraft(product!.rating || BLANK_RATING);
    setProsInput('');
    setConsInput('');
    setAdverseInput('');
    setEditing(true);
  }

  function saveRating() {
    rateProduct(product!.id, { ...draft, reviewDate: new Date().toISOString().split('T')[0] });
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

  function handleDelete() {
    deleteProduct(product!.id);
    router.push('/products');
  }

  const expiryDays = daysUntilExpiry(product);
  const expiryStatus = getExpiryStatus(expiryDays);

  const productIngredients = allIngredients.filter((i) => product.ingredients.includes(i.id));
  const keyIngredients = productIngredients.filter((i) => product.keyIngredients.includes(i.id));
  const otherIngredients = productIngredients.filter((i) => !product.keyIngredients.includes(i.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-slate-50"
    >
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-8 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4" />
                View on Shelf
              </Button>
            </Link>
            <Link href="/ingredients">
              <Button variant="ghost" size="sm">
                <FlaskConical className="w-4 h-4" />
                Ingredients
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left Column: Image & Quick Info ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="lg:col-span-1"
          >
            {/* Product image */}
            <Card className="overflow-hidden mb-6">
              <div className="relative aspect-square">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center"
                    style={{ backgroundColor: product.imageColor }}
                  >
                    <Package className="w-20 h-20 text-white/30" />
                    <div className="mt-4 text-white/50 text-sm font-medium">{product.brand}</div>
                  </div>
                )}
                {/* Category badge overlay */}
                <div className="absolute top-4 left-4">
                  <span className={cn('text-xs font-semibold rounded-full px-3 py-1 shadow-sm', categoryColor(product.category))}>
                    {categoryLabel(product.category)}
                  </span>
                </div>
                {product.inRoutine && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-emerald-500 text-white text-xs font-semibold rounded-full px-2.5 py-1 shadow-sm">
                      {product.routineStep === 'am' ? 'AM' : product.routineStep === 'pm' ? 'PM' : 'AM + PM'}
                      {product.routineOrder ? ` #${product.routineOrder}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick stats */}
            <Card>
              <CardBody className="space-y-3">
                {product.price !== undefined && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-medium">${product.price.toFixed(2)}</span>
                    {product.size && (
                      <span className="text-slate-400">/ {product.size}</span>
                    )}
                  </div>
                )}
                {!product.price && product.size && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{product.size}</span>
                  </div>
                )}
                {product.purchaseDate && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Purchased {formatDate(product.purchaseDate)}</span>
                  </div>
                )}
                {product.openedDate && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Opened {formatDate(product.openedDate)}</span>
                  </div>
                )}
                {expiryDays !== null && (
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium',
                      expiryStatus === 'expired'
                        ? 'bg-red-50 text-red-600'
                        : expiryStatus === 'warning'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    )}
                  >
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {expiryStatus === 'expired'
                        ? `Expired ${Math.abs(expiryDays)} days ago`
                        : `${expiryDays} days until expiry`}
                    </span>
                  </div>
                )}
                {product.paoMonths && (
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>PAO: {product.paoMonths} months</span>
                  </div>
                )}

                {product.purchaseUrl && (
                  <a
                    href={product.purchaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buy Again
                    </Button>
                  </a>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Product
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* ── Right Column: Details ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Product header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>
              <p className="text-slate-500 mt-1">{product.brand}</p>

              {/* Concerns & tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {product.concerns.map((c) => (
                  <Badge key={c} className="bg-rose-50 text-rose-600">
                    {concernLabel(c)}
                  </Badge>
                ))}
                {product.tags.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>

            {/* ── Rating / Review Section ── */}
            <Card>
              <CardBody>
                {product.rating && !editing && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400" />
                        Your Review
                      </h3>
                      <Button variant="ghost" size="sm" onClick={startEditing}>
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Review
                      </Button>
                    </div>

                    {/* Overall rating large */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl font-bold text-slate-800">
                        {product.rating.overall.toFixed(1)}
                      </div>
                      <div>
                        <StarRating value={product.rating.overall} size="lg" />
                        <p className="text-xs text-slate-400 mt-1">
                          Reviewed {formatDate(product.rating.reviewDate)}
                        </p>
                      </div>
                    </div>

                    {/* Rating breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: 'Overall', value: product.rating.overall },
                        { label: 'Texture', value: product.rating.texture },
                        { label: 'Efficacy', value: product.rating.efficacy },
                        { label: 'Value', value: product.rating.value },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                          <div className="text-lg font-bold text-slate-800">{value.toFixed(1)}</div>
                          <div className="text-xs text-slate-500 mb-1">{label}</div>
                          <StarRating value={value} size="sm" className="justify-center" />
                        </div>
                      ))}
                    </div>

                    {/* Would repurchase */}
                    <div
                      className={cn(
                        'rounded-xl p-3 flex items-center gap-3 mb-4',
                        product.rating.wouldRepurchase ? 'bg-emerald-50' : 'bg-red-50'
                      )}
                    >
                      {product.rating.wouldRepurchase ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="text-sm font-medium text-slate-700">
                        {product.rating.wouldRepurchase ? 'Would repurchase' : 'Would not repurchase'}
                      </span>
                    </div>

                    {/* Pros */}
                    {product.rating.pros.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mb-2">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Pros
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {product.rating.pros.map((p, i) => (
                            <span key={i} className="bg-emerald-50 text-emerald-700 text-xs rounded-full px-3 py-1 font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cons */}
                    {product.rating.cons.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-rose-500 text-xs font-semibold mb-2">
                          <ThumbsDown className="w-3.5 h-3.5" />
                          Cons
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {product.rating.cons.map((c, i) => (
                            <span key={i} className="bg-rose-50 text-rose-600 text-xs rounded-full px-3 py-1 font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Adverse reactions */}
                    {product.rating.adverseReactions.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold mb-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Adverse Reactions
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {product.rating.adverseReactions.map((r, i) => (
                            <span key={i} className="bg-amber-100 text-amber-700 text-xs rounded-full px-3 py-1 font-medium">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {product.rating.notes && (
                      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 italic">
                        &ldquo;{product.rating.notes}&rdquo;
                      </div>
                    )}
                  </div>
                )}

                {/* No review yet */}
                {!product.rating && !editing && (
                  <div className="text-center py-10">
                    <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 mb-4">You haven&apos;t reviewed this product yet</p>
                    <Button onClick={startEditing}>
                      <Edit2 className="w-4 h-4" />
                      Write a Review
                    </Button>
                  </div>
                )}

                {/* Editing mode */}
                {editing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    <h3 className="font-semibold text-slate-700">
                      {product.rating ? 'Edit Your Review' : 'Write Your Review'}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Overall Rating', field: 'overall' as const },
                        { label: 'Texture', field: 'texture' as const },
                        { label: 'Efficacy', field: 'efficacy' as const },
                        { label: 'Value for Money', field: 'value' as const },
                      ].map(({ label, field }) => (
                        <div key={field}>
                          <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
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
                      <label className="text-xs font-medium text-slate-600 block mb-1">Pros</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a pro..."
                          value={prosInput}
                          onChange={(e) => setProsInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('pros', prosInput, setProsInput))}
                        />
                        <Button size="sm" variant="secondary" onClick={() => addTag('pros', prosInput, setProsInput)}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {draft.pros.map((p, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-700 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                            {p}
                            <button type="button" onClick={() => removeTag('pros', i)} className="hover:text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Cons */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Cons</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a con..."
                          value={consInput}
                          onChange={(e) => setConsInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('cons', consInput, setConsInput))}
                        />
                        <Button size="sm" variant="secondary" onClick={() => addTag('cons', consInput, setConsInput)}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {draft.cons.map((c, i) => (
                          <span key={i} className="bg-rose-50 text-rose-600 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                            {c}
                            <button type="button" onClick={() => removeTag('cons', i)} className="hover:text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Adverse reactions */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Adverse Reactions</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. redness, breakout..."
                          value={adverseInput}
                          onChange={(e) => setAdverseInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('adverseReactions', adverseInput, setAdverseInput))}
                        />
                        <Button size="sm" variant="secondary" onClick={() => addTag('adverseReactions', adverseInput, setAdverseInput)}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {draft.adverseReactions.map((r, i) => (
                          <span key={i} className="bg-amber-50 text-amber-700 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                            {r}
                            <button type="button" onClick={() => removeTag('adverseReactions', i)} className="hover:text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.wouldRepurchase}
                        onChange={(e) => setDraft((d) => ({ ...d, wouldRepurchase: e.target.checked }))}
                        className="w-4 h-4 accent-rose-500"
                      />
                      <span className="text-sm text-slate-700">Would repurchase</span>
                    </label>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                      <Button onClick={saveRating}>
                        <RefreshCw className="w-4 h-4" />
                        Save Review
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardBody>
            </Card>

            {/* ── Ingredients Section ── */}
            <Card>
              <CardBody>
                <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
                  <FlaskConical className="w-4 h-4 text-rose-400" />
                  Ingredients
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    {productIngredients.length} tracked
                  </span>
                </h3>

                {keyIngredients.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-rose-400" />
                      Key Ingredients
                    </h4>
                    <div className="space-y-2">
                      {keyIngredients.map((ing) => (
                        <Link
                          key={ing.id}
                          href={`/ingredients/${ing.id}`}
                          className="block bg-rose-50/50 border border-rose-100 rounded-xl p-3 hover:bg-rose-50 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-sm text-slate-800 group-hover:text-rose-700 transition-colors">
                                {ing.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">{ing.inci}</div>
                            </div>
                            <span
                              className={cn(
                                'text-xs rounded-full px-2 py-0.5 font-medium flex-shrink-0',
                                evidenceLevelColor(ing.evidenceLevel)
                              )}
                            >
                              {ing.evidenceLevel} evidence
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-2">{ing.whatItDoes}</p>
                          {ing.benefits.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {ing.benefits.slice(0, 4).map((b) => (
                                <span key={b} className="bg-white text-slate-600 text-xs rounded-full px-2 py-0.5 border border-rose-100">
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {otherIngredients.length > 0 && (
                  <div>
                    {keyIngredients.length > 0 && (
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Other Tracked Ingredients
                      </h4>
                    )}
                    <div className="space-y-2">
                      {otherIngredients.map((ing) => (
                        <Link
                          key={ing.id}
                          href={`/ingredients/${ing.id}`}
                          className="block bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm text-slate-700 group-hover:text-rose-600 transition-colors">
                              {ing.name}
                            </div>
                            <span
                              className={cn(
                                'text-xs rounded-full px-2 py-0.5 font-medium',
                                evidenceLevelColor(ing.evidenceLevel)
                              )}
                            >
                              {ing.evidenceLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{ing.whatItDoes}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {productIngredients.length === 0 && (
                  <div className="text-center py-6">
                    <FlaskConical className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No tracked ingredients</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Product"
        description="This action cannot be undone."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <strong>{product.name}</strong> by {product.brand}?
            This will permanently remove it from your shelf.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
