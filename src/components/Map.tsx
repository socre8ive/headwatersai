"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  onMapLoad?: (map: mapboxgl.Map) => void;
  watershedBoundary?: GeoJSON.Geometry | null;
  flowlines?: GeoJSON.FeatureCollection | null;
  gauges?: Array<{
    siteId: string;
    siteName: string;
    latitude: number;
    longitude: number;
    dischargeCfs?: number | null;
    gageHeightFt?: number | null;
  }>;
  facilities?: Array<{
    registryId: string;
    facilityName: string;
    latitude: number;
    longitude: number;
    isMajorDischarger: boolean;
    complianceStatus: string;
  }>;
  selectedLocation?: { lat: number; lng: number } | null;
}

export default function Map({
  initialCenter = [-105.2705, 40.015],
  initialZoom = 10,
  onMapClick,
  onMapLoad,
  watershedBoundary,
  flowlines,
  gauges,
  facilities,
  selectedLocation,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: initialCenter,
      zoom: initialZoom,
      pitch: 45,
      bearing: 0,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      if (!map.current) return;

      map.current.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });

      map.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

      map.current.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      });

      setMapLoaded(true);
      if (onMapLoad) {
        onMapLoad(map.current);
      }
    });

    map.current.on("click", (e) => {
      if (onMapClick) {
        onMapClick(e.lngLat.lat, e.lngLat.lng);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (map.current.getLayer("watershed-fill")) {
      map.current.removeLayer("watershed-fill");
    }
    if (map.current.getLayer("watershed-outline")) {
      map.current.removeLayer("watershed-outline");
    }
    if (map.current.getSource("watershed")) {
      map.current.removeSource("watershed");
    }

    if (watershedBoundary) {
      map.current.addSource("watershed", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: watershedBoundary,
        },
      });

      map.current.addLayer({
        id: "watershed-fill",
        type: "fill",
        source: "watershed",
        paint: {
          "fill-color": "#0080ff",
          "fill-opacity": 0.15,
        },
      });

      map.current.addLayer({
        id: "watershed-outline",
        type: "line",
        source: "watershed",
        paint: {
          "line-color": "#0066cc",
          "line-width": 3,
        },
      });
    }
  }, [watershedBoundary, mapLoaded]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (map.current.getLayer("flowlines-layer")) {
      map.current.removeLayer("flowlines-layer");
    }
    if (map.current.getSource("flowlines")) {
      map.current.removeSource("flowlines");
    }

    if (flowlines) {
      map.current.addSource("flowlines", {
        type: "geojson",
        data: flowlines,
      });

      map.current.addLayer({
        id: "flowlines-layer",
        type: "line",
        source: "flowlines",
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "STREAMORDE"], 1],
            1, "#a6cee3",
            2, "#6baed6",
            3, "#3182bd",
            4, "#08519c",
            5, "#08306b",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "STREAMORDE"], 1],
            1, 1,
            2, 1.5,
            3, 2,
            4, 3,
            5, 4,
          ],
        },
      });
    }
  }, [flowlines, mapLoaded]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    clearMarkers();

    if (gauges) {
      gauges.forEach((gauge) => {
        const el = document.createElement("div");
        el.className = "gauge-marker";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#22c55e";
        el.style.border = "3px solid #15803d";
        el.style.cursor = "pointer";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">${gauge.siteName}</h3>
            <p style="margin: 0 0 4px; font-size: 12px; color: #666;">Site ID: ${gauge.siteId}</p>
            ${gauge.dischargeCfs !== null && gauge.dischargeCfs !== undefined
              ? `<p style="margin: 0 0 4px; font-size: 13px;"><strong>Discharge:</strong> ${gauge.dischargeCfs.toLocaleString()} cfs</p>`
              : ""
            }
            ${gauge.gageHeightFt !== null && gauge.gageHeightFt !== undefined
              ? `<p style="margin: 0; font-size: 13px;"><strong>Gage Height:</strong> ${gauge.gageHeightFt.toFixed(2)} ft</p>`
              : ""
            }
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([gauge.longitude, gauge.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }

    if (facilities) {
      facilities.forEach((facility) => {
        const el = document.createElement("div");
        el.className = "facility-marker";
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "4px";
        el.style.cursor = "pointer";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

        if (facility.complianceStatus === "Violation") {
          el.style.backgroundColor = "#ef4444";
          el.style.border = "3px solid #b91c1c";
        } else if (facility.isMajorDischarger) {
          el.style.backgroundColor = "#f97316";
          el.style.border = "3px solid #c2410c";
        } else {
          el.style.backgroundColor = "#eab308";
          el.style.border = "3px solid #a16207";
        }

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; max-width: 280px;">
            <h3 style="margin: 0 0 8px; font-weight: 600; font-size: 14px;">${facility.facilityName}</h3>
            <p style="margin: 0 0 4px; font-size: 12px; color: #666;">Registry ID: ${facility.registryId}</p>
            <p style="margin: 0 0 4px; font-size: 13px;">
              <strong>Status:</strong>
              <span style="color: ${facility.complianceStatus === "Violation" ? "#ef4444" : "#22c55e"}">
                ${facility.complianceStatus}
              </span>
            </p>
            ${facility.isMajorDischarger
              ? `<p style="margin: 0; font-size: 12px; color: #f97316; font-weight: 500;">⚠️ Major Discharger</p>`
              : ""
            }
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([facility.longitude, facility.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }
  }, [gauges, facilities, mapLoaded, clearMarkers]);

  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedLocation) return;

    map.current.flyTo({
      center: [selectedLocation.lng, selectedLocation.lat],
      zoom: 12,
      pitch: 45,
      duration: 2000,
    });
  }, [selectedLocation, mapLoaded]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: "500px" }}
    />
  );
}