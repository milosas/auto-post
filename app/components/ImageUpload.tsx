'use client';

import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import toast from 'react-hot-toast';
import { validateImage } from '@/app/lib/image-utils';

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  currentImage: string | null; // base64 preview URL
  disabled?: boolean;
}

export function ImageUpload({ onImageSelect, currentImage, disabled }: ImageUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          toast.error('Failas per didelis. Maksimalus dydis: 5MB');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          toast.error('Netinkamas formatas. Naudokite JPG, PNG arba WebP');
        } else {
          toast.error('Nepavyko įkelti failo');
        }
        return;
      }

      // Validate accepted file
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const validation = validateImage(file);

        if (!validation.valid) {
          toast.error(validation.error || 'Netinkamas failas');
          return;
        }

        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    disabled,
    multiple: false
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageSelect(null);
  };

  // If we have an image, show preview
  if (currentImage) {
    return (
      <div className="relative">
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
          <img
            src={currentImage}
            alt="Preview"
            className="w-full h-64 object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              aria-label="Pašalinti paveikslėlį"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Otherwise show dropzone
  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : ''}
        ${isDragReject ? 'border-red-500 bg-red-50' : ''}
        ${!isDragActive && !isDragReject ? 'border-gray-300 hover:border-gray-400' : ''}
      `}
      style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
    >
      <input {...getInputProps()} />

      {/* Upload icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      <p className="text-base font-medium text-gray-700 mb-1">
        {isDragActive
          ? 'Paleiskite failą čia...'
          : 'Nutempkite paveikslėlį arba paspauskite pasirinkti'}
      </p>

      <p className="text-sm text-gray-500">
        JPG, PNG, WebP iki 5MB
      </p>
    </div>
  );
}
