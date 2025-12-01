"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import SearchBox from "@/components/SearchBox";
import WatershedInfo from "@/components/WatershedInfo";
import GaugeList from "@/components/GaugeList";
import FacilityList from "@/components/FacilityList";
import WeatherPanel from "@/components/WeatherPanel";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
});

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
  centroid: { lat: number; lng: number };
  boundary: object;
  upstreamHuc12s: string[];
}

interface GaugeData {
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

interface FacilityData {
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

interface WeatherData {
  forecast?: {
    updated: string;
    periods: Array<{
      number: number;
      name: string;
      startTime: string;
      endTime: string;
      isDaytime: boolean;
      temperature: number;
      temperatureUnit: string;
      probabilityOfPrecipitation: number | null;
      windSpeed: string;
      windDirection: string;
      shortForecast: string;
      detailedForecast: string;
      icon: string;
    }>;
  };
  alerts?: Array<{
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
  }>;
}

export default function ExplorePage() {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);
  const [watershed, setWatershed] = useState<WatershedData | null>(null);
  const [gauges, setGauges] = useState<GaugeData[]>([]);
  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [flowlines, setFlowlines] = useState<GeoJSON.FeatureCollection | null>(null);

  const [isLoadingWatershed, setIsLoadingWatershed] = useState(false);
  const [isLoadingGauges, setIsLoadingGauges] = useState(false);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const [activePanel, setActivePanel] = useState<"watershed" | "gauges" | "facilities" | "weather">(
    "watershed"
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchWatershedData = useCallback(async (lat: number, lng: number) => {
    setIsLoadingWatershed(true);
    try {
      const response = await fetch(`/api/watershed?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json() as { watershed: any };
        setWatershed(data.watershed);
        return data.watershed;
      }
    } catch (error) {
      console.error("Failed to fetch watershed:", error);
    } finally {
      setIsLoadingWatershed(false);
    }
    return null;
  }, []);

  const fetchGaugesData = useCallback(async (huc8: string) => {
    setIsLoadingGauges(true);
    try {
      const response = await fetch(`/api/gauges?huc=${huc8}&readings=true`);
      if (response.ok) {
        const data = await response.json() as { gauges: any[] };
        setGauges(data.gauges);
      }
    } catch (error) {
      console.error("Failed to fetch gauges:", error);
    } finally {
      setIsLoadingGauges(false);
    }
  }, []);

  const fetchFacilitiesData = useCallback(async (huc8: string) => {
    setIsLoadingFacilities(true);
    try {
      const response = await fetch(`/api/facilities?huc8=${huc8}`);
      if (response.ok) {
        const data = await response.json() as { facilities: any[] };
        setFacilities(data.facilities);
      }
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
    } finally {
      setIsLoadingFacilities(false);
    }
  }, []);

  const fetchWeatherData = useCallback(async (lat: number, lng: number) => {
    setIsLoadingWeather(true);
    try {
      const [forecastRes, alertsRes] = await Promise.all([
        fetch(`/api/weather?lat=${lat}&lng=${lng}&type=forecast`),
        fetch(`/api/weather?lat=${lat}&lng=${lng}&type=alerts`),
      ]);

      const weatherData: WeatherData = {};

      if (forecastRes.ok) {
        const forecastData = await forecastRes.json() as { forecast: any };
        weatherData.forecast = forecastData.forecast;
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json() as { alerts: any[] };
        weatherData.alerts = alertsData.alerts;
      }

      setWeather(weatherData);
    } catch (error) {
      console.error("Failed to fetch weather:", error);
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  const fetchFlowlines = useCallback(async (lat: number, lng: number) => {
    try {
      const delta = 0.15;
      const response = await fetch(
        `/api/flowlines?west=${lng - delta}&south=${lat - delta}&east=${lng + delta}&north=${lat + delta}`
      );
      if (response.ok) {
        const data = await response.json() as { flowlines: GeoJSON.FeatureCollection };
        setFlowlines(data.flowlines);
      }
    } catch (error) {
      console.error("Failed to fetch flowlines:", error);
    }
  }, []);

  const handleLocationSelect = useCallback(
    async (lat: number, lng: number, name?: string) => {
      setSelectedLocation({ lat, lng, name });

      const watershedData = await fetchWatershedData(lat, lng);

      if (watershedData?.huc8) {
        fetchGaugesData(watershedData.huc8);
        fetchFacilitiesData(watershedData.huc8);
      }

      fetchWeatherData(lat, lng);
      fetchFlowlines(lat, lng);
    },
    [fetchWatershedData, fetchGaugesData, fetchFacilitiesData, fetchWeatherData, fetchFlowlines]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      handleLocationSelect(lat, lng);
    },
    [handleLocationSelect]
  );

  const handleSearchSelect = useCallback(
    (lat: number, lng: number, placeName: string) => {
      handleLocationSelect(lat, lng, placeName);
    },
    [handleLocationSelect]
  );

  const panelTabs = [
    { id: "watershed" as const, label: "Watershed", count: null },
    { id: "gauges" as const, label: "Gauges", count: gauges.length },
    { id: "facilities" as const, label: "Facilities", count: facilities.length },
    { id: "weather" as const, label: "Weather", count: weather?.alerts?.length || null },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div
        className={`${
          sidebarOpen ? "w-96" : "w-0"
        } transition-all duration-300 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden`}
      >
        <div className="p-4 bg-white border-b border-gray-200">
          <SearchBox
            onSelectLocation={handleSearchSelect}
            placeholder="Search for an address or place..."
          />
          {selectedLocation?.name && (
            <p className="mt-2 text-sm text-gray-600 truncate">
              📍 {selectedLocation.name}
            </p>
          )}
        </div>

        <div className="flex border-b border-gray-200 bg-white">
          {panelTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors relative ${
                activePanel === tab.id
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  {tab.count}
                </span>
              )}
              {activePanel === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activePanel === "watershed" && (
            <WatershedInfo watershed={watershed} isLoading={isLoadingWatershed} />
          )}
          {activePanel === "gauges" && (
            <GaugeList
              gauges={gauges}
              isLoading={isLoadingGauges}
              onSelectGauge={(gauge) => {
                setSelectedLocation({
                  lat: gauge.latitude,
                  lng: gauge.longitude,
                  name: gauge.siteName,
                });
              }}
            />
          )}
          {activePanel === "facilities" && (
            <FacilityList
              facilities={facilities}
              isLoading={isLoadingFacilities}
              onSelectFacility={(facility) => {
                setSelectedLocation({
                  lat: facility.latitude,
                  lng: facility.longitude,
                  name: facility.facilityName,
                });
              }}
            />
          )}
          {activePanel === "weather" && (
            <WeatherPanel weather={weather} isLoading={isLoadingWeather} />
          )}
        </div>
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-lg p-2 shadow-md hover:bg-gray-50 transition-colors"
        style={{ left: sidebarOpen ? "384px" : "0" }}
      >
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${
            sidebarOpen ? "" : "rotate-180"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div className="flex-1 relative">
        <Map
          initialCenter={[-105.2705, 40.015]}
          initialZoom={10}
          onMapClick={handleMapClick}
          watershedBoundary={watershed?.boundary as GeoJSON.Geometry | undefined}
          flowlines={flowlines}
          gauges={gauges.map((g) => ({
            siteId: g.siteId,
            siteName: g.siteName,
            latitude: g.latitude,
            longitude: g.longitude,
            dischargeCfs: g.latestReading?.dischargeCfs,
            gageHeightFt: g.latestReading?.gageHeightFt,
          }))}
          facilities={facilities.map((f) => ({
            registryId: f.registryId,
            facilityName: f.facilityName,
            latitude: f.latitude,
            longitude: f.longitude,
            isMajorDischarger: f.isMajorDischarger,
            complianceStatus: f.complianceStatus,
          }))}
          selectedLocation={selectedLocation}
        />

        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs text-gray-600">
          <p className="font-semibold mb-1">Map Legend</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-700"></div>
              <span>Stream Gauge</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500 border-2 border-yellow-700"></div>
              <span>EPA Facility</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500 border-2 border-red-700"></div>
              <span>Violation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-30 border border-blue-600"></div>
              <span>Watershed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}