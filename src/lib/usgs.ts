const USGS_WATER_SERVICES_BASE = "https://waterservices.usgs.gov/nwis";
const USGS_NHD_BASE = "https://hydro.nationalmap.gov/arcgis/rest/services";

export interface StreamGauge {
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  stateCode: string;
  countyName: string;
  drainageAreaSqMi: number | null;
  datumElevationFt: number | null;
  siteType: string;
}

export interface GaugeReading {
  siteId: string;
  timestamp: string;
  dischargeCfs: number | null;
  gageHeightFt: number | null;
  waterTempCelsius: number | null;
  dissolvedOxygenMgL: number | null;
  ph: number | null;
  specificConductance: number | null;
  turbidityNtu: number | null;
}

export interface WatershedBoundary {
  huc12: string;
  huc10: string;
  huc8: string;
  huc6: string;
  huc4: string;
  huc2: string;
  name: string;
  areaSqKm: number;
  states: string;
  centroidLat: number;
  centroidLng: number;
  boundaryGeoJson: object;
}

export async function fetchStreamGaugesBySite(siteIds: string[]): Promise<StreamGauge[]> {
  const sites = siteIds.join(",");
  const url = `${USGS_WATER_SERVICES_BASE}/site/?format=rdb&sites=${sites}&siteOutput=expanded&siteStatus=all`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const text = await response.text();
  return parseRdbSiteData(text);
}

export async function fetchStreamGaugesByBoundingBox(
  west: number,
  south: number,
  east: number,
  north: number
): Promise<StreamGauge[]> {
  const bbox = `${west},${south},${east},${north}`;
  const url = `${USGS_WATER_SERVICES_BASE}/site/?format=rdb&bBox=${bbox}&siteOutput=expanded&siteStatus=active&siteType=ST&hasDataTypeCd=iv`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const text = await response.text();
  return parseRdbSiteData(text);
}

export async function fetchStreamGaugesByState(stateCode: string): Promise<StreamGauge[]> {
  const url = `${USGS_WATER_SERVICES_BASE}/site/?format=rdb&stateCd=${stateCode}&siteOutput=expanded&siteStatus=active&siteType=ST&hasDataTypeCd=iv`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const text = await response.text();
  return parseRdbSiteData(text);
}

export async function fetchStreamGaugesByHuc(huc: string): Promise<StreamGauge[]> {
  const url = `${USGS_WATER_SERVICES_BASE}/site/?format=rdb&huc=${huc}&siteOutput=expanded&siteStatus=active&siteType=ST&hasDataTypeCd=iv`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const text = await response.text();
  return parseRdbSiteData(text);
}

export async function fetchInstantaneousValues(
  siteIds: string[],
  parameterCodes: string[] = ["00060", "00065", "00010"]
): Promise<GaugeReading[]> {
  const sites = siteIds.join(",");
  const params = parameterCodes.join(",");
  const url = `${USGS_WATER_SERVICES_BASE}/iv/?format=json&sites=${sites}&parameterCd=${params}&siteStatus=all`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const data = await response.json() as USGSInstantaneousResponse;
  return parseInstantaneousValues(data);
}

export async function fetchDailyValues(
  siteIds: string[],
  startDate: string,
  endDate: string,
  parameterCodes: string[] = ["00060", "00065"]
): Promise<GaugeReading[]> {
  const sites = siteIds.join(",");
  const params = parameterCodes.join(",");
  const url = `${USGS_WATER_SERVICES_BASE}/dv/?format=json&sites=${sites}&startDT=${startDate}&endDT=${endDate}&parameterCd=${params}&siteStatus=all`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const data = await response.json() as USGSInstantaneousResponse;
  return parseInstantaneousValues(data);
}

export async function fetchWatershedByPoint(
  latitude: number,
  longitude: number
): Promise<WatershedBoundary | null> {
  const url = `${USGS_NHD_BASE}/wbd/MapServer/6/query?geometry=${longitude},${latitude}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&f=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS NHD API error: ${response.status}`);
  }

  const data = await response.json() as NHDQueryResponse;

  if (!data.features || data.features.length === 0) {
    return null;
  }

  const feature = data.features[0];
  const props = feature.properties;

  return {
    huc12: props.huc12 || props.HUC12,
    huc10: (props.huc12 || props.HUC12).substring(0, 10),
    huc8: (props.huc12 || props.HUC12).substring(0, 8),
    huc6: (props.huc12 || props.HUC12).substring(0, 6),
    huc4: (props.huc12 || props.HUC12).substring(0, 4),
    huc2: (props.huc12 || props.HUC12).substring(0, 2),
    name: props.name || props.NAME,
    areaSqKm: props.areasqkm || props.AREASQKM || 0,
    states: props.states || props.STATES || "",
    centroidLat: latitude,
    centroidLng: longitude,
    boundaryGeoJson: feature.geometry,
  };
}

