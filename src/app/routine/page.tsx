'use client';
import { useState, useMemo } from 'react';
import {
  Sun, Moon, Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle,
  CheckCircle, Info, Printer, Flame, Star, Sparkles, ListOrdered,
  GripVertical, X,
} from 'lucide-react';
import { useAppStore, useProducts, useRoutine } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { cn, categoryColor, categoryLabel } from '@/lib/utils';
import type { Product, RoutineStep } from '@/lib/types';

// ─── Ingredient conflict detection ───────────────────────────────────────────

interface Conflict {
  severity: 'warning' | 'info';
  message: string;
  products: string[];
}

function detectConflicts(products: Product[], time: 'am' | 'pm'): Conflict[] {
  const conflicts: Conflict[] = [];

  const hasRetinol = products.some((p) =>
    p.ingredients.includes('retinol') ||
    p.ingredients.includes('retinal') ||
    p.keyIngredients.includes('retinol') ||
    p.keyIngredients.includes('retinal') ||
    (p.tags.includes('retinol') && p.category === 'treatment')
  );

  const hasAHA = products.some((p) =>
    p.ingredients.includes('glycolic-acid') ||
    p.category === 'exfoliant' ||
    p.tags.includes('aha')
  );

  const hasBHA = products.some((p) =>
    p.ingredients.includes('salicylic-acid') ||
    p.tags.includes('bha')
  );

  const hasVitaminC = products.some((p) =>
    p.ingredients.includes('vitamin-c') ||
    p.keyIngredients.includes('vitamin-c')
  );

  const hasSPF = products.some((p) => p.category === 'spf');

  const retinolProducts = products
    .filter((p) => p.ingredients.includes('retinol') || p.keyIngredients.includes('retinol') || p.ingredients.includes('retinal'))
    .map((p) => p.name);
  const acidProducts = products
    .filter((p) => p.ingredients.includes('glycolic-acid') || p.ingredients.includes('salicylic-acid') || p.category === 'exfoliant')
    .map((p) => p.name);
  const vitaminCProducts = products
    .filter((p) => p.ingredients.includes('vitamin-c') || p.keyIngredients.includes('vitamin-c'))
    .map((p) => p.name);

  // Retinol in AM routine
  if (time === 'am' && hasRetinol) {
    conflicts.push({
      severity: 'warning',
      message: 'Retinoids should only be used at night — they degrade in sunlight and can cause photosensitivity.',
      products: retinolProducts,
    });
  }

  // Retinol + AHA/BHA in same session
  if (hasRetinol && (hasAHA || hasBHA)) {
    conflicts.push({
      severity: 'warning',
      message: 'Retinol + AHA/BHA together can over-exfoliate and cause significant irritation. Alternate nights instead.',
      products: [...retinolProducts, ...acidProducts],
    });
  }

  // No SPF in AM
  if (time === 'am' && !hasSPF && products.length > 0) {
    conflicts.push({
      severity: 'warning',
      message: 'No SPF in your AM routine — this is essential, especially if using any actives.',
      products: [],
    });
  }

  // Vitamin C in PM (suboptimal, not wrong)
  if (time === 'pm' && hasVitaminC) {
    conflicts.push({
      severity: 'info',
      message: 'Vitamin C is most effective in the AM as an antioxidant shield. It also pairs well with SPF.',
      products: vitaminCProducts,
    });
  }

  // AHA/BHA in AM without SPF
  if (time === 'am' && (hasAHA || hasBHA) && !hasSPF) {
    conflicts.push({
      severity: 'warning',
      message: 'Chemical exfoliants increase UV sensitivity — always follow with SPF 30+ in the AM.',
      products: acidProducts,
    });
  }

  // Multiple retinoids
  const multipleRetinoids = products.filter((p) =>
    (p.ingredients.includes('retinol') || p.ingredients.includes('retinal')) &&
    p.category === 'treatment'
  );
  if (multipleRetinoids.length > 1) {
    conflicts.push({
      severity: 'warning',
      message: 'Multiple retinoid products can cause over-exfoliation and barrier damage. Use just one.',
      products: multipleRetinoids.map((p) => p.name),
    });
  }

  return conflicts;
}

