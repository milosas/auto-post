'use client';

interface FacebookPreviewProps {
  imageUrl: string | null;
  text: string;
  viewMode: 'mobile' | 'desktop';
}

export function FacebookPreview({ imageUrl, text, viewMode }: FacebookPreviewProps) {
  const widthClass = viewMode === 'mobile' ? 'max-w-sm' : 'max-w-xl';

  return (
    <div className={`${widthClass} w-full bg-white rounded-lg border overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-gray-400 font-medium">Facebook irašas</p>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Text */}
        {text && (
          <div className="whitespace-pre-wrap text-sm text-gray-900 mb-3">
            {text}
          </div>
        )}

        {/* Image */}
        {imageUrl && (
          <div className="mt-3 -mx-4">
            <img
              src={imageUrl}
              alt="Post preview"
              className="w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-2">
        <p className="text-xs text-gray-400">Pavyzdys - ne tikras vaizdas</p>
      </div>
    </div>
  );
}
