'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { detectRoutineConflicts, type ConflictResult, type ConflictSeverity } from '@/lib/conflicts';
import { Badge } from '@/components/ui/badge';

function SeverityIcon({ severity }: { severity: ConflictSeverity }) {
  switch (severity) {
    case 'avoid':
      return <ShieldAlert className="w-4 h-4" />;
    case 'caution':
      return <AlertTriangle className="w-4 h-4" />;
    case 'timing':
      return <Clock className="w-4 h-4" />;
  }
}

function SeverityBadge({ severity }: { severity: ConflictSeverity }) {
  const config: Record<ConflictSeverity, { label: string; className: string }> = {
    avoid: { label: 'Avoid', className: 'bg-red-100 text-red-700' },
    caution: { label: 'Caution', className: 'bg-amber-100 text-amber-700' },
    timing: { label: 'Timing', className: 'bg-blue-100 text-blue-700' },
  };
  const { label, className } = config[severity];
  return <Badge className={className}>{label}</Badge>;
}

function ConflictCard({ conflict }: { conflict: ConflictResult }) {
  const borderColor =
    conflict.severity === 'avoid'
      ? 'border-red-200'
      : conflict.severity === 'caution'
        ? 'border-amber-200'
        : 'border-blue-200';

  const bgColor =
    conflict.severity === 'avoid'
      ? 'bg-red-50/50'
      : conflict.severity === 'caution'
        ? 'bg-amber-50/50'
        : 'bg-blue-50/50';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border ${borderColor} ${bgColor} p-3 space-y-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">
            {conflict.productA.brand} {conflict.productA.name}
          </span>
          <span className="text-xs text-slate-400">x</span>
          <span className="text-xs font-semibold text-slate-700">
            {conflict.productB.brand} {conflict.productB.name}
          </span>
        </div>
        <SeverityBadge severity={conflict.severity} />
      </div>
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 flex-shrink-0 ${
            conflict.severity === 'avoid'
              ? 'text-red-500'
              : conflict.severity === 'caution'
                ? 'text-amber-500'
                : 'text-blue-500'
          }`}
        >
          <SeverityIcon severity={conflict.severity} />
        </div>
        <div>
          <p className="text-xs text-slate-600">{conflict.message}</p>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-medium">Tip:</span> {conflict.advice}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400">Conflicting:</span>
        <Badge className="bg-slate-100 text-slate-500 text-[10px]">
          {conflict.ingredientA.name}
        </Badge>
        <span className="text-[10px] text-slate-300">+</span>
        <Badge className="bg-slate-100 text-slate-500 text-[10px]">
          {conflict.ingredientB.name}
        </Badge>
      </div>
    </motion.div>
  );
}

export function ConflictBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const products = useAppStore((s) => s.products);
  const ingredients = useAppStore((s) => s.ingredients);
  const routine = useAppStore((s) => s.routine);

  const conflicts = useMemo(() => {
    const routineProductIds = new Set([
      ...routine.am.map((s) => s.productId),
      ...routine.pm.map((s) => s.productId),
    ]);
    const routineProducts = products.filter((p) => routineProductIds.has(p.id));

    const amConflicts = detectRoutineConflicts(routineProducts, 'am', ingredients);
    const pmConflicts = detectRoutineConflicts(routineProducts, 'pm', ingredients);

    // Deduplicate
    const seen = new Set<string>();
    const all: (ConflictResult & { routineTime: 'am' | 'pm' })[] = [];

    for (const c of amConflicts) {
      const key = [c.productA.id, c.productB.id, c.ingredientA.id, c.ingredientB.id].sort().join('|');
      if (!seen.has(key)) {
        seen.add(key);
        all.push({ ...c, routineTime: 'am' });
      }
    }
    for (const c of pmConflicts) {
      const key = [c.productA.id, c.productB.id, c.ingredientA.id, c.ingredientB.id].sort().join('|');
      if (!seen.has(key)) {
        seen.add(key);
        all.push({ ...c, routineTime: 'pm' });
      }
    }

    // Sort: avoid first, then caution, then timing
    const severityOrder: Record<ConflictSeverity, number> = { avoid: 0, caution: 1, timing: 2 };
    return all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [products, ingredients, routine]);

  if (isDismissed || conflicts.length === 0) return null;

  const avoidCount = conflicts.filter((c) => c.severity === 'avoid').length;
  const cautionCount = conflicts.filter(
    (c) => c.severity === 'caution' || c.severity === 'timing'
  ).length;

  const bannerBg =
    avoidCount > 0
      ? 'bg-gradient-to-r from-red-50 to-amber-50 border-red-200'
      : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';

  const iconColor = avoidCount > 0 ? 'text-red-500' : 'text-amber-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border ${bannerBg} mb-6 overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          className="flex items-center gap-3 flex-1 text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={`${iconColor}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-700">
              Routine Conflicts Detected
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              {avoidCount > 0 && (
                <span className="text-red-600 font-medium">
                  {avoidCount} to avoid
                </span>
              )}
              {avoidCount > 0 && cautionCount > 0 && (
                <span className="text-slate-300">|</span>
              )}
              {cautionCount > 0 && (
                <span className="text-amber-600 font-medium">
                  {cautionCount} caution{cautionCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="text-slate-400">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="ml-2 p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Dismiss conflict warnings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded conflict list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {conflicts.map((conflict, idx) => (
                <ConflictCard key={idx} conflict={conflict} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
