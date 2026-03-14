import type { ProductCategory, SkinConcern } from './types';

export interface BarcodeProduct {
  upc: string;
  name: string;
  brand: string;
  category: ProductCategory;
  keyIngredients: string[]; // ingredient IDs from the store
  concerns: SkinConcern[];
  price: number;
  size: string;
  description: string;
}

export const BARCODE_DATABASE: BarcodeProduct[] = [
  {
    upc: '3606000537538',
    name: 'Moisturizing Cream',
    brand: 'CeraVe',
    category: 'moisturizer',
    keyIngredients: ['ceramides', 'hyaluronic-acid'],
    concerns: ['dryness', 'sensitivity'],
    price: 19,
    size: '539g',
    description:
      'A rich, non-greasy moisturizing cream with three essential ceramides and hyaluronic acid to help restore and maintain the skin barrier.',
  },
  {
    upc: '769915190431',
    name: 'Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    category: 'serum',
    keyIngredients: ['niacinamide'],
    concerns: ['acne', 'pores', 'hyperpigmentation'],
    price: 6,
    size: '30ml',
    description:
      'A high-strength vitamin and mineral blemish formula that targets the look of blemishes, pores, and skin texture.',
  },
  {
    upc: '3337875709651',
    name: 'Anthelios Melt-In Milk SPF 50',
    brand: 'La Roche-Posay',
    category: 'spf',
    keyIngredients: ['spf'],
    concerns: ['anti-aging', 'hyperpigmentation', 'sensitivity'],
    price: 36,
    size: '90ml',
    description:
      'A broad-spectrum SPF 50 sunscreen with Cell-Ox Shield technology for superior UVA/UVB protection and antioxidant defense.',
  },
  {
    upc: '0655439077101',
    name: '2% BHA Liquid Exfoliant',
    brand: "Paula's Choice",
    category: 'exfoliant',
    keyIngredients: ['salicylic-acid'],
    concerns: ['acne', 'pores', 'texture'],
    price: 35,
    size: '118ml',
    description:
      'A cult-favorite leave-on exfoliant with 2% salicylic acid that unclogs pores, smooths wrinkles, and evens skin tone.',
  },
  {
    upc: '0812343019486',
    name: 'Protini Polypeptide Cream',
    brand: 'Drunk Elephant',
    category: 'moisturizer',
    keyIngredients: ['peptides', 'hyaluronic-acid'],
    concerns: ['anti-aging', 'firmness', 'fine-lines', 'dryness'],
    price: 68,
    size: '50ml',
    description:
      'A protein moisturizer formulated with signal peptides, growth factors, and amino acids to improve skin tone, texture, and firmness.',
  },
  {
    upc: '0635494123456',
    name: 'C E Ferulic Serum',
    brand: 'SkinCeuticals',
    category: 'serum',
    keyIngredients: ['vitamin-c'],
    concerns: ['hyperpigmentation', 'dullness', 'anti-aging'],
    price: 185,
    size: '30ml',
    description:
      'A patented daytime vitamin C serum with 15% L-ascorbic acid, vitamin E, and ferulic acid for advanced environmental protection and anti-aging benefits.',
  },
  {
    upc: '0070501113127',
    name: 'Hydro Boost Water Gel',
    brand: 'Neutrogena',
    category: 'moisturizer',
    keyIngredients: ['hyaluronic-acid'],
    concerns: ['dryness', 'dullness'],
    price: 20,
    size: '50ml',
    description:
      'An oil-free, water-based gel moisturizer with hyaluronic acid that quenches skin for smooth, supple, hydrated skin.',
  },
  {
    upc: '3606000537491',
    name: 'Hydrating Facial Cleanser',
    brand: 'CeraVe',
    category: 'cleanser',
    keyIngredients: ['ceramides', 'hyaluronic-acid', 'niacinamide'],
    concerns: ['dryness', 'sensitivity'],
    price: 16,
    size: '473ml',
    description:
      'A gentle, non-foaming cleanser with ceramides and hyaluronic acid that hydrates while effectively removing dirt and makeup.',
  },
  {
    upc: '769915190295',
    name: 'AHA 30% + BHA 2% Peeling Solution',
    brand: 'The Ordinary',
    category: 'exfoliant',
    keyIngredients: ['glycolic-acid', 'salicylic-acid'],
    concerns: ['texture', 'hyperpigmentation', 'acne', 'dullness'],
    price: 9,
    size: '30ml',
    description:
      'A 10-minute exfoliating facial with 30% alpha hydroxy acids and 2% beta hydroxy acid for radiant, clear skin.',
  },
  {
    upc: '0651986012345',
    name: 'The Dewy Skin Cream',
    brand: 'Tatcha',
    category: 'moisturizer',
    keyIngredients: ['hyaluronic-acid', 'ceramides'],
    concerns: ['dryness', 'dullness', 'anti-aging'],
    price: 68,
    size: '50ml',
    description:
      'A rich cream that feeds skin with plumping hydration and a dewy finish, powered by Japanese purple rice and hyaluronic acid.',
  },
  {
    upc: '3605971214517',
    name: 'Ultra Facial Cream',
    brand: "Kiehl's",
    category: 'moisturizer',
    keyIngredients: ['squalane', 'ceramides'],
    concerns: ['dryness', 'sensitivity'],
    price: 35,
    size: '50ml',
    description:
      'A 24-hour daily moisturizer with squalane and glacial glycoprotein that leaves skin soft, smooth, and hydrated.',
  },
  {
    upc: '0764933000001',
    name: 'Ultra Repair Cream',
    brand: 'First Aid Beauty',
    category: 'moisturizer',
    keyIngredients: ['ceramides', 'hyaluronic-acid'],
    concerns: ['dryness', 'sensitivity', 'redness'],
    price: 38,
    size: '170g',
    description:
      'An intense hydration cream with colloidal oatmeal, shea butter, and ceramides that relieves dry, distressed skin on contact.',
  },
  {
    upc: '0854779006180',
    name: 'Good Genes All-in-One Lactic Acid Treatment',
    brand: 'Sunday Riley',
    category: 'treatment',
    keyIngredients: ['glycolic-acid'],
    concerns: ['anti-aging', 'hyperpigmentation', 'texture', 'fine-lines'],
    price: 85,
    size: '30ml',
    description:
      'A high-potency lactic acid treatment serum that exfoliates, plumps, and brightens for immediately clearer, more radiant skin.',
  },
  {
    upc: '8809642714717',
    name: 'Cicapair Tiger Grass Color Correcting Treatment',
    brand: 'Dr. Jart+',
    category: 'treatment',
    keyIngredients: ['centella'],
    concerns: ['redness', 'sensitivity', 'dullness'],
    price: 52,
    size: '50ml',
    description:
      'A color-correcting treatment cream infused with centella asiatica that calms redness and transforms from green to beige to neutralize discoloration.',
  },
  {
    upc: '8801042882775',
    name: 'Water Sleeping Mask',
    brand: 'Laneige',
    category: 'mask',
    keyIngredients: ['hyaluronic-acid'],
    concerns: ['dryness', 'dullness'],
    price: 29,
    size: '70ml',
    description:
      'An overnight hydrating mask with sleep-biome technology and hyaluronic acid that deeply moisturizes while you sleep for a refreshed, dewy complexion.',
  },
];

export function lookupBarcode(upc: string): BarcodeProduct | undefined {
  const normalized = upc.replace(/[^0-9]/g, '');
  return BARCODE_DATABASE.find((p) => p.upc === normalized);
}
