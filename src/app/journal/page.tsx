'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Camera,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Moon,
  Zap,
  Filter,
  ChevronDown,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  X,
} from 'lucide-react';
import { format, parseISO, subDays, isWithinInterval } from 'date-fns';
import { useAppStore } from '@/lib/store';
import { concernLabel } from '@/lib/utils';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea } from '@/components/ui/input';
import type { JournalEntry, SkinConcern } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────
const MOODS: { value: JournalEntry['mood']; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😊', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'bad', emoji: '😞', label: 'Bad' },
  { value: 'terrible', emoji: '😢', label: 'Terrible' },
];

const CONCERNS: SkinConcern[] = [
  'acne', 'hyperpigmentation', 'anti-aging', 'dryness', 'sensitivity',
  'redness', 'pores', 'texture', 'dullness', 'dark-circles', 'fine-lines', 'firmness',
];

const WEATHER_OPTIONS = ['sunny', 'cloudy', 'rainy', 'windy', 'humid', 'dry', 'cold', 'hot'];
const STRESS_OPTIONS: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

function skinConditionColor(score: number) {
  if (score <= 4) return 'bg-red-500';
  if (score <= 6) return 'bg-amber-500';
  if (score <= 8) return 'bg-emerald-500';
  return 'bg-emerald-600';
}

function skinConditionBg(score: number) {
  if (score <= 4) return 'bg-red-50 text-red-700 border-red-200';
  if (score <= 6) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (score <= 8) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-emerald-100 text-emerald-800 border-emerald-300';
}

function moodEmoji(mood: JournalEntry['mood']) {
  return MOODS.find((m) => m.value === mood)?.emoji ?? '😐';
}

function WeatherIcon({ weather }: { weather: string }) {
  if (weather === 'sunny') return <Sun className="w-3.5 h-3.5 text-amber-500" />;
  if (weather === 'rainy') return <CloudRain className="w-3.5 h-3.5 text-blue-500" />;
  if (weather === 'windy') return <Wind className="w-3.5 h-3.5 text-slate-500" />;
  return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
}

