import { NextRequest, NextResponse } from "next/server";
import {
  getForecast,
  getHourlyForecast,
  getActiveAlerts,
  getQuantitativePrecipitationForecast,
  getObservationsForArea,
} from "@/lib/noaa";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const type = searchParams.get("type") || "forecast";

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    if (latitude < 24 || latitude > 50 || longitude < -125 || longitude > -66) {
      return NextResponse.json(
        { error: "Coordinates must be within the continental United States" },
        { status: 400 }
      );
    }

    let data;

    switch (type) {
      case "forecast":
        data = await getForecast(latitude, longitude);
        return NextResponse.json({
          success: true,
          type: "forecast",
          location: { lat: latitude, lng: longitude },
          forecast: data,
        });

      case "hourly":
        data = await getHourlyForecast(latitude, longitude);
        return NextResponse.json({
          success: true,
          type: "hourly",
          location: { lat: latitude, lng: longitude },
          forecast: data,
        });

      case "alerts":
        data = await getActiveAlerts(latitude, longitude);
        return NextResponse.json({
          success: true,
          type: "alerts",
          location: { lat: latitude, lng: longitude },
          alertCount: data.length,
          alerts: data,
        });

      case "precipitation":
        data = await getQuantitativePrecipitationForecast(latitude, longitude);
        return NextResponse.json({
          success: true,
          type: "precipitation",
          location: { lat: latitude, lng: longitude },
          precipitationForecast: data,
        });

      case "observations":
        const radiusKm = searchParams.get("radius")
          ? parseFloat(searchParams.get("radius")!)
          : 50;
        data = await getObservationsForArea(latitude, longitude, radiusKm);
        return NextResponse.json({
          success: true,
          type: "observations",
          location: { lat: latitude, lng: longitude },
          radiusKm,
          stationCount: data.length,
          observations: data,
        });

      case "all":
        const [forecast, hourly, alerts, precipitation, observations] = await Promise.all([
          getForecast(latitude, longitude),
          getHourlyForecast(latitude, longitude),
          getActiveAlerts(latitude, longitude),
          getQuantitativePrecipitationForecast(latitude, longitude),
          getObservationsForArea(latitude, longitude, 50),
        ]);

        return NextResponse.json({
          success: true,
          type: "all",
          location: { lat: latitude, lng: longitude },
          forecast,
          hourlyForecast: hourly,
          alerts,
          precipitationForecast: precipitation,
          observations,
        });

      default:
        return NextResponse.json(
          { error: "Invalid type. Must be: forecast, hourly, alerts, precipitation, observations, or all" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}