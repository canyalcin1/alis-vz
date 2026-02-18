import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDocuments } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const docs = await getDocuments();
  return NextResponse.json({ documents: docs });
}
