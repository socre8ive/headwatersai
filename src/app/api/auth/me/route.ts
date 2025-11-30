import { NextResponse } from "next/server";
import { getDB } from "@/lib/cloudflare";
import { validateSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const db = await getDB();
    const result = await validateSession(db, sessionId);

    if (!result) {
      cookieStore.set("session_id", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });

      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        subscriptionTier: result.user.subscriptionTier,
        createdAt: result.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}