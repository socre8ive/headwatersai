"use client";

interface WatershedData {
  huc12: string;
  huc10: string;
  huc8: string;
  huc6: string;
  huc4: string;
  huc2: string;
  name: string;
  areaSqKm: number;
  states: string;
  centroid: {
    lat: number;
    lng: number;
  };
  upstreamHuc12s: string[];
}

interface WatershedInfoProps {
  watershed: WatershedData | null;
  isLoading?: boolean;
}

export default function WatershedInfo({ watershed, isLoading }: WatershedInfoProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!watershed) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-sm">Click on the map or search for a location to view watershed information</p>
        </div>
      </div>
    );
  }

  const areaSquareMiles = (watershed.areaSqKm * 0.386102).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white">{watershed.name}</h2>
        <p className="text-blue-100 text-sm mt-1">HUC-12 Watershed</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Hydrologic Unit Codes
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">HUC-2 (Region)</p>
              <p className="font-mono text-sm font-medium text-gray-900">{watershed.huc2}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">HUC-4 (Subregion)</p>
              <p className="font-mono text-sm font-medium text-gray-900">{watershed.huc4}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">HUC-6 (Basin)</p>
              <p className="font-mono text-sm font-medium text-gray-900">{watershed.huc6}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">HUC-8 (Subbasin)</p>
              <p className="font-mono text-sm font-medium text-gray-900">{watershed.huc8}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">HUC-10 (Watershed)</p>
              <p className="font-mono text-sm font-medium text-gray-900">{watershed.huc10}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600">HUC-12 (Subwatershed)</p>
              <p className="font-mono text-sm font-medium text-blue-900">{watershed.huc12}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Watershed Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Area</span>
              <span className="font-medium text-gray-900">
                {watershed.areaSqKm.toLocaleString()} km² ({areaSquareMiles} mi²)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">States</span>
              <span className="font-medium text-gray-900">{watershed.states || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Centroid</span>
              <span className="font-mono text-sm text-gray-900">
                {watershed.centroid.lat.toFixed(4)}°, {watershed.centroid.lng.toFixed(4)}°
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Upstream Watersheds</span>
              <span className="font-medium text-gray-900">
                {watershed.upstreamHuc12s.length} subwatersheds
              </span>
            </div>
          </div>
        </div>

        {watershed.upstreamHuc12s.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Upstream HUC-12s
            </h3>
            <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {watershed.upstreamHuc12s.map((huc) => (
                  <span
                    key={huc}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-100 text-blue-800"
                  >
                    {huc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}