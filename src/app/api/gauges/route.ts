import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/cloudflare";
import {
  fetchStreamGaugesByBoundingBox,
  fetchStreamGaugesByHuc,
  fetchInstantaneousValues,
} from "@/lib/usgs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const huc = searchParams.get("huc");
    const west = searchParams.get("west");
    const south = searchParams.get("south");
    const east = searchParams.get("east");
    const north = searchParams.get("north");
    const includeReadings = searchParams.get("readings") === "true";

    let gauges;

    if (huc) {
      gauges = await fetchStreamGaugesByHuc(huc);
    } else if (west && south && east && north) {
      const bbox = {
        west: parseFloat(west),
        south: parseFloat(south),
        east: parseFloat(east),
        north: parseFloat(north),
      };

      if (Object.values(bbox).some(isNaN)) {
        return NextResponse.json(
          { error: "Invalid bounding box coordinates" },
          { status: 400 }
        );
      }

      gauges = await fetchStreamGaugesByBoundingBox(
        bbox.west,
        bbox.south,
        bbox.east,
        bbox.north
      );
    } else {
      return NextResponse.json(
        { error: "Either huc code or bounding box (west, south, east, north) is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    for (const gauge of gauges) {
      await db
        .prepare(
          `INSERT OR REPLACE INTO stream_gauges
           (site_id, site_name, latitude, longitude, state_code, county,
            drainage_area_sq_mi, datum_elevation_ft, site_type, active, cached_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
        )
        .bind(
          gauge.siteId,
          gauge.siteName,
          gauge.latitude,
          gauge.longitude,
          gauge.stateCode,
          gauge.countyName,
          gauge.drainageAreaSqMi,
          gauge.datumElevationFt,
          gauge.siteType
        )
        .run();
    }

    let readings: Record<string, object> = {};

    if (includeReadings && gauges.length > 0) {
      const siteIds = gauges.slice(0, 100).map((g) => g.siteId);
      const readingsData = await fetchInstantaneousValues(siteIds);

      for (const reading of readingsData) {
        readings[reading.siteId] = {
          timestamp: reading.timestamp,
          dischargeCfs: reading.dischargeCfs,
          gageHeightFt: reading.gageHeightFt,
          waterTempCelsius: reading.waterTempCelsius,
        };

        await db
          .prepare(
            `INSERT OR REPLACE INTO gauge_readings
             (id, site_id, timestamp, discharge_cfs, gage_height_ft, water_temp_celsius, cached_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
          )
          .bind(
            `${reading.siteId}_${reading.timestamp}`,
            reading.siteId,
            reading.timestamp,
            reading.dischargeCfs,
            reading.gageHeightFt,
            reading.waterTempCelsius
          )
          .run();
      }
    }

    return NextResponse.json({
      success: true,
      count: gauges.length,
      gauges: gauges.map((g) => ({
        siteId: g.siteId,
        siteName: g.siteName,
        latitude: g.latitude,
        longitude: g.longitude,
        stateCode: g.stateCode,
        county: g.countyName,
        drainageAreaSqMi: g.drainageAreaSqMi,
        datumElevationFt: g.datumElevationFt,
        siteType: g.siteType,
        latestReading: readings[g.siteId] || null,
      })),
    });
  } catch (error) {
    console.error("Gauges API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gauge data" },
      { status: 500 }
    );
  }
}