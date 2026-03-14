import type { Product, Ingredient } from './types';

export type ConflictSeverity = 'avoid' | 'caution' | 'timing';

export interface ConflictRule {
  ingredientA: string;
  ingredientB: string;
  severity: ConflictSeverity;
  message: string;
  advice: string;
}

export interface ConflictResult {
  productA: Product;
  productB: Product;
  ingredientA: Ingredient;
  ingredientB: Ingredient;
  severity: ConflictSeverity;
  message: string;
  advice: string;
}

const CONFLICT_RULES: ConflictRule[] = [
  {
    ingredientA: 'retinol',
    ingredientB: 'glycolic-acid',
    severity: 'avoid',
    message: 'Retinol and Glycolic Acid should not be used in the same step.',
    advice: 'Use on alternating nights to avoid irritation and over-exfoliation.',
  },
  {
    ingredientA: 'retinol',
    ingredientB: 'salicylic-acid',
    severity: 'avoid',
    message: 'Retinol and Salicylic Acid should not be used together.',
    advice: 'Alternate nights between these two actives.',
  },
  {
    ingredientA: 'vitamin-c',
    ingredientB: 'niacinamide',
    severity: 'caution',
    message: 'Vitamin C and Niacinamide may cause flushing when combined.',
    advice: 'Use at different times of day (Vitamin C in AM, Niacinamide in PM) or wait 15 minutes between applications.',
  },
  {
    ingredientA: 'vitamin-c',
    ingredientB: 'retinol',
    severity: 'caution',
    message: 'Vitamin C and Retinol can be irritating when combined.',
    advice: 'Use Vitamin C in the morning and Retinol at night for best results.',
  },
  {
    ingredientA: 'glycolic-acid',
    ingredientB: 'salicylic-acid',
    severity: 'avoid',
    message: 'Using Glycolic Acid and Salicylic Acid together risks over-exfoliation.',
    advice: 'Alternate between AHA and BHA on different days to avoid damaging the skin barrier.',
  },
  {
    ingredientA: 'retinol',
    ingredientB: 'azelaic-acid',
    severity: 'caution',
    message: 'Retinol and Azelaic Acid together may increase irritation.',
    advice: 'Introduce slowly and monitor for redness. Consider using on alternate nights.',
  },
  {
    ingredientA: 'vitamin-c',
    ingredientB: 'glycolic-acid',
    severity: 'caution',
    message: 'Both Vitamin C and Glycolic Acid have low pH and can irritate when layered.',
    advice: 'Separate by time of day or wait at least 30 minutes between applications.',
  },
  {
    ingredientA: 'retinal',
    ingredientB: 'glycolic-acid',
    severity: 'avoid',
    message: 'Retinaldehyde and Glycolic Acid should not be used in the same step.',
    advice: 'Use on alternating nights. Retinaldehyde is even more potent than retinol with acids.',
  },
  {
    ingredientA: 'retinal',
    ingredientB: 'salicylic-acid',
    severity: 'avoid',
    message: 'Retinaldehyde and Salicylic Acid should not be combined.',
    advice: 'Alternate nights between these actives to prevent barrier damage.',
  },
];

function findConflict(ingredientIdA: string, ingredientIdB: string): ConflictRule | undefined {
  return CONFLICT_RULES.find(
    (rule) =>
      (rule.ingredientA === ingredientIdA && rule.ingredientB === ingredientIdB) ||
      (rule.ingredientA === ingredientIdB && rule.ingredientB === ingredientIdA)
  );
}

export function detectProductConflicts(
  products: Product[],
  ingredients: Ingredient[]
): ConflictResult[] {
  const results: ConflictResult[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const pA = products[i];
      const pB = products[j];

      for (const ingIdA of pA.keyIngredients) {
        for (const ingIdB of pB.keyIngredients) {
          const rule = findConflict(ingIdA, ingIdB);
          if (rule) {
            const key = [pA.id, pB.id, ingIdA, ingIdB].sort().join('|');
            if (seen.has(key)) continue;
            seen.add(key);

            const ingredientA = ingredients.find((i) => i.id === ingIdA);
            const ingredientB = ingredients.find((i) => i.id === ingIdB);
            if (!ingredientA || !ingredientB) continue;

            results.push({
              productA: pA,
              productB: pB,
              ingredientA,
              ingredientB,
              severity: rule.severity,
              message: rule.message,
              advice: rule.advice,
            });
          }
        }
      }
    }
  }

  return results;
}

export function detectRoutineConflicts(
  routineProducts: Product[],
  time: 'am' | 'pm',
  ingredients: Ingredient[]
): ConflictResult[] {
  const relevantProducts = routineProducts.filter(
    (p) => p.routineStep === time || p.routineStep === 'both'
  );
  return detectProductConflicts(relevantProducts, ingredients);
}
