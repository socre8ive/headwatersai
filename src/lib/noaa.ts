const NOAA_API_BASE = "https://api.weather.gov";

export interface WeatherPoint {
  gridId: string;
  gridX: number;
  gridY: number;
  forecastUrl: string;
  forecastHourlyUrl: string;
  radarStation: string;
  timeZone: string;
  county: string;
  state: string;
}

export interface Forecast {
  updated: string;
  periods: ForecastPeriod[];
}

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend: string | null;
  probabilityOfPrecipitation: number | null;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  icon: string;
}

export interface WeatherAlert {
  id: string;
  areaDesc: string;
  severity: string;
  certainty: string;
  urgency: string;
  event: string;
  headline: string;
  description: string;
  instruction: string | null;
  onset: string;
  expires: string;
  senderName: string;
}

export interface PrecipitationObservation {
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  observationTime: string;
  precipitationLastHour: number | null;
  precipitationLast3Hours: number | null;
  precipitationLast6Hours: number | null;
  precipitationLast24Hours: number | null;
  temperature: number | null;
  humidity: number | null;
}

export interface RadarStation {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  stationType: string;
}

export async function getWeatherPoint(latitude: number, longitude: number): Promise<WeatherPoint> {
  const url = `${NOAA_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "HeadwatersAI (contact@headwatersai.com)",
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`NOAA API error: ${response.status}`);
  }

  const data = await response.json() as NOAAPointResponse;
  const props = data.properties;

  return {
    gridId: props.gridId,
    gridX: props.gridX,
    gridY: props.gridY,
    forecastUrl: props.forecast,
    forecastHourlyUrl: props.forecastHourly,
    radarStation: props.radarStation,
    timeZone: props.timeZone,
    county: props.county?.split("/").pop() || "",
    state: props.relativeLocation?.properties?.state || "",
  };
}

export async function getForecast(latitude: number, longitude: number): Promise<Forecast> {
  const point = await getWeatherPoint(latitude, longitude);

  const response = await fetch(point.forecastUrl, {
    headers: {
      "User-Agent": "HeadwatersAI (contact@headwatersai.com)",
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`NOAA Forecast API error: ${response.status}`);
  }

  const data = await response.json() as NOAAForecastResponse;

  return {
    updated: data.properties.updated,
    periods: data.properties.periods.map(p => ({
      number: p.number,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime,
      isDaytime: p.isDaytime,
      temperature: p.temperature,
      temperatureUnit: p.temperatureUnit,
      temperatureTrend: p.temperatureTrend,
      probabilityOfPrecipitation: p.probabilityOfPrecipitation?.value ?? null,
      windSpeed: p.windSpeed,
      windDirection: p.windDirection,
      shortForecast: p.shortForecast,
      detailedForecast: p.detailedForecast,
      icon: p.icon,
    })),
  };
}

export async function getHourlyForecast(latitude: number, longitude: number): Promise<Forecast> {
  const point = await getWeatherPoint(latitude, longitude);

  const response = await fetch(point.forecastHourlyUrl, {
    headers: {
      "User-Agent": "HeadwatersAI (contact@headwatersai.com)",
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`NOAA Hourly Forecast API error: ${response.status}`);
  }

  const data = await response.json() as NOAAForecastResponse;

  return {
    updated: data.properties.updated,
    periods: data.properties.periods.map(p => ({
      number: p.number,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime,
      isDaytime: p.isDaytime,
      temperature: p.temperature,
      temperatureUnit: p.temperatureUnit,
      temperatureTrend: p.temperatureTrend,
      probabilityOfPrecipitation: p.probabilityOfPrecipitation?.value ?? null,
      windSpeed: p.windSpeed,
      windDirection: p.windDirection,
      shortForecast: p.shortForecast,
      detailedForecast: p.detailedForecast,
      icon: p.icon,
    })),
  };
}

export async function getActiveAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
  const url = `${NOAA_API_BASE}/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "HeadwatersAI (contact@headwatersai.com)",
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`NOAA Alerts API error: ${response.status}`);
  }

  const data = await response.json() as NOAAAlertsResponse;

  return data.features.map(f => ({
    id: f.properties.id,
    areaDesc: f.properties.areaDesc,
    severity: f.properties.severity,
    certainty: f.properties.certainty,
    urgency: f.properties.urgency,
    event: f.properties.event,
    headline: f.properties.headline || "",
    description: f.properties.description || "",
    instruction: f.properties.instruction,
    onset: f.properties.onset,
    expires: f.properties.expires,
    senderName: f.properties.senderName,
  }));
}

