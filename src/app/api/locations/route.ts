import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/cloudflare";
import { validateSession } from "@/lib/auth";
import { generateId, getCurrentTimestamp } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const db = await getDB();
    const session = await validateSession(db, sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const locations = await db
      .prepare(
        `SELECT id, name, latitude, longitude, watershed_huc12, address, notes, created_at
         FROM saved_locations
         WHERE user_id = ?
         ORDER BY created_at DESC`
      )
      .bind(session.user.id)
      .all() as {
        results: {
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          watershed_huc12: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
        }[];
      };

    return NextResponse.json({
      success: true,
      count: locations.results.length,
      locations: locations.results.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        watershedHuc12: loc.watershed_huc12,
        address: loc.address,
        notes: loc.notes,
        createdAt: loc.created_at,
      })),
    });
  } catch (error) {
    console.error("Locations GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const db = await getDB();
    const session = await validateSession(db, sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      name?: string;
      latitude?: number;
      longitude?: number;
      watershedHuc12?: string;
      address?: string;
      notes?: string;
    };
    const { name, latitude, longitude, watershedHuc12, address, notes } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Name, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Latitude and longitude must be numbers" },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Coordinates out of range" },
        { status: 400 }
      );
    }

    const locationCount = await db
      .prepare("SELECT COUNT(*) as count FROM saved_locations WHERE user_id = ?")
      .bind(session.user.id)
      .first() as { count: number } | null;

    const maxLocations =
      session.user.subscriptionTier === "free"
        ? 3
        : session.user.subscriptionTier === "enthusiast"
        ? 10
        : 100;

    if (locationCount && locationCount.count >= maxLocations) {
      return NextResponse.json(
        {
          error: `Location limit reached. Your plan allows ${maxLocations} saved locations.`,
        },
        { status: 403 }
      );
    }

    const locationId = generateId();
    const now = getCurrentTimestamp();

    await db
      .prepare(
        `INSERT INTO saved_locations
         (id, user_id, name, latitude, longitude, watershed_huc12, address, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        locationId,
        session.user.id,
        name,
        latitude,
        longitude,
        watershedHuc12 || null,
        address || null,
        notes || null,
        now
      )
      .run();

    return NextResponse.json({
      success: true,
      location: {
        id: locationId,
        name,
        latitude,
        longitude,
        watershedHuc12: watershedHuc12 || null,
        address: address || null,
        notes: notes || null,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Locations POST error:", error);
    return NextResponse.json(
      { error: "Failed to save location" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const db = await getDB();
    const session = await validateSession(db, sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("id");

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    const existing = await db
      .prepare("SELECT id FROM saved_locations WHERE id = ? AND user_id = ?")
      .bind(locationId, session.user.id)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    await db
      .prepare("DELETE FROM saved_locations WHERE id = ? AND user_id = ?")
      .bind(locationId, session.user.id)
      .run();

    return NextResponse.json({
      success: true,
      message: "Location deleted",
    });
  } catch (error) {
    console.error("Locations DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}