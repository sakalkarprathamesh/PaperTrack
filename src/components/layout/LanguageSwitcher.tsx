'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, Language } from '@/lib/i18n';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact = false, className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentOption = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Change language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
      >
        <Globe className="w-3.5 h-3.5 text-slate-500" />
        <span className={compact ? 'hidden sm:inline font-semibold' : 'font-semibold'}>
          {currentOption.nativeLabel}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 rounded-lg bg-white shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            भाषा / Language
          </div>
          {SUPPORTED_LANGUAGES.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLanguage(opt.code as Language);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-red-50 text-red-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <span>{opt.nativeLabel}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-red-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
