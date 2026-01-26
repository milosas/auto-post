'use client';

import { ImageSourceType } from '@/app/lib/image-utils';

interface ImageSourceProps {
  value: ImageSourceType;
  onChange: (value: ImageSourceType) => void;
}

export function ImageSource({ value, onChange }: ImageSourceProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Paveikslėlio šaltinis</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('ai')}
          className={`flex-1 px-4 py-2 rounded border text-sm font-medium transition-colors ${
            value === 'ai'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400'
          }`}
        >
          Naudoti AI paveikslėlį
        </button>
        <button
          type="button"
          onClick={() => onChange('upload')}
          className={`flex-1 px-4 py-2 rounded border text-sm font-medium transition-colors ${
            value === 'upload'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400'
          }`}
        >
          Įkelti savo
        </button>
      </div>
    </div>
  );
}
