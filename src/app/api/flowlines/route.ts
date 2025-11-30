import { NextRequest, NextResponse } from "next/server";
import { fetchFlowlines } from "@/lib/usgs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const west = searchParams.get("west");
    const south = searchParams.get("south");
    const east = searchParams.get("east");
    const north = searchParams.get("north");

    if (!west || !south || !east || !north) {
      return NextResponse.json(
        { error: "Bounding box (west, south, east, north) is required" },
        { status: 400 }
      );
    }

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

    const bboxWidth = Math.abs(bbox.east - bbox.west);
    const bboxHeight = Math.abs(bbox.north - bbox.south);

    if (bboxWidth > 2 || bboxHeight > 2) {
      return NextResponse.json(
        { error: "Bounding box too large. Maximum 2 degrees width and height." },
        { status: 400 }
      );
    }

    const flowlines = await fetchFlowlines(
      bbox.west,
      bbox.south,
      bbox.east,
      bbox.north
    );

    return NextResponse.json({
      success: true,
      bounds: bbox,
      flowlines,
    });
  } catch (error) {
    console.error("Flowlines API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch flowlines data" },
      { status: 500 }
    );
  }
}