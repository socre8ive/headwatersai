const EPA_ECHO_BASE = "https://echodata.epa.gov/echo";

export interface EPAFacility {
  registryId: string;
  facilityName: string;
  latitude: number;
  longitude: number;
  streetAddress: string;
  city: string;
  stateCode: string;
  zipCode: string;
  facilityType: string;
  naicsCodes: string[];
  sicCodes: string[];
  npdesPermitIds: string[];
  isMajorDischarger: boolean;
  complianceStatus: string;
  lastInspectionDate: string | null;
  violationsLast3Years: number;
}

export interface DischargePermit {
  permitId: string;
  registryId: string;
  permitType: string;
  issueDate: string | null;
  expirationDate: string | null;
  permittedFlowMgd: number | null;
  receivingWater: string;
  permitStatus: string;
  majorMinor: string;
}

export interface EPAViolation {
  registryId: string;
  facilityName: string;
  violationDate: string;
  violationType: string;
  pollutant: string;
  limitValue: number | null;
  actualValue: number | null;
  exceedancePercent: number | null;
  resolutionDate: string | null;
}

export interface WaterQualityData {
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  sampleDate: string;
  parameter: string;
  value: number;
  unit: string;
  detectionLimit: number | null;
}

export async function fetchFacilitiesByBoundingBox(
  west: number,
  south: number,
  east: number,
  north: number
): Promise<EPAFacility[]> {
  const url = `${EPA_ECHO_BASE}/cwa_rest_services.get_facilities?output=JSON&p_c1lat=${south}&p_c1lon=${west}&p_c2lat=${north}&p_c2lon=${east}&p_ptype=NPD`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAFacilitiesResponse;
  return parseFacilitiesResponse(data);
}

export async function fetchFacilitiesByState(stateCode: string): Promise<EPAFacility[]> {
  const url = `${EPA_ECHO_BASE}/cwa_rest_services.get_facilities?output=JSON&p_st=${stateCode}&p_ptype=NPD`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAFacilitiesResponse;
  return parseFacilitiesResponse(data);
}

export async function fetchFacilitiesByHuc(huc8: string): Promise<EPAFacility[]> {
  const url = `${EPA_ECHO_BASE}/cwa_rest_services.get_facilities?output=JSON&p_huc=${huc8}&p_ptype=NPD`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAFacilitiesResponse;
  return parseFacilitiesResponse(data);
}

export async function fetchFacilitiesByRadius(
  latitude: number,
  longitude: number,
  radiusMiles: number
): Promise<EPAFacility[]> {
  const url = `${EPA_ECHO_BASE}/cwa_rest_services.get_facilities?output=JSON&p_lat=${latitude}&p_long=${longitude}&p_radius=${radiusMiles}&p_ptype=NPD`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAFacilitiesResponse;
  return parseFacilitiesResponse(data);
}

