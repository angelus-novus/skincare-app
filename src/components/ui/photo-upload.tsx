'use client';
import { useState, useRef, useCallback } from 'react';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function PhotoUpload({ value, onChange, className, size = 'md', label }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const sizes = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Resize to reasonable dimensions for storage
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 800;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        onChange(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={className}>
      {label && <label className="text-sm font-medium text-slate-700 block mb-1.5">{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {value ? (
        <div className={cn('relative rounded-2xl overflow-hidden border-2 border-slate-100 group', sizes[size])}>
          <img src={value} alt="Upload" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
            >
              <Camera className="w-4 h-4 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer',
            dragging ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/30',
            sizes[size]
          )}
        >
          {dragging ? (
            <Upload className="w-5 h-5 text-rose-400" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-slate-300" />
              <span className="text-xs text-slate-400">Add Photo</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Photo gallery for skin journal timeline
interface PhotoTimelineProps {
  photos: { date: string; imageUrl: string; note?: string }[];
  className?: string;
}

export function PhotoTimeline({ photos, className }: PhotoTimelineProps) {
  const [selected, setSelected] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-rose-400" />
        Skin Progress Photos
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setSelected(selected === i ? null : i)}
            className={cn(
              'flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all',
              selected === i ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-100 hover:border-rose-200'
            )}
          >
            <img src={photo.imageUrl} alt={`Skin ${photo.date}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {selected !== null && photos[selected] && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <img
            src={photos[selected].imageUrl}
            alt="Skin photo"
            className="w-full max-h-64 object-cover"
          />
          <div className="p-3">
            <div className="text-xs text-slate-400">{photos[selected].date}</div>
            {photos[selected].note && (
              <p className="text-sm text-slate-600 mt-1">{photos[selected].note}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Before/After comparison component
interface BeforeAfterProps {
  before: { imageUrl: string; date: string };
  after: { imageUrl: string; date: string };
  className?: string;
}

export function BeforeAfter({ before, after, className }: BeforeAfterProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-semibold text-slate-700">Before & After</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl overflow-hidden border border-slate-100">
          <img src={before.imageUrl} alt="Before" className="w-full h-40 object-cover" />
          <div className="p-2 text-center">
            <span className="text-xs font-medium text-slate-500">Before</span>
            <div className="text-xs text-slate-400">{before.date}</div>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-rose-100">
          <img src={after.imageUrl} alt="After" className="w-full h-40 object-cover" />
          <div className="p-2 text-center">
            <span className="text-xs font-medium text-rose-500">After</span>
            <div className="text-xs text-slate-400">{after.date}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