export async function getAlertsByState(stateCode: string): Promise<WeatherAlert[]> {
  const url = `${NOAA_API_BASE}/alerts/active?area=${stateCode}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "HeadwatersAI (contact@headwatersai.com)",
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`NOAA Alerts API error: ${response.status}`);
  }

  const data = await response.json() as NOAAAlertsResponse;

  return data.features.map(f => ({
    id: f.properties.id,
    areaDesc: f.properties.areaDesc,
    severity: f.properties.severity,
    certainty: f.properties.certainty,
    urgency: f.properties.urgency,
    event: f.properties.event,
    headline: f.properties.headline || "",
    description: f.properties.description || "",
    instruction: f.properties.instruction,
    onset: f.properties.onset,
    expires: f.properties.expires,
    senderName: f.properties.senderName,
  }));
}

export async function getFloodAlerts(stateCode?: string): Promise<WeatherAlert[]> {
  let url = `${NOAA_API_BASE}/alerts/active?event=Flood%20Warning,Flood%20Watch,Flash%20Flood%20Warning,Flash%20Flood%20Watch,Flood%20Advisory`;

  if (stateCode) {
    url += `&area=${stateCode}`;
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "HeadwatersAI (contact@headwatersai.com)",
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`NOAA Alerts API error: ${response.status}`);
  }

  const data = await response.json() as NOAAAlertsResponse;

  return data.features.map(f => ({
    id: f.properties.id,
    areaDesc: f.properties.areaDesc,
    severity: f.properties.severity,
    certainty: f.properties.certainty,
    urgency: f.properties.urgency,
    event: f.properties.event,
    headline: f.properties.headline || "",
    description: f.properties.description || "",
    instruction: f.properties.instruction,
    onset: f.properties.onset,
    expires: f.properties.expires,
    senderName: f.properties.senderName,
  }));
}

export async function getObservationStations(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<RadarStation[]> {
  const point = await getWeatherPoint(latitude, longitude);
  const url = `${NOAA_API_BASE}/gridpoints/${point.gridId}/${point.gridX},${point.gridY}/stations`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "HeadwatersAI (contact@headwatersai.com)",
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`NOAA Stations API error: ${response.status}`);
  }

  const data = await response.json() as NOAAStationsResponse;

  return data.features
    .filter(f => {
      const coords = f.geometry.coordinates;
      const dist = haversineDistance(latitude, longitude, coords[1], coords[0]);
      return dist <= radiusKm;
    })
    .map(f => ({
      stationId: f.properties.stationIdentifier,
      name: f.properties.name,
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
      elevation: f.properties.elevation?.value || 0,
      stationType: f.properties.stationType || "Unknown",
    }));
}

export async function getLatestObservation(stationId: string): Promise<PrecipitationObservation | null> {
  const url = `${NOAA_API_BASE}/stations/${stationId}/observations/latest`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "HeadwatersAI (contact@headwatersai.com)",
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`NOAA Observation API error: ${response.status}`);
  }

  const data = await response.json() as NOAAObservationResponse;
  const props = data.properties;
  const coords = data.geometry?.coordinates || [0, 0];

  return {
    stationId: stationId,
    stationName: props.station?.split("/").pop() || stationId,
    latitude: coords[1],
    longitude: coords[0],
    observationTime: props.timestamp,
    precipitationLastHour: props.precipitationLastHour?.value ?? null,
    precipitationLast3Hours: props.precipitationLast3Hours?.value ?? null,
    precipitationLast6Hours: props.precipitationLast6Hours?.value ?? null,
    precipitationLast24Hours: props.precipitationLast24Hours?.value ?? null,
    temperature: props.temperature?.value ?? null,
    humidity: props.relativeHumidity?.value ?? null,
  };
}

export async function getObservationsForArea(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<PrecipitationObservation[]> {
  const stations = await getObservationStations(latitude, longitude, radiusKm);
  const observations: PrecipitationObservation[] = [];

  for (const station of stations.slice(0, 10)) {
    try {
      const obs = await getLatestObservation(station.stationId);
      if (obs) {
        obs.stationName = station.name;
        obs.latitude = station.latitude;
        obs.longitude = station.longitude;
        observations.push(obs);
      }
    } catch {
      continue;
    }
  }

  return observations;
}

export async function getQuantitativePrecipitationForecast(
  latitude: number,
  longitude: number
): Promise<HourlyPrecipitation[]> {
  const point = await getWeatherPoint(latitude, longitude);
  const url = `${NOAA_API_BASE}/gridpoints/${point.gridId}/${point.gridX},${point.gridY}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "HeadwatersAI (contact@headwatersai.com)",
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(`NOAA Gridpoint API error: ${response.status}`);
  }

  const data = await response.json() as NOAAGridpointResponse;
  const qpf = data.properties.quantitativePrecipitation;

  if (!qpf?.values) {
    return [];
  }

  return qpf.values.map(v => ({
    validTime: v.validTime.split("/")[0],
    duration: v.validTime.split("/")[1] || "PT1H",
    precipitationMm: v.value ?? 0,
    precipitationIn: (v.value ?? 0) / 25.4,
  }));
}

