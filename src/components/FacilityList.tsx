"use client";

interface Facility {
  registryId: string;
  facilityName: string;
  latitude: number;
  longitude: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  facilityType: string;
  naicsCodes: string[];
  sicCodes: string[];
  npdesPermitIds: string[];
  isMajorDischarger: boolean;
  complianceStatus: string;
  lastInspectionDate: string | null;
  violationsLast3Years: number;
}

interface FacilityListProps {
  facilities: Facility[];
  isLoading?: boolean;
  onSelectFacility?: (facility: Facility) => void;
  selectedFacilityId?: string | null;
}

export default function FacilityList({
  facilities,
  isLoading,
  onSelectFacility,
  selectedFacilityId,
}: FacilityListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">EPA Facilities</h2>
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

  if (facilities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">EPA Facilities</h2>
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="text-sm">No EPA-regulated facilities found in this area</p>
        </div>
      </div>
    );
  }

  const getComplianceColor = (status: string, violations: number): string => {
    if (status === "Violation" || violations > 5) return "bg-red-100 text-red-800";
    if (violations > 0) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getComplianceIcon = (status: string, violations: number): string => {
    if (status === "Violation" || violations > 5) return "🚨";
    if (violations > 0) return "⚠️";
    return "✅";
  };

  const majorDischargers = facilities.filter((f) => f.isMajorDischarger);
  const withViolations = facilities.filter((f) => f.violationsLast3Years > 0);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
        <h2 className="text-lg font-bold text-white">EPA Facilities</h2>
        <p className="text-orange-100 text-sm mt-1">
          {facilities.length} facilities • {majorDischargers.length} major dischargers
        </p>
      </div>

      {withViolations.length > 0 && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-3">
          <p className="text-sm text-red-800">
            <span className="font-semibold">⚠️ {withViolations.length}</span> facilities with violations in the last 3 years
          </p>
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {facilities.map((facility) => (
          <div
            key={facility.registryId}
            onClick={() => onSelectFacility && onSelectFacility(facility)}
            className={`p-4 cursor-pointer transition-colors ${
              selectedFacilityId === facility.registryId
                ? "bg-orange-50 border-l-4 border-orange-500"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {facility.facilityName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {facility.address.city}, {facility.address.state} {facility.address.zip}
                </p>
              </div>
              <span
                className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getComplianceColor(
                  facility.complianceStatus,
                  facility.violationsLast3Years
                )}`}
              >
                {getComplianceIcon(facility.complianceStatus, facility.violationsLast3Years)}{" "}
                {facility.complianceStatus}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {facility.isMajorDischarger && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  Major Discharger
                </span>
              )}
              {facility.violationsLast3Years > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  {facility.violationsLast3Years} violations (3yr)
                </span>
              )}
              {facility.facilityType && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {facility.facilityType.length > 30
                    ? facility.facilityType.substring(0, 30) + "..."
                    : facility.facilityType}
                </span>
              )}
            </div>

            {facility.npdesPermitIds.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  NPDES Permits: {facility.npdesPermitIds.slice(0, 3).join(", ")}
                  {facility.npdesPermitIds.length > 3 && ` +${facility.npdesPermitIds.length - 3} more`}
                </p>
              </div>
            )}

            {facility.lastInspectionDate && (
              <p className="text-xs text-gray-400 mt-2">
                Last inspection: {new Date(facility.lastInspectionDate).toLocaleDateString()}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-1">
              Registry ID: {facility.registryId}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}