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
    <div className="relative flex gap-0">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setShowDropdown(!showDropdown)}
        className="rounded-r-none border-r-0 px-3 min-w-[100px] shrink-0"
      >
        <span className="mr-1">{selectedCountry.flag}</span>
        <span className="text-sm">{selectedCountry.dial}</span>
        <ChevronDown size={14} className="ml-1 text-muted-foreground" />
      </Button>
      <Input
        type="tel"
        inputMode="numeric"
        placeholder="Phone number"
        value={localNumber}
        onChange={(e) => handlePhoneChange(e.target.value)}
        disabled={disabled}
        className="rounded-l-none"
      />

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
          <div className="p-2 border-b border-border">
            <Input
              placeholder="Search country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelectCountry(country)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 ${
                  selectedCountry.code === country.code ? 'bg-accent' : ''
                }`}
              >
                <span>{country.flag}</span>
                <span className="flex-1 text-foreground">{country.name}</span>
                <span className="text-muted-foreground">{country.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
