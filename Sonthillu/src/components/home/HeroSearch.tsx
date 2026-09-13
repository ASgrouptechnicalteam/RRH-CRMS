'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROPERTY_TYPE_OPTIONS, BUDGET_PRESETS, PropertyType } from '@/types/search';
import { BHK_OPTIONS } from '@/types/property';
import { Button } from '@/components/ui/Button';
import { CRM_CONFIG } from '@/lib/constants';

export function HeroSearch() {
  const router = useRouter();

  const [mode, setMode] = useState<'BUY' | 'AI'>('BUY');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [bedrooms, setBedrooms] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (propertyType) params.set('propertyType', propertyType);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (maxBudget) params.set('maxBudget', maxBudget);
    router.push(`/properties?${params.toString()}`);
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    try {
      // Was pointed at the retiring Sonthillu-Backend BFF's own /api/search/parse
      // (and via a non-NEXT_PUBLIC_ env var that was never exposed to the
      // browser to begin with) — now calls apps/api's WebsiteAccount search
      // parser directly, same endpoint actions/ai-search.ts uses.
      const backendUrl = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'http://localhost:3000/api/v1';
      const apiKey = process.env.NEXT_PUBLIC_CRM_API_KEY || '';
      const res = await fetch(`${backendUrl}/public/${CRM_CONFIG.brandParameter}/search/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ query: aiQuery.trim() }),
      });

      const parsed = await res.json();
      if (!res.ok) {
        throw new Error(parsed.error || 'Failed to parse AI query');
      }

      const params = new URLSearchParams();
      if (parsed.location) params.set('location', parsed.location);
      if (parsed.propertyType) params.set('propertyType', parsed.propertyType);
      if (parsed.bedrooms) params.set('bedrooms', parsed.bedrooms);
      if (parsed.maxBudget) params.set('maxBudget', parsed.maxBudget.toString());
      if (parsed.minBudget) params.set('minBudget', parsed.minBudget.toString());
      if (parsed.possessionStatus) params.set('possessionStatus', parsed.possessionStatus);
      if (parsed.location) setLocation(parsed.location);
      if (parsed.propertyType) setPropertyType(parsed.propertyType as PropertyType);
      if (parsed.bedrooms) setBedrooms(parsed.bedrooms);
      if (parsed.maxBudget) setMaxBudget(parsed.maxBudget.toString());
      router.push(`/properties?${params.toString()}`);
    } catch (error: any) {
      console.error(error);
      alert(`AI Search Error: ${error.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const tabs = [
    { key: 'BUY' as const, label: 'Buy Property', icon: '🏠' },
    { key: 'AI' as const, label: 'AI Search', icon: '✨' },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Tab Switcher */}
      <div className="mb-3 flex justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
              mode === tab.key
                ? tab.key === 'AI'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                  : 'bg-brand-gold text-brand-navy shadow-gold'
                : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Card */}
      <div className="rounded-2xl bg-white shadow-2xl overflow-hidden border border-brand-gold/20">
        {/* Gold top accent line */}
        <div className="h-1 bg-gradient-to-r from-brand-gold via-brand-gold-soft to-brand-gold" />

        <div className="p-2 sm:p-3">
          {mode === 'BUY' ? (
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              {/* Location */}
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-brand-navy/50"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search location, area or landmark..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border-transparent bg-cream py-3 pl-10 pr-3 text-text-primary placeholder:text-text-muted focus:bg-white focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold transition-all sm:rounded-lg sm:bg-transparent sm:border-r sm:border-border"
                />
              </div>

              {/* Property Type */}
              <div className="relative w-full sm:w-40 sm:border-r sm:border-border">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full appearance-none bg-transparent py-3 pl-3 pr-8 text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="">Property Type</option>
                  {PROPERTY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* BHK */}
              <div className="relative w-full sm:w-28 sm:border-r sm:border-border">
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full appearance-none bg-transparent py-3 pl-3 pr-8 text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="">BHK</option>
                  {BHK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div className="relative w-full sm:w-36">
                <select
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full appearance-none bg-transparent py-3 pl-3 pr-8 text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="">Budget</option>
                  {BUDGET_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.max || ''}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto bg-brand-gold text-brand-navy font-bold hover:bg-brand-gold-dark border-0 px-6 py-3 rounded-xl shadow-gold"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handleAiSearch}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-xl">✨</span>
                </div>
                <input
                  type="text"
                  placeholder='e.g. "3 BHK in Gachibowli under 2 Crores near school"'
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  disabled={isAiLoading}
                  className="w-full rounded-xl border-transparent bg-cream py-3 pl-10 pr-3 text-text-primary placeholder:text-text-muted focus:bg-white focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all sm:rounded-lg sm:bg-transparent sm:border-r sm:border-border"
                />
              </div>
              <Button
                type="submit"
                disabled={isAiLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold border-0 px-6 py-3 rounded-xl"
              >
                {isAiLoading ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Thinking...
                  </>
                ) : (
                  '✨ AI Search'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