export async function fetchWatershedByHuc12(huc12: string): Promise<WatershedBoundary | null> {
  const url = `${USGS_NHD_BASE}/wbd/MapServer/6/query?where=HUC12='${huc12}'&outFields=*&returnGeometry=true&f=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS NHD API error: ${response.status}`);
  }

  const data = await response.json() as NHDQueryResponse;

  if (!data.features || data.features.length === 0) {
    return null;
  }

  const feature = data.features[0];
  const props = feature.properties;
  const centroid = calculateCentroid(feature.geometry);

  return {
    huc12: props.huc12 || props.HUC12,
    huc10: (props.huc12 || props.HUC12).substring(0, 10),
    huc8: (props.huc12 || props.HUC12).substring(0, 8),
    huc6: (props.huc12 || props.HUC12).substring(0, 6),
    huc4: (props.huc12 || props.HUC12).substring(0, 4),
    huc2: (props.huc12 || props.HUC12).substring(0, 2),
    name: props.name || props.NAME,
    areaSqKm: props.areasqkm || props.AREASQKM || 0,
    states: props.states || props.STATES || "",
    centroidLat: centroid.lat,
    centroidLng: centroid.lng,
    boundaryGeoJson: feature.geometry,
  };
}

export async function fetchUpstreamWatersheds(huc12: string): Promise<string[]> {
  const url = `${USGS_NHD_BASE}/wbd/MapServer/6/query?where=TOHUC='${huc12}'&outFields=HUC12&returnGeometry=false&f=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS NHD API error: ${response.status}`);
  }

  const data = await response.json() as { features: Array<{ attributes: { HUC12: string } }> };
  return data.features.map(f => f.attributes.HUC12);
}

export async function fetchFlowlines(
  west: number,
  south: number,
  east: number,
  north: number
): Promise<object> {
  const bbox = `${west},${south},${east},${north}`;
  const url = `${USGS_NHD_BASE}/nhd/MapServer/6/query?geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=GNIS_NAME,LENGTHKM,FCODE,STREAMORDE&returnGeometry=true&f=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS NHD API error: ${response.status}`);
  }

  return await response.json();
}

interface USGSInstantaneousResponse {
  value: {
    timeSeries: Array<{
      sourceInfo: {
        siteCode: Array<{ value: string }>;
      };
      variable: {
        variableCode: Array<{ value: string }>;
      };
      values: Array<{
        value: Array<{
          value: string;
          dateTime: string;
        }>;
      }>;
    }>;
  };
}

interface NHDQueryResponse {
  features: Array<{
    properties: Record<string, unknown>;
    geometry: object;
  }>;
}

function parseRdbSiteData(rdbText: string): StreamGauge[] {
  const lines = rdbText.split("\n");
  const gauges: StreamGauge[] = [];

  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#") || line === "") {
      continue;
    }

    if (headerIndex === -1) {
      headers = line.split("\t");
      headerIndex = i;
      continue;
    }

    if (line.match(/^[\d\-s]+$/)) {
      continue;
    }

    const values = line.split("\t");
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });

    if (row["site_no"]) {
      gauges.push({
        siteId: row["site_no"],
        siteName: row["station_nm"] || "",
        latitude: parseFloat(row["dec_lat_va"]) || 0,
        longitude: parseFloat(row["dec_long_va"]) || 0,
        stateCode: row["state_cd"] || "",
        countyName: row["county_nm"] || "",
        drainageAreaSqMi: row["drain_area_va"] ? parseFloat(row["drain_area_va"]) : null,
        datumElevationFt: row["alt_va"] ? parseFloat(row["alt_va"]) : null,
        siteType: row["site_tp_cd"] || "",
      });
    }
  }

  return gauges;
}

function parseInstantaneousValues(data: USGSInstantaneousResponse): GaugeReading[] {
  const readings: Map<string, GaugeReading> = new Map();

  if (!data.value?.timeSeries) {
    return [];
  }

  for (const series of data.value.timeSeries) {
    const siteId = series.sourceInfo.siteCode[0]?.value;
    const paramCode = series.variable.variableCode[0]?.value;

    if (!siteId || !series.values[0]?.value) {
      continue;
    }

    for (const point of series.values[0].value) {
      const key = `${siteId}_${point.dateTime}`;

      if (!readings.has(key)) {
        readings.set(key, {
          siteId,
          timestamp: point.dateTime,
          dischargeCfs: null,
          gageHeightFt: null,
          waterTempCelsius: null,
          dissolvedOxygenMgL: null,
          ph: null,
          specificConductance: null,
          turbidityNtu: null,
        });
      }

      const reading = readings.get(key)!;
      const value = parseFloat(point.value);

      if (isNaN(value)) continue;

      switch (paramCode) {
        case "00060":
          reading.dischargeCfs = value;
          break;
        case "00065":
          reading.gageHeightFt = value;
          break;
        case "00010":
          reading.waterTempCelsius = value;
          break;
        case "00300":
          reading.dissolvedOxygenMgL = value;
          break;
        case "00400":
          reading.ph = value;
          break;
        case "00095":
          reading.specificConductance = value;
          break;
        case "63680":
          reading.turbidityNtu = value;
          break;
      }
    }
  }

  return Array.from(readings.values());
}

function calculateCentroid(geometry: object): { lat: number; lng: number } {
  const geom = geometry as { type: string; coordinates: number[][][] | number[][][][] };
  let sumLat = 0;
  let sumLng = 0;
  let count = 0;

  function processCoords(coords: number[][]) {
    for (const coord of coords) {
      sumLng += coord[0];
      sumLat += coord[1];
      count++;
    }
  }

  if (geom.type === "Polygon") {
    processCoords(geom.coordinates[0] as number[][]);
  } else if (geom.type === "MultiPolygon") {
    for (const polygon of geom.coordinates) {
      processCoords((polygon as number[][][])[0]);
    }
  }

  return {
    lat: count > 0 ? sumLat / count : 0,
    lng: count > 0 ? sumLng / count : 0,
  };
}