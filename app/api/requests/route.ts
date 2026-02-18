import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSession } from "@/lib/auth";
import { getRequests, createRequest, getDocumentById } from "@/lib/db";
import type { AccessRequest } from "@/lib/types";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const allRequests = await getRequests();

  // lab_member can only see their own requests
  if (user.role === "lab_member") {
    return NextResponse.json({
      requests: allRequests.filter((r) => r.requesterId === user.id),
    });
  }

  // admin and analiz_member can see all
  return NextResponse.json({ requests: allRequests });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await req.json();
  const { documentId, note } = body;

  if (!documentId) {
    return NextResponse.json(
      { error: "Dokuman ID gerekli." },
      { status: 400 }
    );
  }

  const doc = await getDocumentById(documentId);
  if (!doc) {
    return NextResponse.json(
      { error: "Dokuman bulunamadi." },
      { status: 404 }
    );
  }

  const newRequest: AccessRequest = {
    id: uuid(),
    requesterId: user.id,
    requesterName: user.name,
    documentId,
    documentTitle: doc.title,
    status: "pending",
    requesterNote: note || null,
    responderId: null,
    responderName: null,
    responderNote: null,
    createdAt: new Date().toISOString(),
    respondedAt: null,
  };

  await createRequest(newRequest);
  return NextResponse.json({ request: newRequest });
}