// ─── Routine tips content ─────────────────────────────────────────────────────

const AM_TIPS = [
  { icon: '1️⃣', title: 'Cleanse', desc: 'Gentle cleanser to remove overnight products and oils' },
  { icon: '2️⃣', title: 'Tone/Hydrate', desc: 'Toner or essence to prep skin and boost absorption' },
  { icon: '3️⃣', title: 'Treat', desc: 'Vitamin C serum, niacinamide, or other AM actives' },
  { icon: '4️⃣', title: 'Moisturize', desc: 'Lock in hydration with moisturizer' },
  { icon: '5️⃣', title: 'Protect', desc: 'SPF 30+ is non-negotiable — the most important step!' },
];

const PM_TIPS = [
  { icon: '1️⃣', title: 'Remove Makeup', desc: 'Micellar water or cleansing balm/oil first (double cleanse if wearing SPF/makeup)' },
  { icon: '2️⃣', title: 'Cleanse', desc: 'Water-based cleanser to finish removing impurities' },
  { icon: '3️⃣', title: 'Treat', desc: 'Retinol, acids, or other PM actives on alternate nights' },
  { icon: '4️⃣', title: 'Repair', desc: 'Peptide or barrier-repair serum' },
  { icon: '5️⃣', title: 'Moisturize', desc: 'Richer moisturizer or facial oil to support overnight repair' },
];

const LAYERING_TIPS = [
  { tip: 'Apply thinnest consistency to thickest (water → serum → moisturizer → oil)' },
  { tip: 'Wait 30–60 seconds between water-based products for better absorption' },
  { tip: 'Apply eye cream before or after moisturizer — gently tap, never rub' },
  { tip: 'Oil-based products always go after water-based ones — they act as a seal' },
  { tip: 'Cleanse, don\'t strip — your skin barrier is your most important asset' },
  { tip: 'Let active ingredients like vitamin C and retinol fully absorb before layering' },
];

// ─── Mock streak data ─────────────────────────────────────────────────────────

const STREAK_DATA = {
  currentStreak: 12,
  longestStreak: 28,
  completedToday: { am: true, pm: false },
  thisWeek: [
    { day: 'Mon', am: true, pm: true },
    { day: 'Tue', am: true, pm: true },
    { day: 'Wed', am: true, pm: false },
    { day: 'Thu', am: true, pm: true },
    { day: 'Fri', am: true, pm: true },
    { day: 'Sat', am: true, pm: true },
    { day: 'Sun', am: true, pm: false },
  ],
};

// ─── Step card component ──────────────────────────────────────────────────────

