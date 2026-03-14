'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, AlertCircle } from 'lucide-react';
import type { Product } from '@/lib/types';
import { categoryLabel, daysUntilExpiry, getExpiryStatus } from '@/lib/utils';

interface ProductBottleProps {
  product: Product;
  onClick: () => void;
  index: number;
}

const BOTTLE_SHAPES = {
  cleanser: 'pump',
  toner: 'bottle',
  essence: 'dropper',
  serum: 'dropper',
  moisturizer: 'jar',
  'eye-cream': 'tube',
  spf: 'tube',
  mask: 'jar',
  exfoliant: 'bottle',
  oil: 'dropper',
  mist: 'spray',
  treatment: 'dropper',
  'lip-care': 'tube',
  'body-care': 'pump',
};

function BottleShape({
  shape,
  color,
  name,
}: {
  shape: string;
  color: string;
  name: string;
}) {
  if (shape === 'jar') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div
          className="w-12 h-3 rounded-full border-2 border-white/30"
          style={{ backgroundColor: color }}
        />
        <div
          className="w-14 h-10 rounded-b-xl border-2 border-white/30 flex items-end justify-center pb-1"
          style={{ backgroundColor: color }}
        >
          <span className="text-[6px] font-bold text-white/80 uppercase tracking-wide text-center px-0.5 leading-tight">
            {name.slice(0, 10)}
          </span>
        </div>
      </div>
    );
  }

  if (shape === 'dropper') {
    return (
      <div className="flex flex-col items-center gap-0">
        <div
          className="w-2 h-4 rounded-full border border-white/30"
          style={{ backgroundColor: color }}
        />
        <div
          className="w-1.5 h-3"
          style={{ backgroundColor: color, opacity: 0.8 }}
        />
        <div
          className="w-8 h-14 rounded-xl border-2 border-white/30 flex items-end justify-center pb-1.5"
          style={{ backgroundColor: color }}
        >
          <span className="text-[5px] font-bold text-white/80 uppercase tracking-wide text-center px-0.5 leading-tight rotate-0">
            {name.slice(0, 8)}
          </span>
        </div>
      </div>
    );
  }

  if (shape === 'spray' || shape === 'pump') {
    return (
      <div className="flex flex-col items-center gap-0">
        <div className="flex items-start gap-0.5">
          <div
            className="w-1.5 h-6 rounded-t"
            style={{ backgroundColor: color, opacity: 0.7 }}
          />
          <div
            className="w-4 h-3 rounded-t-lg mt-3"
            style={{ backgroundColor: color, opacity: 0.8 }}
          />
        </div>
        <div
          className="w-10 h-16 rounded-xl border-2 border-white/30 flex items-end justify-center pb-1.5 -mt-1"
          style={{ backgroundColor: color }}
        >
          <span className="text-[5px] font-bold text-white/80 uppercase tracking-wide text-center px-0.5 leading-tight">
            {name.slice(0, 8)}
          </span>
        </div>
      </div>
    );
  }

  if (shape === 'tube') {
    return (
      <div className="flex flex-col items-center gap-0">
        <div
          className="w-4 h-3 rounded-t-lg border-t-2 border-x-2 border-white/30"
          style={{ backgroundColor: color, opacity: 0.8 }}
        />
        <div
          className="w-10 h-16 border-2 border-white/30 flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <span
            className="text-[5px] font-bold text-white/80 uppercase tracking-wide text-center px-0.5 leading-tight"
            style={{ writingMode: 'vertical-rl' }}
          >
            {name.slice(0, 10)}
          </span>
        </div>
        <div
          className="w-10 h-2 rounded-b"
          style={{ backgroundColor: color, opacity: 0.6 }}
        />
      </div>
    );
  }

  // Default bottle
  return (
    <div className="flex flex-col items-center gap-0">
      <div
        className="w-3 h-3 rounded-t border-t-2 border-x-2 border-white/30"
        style={{ backgroundColor: color, opacity: 0.8 }}
      />
      <div
        className="w-11 h-16 rounded-xl border-2 border-white/30 flex items-end justify-center pb-1.5"
        style={{ backgroundColor: color }}
      >
        <span className="text-[5px] font-bold text-white/80 uppercase tracking-wide text-center px-0.5 leading-tight">
          {name.slice(0, 10)}
        </span>
      </div>
    </div>
  );
}

export function ProductBottle({ product, onClick, index }: ProductBottleProps) {
  const [hovered, setHovered] = useState(false);
  const shape = BOTTLE_SHAPES[product.category] || 'bottle';
  const expiryDays = daysUntilExpiry(product);
  const expiryStatus = getExpiryStatus(expiryDays);

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Expiry warning */}
      {expiryStatus === 'warning' && (
        <div className="absolute -top-1 -right-1 z-10">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
        </div>
      )}
      {expiryStatus === 'expired' && (
        <div className="absolute -top-1 -right-1 z-10">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 fill-red-100" />
        </div>
      )}

      {/* Product image or illustrated bottle */}
      <div className="relative w-16 flex items-end justify-center h-20">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-20 w-14 object-cover rounded-xl border-2 border-white shadow-md group-hover:shadow-lg transition-shadow"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <BottleShape shape={shape} color={product.imageColor} name={product.brand} />
        )}
        {/* Shadow under bottle */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-black/10 rounded-full blur-sm transition-all"
          style={{ width: hovered ? '36px' : '28px' }}
        />
      </div>

      {/* Tooltip on hover */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-xl px-3 py-2 text-center shadow-xl z-20 w-36 pointer-events-none"
        >
          <div className="text-xs font-semibold leading-tight">{product.name}</div>
          <div className="text-[10px] text-obsidian-300 mt-0.5">{product.brand}</div>
          <div className="text-[10px] text-rose-300 mt-1">{categoryLabel(product.category)}</div>
          {product.rating && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[10px]">{product.rating.overall.toFixed(1)}</span>
            </div>
          )}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800" />
        </motion.div>
      )}
    </motion.div>
  );
}