export interface HourlyPrecipitation {
  validTime: string;
  duration: string;
  precipitationMm: number;
  precipitationIn: number;
}

interface NOAAPointResponse {
  properties: {
    gridId: string;
    gridX: number;
    gridY: number;
    forecast: string;
    forecastHourly: string;
    radarStation: string;
    timeZone: string;
    county: string;
    relativeLocation?: {
      properties?: {
        state?: string;
      };
    };
  };
}

interface NOAAForecastResponse {
  properties: {
    updated: string;
    periods: Array<{
      number: number;
      name: string;
      startTime: string;
      endTime: string;
      isDaytime: boolean;
      temperature: number;
      temperatureUnit: string;
      temperatureTrend: string | null;
      probabilityOfPrecipitation?: { value: number | null };
      windSpeed: string;
      windDirection: string;
      shortForecast: string;
      detailedForecast: string;
      icon: string;
    }>;
  };
}

interface NOAAAlertsResponse {
  features: Array<{
    properties: {
      id: string;
      areaDesc: string;
      severity: string;
      certainty: string;
      urgency: string;
      event: string;
      headline: string | null;
      description: string | null;
      instruction: string | null;
      onset: string;
      expires: string;
      senderName: string;
    };
  }>;
}

interface NOAAStationsResponse {
  features: Array<{
    properties: {
      stationIdentifier: string;
      name: string;
      elevation?: { value: number };
      stationType?: string;
    };
    geometry: {
      coordinates: number[];
    };
  }>;
}

interface NOAAObservationResponse {
  properties: {
    station?: string;
    timestamp: string;
    precipitationLastHour?: { value: number | null };
    precipitationLast3Hours?: { value: number | null };
    precipitationLast6Hours?: { value: number | null };
    precipitationLast24Hours?: { value: number | null };
    temperature?: { value: number | null };
    relativeHumidity?: { value: number | null };
  };
  geometry?: {
    coordinates: number[];
  };
}

interface NOAAGridpointResponse {
  properties: {
    quantitativePrecipitation?: {
      values: Array<{
        validTime: string;
        value: number | null;
      }>;
    };
  };
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}