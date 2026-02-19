import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getApprovedDocumentsForUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (!authResult.valid || !authResult.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get approved access requests for this user
    const approvedDocuments = await getApprovedDocumentsForUser(authResult.user.id);
    
    return NextResponse.json({ documents: approvedDocuments });
  } catch (error) {
    console.error("[v0] Error fetching my documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
