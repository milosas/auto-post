'use client';

import { useState, forwardRef } from 'react';
import { FacebookPreview } from './FacebookPreview';
import { InstagramPreview } from './InstagramPreview';
import { PreviewToggle } from './PreviewToggle';

interface SocialPreviewProps {
  imageUrl: string | null;
  text: string;
  className?: string;
}

export const SocialPreview = forwardRef<HTMLDivElement, SocialPreviewProps>(
  function SocialPreview({ imageUrl, text, className }, ref) {
    const [platform, setPlatform] = useState<'facebook' | 'instagram'>('facebook');
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

    // Empty state check
    const isEmpty = !text && !imageUrl;

    return (
      <div className={className}>
        {/* Platform tabs */}
        <div className="flex gap-2 border-b mb-4">
          <button
            type="button"
            onClick={() => setPlatform('facebook')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              platform === 'facebook'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Facebook
          </button>
          <button
            type="button"
            onClick={() => setPlatform('instagram')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              platform === 'instagram'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Instagram
          </button>
        </div>

        {/* View mode toggle */}
        {!isEmpty && (
          <div className="mb-4">
            <PreviewToggle value={viewMode} onChange={setViewMode} />
          </div>
        )}

        {/* Preview container - centered */}
        <div className="flex justify-center" ref={ref}>
          {isEmpty ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">
                Sugeneruokite tekstą arba įkelkite paveikslelį
              </p>
            </div>
          ) : platform === 'facebook' ? (
            <FacebookPreview imageUrl={imageUrl} text={text} viewMode={viewMode} />
          ) : (
            <InstagramPreview imageUrl={imageUrl} text={text} viewMode={viewMode} />
          )}
        </div>
      </div>
    );
  }
);
