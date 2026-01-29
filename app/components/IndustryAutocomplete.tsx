'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';
import { INDUSTRIES } from '@/app/lib/industries';

interface IndustryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function IndustryAutocomplete({
  value,
  onChange,
  className = '',
}: IndustryAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(INDUSTRIES, {
        threshold: 0.3,
        distance: 100,
        minMatchCharLength: 2,
      }),
    []
  );

  const suggestions = useMemo(() => {
    // Jei showAll arba tuščias - rodyti visas industrijas
    if (showAll || !value || value.length < 2) {
      return [...INDUSTRIES];
    }
    // Kitaip - fuzzy search
    const results = fuse.search(value);
    return results.map((result) => result.item);
  }, [value, fuse, showAll]);

  const handleFocus = () => {
    setShowAll(true);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleSelect = (industry: string) => {
    onChange(industry);
    setShowAll(false);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setShowAll(false);
          onChange(e.target.value);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Pasirinkite savo industriją..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((industry, index) => (
            <button
              key={industry}
              type="button"
              onClick={() => handleSelect(industry)}
              className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors ${
                index === highlightedIndex ? 'bg-blue-100' : ''
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
