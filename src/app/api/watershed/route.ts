import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/cloudflare";
import { fetchWatershedByPoint, fetchWatershedByHuc12, fetchUpstreamWatersheds } from "@/lib/usgs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const huc12 = searchParams.get("huc12");

    if (!lat && !lng && !huc12) {
      return NextResponse.json(
        { error: "Either lat/lng coordinates or huc12 code is required" },
        { status: 400 }
      );
    }

    let watershed;

    if (huc12) {
      watershed = await fetchWatershedByHuc12(huc12);
    } else if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: "Invalid coordinates" },
          { status: 400 }
        );
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: "Coordinates out of range" },
          { status: 400 }
        );
      }

      watershed = await fetchWatershedByPoint(latitude, longitude);
    }

    if (!watershed) {
      return NextResponse.json(
        { error: "No watershed found for the given location" },
        { status: 404 }
      );
    }

    const upstreamHucs = await fetchUpstreamWatersheds(watershed.huc12);

    const db = await getDB();
    await db
      .prepare(
        `INSERT OR REPLACE INTO watersheds
         (huc12, huc10, huc8, huc6, huc4, huc2, name, area_sq_km, states,
          centroid_lat, centroid_lng, boundary_geojson, upstream_huc12s, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        watershed.huc12,
        watershed.huc10,
        watershed.huc8,
        watershed.huc6,
        watershed.huc4,
        watershed.huc2,
        watershed.name,
        watershed.areaSqKm,
        watershed.states,
        watershed.centroidLat,
        watershed.centroidLng,
        JSON.stringify(watershed.boundaryGeoJson),
        JSON.stringify(upstreamHucs)
      )
      .run();

    return NextResponse.json({
      success: true,
      watershed: {
        huc12: watershed.huc12,
        huc10: watershed.huc10,
        huc8: watershed.huc8,
        huc6: watershed.huc6,
        huc4: watershed.huc4,
        huc2: watershed.huc2,
        name: watershed.name,
        areaSqKm: watershed.areaSqKm,
        states: watershed.states,
        centroid: {
          lat: watershed.centroidLat,
          lng: watershed.centroidLng,
        },
        boundary: watershed.boundaryGeoJson,
        upstreamHuc12s: upstreamHucs,
      },
    });
  } catch (error) {
    console.error("Watershed API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch watershed data" },
      { status: 500 }
    );
  }
}