'use client';

import { useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import toast from 'react-hot-toast';

interface DownloadButtonProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
  imageUrl: string | null;
  industry: string;
  disabled?: boolean;
}

type DownloadFormat = 'png' | 'jpeg';
type DownloadTarget = 'image' | 'preview';

export function DownloadButton({
  previewRef,
  imageUrl,
  industry,
  disabled = false,
}: DownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sanitizeFilename = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const downloadImage = async (format: DownloadFormat) => {
    if (!imageUrl) {
      toast.error('Nėra paveikslelio');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizeFilename(industry)}-post.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Paveikslelis atsisiųstas');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Nepavyko atsisiųsti paveikslelio');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const downloadPreview = async (format: DownloadFormat) => {
    if (!previewRef.current) {
      toast.error('Nėra peržiūros');
      return;
    }

    try {
      setIsLoading(true);
      const dataUrl =
        format === 'png'
          ? await toPng(previewRef.current, { quality: 1.0 })
          : await toJpeg(previewRef.current, { quality: 0.95 });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${sanitizeFilename(industry)}-preview.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Peržiūra atsisiųsta');
    } catch (error) {
      console.error('Preview download error:', error);
      toast.error('Nepavyko atsisiųsti peržiūros');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleDownload = (target: DownloadTarget, format: DownloadFormat) => {
    if (target === 'image') {
      downloadImage(format);
    } else {
      downloadPreview(format);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isLoading ? 'Atsisiunčiama...' : 'Atsisiųsti ↓'}
      </button>

      {isOpen && !isLoading && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
          <div className="py-2">
            {imageUrl && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Paveikslelis
                </div>
                <button
                  onClick={() => handleDownload('image', 'png')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                >
                  PNG formatu
                </button>
                <button
                  onClick={() => handleDownload('image', 'jpeg')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                >
                  JPEG formatu
                </button>
              </>
            )}

            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-t border-gray-200 mt-1">
              Peržiūra
            </div>
            <button
              onClick={() => handleDownload('preview', 'png')}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
            >
              PNG formatu
            </button>
            <button
              onClick={() => handleDownload('preview', 'jpeg')}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
            >
              JPEG formatu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
