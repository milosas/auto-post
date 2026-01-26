'use client';

interface InstagramPreviewProps {
  imageUrl: string | null;
  text: string;
  viewMode: 'mobile' | 'desktop';
}

export function InstagramPreview({ imageUrl, text, viewMode }: InstagramPreviewProps) {
  const widthClass = viewMode === 'mobile' ? 'max-w-sm' : 'max-w-lg';

  return (
    <div className={`${widthClass} w-full bg-white rounded-lg border overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-gray-400 font-medium">Instagram irašas</p>
      </div>

      {/* Image first (Instagram style) */}
      {imageUrl && (
        <div className="w-full aspect-square">
          <img
            src={imageUrl}
            alt="Post preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Caption */}
      {text && (
        <div className="p-4">
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {text}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-4 pb-2">
        <p className="text-xs text-gray-400">Pavyzdys - ne tikras vaizdas</p>
      </div>
    </div>
  );
}
