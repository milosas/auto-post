'use client';

interface GenerationOptionsProps {
  generateText: boolean;
  generateImage: boolean;
  onTextChange: (value: boolean) => void;
  onImageChange: (value: boolean) => void;
  disabled?: boolean;
}

export function GenerationOptions({
  generateText,
  generateImage,
  onTextChange,
  onImageChange,
  disabled = false,
}: GenerationOptionsProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Ką generuoti?
      </label>
      <div className="flex flex-col sm:flex-row gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={generateText}
            onChange={(e) => onTextChange(e.target.checked)}
            disabled={disabled}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm text-gray-700">Generuoti tekstą</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={generateImage}
            onChange={(e) => onImageChange(e.target.checked)}
            disabled={disabled}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm text-gray-700">Generuoti paveikslėlį</span>
        </label>
      </div>
    </div>
  );
}
