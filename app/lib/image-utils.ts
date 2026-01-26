import { useState, useEffect } from 'react';

// Type definitions
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export type ImageSourceType = 'upload' | 'ai';

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates image file type and size
 * @param file - File object to validate
 * @returns Validation result with Lithuanian error messages
 */
export function validateImage(file: File): ImageValidationResult {
  // Check file type
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Netinkamas formatas. Naudokite JPG, PNG arba WebP'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Failas per didelis. Maksimalus dydis: 5MB'
    };
  }

  return { valid: true };
}

/**
 * React hook to generate preview URL from File object
 * @param file - File object to preview
 * @returns Base64 data URL or null
 */
export function useImagePreview(file: File | null): string | null {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result as string);
    };

    reader.readAsDataURL(file);

    // Cleanup function to prevent memory leaks
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  return preview;
}
