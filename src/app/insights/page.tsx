'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Star,
  Zap,
  Target,
  ArrowRight,
  Loader2,
  FlaskConical,
  ShieldAlert,
  Lightbulb,
  BarChart2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { concernLabel } from '@/lib/utils';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SkinConcern } from '@/lib/types';

const COLORS = ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6', '#e11d48', '#be123c'];
const GOOD_COLOR = '#10b981';
const BAD_COLOR = '#f43f5e';
const NEUTRAL_COLOR = '#94a3b8';

interface AIInsights {
  whatsWorking: string;
  potentialConcerns: string;
  missingIngredients: string;
  recommendations: string;
  nextSteps: string;
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-ivory-darker shadow-sm p-5 animate-pulse ${className}`}>
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
      <div className="h-3 bg-ivory-darker rounded w-full mb-2" />
      <div className="h-3 bg-ivory-darker rounded w-5/6 mb-2" />
      <div className="h-3 bg-ivory-darker rounded w-4/6" />
    </div>
  );
}

function InsightSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="mb-5 last:mb-0">
      <h4 className="font-semibold text-obsidian-800 mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
        {title}
      </h4>
      <p className="text-obsidian-600 text-sm leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

export default function InsightsPage() {
  const { products, ingredients, journalEntries, userProfile } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  // ── Pre-computed static insights ──────────────────────────────────────────
  const ratedProducts = useMemo(
    () => products.filter((p) => p.rating !== undefined),
    [products]
  );

  const highRatedProducts = useMemo(
    () => ratedProducts.filter((p) => (p.rating?.overall ?? 0) >= 4),
    [ratedProducts]
  );

  const lowRatedProducts = useMemo(
    () =>
      ratedProducts.filter(
        (p) => (p.rating?.overall ?? 5) <= 2.5 && p.rating?.wouldRepurchase === false
      ),
    [ratedProducts]
  );

  const ingredientRatingMap = useMemo(() => {
    const map: Record<string, { totalRating: number; count: number; name: string }> = {};
    for (const product of ratedProducts) {
      const rating = product.rating!.overall;
      for (const ingId of [...product.ingredients, ...product.keyIngredients]) {
        const ing = ingredients.find((i) => i.id === ingId);
        if (!ing) continue;
        if (!map[ingId]) map[ingId] = { totalRating: 0, count: 0, name: ing.name };
        map[ingId].totalRating += rating;
        map[ingId].count += 1;
      }
    }
    return map;
  }, [ratedProducts, ingredients]);

  const topIngredients = useMemo(() => {
    return Object.entries(ingredientRatingMap)
      .map(([id, data]) => ({ id, name: data.name, avg: data.totalRating / data.count, count: data.count }))
      .filter((i) => i.avg >= 4)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);
  }, [ingredientRatingMap]);

  const irritantIngredients = useMemo(() => {
    const irritantIds = new Set<string>();
    for (const product of ratedProducts) {
      if ((product.rating?.adverseReactions ?? []).length > 0) {
        for (const id of [...product.ingredients, ...product.keyIngredients]) {
          irritantIds.add(id);
        }
      }
    }
    return Array.from(irritantIds)
      .map((id) => ingredients.find((i) => i.id === id))
      .filter(Boolean)
      .slice(0, 6);
  }, [ratedProducts, ingredients]);

  const barChartData = useMemo(() => {
    const buckets: Record<string, { name: string; highRated: number; lowRated: number }> = {};
    for (const [id, data] of Object.entries(ingredientRatingMap)) {
      const avg = data.totalRating / data.count;
      if (!buckets[id]) buckets[id] = { name: data.name, highRated: 0, lowRated: 0 };
      if (avg >= 4) buckets[id].highRated = data.count;
      else buckets[id].lowRated = data.count;
    }
    return Object.values(buckets)
      .filter((b) => b.highRated + b.lowRated > 0)
      .sort((a, b) => b.highRated - a.highRated)
      .slice(0, 8)
      .map((b) => ({ ...b, name: b.name.length > 14 ? b.name.slice(0, 12) + '…' : b.name }));
  }, [ingredientRatingMap]);

  // Concern coverage
  const concernCoverage = useMemo(() => {
    const userConcerns = userProfile.skinConcerns;
    const covered = new Set<SkinConcern>();
    for (const product of products.filter((p) => p.inRoutine)) {
      for (const c of product.concerns) {
        if (userConcerns.includes(c)) covered.add(c);
      }
    }
    return userConcerns.map((c) => ({
      name: concernLabel(c),
      value: 1,
      covered: covered.has(c),
    }));
  }, [products, userProfile.skinConcerns]);

  const coveragePercent = useMemo(() => {
    if (concernCoverage.length === 0) return 0;
    return Math.round((concernCoverage.filter((c) => c.covered).length / concernCoverage.length) * 100);
  }, [concernCoverage]);

  // Journal trend data
  const trendData = useMemo(() => {
    return [...journalEntries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((e) => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        condition: e.skinCondition,
        mood: e.mood === 'great' ? 5 : e.mood === 'good' ? 4 : e.mood === 'okay' ? 3 : e.mood === 'bad' ? 2 : 1,
      }));
  }, [journalEntries]);

  // Product synergies
  const synergies = useMemo(() => {
    const pairs: { a: string; b: string; avgRating: number }[] = [];
    const highProd = highRatedProducts.slice(0, 6);
    for (let i = 0; i < highProd.length; i++) {
      for (let j = i + 1; j < highProd.length; j++) {
        const sharedIngredients = highProd[i].keyIngredients.filter((id) =>
          highProd[j].keyIngredients.includes(id)
        );
        if (sharedIngredients.length > 0 || (highProd[i].rating!.overall + highProd[j].rating!.overall) / 2 >= 4) {
          pairs.push({
            a: `${highProd[i].brand} ${highProd[i].name}`,
            b: `${highProd[j].brand} ${highProd[j].name}`,
            avgRating: (highProd[i].rating!.overall + highProd[j].rating!.overall) / 2,
          });
        }
      }
    }
    return pairs.slice(0, 4);
  }, [highRatedProducts]);

  // Routine gaps
  const routineGaps = useMemo(() => {
    const categories = products.filter((p) => p.inRoutine).map((p) => p.category);
    const gaps: string[] = [];
    if (!categories.includes('spf')) gaps.push('SPF / Sunscreen — essential for skin protection');
    if (!categories.includes('exfoliant')) gaps.push('Chemical Exfoliant — helps with texture & tone');
    if (userProfile.skinConcerns.includes('anti-aging') && !categories.includes('eye-cream'))
      gaps.push('Eye Cream — targeted care for fine lines & dark circles');
    if (userProfile.skinConcerns.includes('dullness') && !categories.includes('serum'))
      gaps.push('Brightening Serum — Vitamin C or Niacinamide for radiance');
    if (userProfile.skinType === 'dry' && !categories.includes('oil'))
      gaps.push('Face Oil — extra nourishment for dry skin');
    return gaps.slice(0, 4);
  }, [products, userProfile]);

  // ── API call ───────────────────────────────────────────────────────────────
  async function generateInsights() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        userProfile,
        products: products.map((p) => ({
          name: p.name,
          brand: p.brand,
          category: p.category,
          rating: p.rating,
          ingredients: p.keyIngredients
            .map((id) => ingredients.find((i) => i.id === id)?.name)
            .filter(Boolean),
          concerns: p.concerns,
        })),
        journalEntries: journalEntries.slice(0, 20),
      };

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to generate insights');
      const data = await res.json();
      setAiInsights(data);
      setGenerated(true);
    } catch (err) {
      setError('Could not generate AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-14">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                top: `${10 + i * 12}%`,
                left: `${5 + i * 15}%`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Claude AI</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">Your Skin Insights</h1>
          <p className="text-rose-100 text-lg mb-8 max-w-xl mx-auto">
            Get personalized AI analysis of your skincare routine, ingredient patterns, and skin trends.
          </p>
          <Button
            onClick={generateInsights}
            disabled={loading}
            size="lg"
            className="bg-white text-rose-600 hover:bg-rose-50 shadow-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Analysis…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {generated ? 'Regenerate AI Analysis' : 'Generate AI Analysis'}
              </>
            )}
          </Button>
          {error && (
            <p className="mt-4 text-rose-200 text-sm bg-white/10 rounded-lg px-4 py-2 inline-block">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Loading skeletons */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500 font-medium">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Claude is analyzing your skincare data…</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Written Analysis */}
        <AnimatePresence>
          {aiInsights && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <CardTitle className="text-rose-700">AI Analysis</CardTitle>
                      <p className="text-xs text-obsidian-500 mt-0.5">Generated by Claude</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateInsights}
                      className="ml-auto text-rose-500"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="divide-y divide-slate-50">
                  <InsightSection title="What's Working in Your Routine" content={aiInsights.whatsWorking} />
                  <div className="pt-5">
                    <InsightSection title="Potential Concerns & Conflicts" content={aiInsights.potentialConcerns} />
                  </div>
                  <div className="pt-5">
                    <InsightSection title="Missing Ingredients for Your Goals" content={aiInsights.missingIngredients} />
                  </div>
                  <div className="pt-5">
                    <InsightSection title="Personalized Recommendations" content={aiInsights.recommendations} />
                  </div>
                  <div className="pt-5">
                    <InsightSection title="Next Steps" content={aiInsights.nextSteps} />
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Static insights grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top performing ingredients */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm">Top Performing Ingredients</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              {topIngredients.length === 0 ? (
                <p className="text-obsidian-400 text-sm">Rate more products to see patterns.</p>
              ) : (
                <ul className="space-y-2">
                  {topIngredients.map((ing) => (
                    <li key={ing.id} className="flex items-center justify-between">
                      <span className="text-sm text-obsidian-700">{ing.name}</span>
                      <Badge className="bg-emerald-100 text-emerald-700">★ {ing.avg.toFixed(1)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Products to replace */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <CardTitle className="text-sm">Consider Replacing</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              {lowRatedProducts.length === 0 ? (
                <p className="text-obsidian-400 text-sm">All your products are performing well!</p>
              ) : (
                <ul className="space-y-2">
                  {lowRatedProducts.map((p) => (
                    <li key={p.id} className="text-sm text-obsidian-700">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-obsidian-400"> by {p.brand}</span>
                      <Badge variant="destructive" className="ml-2">
                        {p.rating?.overall.toFixed(1)} ★
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Ingredients to watch */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm">Ingredients to Watch</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              {irritantIngredients.length === 0 ? (
                <p className="text-obsidian-400 text-sm">No known irritants detected.</p>
              ) : (
                <ul className="space-y-2">
                  {irritantIngredients.map((ing) =>
                    ing ? (
                      <li key={ing.id} className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-obsidian-700">{ing.name}</span>
                      </li>
                    ) : null
                  )}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Ingredient Pattern Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <CardTitle>Ingredient Pattern Analysis</CardTitle>
                <p className="text-xs text-obsidian-500 mt-0.5">Based on your product ratings</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium text-obsidian-600 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Your skin loves:
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {topIngredients.slice(0, 6).map((ing) => (
                    <span
                      key={ing.id}
                      className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1"
                    >
                      {ing.name}
                    </span>
                  ))}
                  {topIngredients.length === 0 && (
                    <span className="text-obsidian-400 text-sm">Rate products to see patterns</span>
                  )}
                </div>

                <p className="text-sm font-medium text-obsidian-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Potential irritants:
                </p>
                <div className="flex flex-wrap gap-2">
                  {irritantIngredients.map((ing) =>
                    ing ? (
                      <span
                        key={ing.id}
                        className="text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1"
                      >
                        {ing.name}
                      </span>
                    ) : null
                  )}
                  {irritantIngredients.length === 0 && (
                    <span className="text-obsidian-400 text-sm">No known irritants</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-obsidian-600 mb-3 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-rose-400" />
                  Ingredient frequency by rating tier
                </p>
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="highRated" name="Highly Rated" fill={GOOD_COLOR} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lowRated" name="Low Rated" fill={BAD_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-obsidian-400 text-sm">
                    Rate more products to see chart data
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Skin Concern Coverage + Trend Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Concern Coverage Donut */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Target className="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <CardTitle>Skin Concern Coverage</CardTitle>
                  <p className="text-xs text-obsidian-500 mt-0.5">How well your routine addresses your concerns</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {concernCoverage.length === 0 ? (
                <p className="text-obsidian-400 text-sm">Add skin concerns in your profile to see coverage.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie
                          data={concernCoverage}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {concernCoverage.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.covered ? GOOD_COLOR : '#e2e8f0'}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-obsidian-800">{coveragePercent}%</p>
                        <p className="text-xs text-obsidian-400">covered</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {concernCoverage.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${c.covered ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        />
                        <span className={`text-sm ${c.covered ? 'text-obsidian-700' : 'text-obsidian-400'}`}>
                          {c.name}
                        </span>
                        {c.covered && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Skin Condition Trend */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <CardTitle>Skin Condition Trend</CardTitle>
                  <p className="text-xs text-obsidian-500 mt-0.5">Last 30 journal entries</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {trendData.length < 2 ? (
                <div className="h-40 flex flex-col items-center justify-center text-obsidian-400 gap-2">
                  <Zap className="w-8 h-8 text-slate-200" />
                  <p className="text-sm">Add journal entries to see your trend</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="condition"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      dot={{ fill: '#f43f5e', r: 3 }}
                      name="Skin Condition"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Product Synergies */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <CardTitle>Product Synergies</CardTitle>
                <p className="text-xs text-obsidian-500 mt-0.5">Combinations that work well together</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {synergies.length === 0 ? (
              <p className="text-obsidian-400 text-sm">Rate more products to discover synergies.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {synergies.map((pair, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-violet-50 rounded-xl px-4 py-3 border border-violet-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-obsidian-800 truncate">{pair.a}</p>
                      <p className="text-xs text-obsidian-400 mt-0.5 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        pairs with
                      </p>
                      <p className="text-sm font-medium text-obsidian-800 truncate">{pair.b}</p>
                    </div>
                    <Badge className="bg-violet-100 text-violet-700 flex-shrink-0">
                      ★ {pair.avgRating.toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Routine Gap Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <CardTitle>Routine Gap Analysis</CardTitle>
                <p className="text-xs text-obsidian-500 mt-0.5">What your routine might be missing</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {routineGaps.length === 0 ? (
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Your routine looks comprehensive!</span>
              </div>
            ) : (
              <ul className="space-y-3">
                {routineGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-obsidian-700 pt-0.5">{gap}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
