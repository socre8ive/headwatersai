"use client";

interface Gauge {
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  stateCode: string;
  county: string;
  drainageAreaSqMi: number | null;
  datumElevationFt: number | null;
  siteType: string;
  latestReading: {
    timestamp: string;
    dischargeCfs: number | null;
    gageHeightFt: number | null;
    waterTempCelsius: number | null;
  } | null;
}

interface GaugeListProps {
  gauges: Gauge[];
  isLoading?: boolean;
  onSelectGauge?: (gauge: Gauge) => void;
  selectedGaugeId?: string | null;
}

export default function GaugeList({
  gauges,
  isLoading,
  onSelectGauge,
  selectedGaugeId,
}: GaugeListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stream Gauges</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gauges.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Stream Gauges</h2>
        <div className="text-center text-gray-500 py-8">
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <p className="text-sm">No stream gauges found in this area</p>
        </div>
      </div>
    );
  }

  const getDischargeColor = (dischargeCfs: number | null): string => {
    if (dischargeCfs === null) return "text-gray-400";
    if (dischargeCfs < 10) return "text-yellow-600";
    if (dischargeCfs < 100) return "text-green-600";
    if (dischargeCfs < 1000) return "text-blue-600";
    return "text-purple-600";
  };

  const getDischargeStatus = (dischargeCfs: number | null): string => {
    if (dischargeCfs === null) return "No data";
    if (dischargeCfs < 10) return "Low flow";
    if (dischargeCfs < 100) return "Normal";
    if (dischargeCfs < 1000) return "Moderate";
    if (dischargeCfs < 5000) return "High";
    return "Very high";
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <h2 className="text-lg font-bold text-white">Stream Gauges</h2>
        <p className="text-green-100 text-sm mt-1">{gauges.length} stations found</p>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {gauges.map((gauge) => (
          <div
            key={gauge.siteId}
            onClick={() => onSelectGauge && onSelectGauge(gauge)}
            className={`p-4 cursor-pointer transition-colors ${
              selectedGaugeId === gauge.siteId
                ? "bg-green-50 border-l-4 border-green-500"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {gauge.siteName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {gauge.county}, {gauge.stateCode} • ID: {gauge.siteId}
                </p>
              </div>
              {gauge.latestReading && (
                <span
                  className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    gauge.latestReading.dischargeCfs !== null
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {getDischargeStatus(gauge.latestReading.dischargeCfs)}
                </span>
              )}
            </div>

            {gauge.latestReading ? (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Discharge</p>
                  <p className={`text-sm font-semibold ${getDischargeColor(gauge.latestReading.dischargeCfs)}`}>
                    {gauge.latestReading.dischargeCfs !== null
                      ? `${gauge.latestReading.dischargeCfs.toLocaleString()} cfs`
                      : "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Gage Height</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {gauge.latestReading.gageHeightFt !== null
                      ? `${gauge.latestReading.gageHeightFt.toFixed(2)} ft`
                      : "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Water Temp</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {gauge.latestReading.waterTempCelsius !== null
                      ? `${((gauge.latestReading.waterTempCelsius * 9) / 5 + 32).toFixed(1)}°F`
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-2 italic">No recent readings available</p>
            )}

            {gauge.latestReading && (
              <p className="text-xs text-gray-400 mt-2">
                Updated: {formatTimestamp(gauge.latestReading.timestamp)}
              </p>
            )}

            {gauge.drainageAreaSqMi && (
              <p className="text-xs text-gray-500 mt-1">
                Drainage area: {gauge.drainageAreaSqMi.toLocaleString()} mi²
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}