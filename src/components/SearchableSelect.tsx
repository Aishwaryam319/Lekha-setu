import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface SelectOption {
  id: string;
  labelEn: string;
  labelKn: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
  disabledMessage?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
  disabledMessage,
  icon,
  required = false,
}: SearchableSelectProps) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.labelEn.toLowerCase().includes(q) ||
        opt.labelKn.toLowerCase().includes(q) ||
        (opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false)
    );
  }, [options, query]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
    }
  }, [open]);

  const displayLabel = selectedOption
    ? language === 'kn'
      ? `${selectedOption.labelKn} (${selectedOption.labelEn})`
      : `${selectedOption.labelEn}${selectedOption.labelKn ? ` · ${selectedOption.labelKn}` : ''}`
    : '';

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173B63] ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : open
              ? 'bg-white border-[#173B63] text-slate-900'
              : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
          <span className={`truncate ${selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
            {disabled && disabledMessage ? disabledMessage : displayLabel || placeholder}
          </span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute z-40 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#173B63]"
              />
            </div>
          </div>

          <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="px-3.5 py-4 text-sm text-slate-500 text-center">
                {t('noResultsFound')}
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-[#173B63]/5 text-[#173B63] font-semibold'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate">
                          {language === 'kn' ? opt.labelKn : opt.labelEn}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {language === 'kn' ? opt.labelEn : opt.labelKn}
                          {opt.sublabel ? ` · ${opt.sublabel}` : ''}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#0D9488] shrink-0" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
