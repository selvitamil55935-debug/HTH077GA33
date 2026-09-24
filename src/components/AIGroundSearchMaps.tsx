import React, { useState } from 'react';
import {
  searchGrounding,
  mapsGrounding,
  SearchGroundingResult,
  MapsGroundingResult,
} from '../services/aiSuiteService';
import {
  Search,
  MapPin,
  ExternalLink,
  Globe,
  Compass,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Building,
} from 'lucide-react';

export const AIGroundSearchMaps: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'maps'>('search');

  // Search Grounding state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchGroundingResult | null>(null);

  // Maps Grounding state
  const [mapsQuery, setMapsQuery] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsResult, setMapsResult] = useState<MapsGroundingResult | null>(null);

  const handleSearch = async (queryText?: string) => {
    const q = (queryText || searchQuery).trim();
    if (!q || searchLoading) return;
    setSearchLoading(true);
    try {
      const res = await searchGrounding(q);
      setSearchResult(res);
    } catch (err: any) {
      alert(`Search error: ${err.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMaps = async (queryText?: string) => {
    const q = (queryText || mapsQuery).trim();
    if (!q || mapsLoading) return;
    setMapsLoading(true);
    try {
      const res = await mapsGrounding(q, locationHint.trim() || undefined);
      setMapsResult(res);
    } catch (err: any) {
      alert(`Maps error: ${err.message}`);
    } finally {
      setMapsLoading(false);
    }
  };

  const sampleSearchQueries = [
    'Current RBI repo rate and high-yield savings interest rates in India',
    'Benchmark SaaS gross margin and CAC payback period for B2B startups',
    'Tax deduction limits under section 80C and corporate tax brackets 2026',
  ];

  const sampleMapsQueries = [
    'Chartered Accountant firms and tax filing consultants',
    'Commercial bank branches offering SME business working capital loans',
    'Co-working offices and business incubator hubs',
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'search'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-500" />
          <span>Google Search Grounding (gemini-3.5-flash)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('maps')}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'maps'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-500" />
          <span>Google Maps Grounding (gemini-3.5-flash)</span>
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {/* TAB 1: SEARCH GROUNDING */}
        {activeTab === 'search' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Live Market &amp; Financial Search Grounding
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Retrieve grounded financial research, interest rate movements, macro indicators, and verified facts with Google Search tool integration.
              </p>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter financial topic, e.g. Current inflation rates or SME tax laws..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim() || searchLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                {searchLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Ground Search</span>
                  </>
                )}
              </button>
            </form>

            {/* Sample Queries */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Try:</span>
              {sampleSearchQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(q);
                    handleSearch(q);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 text-[11px] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Grounded Results Output */}
            {searchResult && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Grounded Research Summary
                  </span>
                  <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    Model: gemini-3.5-flash (googleSearch)
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {searchResult.text}
                </div>

                {/* Grounding Web Sources */}
                {searchResult.sources && searchResult.sources.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                    <h5 className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                      Verified Web References &amp; Sources
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {searchResult.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-blue-600 dark:text-blue-400 hover:underline shadow-2xs transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="max-w-xs truncate">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MAPS GROUNDING */}
        {activeTab === 'maps' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Local Financial Services &amp; Vendor Maps Grounding
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Locate certified financial planners, SME banks, accounting firms, and commercial hubs near you using Google Maps tool grounding.
              </p>
            </div>

            {/* Maps Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleMaps();
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 relative">
                  <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={mapsQuery}
                    onChange={(e) => setMapsQuery(e.target.value)}
                    placeholder="Search: e.g. Business bank branches, Tax accountants..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={locationHint}
                    onChange={(e) => setLocationHint(e.target.value)}
                    placeholder="City / Area (e.g. Bangalore, Mumbai)"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!mapsQuery.trim() || mapsLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                {mapsLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching Maps data...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>Find Grounded Locations</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Quick find:</span>
              {sampleMapsQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMapsQuery(q);
                    handleMaps(q);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 text-[11px] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Grounded Maps Result Output */}
            {mapsResult && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Grounded Geographic Insights
                  </span>
                  <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    Model: gemini-3.5-flash (googleMaps)
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {mapsResult.text}
                </div>

                {/* Grounded Place Links */}
                {mapsResult.places && mapsResult.places.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                    <h5 className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                      Grounded Map Place References
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mapsResult.places.map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:border-emerald-500 shadow-2xs transition-all"
                        >
                          <span className="font-semibold truncate">{place.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
