"use client";

import { useState, useRef, useEffect } from "react";

interface SearchResult {
  id: string;
  placeName: string;
  center: [number, number];
  placeType: string;
}

interface SearchBoxProps {
  onSelectLocation: (lat: number, lng: number, placeName: string) => void;
  placeholder?: string;
}

export default function SearchBox({
  onSelectLocation,
  placeholder = "Search for a location...",
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${token}&country=US&types=address,place,locality,neighborhood,poi&limit=5`
      );

      if (!response.ok) {
        throw new Error("Geocoding failed");
      }

      const data = await response.json() as { features: any[] };

      const searchResults: SearchResult[] = data.features.map(
        (feature: {
          id: string;
          place_name: string;
          center: [number, number];
          place_type: string[];
        }) => ({
          id: feature.id,
          placeName: feature.place_name,
          center: feature.center,
          placeType: feature.place_type[0],
        })
      );

      setResults(searchResults);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const handleSelectResult = (result: SearchResult) => {
    setQuery(result.placeName);
    setShowResults(false);
    onSelectLocation(result.center[1], result.center[0], result.placeName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case "Escape":
        setShowResults(false);
        break;
    }
  };

  const getPlaceTypeIcon = (placeType: string) => {
    switch (placeType) {
      case "address":
        return "📍";
      case "place":
        return "🏙️";
      case "locality":
        return "🏘️";
      case "neighborhood":
        return "🏠";
      case "poi":
        return "📌";
      default:
        return "📍";
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isLoading ? (
            <svg
              className="w-5 h-5 text-gray-400 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowResults(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((result, index) => (
            <li
              key={result.id}
              onClick={() => handleSelectResult(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-4 py-3 cursor-pointer flex items-start gap-3 ${
                index === selectedIndex ? "bg-blue-50" : "hover:bg-gray-50"
              } ${index !== results.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <span className="text-lg">{getPlaceTypeIcon(result.placeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {result.placeName.split(",")[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {result.placeName.split(",").slice(1).join(",").trim()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showResults && query.length >= 3 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No locations found
        </div>
      )}
    </div>
  );
}