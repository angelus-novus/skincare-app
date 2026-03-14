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
          className="w-14 h-3.5 rounded-full border-2 border-white/30"
          style={{ backgroundColor: color }}
        />
        <div
          className="w-16 h-12 rounded-b-xl border-2 border-white/30 flex items-end justify-center pb-1"
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
          className="w-2.5 h-5 rounded-full border border-white/30"
          style={{ backgroundColor: color }}
        />
        <div
          className="w-1.5 h-3"
          style={{ backgroundColor: color, opacity: 0.8 }}
        />
        <div
          className="w-10 h-[70px] rounded-xl border-2 border-white/30 flex items-end justify-center pb-2"
          style={{ backgroundColor: color }}
        >
          <span className="text-[5px] font-bold text-white/80 uppercase tracking-wide text-center px-0.5 leading-tight">
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
            className="w-2 h-7 rounded-t"
            style={{ backgroundColor: color, opacity: 0.7 }}
          />
          <div
            className="w-5 h-3.5 rounded-t-lg mt-3.5"
            style={{ backgroundColor: color, opacity: 0.8 }}
          />
        </div>
        <div
          className="w-12 h-[72px] rounded-xl border-2 border-white/30 flex items-end justify-center pb-2 -mt-1"
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
          className="w-5 h-3 rounded-t-lg border-t-2 border-x-2 border-white/30"
          style={{ backgroundColor: color, opacity: 0.8 }}
        />
        <div
          className="w-12 h-[72px] border-2 border-white/30 flex items-center justify-center"
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
          className="w-12 h-2 rounded-b"
          style={{ backgroundColor: color, opacity: 0.6 }}
        />
      </div>
    );
  }

  // Default bottle
  return (
    <div className="flex flex-col items-center gap-0">
      <div
        className="w-4 h-3 rounded-t border-t-2 border-x-2 border-white/30"
        style={{ backgroundColor: color, opacity: 0.8 }}
      />
      <div
        className="w-13 h-[72px] rounded-xl border-2 border-white/30 flex items-end justify-center pb-2"
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
  const [imgError, setImgError] = useState(false);
  const shape = BOTTLE_SHAPES[product.category] || 'bottle';
  const expiryDays = daysUntilExpiry(product);
  const expiryStatus = getExpiryStatus(expiryDays);

  const hasImage = product.imageUrl && !imgError;

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Expiry warning */}
      {expiryStatus === 'warning' && (
        <div className="absolute -top-1 -right-1 z-10">
          <AlertCircle className="w-4 h-4 text-amber-500 fill-amber-100" />
        </div>
      )}
      {expiryStatus === 'expired' && (
        <div className="absolute -top-1 -right-1 z-10">
          <AlertCircle className="w-4 h-4 text-red-500 fill-red-100" />
        </div>
      )}

      {/* Product image or illustrated bottle */}
      <div className="relative flex items-end justify-center" style={{ width: '72px', height: '96px' }}>
        {hasImage ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-[96px] w-[64px] object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <BottleShape shape={shape} color={product.imageColor} name={product.brand} />
        )}

        {/* Reflection / shine effect on product images */}
        {hasImage && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.08) 100%)',
            }}
          />
        )}
      </div>

      {/* Shadow under product on shelf */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50%] bg-black/12 blur-[3px] transition-all"
        style={{
          width: hovered ? '60px' : '48px',
          height: '6px',
          bottom: '-2px',
        }}
      />

      {/* Tooltip on hover */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 text-white rounded-xl px-3 py-2 text-center shadow-xl z-20 w-40 pointer-events-none"
          style={{
            top: '-84px',
            backgroundColor: '#1C1917',
            border: '1px solid rgba(201,169,110,0.2)',
          }}
        >
          <div className="text-xs font-semibold leading-tight">{product.name}</div>
          <div className="text-[10px] mt-0.5" style={{ color: '#C9A96E' }}>{product.brand}</div>
          <div className="text-[10px] mt-1" style={{ color: '#E8C4B8' }}>{categoryLabel(product.category)}</div>
          {product.rating && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="w-2.5 h-2.5" style={{ fill: '#C9A96E', color: '#C9A96E' }} />
              <span className="text-[10px]">{product.rating.overall.toFixed(1)}</span>
            </div>
          )}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-4 border-x-transparent border-t-4"
            style={{ borderTopColor: '#1C1917' }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
