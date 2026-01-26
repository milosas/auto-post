'use client';

interface PreviewToggleProps {
  value: 'mobile' | 'desktop';
  onChange: (value: 'mobile' | 'desktop') => void;
}

export function PreviewToggle({ value, onChange }: PreviewToggleProps) {
  return (
    <div className="flex border-b">
      <button
        type="button"
        onClick={() => onChange('mobile')}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          value === 'mobile'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Mobilus
      </button>
      <button
        type="button"
        onClick={() => onChange('desktop')}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          value === 'desktop'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Kompiuteris
      </button>
    </div>
  );
}
