import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth"; // verifyAuth yerine getSession eklendi
import { getApprovedDocumentsForUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  // getSession() Next.js cookie'lerini otomatik okur, req parametresine ihtiyacı yoktur
  const user = await getSession();

  // Eğer kullanıcı yoksa (oturum kapalıysa veya geçersizse) 401 dön
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get approved access requests for this user
    // authResult.user.id yerine doğrudan user.id kullanıyoruz
    const approvedDocuments = await getApprovedDocumentsForUser(user.id);

    return NextResponse.json({ documents: approvedDocuments });
  } catch (error) {
    console.error("[v0] Error fetching my documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}