export async function fetchFacilityDetail(registryId: string): Promise<EPAFacility | null> {
  const url = `${EPA_ECHO_BASE}/cwa_rest_services.get_facility_info?output=JSON&p_id=${registryId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAFacilityDetailResponse;

  if (!data.Results?.Facilities?.[0]) {
    return null;
  }

  return parseFacilityDetail(data.Results.Facilities[0]);
}

export async function fetchDischargePermits(registryId: string): Promise<DischargePermit[]> {
  const url = `${EPA_ECHO_BASE}/cwa_rest_services.get_permits?output=JSON&p_id=${registryId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAPermitsResponse;
  return parsePermitsResponse(data, registryId);
}

export async function fetchViolations(
  registryId: string,
  startDate?: string,
  endDate?: string
): Promise<EPAViolation[]> {
  let url = `${EPA_ECHO_BASE}/cwa_rest_services.get_cwa_eff_violations?output=JSON&p_id=${registryId}`;

  if (startDate) {
    url += `&p_date_from=${startDate}`;
  }
  if (endDate) {
    url += `&p_date_to=${endDate}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAViolationsResponse;
  return parseViolationsResponse(data);
}

export async function fetchViolationsByHuc(
  huc8: string,
  startDate?: string,
  endDate?: string
): Promise<EPAViolation[]> {
  let url = `${EPA_ECHO_BASE}/cwa_rest_services.get_cwa_eff_violations?output=JSON&p_huc=${huc8}`;

  if (startDate) {
    url += `&p_date_from=${startDate}`;
  }
  if (endDate) {
    url += `&p_date_to=${endDate}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAViolationsResponse;
  return parseViolationsResponse(data);
}

export async function fetchMajorDischargers(stateCode: string): Promise<EPAFacility[]> {
  const url = `${EPA_ECHO_BASE}/cwa_rest_services.get_facilities?output=JSON&p_st=${stateCode}&p_maj=Y&p_ptype=NPD`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAFacilitiesResponse;
  return parseFacilitiesResponse(data);
}

export async function fetchNonCompliantFacilities(stateCode: string): Promise<EPAFacility[]> {
  const url = `${EPA_ECHO_BASE}/cwa_rest_services.get_facilities?output=JSON&p_st=${stateCode}&p_qnc_status=V&p_ptype=NPD`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EPA ECHO API error: ${response.status}`);
  }

  const data = await response.json() as EPAFacilitiesResponse;
  return parseFacilitiesResponse(data);
}

export async function fetchWaterQualityStations(
  west: number,
  south: number,
  east: number,
  north: number
): Promise<WaterQualityData[]> {
  const bbox = `${west},${south},${east},${north}`;
  const url = `https://www.waterqualitydata.us/data/Result/search?bBox=${bbox}&mimeType=geojson&dataProfile=narrowResult&providers=NWIS&providers=STORET`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Water Quality Portal API error: ${response.status}`);
  }

  const data = await response.json() as WaterQualityResponse;
  return parseWaterQualityResponse(data);
}

interface EPAFacilitiesResponse {
  Results?: {
    Facilities?: Array<Record<string, unknown>>;
  };
}

interface EPAFacilityDetailResponse {
  Results?: {
    Facilities?: Array<Record<string, unknown>>;
  };
}

interface EPAPermitsResponse {
  Results?: {
    Permits?: Array<Record<string, unknown>>;
  };
}

interface EPAViolationsResponse {
  Results?: {
    Violations?: Array<Record<string, unknown>>;
  };
}

interface WaterQualityResponse {
  features?: Array<{
    properties: Record<string, unknown>;
    geometry?: {
      coordinates?: number[];
    };
  }>;
}

function parseFacilitiesResponse(data: EPAFacilitiesResponse): EPAFacility[] {
  if (!data.Results?.Facilities) {
    return [];
  }

  return data.Results.Facilities.map(f => ({
    registryId: String(f.RegistryId || f.FacilityId || ""),
    facilityName: String(f.FacilityName || f.Name || ""),
    latitude: parseFloat(String(f.Latitude || f.FacLat || 0)),
    longitude: parseFloat(String(f.Longitude || f.FacLong || 0)),
    streetAddress: String(f.StreetAddress || f.Address || ""),
    city: String(f.City || f.CityName || ""),
    stateCode: String(f.State || f.StateCode || ""),
    zipCode: String(f.Zip || f.ZipCode || ""),
    facilityType: String(f.FacilityType || f.SICDesc || ""),
    naicsCodes: parseCodeList(f.NAICSCodes || f.NAICS),
    sicCodes: parseCodeList(f.SICCodes || f.SIC),
    npdesPermitIds: parseCodeList(f.NPDESIds || f.SourceID),
    isMajorDischarger: f.CWAPermitStatus === "Major" || f.MajorFlag === "Y",
    complianceStatus: String(f.CWAComplianceStatus || f.ComplianceStatus || "Unknown"),
    lastInspectionDate: f.LastInspection ? String(f.LastInspection) : null,
    violationsLast3Years: parseInt(String(f.CWA3YrQtrStatus || f.Violations || 0)) || 0,
  }));
}

function parseFacilityDetail(f: Record<string, unknown>): EPAFacility {
  return {
    registryId: String(f.RegistryId || f.FacilityId || ""),
    facilityName: String(f.FacilityName || f.Name || ""),
    latitude: parseFloat(String(f.Latitude || f.FacLat || 0)),
    longitude: parseFloat(String(f.Longitude || f.FacLong || 0)),
    streetAddress: String(f.StreetAddress || f.Address || ""),
    city: String(f.City || f.CityName || ""),
    stateCode: String(f.State || f.StateCode || ""),
    zipCode: String(f.Zip || f.ZipCode || ""),
    facilityType: String(f.FacilityType || f.SICDesc || ""),
    naicsCodes: parseCodeList(f.NAICSCodes || f.NAICS),
    sicCodes: parseCodeList(f.SICCodes || f.SIC),
    npdesPermitIds: parseCodeList(f.NPDESIds || f.SourceID),
    isMajorDischarger: f.CWAPermitStatus === "Major" || f.MajorFlag === "Y",
    complianceStatus: String(f.CWAComplianceStatus || f.ComplianceStatus || "Unknown"),
    lastInspectionDate: f.LastInspection ? String(f.LastInspection) : null,
    violationsLast3Years: parseInt(String(f.CWA3YrQtrStatus || f.Violations || 0)) || 0,
  };
}

function parsePermitsResponse(data: EPAPermitsResponse, registryId: string): DischargePermit[] {
  if (!data.Results?.Permits) {
    return [];
  }

  return data.Results.Permits.map(p => ({
    permitId: String(p.SourceID || p.PermitNumber || ""),
    registryId: registryId,
    permitType: String(p.PermitType || p.PermitTypeDesc || ""),
    issueDate: p.IssueDate ? String(p.IssueDate) : null,
    expirationDate: p.ExpirationDate ? String(p.ExpirationDate) : null,
    permittedFlowMgd: p.DesignFlow ? parseFloat(String(p.DesignFlow)) : null,
    receivingWater: String(p.ReceivingWater || p.WaterBody || ""),
    permitStatus: String(p.PermitStatus || p.Status || ""),
    majorMinor: String(p.MajorMinor || p.MajorFlag || ""),
  }));
}

function parseViolationsResponse(data: EPAViolationsResponse): EPAViolation[] {
  if (!data.Results?.Violations) {
    return [];
  }

  return data.Results.Violations.map(v => ({
    registryId: String(v.RegistryId || v.FacilityId || ""),
    facilityName: String(v.FacilityName || v.Name || ""),
    violationDate: String(v.MonitoringPeriodEndDate || v.ViolationDate || ""),
    violationType: String(v.ViolationType || v.ViolationDesc || ""),
    pollutant: String(v.ParameterDesc || v.Pollutant || ""),
    limitValue: v.LimitValue ? parseFloat(String(v.LimitValue)) : null,
    actualValue: v.DMRValue ? parseFloat(String(v.DMRValue)) : null,
    exceedancePercent: v.ExceedancePercent ? parseFloat(String(v.ExceedancePercent)) : null,
    resolutionDate: v.ResolutionDate ? String(v.ResolutionDate) : null,
  }));
}

function parseWaterQualityResponse(data: WaterQualityResponse): WaterQualityData[] {
  if (!data.features) {
    return [];
  }

  return data.features.map(f => ({
    stationId: String(f.properties.MonitoringLocationIdentifier || ""),
    stationName: String(f.properties.MonitoringLocationName || ""),
    latitude: f.geometry?.coordinates?.[1] || 0,
    longitude: f.geometry?.coordinates?.[0] || 0,
    sampleDate: String(f.properties.ActivityStartDate || ""),
    parameter: String(f.properties.CharacteristicName || ""),
    value: parseFloat(String(f.properties.ResultMeasureValue || 0)),
    unit: String(f.properties.ResultMeasure_MeasureUnitCode || ""),
    detectionLimit: f.properties.DetectionQuantitationLimitMeasure_MeasureValue
      ? parseFloat(String(f.properties.DetectionQuantitationLimitMeasure_MeasureValue))
      : null,
  }));
}

function parseCodeList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}