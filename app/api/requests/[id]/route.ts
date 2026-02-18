import { NextResponse } from "next/server";
import { getSession, canApproveRequests } from "@/lib/auth";
import { updateRequest, getRequestById } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || !canApproveRequests(user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, note } = body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "Gecersiz durum." },
      { status: 400 }
    );
  }

  const existing = await getRequestById(id);
  if (!existing) {
    return NextResponse.json(
      { error: "Talep bulunamadi." },
      { status: 404 }
    );
  }

  const updated = await updateRequest(id, {
    status,
    responderId: user.id,
    responderName: user.name,
    responderNote: note || null,
    respondedAt: new Date().toISOString(),
  });

  return NextResponse.json({ request: updated });
}