// ── Add Entry Modal ────────────────────────────────────────────────────────────
function AddEntryModal({
  open,
  onClose,
  editEntry,
}: {
  open: boolean;
  onClose: () => void;
  editEntry?: JournalEntry;
}) {
  const { products, addJournalEntry, updateJournalEntry } = useAppStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [date, setDate] = useState(editEntry?.date ?? today);
  const [mood, setMood] = useState<JournalEntry['mood']>(editEntry?.mood ?? 'okay');
  const [skinCondition, setSkinCondition] = useState(editEntry?.skinCondition ?? 7);
  const [notes, setNotes] = useState(editEntry?.notes ?? '');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(editEntry?.products ?? []);
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcern[]>(editEntry?.concerns ?? []);
  const [weather, setWeather] = useState(editEntry?.environment?.weather ?? '');
  const [stress, setStress] = useState<'low' | 'medium' | 'high'>(editEntry?.environment?.stress ?? 'low');
  const [sleep, setSleep] = useState<string>(String(editEntry?.environment?.sleep ?? '7'));

  const sliderColor = () => {
    if (skinCondition <= 4) return '#ef4444';
    if (skinCondition <= 6) return '#f59e0b';
    if (skinCondition <= 8) return '#10b981';
    return '#059669';
  };

  function toggleProduct(id: string) {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function toggleConcern(c: SkinConcern) {
    setSelectedConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function handleSave() {
    const entry: JournalEntry = {
      id: editEntry?.id ?? `je-${Date.now()}`,
      date,
      mood,
      skinCondition,
      notes: notes || undefined,
      products: selectedProducts,
      concerns: selectedConcerns,
      environment: {
        weather: weather || undefined,
        stress,
        sleep: sleep ? parseFloat(sleep) : undefined,
      },
    };
    if (editEntry) {
      updateJournalEntry(editEntry.id, entry);
    } else {
      addJournalEntry(entry);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editEntry ? 'Edit Journal Entry' : 'Add Journal Entry'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={today}
        />

        {/* Mood */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Mood</label>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl border-2 transition-all ${
                  mood === m.value
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs text-slate-600 mt-1">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skin Condition Slider */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Skin Condition:{' '}
            <span className="font-bold" style={{ color: sliderColor() }}>
              {skinCondition}/10
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={skinCondition}
            onChange={(e) => setSkinCondition(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: sliderColor() }}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Terrible</span>
            <span>Amazing</span>
          </div>
        </div>

        {/* Notes */}
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did your skin feel today?"
          rows={3}
        />

        {/* Products Used */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Products Used</label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className={`text-xs rounded-full px-3 py-1 border transition-all ${
                  selectedProducts.includes(p.id)
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Concerns */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Skin Concerns Today</label>
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleConcern(c)}
                className={`text-xs rounded-full px-3 py-1 border transition-all ${
                  selectedConcerns.includes(c)
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-200'
                }`}
              >
                {concernLabel(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Environment */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-3">Environment</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Weather</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="">— Select —</option>
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w.charAt(0).toUpperCase() + w.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Stress</label>
              <div className="flex gap-1">
                {STRESS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStress(s)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${
                      stress === s
                        ? s === 'low'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : s === 'medium'
                          ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-red-100 text-red-700 border-red-300'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sleep (hrs)</label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                placeholder="7"
              />
            </div>
          </div>
        </div>

        {/* Photo Placeholder */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 hover:border-rose-300 hover:text-rose-400 transition-colors cursor-pointer">
          <Camera className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Add Photo</p>
          <p className="text-xs mt-0.5">Photo upload coming soon</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            {editEntry ? 'Update Entry' : 'Save Entry'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Entry Card ─────────────────────────────────────────────────────────────────
function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { products } = useAppStore();
  const usedProducts = products.filter((p) => entry.products.includes(p.id));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex">
        {/* Date sidebar */}
        <div className="w-20 flex-shrink-0 bg-gradient-to-b from-rose-500 to-pink-500 text-white flex flex-col items-center justify-center p-3">
          <span className="text-2xl font-bold">
            {format(parseISO(entry.date), 'd')}
          </span>
          <span className="text-xs opacity-80 uppercase tracking-wide">
            {format(parseISO(entry.date), 'MMM')}
          </span>
          <span className="text-xs opacity-60">
            {format(parseISO(entry.date), 'yyyy')}
          </span>
          <span className="text-2xl mt-2">{moodEmoji(entry.mood)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full border ${skinConditionBg(entry.skinCondition)}`}
              >
                <span className={`w-2 h-2 rounded-full ${skinConditionColor(entry.skinCondition)}`} />
                {entry.skinCondition}/10
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {entry.notes && (
            <p className="text-sm text-slate-600 mb-3 leading-relaxed">{entry.notes}</p>
          )}

          {/* Products */}
          {usedProducts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {usedProducts.map((p) => (
                <span
                  key={p.id}
                  className="text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-2.5 py-0.5"
                >
                  {p.name}
                </span>
              ))}
            </div>
          )}

          {/* Concerns */}
          {entry.concerns.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {entry.concerns.map((c) => (
                <Badge key={c} variant="secondary" className="text-xs">
                  {concernLabel(c)}
                </Badge>
              ))}
            </div>
          )}

          {/* Environment */}
          {entry.environment && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {entry.environment.weather && (
                <span className="flex items-center gap-1">
                  <WeatherIcon weather={entry.environment.weather} />
                  {entry.environment.weather}
                </span>
              )}
              {entry.environment.stress && (
                <span className="flex items-center gap-1">
                  <Zap
                    className={`w-3.5 h-3.5 ${
                      entry.environment.stress === 'low'
                        ? 'text-emerald-500'
                        : entry.environment.stress === 'medium'
                        ? 'text-amber-500'
                        : 'text-red-500'
                    }`}
                  />
                  Stress: {entry.environment.stress}
                </span>
              )}
              {entry.environment.sleep !== undefined && (
                <span className="flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  {entry.environment.sleep}h sleep
                </span>
              )}
            </div>
          )}
        </div>

        {/* Photo placeholder */}
        <div className="w-20 flex-shrink-0 bg-slate-50 flex flex-col items-center justify-center text-slate-300 border-l border-slate-100">
          {entry.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.imageUrl} alt="skin photo" className="w-full h-full object-cover" />
          ) : (
            <>
              <Camera className="w-5 h-5" />
              <span className="text-xs mt-1">No photo</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Calendar Heatmap ───────────────────────────────────────────────────────────
function CalendarHeatmap({ entries }: { entries: JournalEntry[] }) {
  const days = useMemo(() => {
    const result = [];
    for (let i = 41; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      const entry = entries.find((e) => e.date === key);
      result.push({ date: d, key, entry });
    }
    return result;
  }, [entries]);

  const weeks = useMemo(() => {
    const w: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) w.push(days.slice(i, i + 7));
    return w;
  }, [days]);

  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day) => (
            <div
              key={day.key}
              title={`${format(day.date, 'MMM d')}: ${day.entry ? `${day.entry.skinCondition}/10` : 'No entry'}`}
              className={`w-5 h-5 rounded-sm cursor-default ${
                !day.entry
                  ? 'bg-slate-100'
                  : day.entry.skinCondition <= 4
                  ? 'bg-red-400'
                  : day.entry.skinCondition <= 6
                  ? 'bg-amber-400'
                  : day.entry.skinCondition <= 8
                  ? 'bg-emerald-400'
                  : 'bg-emerald-600'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const { journalEntries, deleteJournalEntry } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | undefined>(undefined);
  const [filterMood, setFilterMood] = useState<JournalEntry['mood'] | ''>('');
  const [filterConditionMin, setFilterConditionMin] = useState<number>(1);
  const [filterConditionMax, setFilterConditionMax] = useState<number>(10);
  const [showFilters, setShowFilters] = useState(false);

  // Analytics
  const last30 = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    return journalEntries.filter((e) =>
      isWithinInterval(parseISO(e.date), { start: cutoff, end: new Date() })
    );
  }, [journalEntries]);

  const avgCondition = useMemo(() => {
    if (last30.length === 0) return null;
    return last30.reduce((sum, e) => sum + e.skinCondition, 0) / last30.length;
  }, [last30]);

  const trendDirection = useMemo(() => {
    if (last30.length < 4) return 'flat';
    const firstHalf = last30.slice(0, Math.floor(last30.length / 2));
    const secondHalf = last30.slice(Math.floor(last30.length / 2));
    const firstAvg = firstHalf.reduce((s, e) => s + e.skinCondition, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, e) => s + e.skinCondition, 0) / secondHalf.length;
    if (secondAvg > firstAvg + 0.5) return 'up';
    if (secondAvg < firstAvg - 0.5) return 'down';
    return 'flat';
  }, [last30]);

  const commonConcerns = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of last30) {
      for (const c of e.concerns) {
        counts[c] = (counts[c] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([c, count]) => ({ concern: c as SkinConcern, count }));
  }, [last30]);

  const stressCorrelation = useMemo(() => {
    const low = last30.filter((e) => e.environment?.stress === 'low');
    const high = last30.filter((e) => e.environment?.stress === 'high');
    if (low.length < 2 || high.length < 2) return null;
    const lowAvg = low.reduce((s, e) => s + e.skinCondition, 0) / low.length;
    const highAvg = high.reduce((s, e) => s + e.skinCondition, 0) / high.length;
    return { lowAvg, highAvg, diff: lowAvg - highAvg };
  }, [last30]);

  const filteredEntries = useMemo(() => {
    return journalEntries
      .filter((e) => {
        if (filterMood && e.mood !== filterMood) return false;
        if (e.skinCondition < filterConditionMin || e.skinCondition > filterConditionMax) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journalEntries, filterMood, filterConditionMin, filterConditionMax]);

  function handleEdit(entry: JournalEntry) {
    setEditEntry(entry);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditEntry(undefined);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Skin Journal</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {journalEntries.length} {journalEntries.length === 1 ? 'entry' : 'entries'} recorded
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditEntry(undefined); setShowModal(true); }}
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="max-w-5xl mx-auto pt-4 flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Mood:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFilterMood('')}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${!filterMood ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-slate-50 border-slate-200'}`}
                    >
                      All
                    </button>
                    {MOODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setFilterMood(m.value)}
                        className={`text-sm px-2 py-1 rounded-lg border transition-all ${filterMood === m.value ? 'bg-rose-100 border-rose-300' : 'bg-slate-50 border-slate-200'}`}
                        title={m.label}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Condition:</span>
                  <select
                    value={filterConditionMin}
                    onChange={(e) => setFilterConditionMin(Number(e.target.value))}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-rose-300"
                  >
                    {[...Array(10)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                  <span className="text-xs text-slate-400">–</span>
                  <select
                    value={filterConditionMax}
                    onChange={(e) => setFilterConditionMax(Number(e.target.value))}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-rose-300"
                  >
                    {[...Array(10)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </div>

                <button
                  onClick={() => { setFilterMood(''); setFilterConditionMin(1); setFilterConditionMax(10); }}
                  className="text-xs text-rose-500 flex items-center gap-1 hover:underline"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entries feed */}
          <div className="lg:col-span-2 space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📓</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No journal entries yet</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Start tracking your skin journey today.
                </p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4" />
                  Add your first entry
                </Button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => handleEdit(entry)}
                    onDelete={() => deleteJournalEntry(entry.id)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Analytics sidebar */}
          <div className="space-y-4">
            {/* Avg condition */}
            <Card>
              <CardBody>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Last 30 Days</h3>
                {avgCondition !== null ? (
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-rose-500">{avgCondition.toFixed(1)}</div>
                      <div className="text-xs text-slate-400 mt-1">avg condition</div>
                    </div>
                    <div className="flex-1">
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${
                        trendDirection === 'up' ? 'text-emerald-600' :
                        trendDirection === 'down' ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        {trendDirection === 'up' ? <TrendingUp className="w-4 h-4" /> :
                         trendDirection === 'down' ? <TrendingDown className="w-4 h-4" /> :
                         <Minus className="w-4 h-4" />}
                        {trendDirection === 'up' ? 'Improving' :
                         trendDirection === 'down' ? 'Declining' : 'Stable'}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{last30.length} entries logged</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No entries in last 30 days</p>
                )}
              </CardBody>
            </Card>

            {/* Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Activity Heatmap</CardTitle>
              </CardHeader>
              <CardBody className="pt-2">
                <CalendarHeatmap entries={journalEntries} />
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-red-400" /> Poor
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-amber-400" /> Okay
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-emerald-400" /> Good
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Common concerns */}
            {commonConcerns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Most Common Concerns</CardTitle>
                </CardHeader>
                <CardBody>
                  <ul className="space-y-2">
                    {commonConcerns.map(({ concern, count }) => (
                      <li key={concern} className="flex items-center gap-2">
                        <div className="flex-1 text-sm text-slate-700">{concernLabel(concern)}</div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-1.5 bg-rose-300 rounded-full"
                            style={{ width: `${(count / last30.length) * 60}px` }}
                          />
                          <span className="text-xs text-slate-400">{count}x</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}

            {/* Stress correlation */}
            {stressCorrelation && Math.abs(stressCorrelation.diff) > 0.5 && (
              <Card className="bg-gradient-to-br from-violet-50 to-pink-50 border-violet-100">
                <CardBody>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Correlation Hint</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {stressCorrelation.diff > 0 ? (
                      <>
                        Your skin tends to be{' '}
                        <span className="text-emerald-600 font-medium">
                          {stressCorrelation.diff.toFixed(1)} points better
                        </span>{' '}
                        on low-stress days. Managing stress could improve your skin.
                      </>
                    ) : (
                      <>
                        Stress levels don't seem to significantly affect your skin condition based on available data.
                      </>
                    )}
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AddEntryModal
        open={showModal}
        onClose={handleCloseModal}
        editEntry={editEntry}
      />
    </div>
  );
}
