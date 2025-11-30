import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/cloudflare";
import {
  fetchFacilitiesByBoundingBox,
  fetchFacilitiesByHuc,
  fetchFacilitiesByRadius,
} from "@/lib/epa";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const huc8 = searchParams.get("huc8");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius");
    const west = searchParams.get("west");
    const south = searchParams.get("south");
    const east = searchParams.get("east");
    const north = searchParams.get("north");

    let facilities;

    if (huc8) {
      facilities = await fetchFacilitiesByHuc(huc8);
    } else if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusMiles = radius ? parseFloat(radius) : 25;

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: "Invalid coordinates" },
          { status: 400 }
        );
      }

      facilities = await fetchFacilitiesByRadius(latitude, longitude, radiusMiles);
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

      facilities = await fetchFacilitiesByBoundingBox(
        bbox.west,
        bbox.south,
        bbox.east,
        bbox.north
      );
    } else {
      return NextResponse.json(
        { error: "Either huc8, lat/lng with optional radius, or bounding box is required" },
        { status: 400 }
      );
    }

    const db = await getDB();

    for (const facility of facilities) {
      await db
        .prepare(
          `INSERT OR REPLACE INTO epa_facilities
           (registry_id, facility_name, latitude, longitude, street_address, city,
            state_code, zip_code, facility_type, naics_codes, sic_codes, npdes_permit_ids,
            is_major_discharger, compliance_status, last_inspection_date,
            violations_last_3_years, cached_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        )
        .bind(
          facility.registryId,
          facility.facilityName,
          facility.latitude,
          facility.longitude,
          facility.streetAddress,
          facility.city,
          facility.stateCode,
          facility.zipCode,
          facility.facilityType,
          JSON.stringify(facility.naicsCodes),
          JSON.stringify(facility.sicCodes),
          JSON.stringify(facility.npdesPermitIds),
          facility.isMajorDischarger ? 1 : 0,
          facility.complianceStatus,
          facility.lastInspectionDate,
          facility.violationsLast3Years
        )
        .run();
    }

    return NextResponse.json({
      success: true,
      count: facilities.length,
      facilities: facilities.map((f) => ({
        registryId: f.registryId,
        facilityName: f.facilityName,
        latitude: f.latitude,
        longitude: f.longitude,
        address: {
          street: f.streetAddress,
          city: f.city,
          state: f.stateCode,
          zip: f.zipCode,
        },
        facilityType: f.facilityType,
        naicsCodes: f.naicsCodes,
        sicCodes: f.sicCodes,
        npdesPermitIds: f.npdesPermitIds,
        isMajorDischarger: f.isMajorDischarger,
        complianceStatus: f.complianceStatus,
        lastInspectionDate: f.lastInspectionDate,
        violationsLast3Years: f.violationsLast3Years,
      })),
    });
  } catch (error) {
    console.error("Facilities API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch facility data" },
      { status: 500 }
    );
  }
}