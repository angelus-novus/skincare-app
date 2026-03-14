'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { lookupBarcode, type BarcodeProduct } from '@/lib/barcodeDb';
import { useAppStore } from '@/lib/store';
import { concernLabel, evidenceLevelColor, categoryLabel } from '@/lib/utils';
import type { Product, Ingredient, SkinConcern } from '@/lib/types';

type Verdict = 'great-match' | 'caution' | 'not-recommended' | 'redundant';

interface IngredientAnalysis {
  ingredientId: string;
  ingredientName: string;
  evidenceLevel: string;
  lovedIn: string[];
  issuesIn: string[];
  isAllergen: boolean;
}

interface AnalysisResult {
  scannedProduct: BarcodeProduct;
  alreadyOwned: Product | null;
  similarProducts: Product[];
  ingredientAnalysis: IngredientAnalysis[];
  matchedConcerns: SkinConcern[];
  unmatchedConcerns: SkinConcern[];
  verdict: Verdict;
  verdictReason: string;
}

function analyzeProduct(
  scanned: BarcodeProduct,
  userProducts: Product[],
  ingredients: Ingredient[],
  userConcerns: SkinConcern[],
  knownIrritants: string[],
  allergies: string[]
): AnalysisResult {
  // Already own check
  const alreadyOwned =
    userProducts.find(
      (p) =>
        p.name.toLowerCase() === scanned.name.toLowerCase() &&
        p.brand.toLowerCase() === scanned.brand.toLowerCase()
    ) || null;

  // Similar products check
  const similarProducts = userProducts.filter((p) => {
    if (alreadyOwned && p.id === alreadyOwned.id) return false;
    if (p.category !== scanned.category) return false;
    const overlap = p.keyIngredients.some((ki) =>
      scanned.keyIngredients.includes(ki)
    );
    return overlap;
  });

  // Ingredient analysis
  const ingredientAnalysis: IngredientAnalysis[] = scanned.keyIngredients.map(
    (ingId) => {
      const ing = ingredients.find((i) => i.id === ingId);
      const ingName = ing?.name || ingId;
      const evidenceLevel = ing?.evidenceLevel || 'limited';

      const lovedIn: string[] = [];
      const issuesIn: string[] = [];

      for (const p of userProducts) {
        const hasIngredient =
          p.keyIngredients.includes(ingId) || p.ingredients.includes(ingId);
        if (!hasIngredient) continue;

        if (p.rating && p.rating.overall >= 4) {
          lovedIn.push(p.name);
        }
        if (p.rating && (p.rating.overall < 3 || p.rating.adverseReactions.length > 0)) {
          issuesIn.push(p.name);
        }
      }

      const isAllergen =
        knownIrritants.includes(ingId) ||
        allergies.includes(ingId) ||
        (ing
          ? knownIrritants.some(
              (ir) => ir.toLowerCase() === ing.name.toLowerCase()
            ) ||
            allergies.some(
              (al) => al.toLowerCase() === ing.name.toLowerCase()
            )
          : false);

      return { ingredientId: ingId, ingredientName: ingName, evidenceLevel, lovedIn, issuesIn, isAllergen };
    }
  );

  // Concern coverage
  const matchedConcerns = scanned.concerns.filter((c) =>
    userConcerns.includes(c)
  );
  const unmatchedConcerns = scanned.concerns.filter(
    (c) => !userConcerns.includes(c)
  );

  // Verdict
  let verdict: Verdict;
  let verdictReason: string;

  const hasAllergen = ingredientAnalysis.some((ia) => ia.isAllergen);
  const hasIssues = ingredientAnalysis.some((ia) => ia.issuesIn.length > 0);
  const hasLoved = ingredientAnalysis.some((ia) => ia.lovedIn.length > 0);
  const concernMatch = matchedConcerns.length > 0;

  if (hasAllergen) {
    verdict = 'not-recommended';
    verdictReason =
      'This product contains ingredients on your allergen/irritant list. Avoid to prevent adverse reactions.';
  } else if (alreadyOwned || similarProducts.length >= 2) {
    verdict = 'redundant';
    verdictReason = alreadyOwned
      ? 'You already own this exact product.'
      : `You already have ${similarProducts.length} similar products in the same category with overlapping ingredients.`;
  } else if (hasIssues && !hasLoved) {
    verdict = 'caution';
    verdictReason =
      'This product contains ingredients you have had issues with in the past. Patch test first.';
  } else if (hasLoved && concernMatch && !hasIssues) {
    verdict = 'great-match';
    verdictReason =
      'This product contains ingredients you love and addresses your skin concerns. A strong addition to your routine!';
  } else if (concernMatch && !hasIssues) {
    verdict = 'great-match';
    verdictReason =
      'This product targets your skin concerns and contains well-tolerated ingredients.';
  } else if (hasIssues && hasLoved) {
    verdict = 'caution';
    verdictReason =
      'Mixed signals: you love some ingredients but have had issues with others. Consider patch testing.';
  } else {
    verdict = 'caution';
    verdictReason =
      "This product doesn't strongly match your current concerns, but no red flags detected.";
  }

  return {
    scannedProduct: scanned,
    alreadyOwned,
    similarProducts,
    ingredientAnalysis,
    matchedConcerns,
    unmatchedConcerns,
    verdict,
    verdictReason,
  };
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const config: Record<
    Verdict,
    { label: string; className: string; Icon: React.ElementType }
  > = {
    'great-match': {
      label: 'Great Match!',
      className: 'bg-emerald-100 text-emerald-700',
      Icon: CheckCircle2,
    },
    caution: {
      label: 'Proceed with Caution',
      className: 'bg-amber-100 text-amber-700',
      Icon: AlertTriangle,
    },
    'not-recommended': {
      label: 'Not Recommended',
      className: 'bg-red-100 text-red-700',
      Icon: XCircle,
    },
    redundant: {
      label: 'Redundant',
      className: 'bg-slate-100 text-slate-600',
      Icon: Package,
    },
  };
  const { label, className, Icon } = config[verdict];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${className}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}