function RoutineStepCard({
  step,
  product,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  step: RoutineStep;
  product: Product;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-ivory-darker shadow-sm p-3 group hover:shadow-md transition-all hover:-translate-y-0.5">
      {/* Step number */}
      <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-rose-500">{index + 1}</span>
      </div>

      {/* Drag handle visual */}
      <GripVertical className="w-3.5 h-3.5 text-obsidian-300 flex-shrink-0" />

      {/* Product image */}
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: product.imageColor }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-lg">🧴</span>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-obsidian-800 truncate">{product.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-obsidian-400">{product.brand}</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', categoryColor(product.category))}>
            {categoryLabel(product.category)}
          </span>
        </div>
        {step.notes && (
          <div className="text-xs text-obsidian-500 mt-1 italic">{step.notes}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 rounded hover:bg-ivory-darker disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move up"
        >
          <ChevronUp className="w-3 h-3 text-obsidian-500" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 rounded hover:bg-ivory-darker disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move down"
        >
          <ChevronDown className="w-3 h-3 text-obsidian-500" />
        </button>
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg hover:bg-red-50 text-obsidian-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        title="Remove from routine"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Add Step Modal ───────────────────────────────────────────────────────────

function AddStepModal({
  open,
  onClose,
  onAdd,
  time,
  existingProductIds,
  products,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (productId: string, notes: string) => void;
  time: 'am' | 'pm';
  existingProductIds: string[];
  products: Product[];
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const available = products
    .filter((p) => !existingProductIds.includes(p.id))
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });

  function handleAdd() {
    if (!selected) return;
    onAdd(selected, notes);
    setSelected(null);
    setNotes('');
    setSearch('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => { setSelected(null); setSearch(''); setNotes(''); onClose(); }}
      title={`Add to ${time.toUpperCase()} Routine`}
      description="Pick a product from your shelf to add to this routine slot"
      size="md"
    >
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-ivory-darker px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
        />

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-sm text-obsidian-400 text-center py-8">
              {products.filter((p) => !existingProductIds.includes(p.id)).length === 0
                ? 'All your products are already in this routine'
                : 'No products match your search'}
            </p>
          ) : (
            available.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(selected === p.id ? null : p.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  selected === p.id
                    ? 'border-rose-300 bg-rose-50'
                    : 'border-ivory-darker bg-white hover:bg-ivory-dark'
                )}
              >
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: p.imageColor }}
                >
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-obsidian-800 truncate">{p.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-obsidian-400">{p.brand}</span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', categoryColor(p.category))}>
                      {categoryLabel(p.category)}
                    </span>
                  </div>
                </div>
                {selected === p.id && (
                  <CheckCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {selected && (
          <input
            type="text"
            placeholder="Notes for this step (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-ivory-darker px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setSelected(null); setSearch(''); setNotes(''); onClose(); }} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selected} className="flex-1">
            <Plus className="w-4 h-4" />
            Add to Routine
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Routine Column ───────────────────────────────────────────────────────────

function RoutineColumn({
  time,
  steps,
  products,
  allProducts,
  onUpdate,
}: {
  time: 'am' | 'pm';
  steps: RoutineStep[];
  products: Product[];
  allProducts: Product[];
  onUpdate: (steps: RoutineStep[]) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);

  const isAM = time === 'am';
  const Icon = isAM ? Sun : Moon;
  const accentColor = isAM ? 'text-amber-500' : 'text-indigo-500';
  const headerBg = isAM
    ? 'from-amber-50 to-orange-50 border-amber-100'
    : 'from-indigo-50 to-violet-50 border-indigo-100';
  const btnBg = isAM ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700';

  const conflicts = detectConflicts(products, time);

  function moveUp(index: number) {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    onUpdate(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
  }

  function moveDown(index: number) {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    onUpdate(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
  }

  function removeStep(productId: string) {
    onUpdate(steps.filter((s) => s.productId !== productId).map((s, i) => ({ ...s, order: i + 1 })));
  }

  function addStep(productId: string, notes: string) {
    const newStep: RoutineStep = {
      productId,
      order: steps.length + 1,
      notes: notes || undefined,
    };
    onUpdate([...steps, newStep]);
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Column header */}
      <div className={cn('rounded-2xl border bg-gradient-to-br p-4 mb-4', headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', accentColor)} />
            <h2 className="text-base font-bold text-obsidian-800">{isAM ? 'AM Routine' : 'PM Routine'}</h2>
            <span className="text-xs text-obsidian-400">{steps.length} steps</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAddOpen(true)}
            className={cn('text-xs rounded-lg', btnBg)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Step
          </Button>
        </div>
        <div className="text-xs text-obsidian-500 mt-1">
          {isAM ? 'Cleanse · Protect · SPF' : 'Treat · Repair · Restore'}
        </div>
      </div>

      {/* Conflict alerts */}
      {conflicts.length > 0 && (
        <div className="space-y-2 mb-4">
          {conflicts.map((c, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl p-3 flex items-start gap-2.5',
                c.severity === 'warning'
                  ? 'bg-amber-50 border border-amber-100'
                  : 'bg-blue-50 border border-blue-100'
              )}
            >
              {c.severity === 'warning' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={cn('text-xs', c.severity === 'warning' ? 'text-amber-700' : 'text-blue-700')}>
                  {c.message}
                </p>
                {c.products.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.products.map((name) => (
                      <span
                        key={name}
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full font-medium',
                          c.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Steps list */}
      {steps.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ivory-darker py-12 text-center">
          <div className="text-3xl mb-2">{isAM ? '☀️' : '🌙'}</div>
          <div className="text-sm text-obsidian-500">No steps yet</div>
          <div className="text-xs text-obsidian-400 mt-1">Add products to build your routine</div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add First Step
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => {
            const product = products.find((p) => p.id === step.productId);
            if (!product) return null;
            return (
              <RoutineStepCard
                key={step.productId}
                step={step}
                product={product}
                index={index}
                total={steps.length}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                onRemove={() => removeStep(step.productId)}
              />
            );
          })}

          {/* Add button at bottom */}
          <button
            onClick={() => setAddOpen(true)}
            className="w-full rounded-xl border-2 border-dashed border-ivory-darker py-3 flex items-center justify-center gap-2 text-sm text-obsidian-400 hover:border-rose-200 hover:text-rose-400 hover:bg-rose-50/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add another step
          </button>
        </div>
      )}

      <AddStepModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addStep}
        time={time}
        existingProductIds={steps.map((s) => s.productId)}
        products={allProducts}
      />
    </div>
  );
}

// ─── Streak Tracker ───────────────────────────────────────────────────────────

function StreakTracker() {
  const data = STREAK_DATA;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Routine Streak
          </CardTitle>
          <span className="text-xs text-obsidian-400">This week</span>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        {/* Streak numbers */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
            <div className="text-2xl font-bold text-orange-500">{data.currentStreak}</div>
            <div className="text-xs text-orange-600 mt-0.5">Current streak</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
            <div className="text-2xl font-bold text-amber-500">{data.longestStreak}</div>
            <div className="text-xs text-amber-600 mt-0.5">Best streak</div>
          </div>
        </div>

        {/* Today status */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className={cn(
            'rounded-xl p-2.5 flex items-center gap-2 border',
            data.completedToday.am ? 'bg-amber-50 border-amber-100' : 'bg-ivory-dark border-ivory-darker'
          )}>
            <Sun className={cn('w-4 h-4', data.completedToday.am ? 'text-amber-500' : 'text-obsidian-300')} />
            <div>
              <div className="text-xs font-medium text-obsidian-700">AM</div>
              <div className={cn('text-xs', data.completedToday.am ? 'text-amber-600' : 'text-obsidian-400')}>
                {data.completedToday.am ? 'Done ✓' : 'Not yet'}
              </div>
            </div>
          </div>
          <div className={cn(
            'rounded-xl p-2.5 flex items-center gap-2 border',
            data.completedToday.pm ? 'bg-indigo-50 border-indigo-100' : 'bg-ivory-dark border-ivory-darker'
          )}>
            <Moon className={cn('w-4 h-4', data.completedToday.pm ? 'text-indigo-500' : 'text-obsidian-300')} />
            <div>
              <div className="text-xs font-medium text-obsidian-700">PM</div>
              <div className={cn('text-xs', data.completedToday.pm ? 'text-indigo-600' : 'text-obsidian-400')}>
                {data.completedToday.pm ? 'Done ✓' : 'Not yet'}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly grid */}
        <div>
          <div className="grid grid-cols-7 gap-1">
            {data.thisWeek.map((day) => (
              <div key={day.day} className="text-center">
                <div className="text-xs text-obsidian-400 mb-1">{day.day}</div>
                <div className={cn(
                  'w-6 h-6 rounded-md mx-auto mb-0.5 flex items-center justify-center',
                  day.am ? 'bg-amber-200' : 'bg-ivory-darker'
                )}>
                  <Sun className={cn('w-2.5 h-2.5', day.am ? 'text-amber-600' : 'text-obsidian-300')} />
                </div>
                <div className={cn(
                  'w-6 h-6 rounded-md mx-auto flex items-center justify-center',
                  day.pm ? 'bg-indigo-200' : 'bg-ivory-darker'
                )}>
                  <Moon className={cn('w-2.5 h-2.5', day.pm ? 'text-indigo-600' : 'text-obsidian-300')} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Routine Tips Panel ───────────────────────────────────────────────────────

function RoutineTipsPanel() {
  const [expandedSection, setExpandedSection] = useState<string | null>('layering');

  const sections = [
    {
      id: 'am',
      title: 'AM Routine Best Practices',
      icon: Sun,
      iconColor: 'text-amber-500',
      items: AM_TIPS,
      type: 'steps' as const,
    },
    {
      id: 'pm',
      title: 'PM Routine Best Practices',
      icon: Moon,
      iconColor: 'text-indigo-500',
      items: PM_TIPS,
      type: 'steps' as const,
    },
    {
      id: 'layering',
      title: 'Layering Order Tips',
      icon: ListOrdered,
      iconColor: 'text-rose-500',
      items: LAYERING_TIPS.map((t) => ({ icon: '•', title: '', desc: t.tip })),
      type: 'tips' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          Routine Tips & Best Practices
        </CardTitle>
      </CardHeader>
      <CardBody className="pt-0 space-y-2">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSection === section.id;
          return (
            <div key={section.id} className="border border-ivory-darker rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-ivory-dark transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SectionIcon className={cn('w-4 h-4', section.iconColor)} />
                  <span className="text-xs font-semibold text-obsidian-700">{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-obsidian-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-obsidian-400" />
                )}
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-ivory-darker pt-3 space-y-2">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.icon}</span>
                      <div>
                        {item.title && (
                          <span className="text-xs font-semibold text-obsidian-700">{item.title}: </span>
                        )}
                        <span className="text-xs text-obsidian-500">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}

// ─── Print/Export Modal ───────────────────────────────────────────────────────

function PrintRoutineModal({
  open,
  onClose,
  amSteps,
  pmSteps,
  products,
}: {
  open: boolean;
  onClose: () => void;
  amSteps: RoutineStep[];
  pmSteps: RoutineStep[];
  products: Product[];
}) {
  function getProduct(id: string) {
    return products.find((p) => p.id === id);
  }

  return (
    <Modal open={open} onClose={onClose} title="Export Routine" size="md">
      <div className="space-y-4">
        <div className="bg-ivory-dark rounded-xl p-4 border border-ivory-darker font-mono text-sm space-y-4">
          <div>
            <div className="font-bold text-amber-600 mb-2">☀️ AM ROUTINE</div>
            {amSteps.map((s, i) => {
              const p = getProduct(s.productId);
              return p ? (
                <div key={s.productId} className="text-obsidian-700">
                  {i + 1}. {p.brand} — {p.name}
                  {s.notes && <span className="text-obsidian-400"> ({s.notes})</span>}
                </div>
              ) : null;
            })}
            {amSteps.length === 0 && <div className="text-obsidian-400 italic">No steps added</div>}
          </div>
          <div>
            <div className="font-bold text-indigo-600 mb-2">🌙 PM ROUTINE</div>
            {pmSteps.map((s, i) => {
              const p = getProduct(s.productId);
              return p ? (
                <div key={s.productId} className="text-obsidian-700">
                  {i + 1}. {p.brand} — {p.name}
                  {s.notes && <span className="text-obsidian-400"> ({s.notes})</span>}
                </div>
              ) : null;
            })}
            {pmSteps.length === 0 && <div className="text-obsidian-400 italic">No steps added</div>}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          <Button
            className="flex-1"
            onClick={() => {
              const text = [
                '☀️ AM ROUTINE',
                ...amSteps.map((s, i) => {
                  const p = getProduct(s.productId);
                  return p ? `${i + 1}. ${p.brand} — ${p.name}${s.notes ? ` (${s.notes})` : ''}` : '';
                }).filter(Boolean),
                '',
                '🌙 PM ROUTINE',
                ...pmSteps.map((s, i) => {
                  const p = getProduct(s.productId);
                  return p ? `${i + 1}. ${p.brand} — ${p.name}${s.notes ? ` (${s.notes})` : ''}` : '';
                }).filter(Boolean),
              ].join('\n');
              navigator.clipboard?.writeText(text);
            }}
          >
            Copy to Clipboard
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoutinePage() {
  const products = useProducts();
  const routine = useRoutine();
  const { updateRoutine } = useAppStore();
  const [printOpen, setPrintOpen] = useState(false);

  const amProducts = useMemo(
    () => routine.am.map((s) => products.find((p) => p.id === s.productId)).filter(Boolean) as Product[],
    [routine.am, products]
  );

  const pmProducts = useMemo(
    () => routine.pm.map((s) => products.find((p) => p.id === s.productId)).filter(Boolean) as Product[],
    [routine.pm, products]
  );

  const amConflicts = detectConflicts(amProducts, 'am');
  const pmConflicts = detectConflicts(pmProducts, 'pm');
  const totalConflicts = amConflicts.filter((c) => c.severity === 'warning').length + pmConflicts.filter((c) => c.severity === 'warning').length;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-obsidian-800">My Routine</h1>
          <p className="text-obsidian-500 mt-1">
            {routine.am.length} AM steps · {routine.pm.length} PM steps
            {totalConflicts > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                · {totalConflicts} conflict{totalConflicts !== 1 ? 's' : ''} detected
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
          <Printer className="w-4 h-4" />
          Export Routine
        </Button>
      </div>

      {/* Overall conflict banner */}
      {totalConflicts > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-800">
              {totalConflicts} ingredient conflict{totalConflicts !== 1 ? 's' : ''} in your routine
            </div>
            <div className="text-xs text-amber-600 mt-0.5">
              Review the warnings below in each routine column for guidance on how to fix them.
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* AM + PM columns */}
        <div className="flex-[2] flex gap-5 min-w-0">
          <RoutineColumn
            time="am"
            steps={routine.am}
            products={amProducts}
            allProducts={products}
            onUpdate={(steps) => updateRoutine('am', steps)}
          />
          <RoutineColumn
            time="pm"
            steps={routine.pm}
            products={pmProducts}
            allProducts={products}
            onUpdate={(steps) => updateRoutine('pm', steps)}
          />
        </div>

        {/* Right sidebar */}
        <div className="w-72 flex-shrink-0 space-y-5">
          <StreakTracker />
          <RoutineTipsPanel />

          {/* Products not in routine */}
          {products.filter((p) => !routine.am.some((s) => s.productId === p.id) && !routine.pm.some((s) => s.productId === p.id)).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Not in Routine</CardTitle>
                <p className="text-xs text-obsidian-400 mt-0.5">Products on your shelf not yet assigned to AM or PM</p>
              </CardHeader>
              <CardBody className="pt-0 space-y-2">
                {products
                  .filter((p) => !routine.am.some((s) => s.productId === p.id) && !routine.pm.some((s) => s.productId === p.id))
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: p.imageColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-obsidian-700 truncate">{p.name}</div>
                        <div className="text-xs text-obsidian-400 truncate">{p.brand}</div>
                      </div>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', categoryColor(p.category))}>
                        {categoryLabel(p.category)}
                      </span>
                    </div>
                  ))}
              </CardBody>
            </Card>
          )}

          {/* Ingredient summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Key Actives in Use</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-1.5">
                {[
                  { id: 'retinol', label: 'Retinol', color: 'bg-purple-100 text-purple-700', time: 'PM only' },
                  { id: 'vitamin-c', label: 'Vitamin C', color: 'bg-amber-100 text-amber-700', time: 'AM' },
                  { id: 'niacinamide', label: 'Niacinamide', color: 'bg-blue-100 text-blue-700', time: 'AM/PM' },
                  { id: 'glycolic-acid', label: 'AHA', color: 'bg-red-100 text-red-700', time: 'PM only' },
                  { id: 'salicylic-acid', label: 'BHA', color: 'bg-rose-100 text-rose-700', time: 'PM only' },
                  { id: 'ceramides', label: 'Ceramides', color: 'bg-emerald-100 text-emerald-700', time: 'AM/PM' },
                  { id: 'hyaluronic-acid', label: 'Hyaluronic Acid', color: 'bg-sky-100 text-sky-700', time: 'AM/PM' },
                ]
                  .filter((ing) =>
                    [...amProducts, ...pmProducts].some(
                      (p) => p.ingredients.includes(ing.id) || p.keyIngredients.includes(ing.id)
                    )
                  )
                  .map((ing) => (
                    <div key={ing.id} className="flex items-center justify-between">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ing.color)}>{ing.label}</span>
                      <span className="text-xs text-obsidian-400">{ing.time}</span>
                    </div>
                  ))}
                {[...amProducts, ...pmProducts].length === 0 && (
                  <p className="text-xs text-obsidian-400 py-2 text-center">Add products to see active ingredients</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <PrintRoutineModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        amSteps={routine.am}
        pmSteps={routine.pm}
        products={products}
      />
    </div>
  );
}
