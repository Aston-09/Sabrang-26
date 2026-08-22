import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface SearchableVenueSelectProps {
  value: string;
  onChange: (value: string) => void;
  suggestedVenues: string[];
  standardVenues: string[];
  placeholder?: string;
  required?: boolean;
  hasIcon?: boolean;
  theme?: 'cloud' | 'white';
}

export function SearchableVenueSelect({
  value,
  onChange,
  suggestedVenues = [],
  standardVenues = [],
  placeholder = "Choose Venue...",
  required = false,
  hasIcon = true,
  theme = 'cloud'
}: SearchableVenueSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset search query when dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const isCustomVenue = useMemo(() => {
    return !!(value && !suggestedVenues.includes(value) && !standardVenues.includes(value));
  }, [value, suggestedVenues, standardVenues]);

  // Filter lists based on search query
  const filteredSuggested = useMemo(() => {
    return suggestedVenues.filter(v =>
      v.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [suggestedVenues, searchQuery]);

  const filteredStandard = useMemo(() => {
    return standardVenues.filter(v =>
      v.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [standardVenues, searchQuery]);

  const showCustomGroup = isCustomVenue && value.toLowerCase().includes(searchQuery.toLowerCase());

  const handleSelect = (venue: string) => {
    onChange(venue);
    setIsOpen(false);
  };

  const hasMatches = filteredSuggested.length > 0 || filteredStandard.length > 0 || showCustomGroup;

  // Neo-brutalist custom styling classes based on theme and icons
  const baseTriggerClass = "w-full flex items-center justify-between border-2 border-brand-ink rounded-md text-xs text-brand-ink font-bold focus:outline-none focus:border-brand-orange transition-colors cursor-pointer text-left relative";
  const paddingClass = hasIcon ? "py-2.5 pl-9 pr-4" : "py-2 px-3";
  const themeClass = theme === 'cloud' 
    ? "bg-brand-cloud/45 focus:bg-white shadow-[2px_2px_0px_0px_#030404]" 
    : "bg-white shadow-[1px_1px_0px_0px_#030404]";

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${baseTriggerClass} ${paddingClass} ${themeClass}`}
      >
        {hasIcon && (
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" size={14} />
        )}
        <span className={value ? "text-brand-ink" : "text-brand-ink/40"}>
          {value || placeholder}
        </span>
        {isOpen ? <ChevronUp size={14} className="text-brand-ink/65 shrink-0" /> : <ChevronDown size={14} className="text-brand-ink/65 shrink-0" />}
      </button>

      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="absolute opacity-0 pointer-events-none h-0 w-0"
          tabIndex={-1}
          aria-label="Selected Venue"
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border-2 border-brand-ink rounded-md shadow-[3px_3px_0px_0px_#030404] overflow-hidden flex flex-col max-h-64">
          {/* Search Input Panel */}
          <div className="relative border-b-2 border-brand-ink/10 bg-brand-cloud/10 p-2">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-brand-ink/40" size={13} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search venue..."
              aria-label="Search venues"
              className="w-full bg-white border-2 border-brand-ink rounded-md py-1.5 pl-8 pr-3 text-xs text-brand-ink font-bold focus:outline-none focus:border-brand-orange"
              autoFocus
            />
          </div>

          {/* List Panel */}
          <div className="overflow-y-auto flex-1 py-1 max-h-48">
            {!hasMatches ? (
              <div className="p-3 text-center text-xs font-bold text-admin-muted uppercase tracking-wider">
                No venues found
              </div>
            ) : (
              <>
                {/* Suggested Group */}
                {filteredSuggested.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[9px] font-black uppercase text-brand-orange tracking-widest bg-brand-cloud/20 border-y border-brand-ink/5">
                      Suggested (Events in this Time Slot)
                    </div>
                    {filteredSuggested.map((ven) => (
                      <button
                        key={ven}
                        type="button"
                        onClick={() => handleSelect(ven)}
                        className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between hover:bg-brand-cloud/45 ${
                          value === ven ? 'text-brand-orange bg-brand-orange/5 font-black' : 'text-brand-ink'
                        }`}
                      >
                        <span>{ven}</span>
                        {value === ven && <Check size={12} className="text-brand-orange shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Standard Group */}
                {filteredStandard.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[9px] font-black uppercase text-brand-blue tracking-widest bg-brand-cloud/20 border-y border-brand-ink/5">
                      Standard Venues
                    </div>
                    {filteredStandard.map((ven) => (
                      <button
                        key={ven}
                        type="button"
                        onClick={() => handleSelect(ven)}
                        className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between hover:bg-brand-cloud/45 ${
                          value === ven ? 'text-brand-blue bg-brand-blue/5 font-black' : 'text-brand-ink'
                        }`}
                      >
                        <span>{ven}</span>
                        {value === ven && <Check size={12} className="text-brand-blue shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Venue Group */}
                {showCustomGroup && (
                  <div>
                    <div className="px-3 py-1.5 text-[9px] font-black uppercase text-brand-orange tracking-widest bg-brand-cloud/20 border-y border-brand-ink/5">
                      Custom Venue
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelect(value)}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between hover:bg-brand-cloud/45 text-brand-orange bg-brand-orange/5 font-black"
                    >
                      <span>{value}</span>
                      <Check size={12} className="text-brand-orange shrink-0" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
