import React from 'react';
import { Globe } from 'lucide-react';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
];

export const getCurrencySymbol = (code?: string): string => {
  if (!code) return '₹';
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found ? found.symbol : code;
};

export const getCurrencyFlag = (code?: string): string => {
  if (!code) return '🇮🇳';
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found ? found.flag : '🌐';
};

interface CurrencySelectProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function CurrencySelect({
  value = 'INR',
  onChange,
  label = 'Currency',
  disabled = false,
  className = '',
}: CurrencySelectProps) {
  const current = value ? value.toUpperCase() : 'INR';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={current}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="glass-input appearance-none pl-10 pr-8 py-2 text-sm bg-white text-gray-900 font-medium cursor-pointer"
        >
          {SUPPORTED_CURRENCIES.map((cur) => (
            <option key={cur.code} value={cur.code} className="bg-white text-gray-900">
              {cur.flag} {cur.code} — {cur.name} ({cur.symbol})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-500">
          <Globe className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