function ProductAnalysisPanel({
  analysis,
  onAddToShelf,
}: {
  analysis: AnalysisResult;
  onAddToShelf: () => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    'verdict'
  );

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 mt-4"
    >
      {/* Product header */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4 border border-rose-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              {analysis.scannedProduct.brand}
            </p>
            <h3 className="text-base font-bold text-slate-800 mt-0.5">
              {analysis.scannedProduct.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {analysis.scannedProduct.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-slate-100 text-slate-600">
                {categoryLabel(analysis.scannedProduct.category)}
              </Badge>
              <span className="text-sm font-semibold text-slate-700">
                ${analysis.scannedProduct.price}
              </span>
              <span className="text-xs text-slate-400">
                {analysis.scannedProduct.size}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <Card>
        <button
          className="w-full text-left p-4 flex items-center justify-between"
          onClick={() => toggle('verdict')}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">
              Verdict
            </span>
          </div>
          {expandedSection === 'verdict' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        <AnimatePresence>
          {expandedSection === 'verdict' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                <VerdictBadge verdict={analysis.verdict} />
                <p className="text-sm text-slate-600">
                  {analysis.verdictReason}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Already own / similar */}
      {(analysis.alreadyOwned || analysis.similarProducts.length > 0) && (
        <Card>
          <CardBody className="p-4 space-y-2">
            {analysis.alreadyOwned && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-rose-500" />
                <span className="text-rose-700 font-medium">
                  You already have this product!
                </span>
                <span className="text-slate-500">
                  ({analysis.alreadyOwned.brand}{' '}
                  {analysis.alreadyOwned.name})
                </span>
              </div>
            )}
            {analysis.similarProducts.length > 0 && (
              <div className="text-sm">
                <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  You have similar products:
                </div>
                <div className="ml-6 space-y-1">
                  {analysis.similarProducts.map((p) => (
                    <div key={p.id} className="text-xs text-slate-500">
                      {p.brand} {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Ingredient analysis */}
      <Card>
        <button
          className="w-full text-left p-4 flex items-center justify-between"
          onClick={() => toggle('ingredients')}
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">
              Ingredient Analysis
            </span>
          </div>
          {expandedSection === 'ingredients' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        <AnimatePresence>
          {expandedSection === 'ingredients' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {analysis.ingredientAnalysis.map((ia) => (
                  <div
                    key={ia.ingredientId}
                    className="border border-slate-100 rounded-xl p-3 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {ia.ingredientName}
                      </span>
                      <Badge
                        className={evidenceLevelColor(
                          ia.evidenceLevel as 'strong' | 'moderate' | 'emerging' | 'limited' | 'anecdotal'
                        )}
                      >
                        {ia.evidenceLevel}
                      </Badge>
                    </div>
                    {ia.isAllergen && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-2 py-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        ALLERGEN ALERT: This ingredient is on your irritant
                        list!
                      </div>
                    )}
                    {ia.lovedIn.length > 0 && (
                      <div className="flex items-start gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          You love this ingredient! Found in:{' '}
                          {ia.lovedIn.join(', ')}
                        </span>
                      </div>
                    )}
                    {ia.issuesIn.length > 0 && !ia.isAllergen && (
                      <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          Caution: You&apos;ve had issues with products
                          containing this. {ia.issuesIn.join(', ')}
                        </span>
                      </div>
                    )}
                    {ia.lovedIn.length === 0 &&
                      ia.issuesIn.length === 0 &&
                      !ia.isAllergen && (
                        <div className="text-xs text-slate-400">
                          No personal history with this ingredient yet.
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Concern coverage */}
      <Card>
        <button
          className="w-full text-left p-4 flex items-center justify-between"
          onClick={() => toggle('concerns')}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">
              Concern Coverage
            </span>
          </div>
          {expandedSection === 'concerns' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        <AnimatePresence>
          {expandedSection === 'concerns' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {analysis.matchedConcerns.map((c) => (
                    <Badge
                      key={c}
                      className="bg-rose-100 text-rose-700 border border-rose-200"
                    >
                      {concernLabel(c)} — matches your concerns
                    </Badge>
                  ))}
                  {analysis.unmatchedConcerns.map((c) => (
                    <Badge key={c} className="bg-slate-100 text-slate-400">
                      {concernLabel(c)}
                    </Badge>
                  ))}
                </div>
                {analysis.matchedConcerns.length === 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    This product does not address any of your listed skin
                    concerns.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Add to Shelf button */}
      <Button className="w-full" size="lg" onClick={onAddToShelf}>
        <Plus className="w-4 h-4" />
        Add to Shelf
      </Button>
    </motion.div>
  );
}

export function BarcodeScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const products = useAppStore((s) => s.products);
  const ingredients = useAppStore((s) => s.ingredients);
  const userProfile = useAppStore((s) => s.userProfile);
  const addProduct = useAppStore((s) => s.addProduct);

  const handleScan = () => {
    if (!barcode.trim()) {
      setError('Please enter a barcode number.');
      return;
    }
    setError('');
    setIsScanning(true);

    // Simulate scanning delay
    setTimeout(() => {
      const found = lookupBarcode(barcode.trim());
      if (!found) {
        setError(
          'Product not found in database. Try another barcode or enter manually.'
        );
        setIsScanning(false);
        return;
      }

      const result = analyzeProduct(
        found,
        products,
        ingredients,
        userProfile.skinConcerns,
        userProfile.knownIrritants,
        userProfile.allergies
      );
      setAnalysis(result);
      setIsScanning(false);
    }, 800);
  };

  const handleAddToShelf = () => {
    if (!analysis) return;
    const scanned = analysis.scannedProduct;
    const newProduct: Product = {
      id: `scanned-${Date.now()}`,
      name: scanned.name,
      brand: scanned.brand,
      category: scanned.category,
      imageUrl: '',
      imageColor: '#F5F0FF',
      price: scanned.price,
      size: scanned.size,
      concerns: scanned.concerns,
      ingredients: scanned.keyIngredients,
      keyIngredients: scanned.keyIngredients,
      inRoutine: false,
      tags: ['scanned'],
    };
    addProduct(newProduct);
    setIsOpen(false);
    setAnalysis(null);
    setBarcode('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setAnalysis(null);
    setBarcode('');
    setError('');
    setIsScanning(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-200 flex items-center justify-center hover:bg-rose-600 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        aria-label="Scan product barcode"
      >
        <Camera className="w-6 h-6" />
      </motion.button>

      {/* Scanner Modal */}
      <Modal
        open={isOpen}
        onClose={handleClose}
        title="Scan Product"
        description="Scan a barcode or enter a UPC number to analyze a product"
        size="lg"
      >
        <div className="space-y-4">
          {/* Simulated camera view */}
          {!analysis && (
            <div className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              {/* Scan line animation */}
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                animate={{ top: ['15%', '85%', '15%'] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Corner markers */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-rose-400 rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-rose-400 rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-rose-400 rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-rose-400 rounded-br-lg" />

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-slate-400 text-xs">
                  Position barcode in frame
                </p>
              </div>
            </div>
          )}

          {/* Manual entry */}
          {!analysis && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">
                  or enter manually
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => {
                    setBarcode(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  placeholder="Enter UPC / barcode number..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-colors"
                />
                <Button onClick={handleScan} disabled={isScanning}>
                  {isScanning ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Scan
                </Button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {error}
                </motion.p>
              )}

              {/* Quick test barcodes */}
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400">Try a sample barcode:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { upc: '3606000537538', label: 'CeraVe Cream' },
                    { upc: '769915190431', label: 'TO Niacinamide' },
                    { upc: '0635494123456', label: 'CE Ferulic' },
                    { upc: '0655439077101', label: "PC BHA" },
                  ].map((sample) => (
                    <button
                      key={sample.upc}
                      onClick={() => {
                        setBarcode(sample.upc);
                        setError('');
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analysis results */}
          {analysis && (
            <ProductAnalysisPanel
              analysis={analysis}
              onAddToShelf={handleAddToShelf}
            />
          )}

          {/* Back button when analysis is showing */}
          {analysis && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setAnalysis(null);
                setBarcode('');
              }}
            >
              Scan another product
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}
