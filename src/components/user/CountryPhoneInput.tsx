'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  disabled?: boolean;
}

export function CountryPhoneInput({ value, onChange, disabled = false }: CountryPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract local number from value (strip dial code)
  const localNumber = useMemo(() => {
    if (value.startsWith(selectedCountry.dial)) {
      return value.slice(selectedCountry.dial.length);
    }
    return value.replace(/^\+\d{1,4}/, '');
  }, [value, selectedCountry.dial]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    const q = searchQuery.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  function handlePhoneChange(phone: string) {
    const cleaned = phone.replace(/\D/g, '');
    onChange(selectedCountry.dial + cleaned);
  }

  function handleSelectCountry(country: Country) {
    setSelectedCountry(country);
    setShowDropdown(false);
    setSearchQuery('');
    onChange(country.dial + localNumber);
  }

  return (
    <div className="relative flex">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowDropdown(!showDropdown)}
        className="rounded-l-[14px] border border-white/10 border-r-0 bg-transparent hover:bg-white/5 text-white px-3 min-w-[100px] shrink-0 flex items-center justify-center transition-colors h-[52px]"
      >
        <span className="mr-1">{selectedCountry.flag}</span>
        <span className="text-[15px]">{selectedCountry.dial}</span>
        <ChevronDown size={16} className="ml-1 text-slate-500" />
      </button>
      <Input
        type="tel"
        inputMode="numeric"
        placeholder="Phone number"
        value={localNumber}
        onChange={(e) => handlePhoneChange(e.target.value)}
        disabled={disabled}
        className="rounded-l-none rounded-r-[14px] h-[52px] bg-transparent border-white/10 focus-visible:ring-1 focus-visible:ring-indigo-500 text-[15px] text-white placeholder-slate-500"
      />

      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#18181B] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-white/10 flex flex-col">
            <input
              placeholder="Search country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 px-3 text-[14px] bg-black/20 border border-white/10 text-white placeholder-slate-500 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelectCountry(country)}
                className={`w-full text-left px-4 py-3 text-[14px] hover:bg-white/5 flex items-center gap-3 transition-colors ${
                  selectedCountry.code === country.code ? 'bg-white/10' : ''
                }`}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="flex-1 text-slate-200 font-medium">{country.name}</span>
                <span className="text-slate-500 font-medium">{country.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
