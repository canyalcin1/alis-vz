import { NextResponse } from "next/server";
import { getSession, canViewFullData } from "@/lib/auth";
import {
  getDocumentById,
  getSamplesByDocumentId,
  getFootnotesByDocumentId,
  updateDocument,
  deleteDocument,
} from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc) {
    return NextResponse.json(
      { error: "Dokuman bulunamadi." },
      { status: 404 }
    );
  }

  const samples = await getSamplesByDocumentId(id);
  const footnotes = await getFootnotesByDocumentId(id);
  const fullAccess = canViewFullData(user.role);

  // For non-analiz users, hide detailed composition data
  const visibleSamples = fullAccess
    ? samples
    : samples.map((s) => ({
        ...s,
        sections: s.sections.map((sec) => ({
          ...sec,
          rows: sec.rows.map((r) => ({
            parameter: r.parameter,
            value: "***",
          })),
        })),
      }));

  return NextResponse.json({
    document: doc,
    samples: visibleSamples,
    footnotes,
    fullAccess,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Add note
  if (body.note) {
    const doc = await getDocumentById(id);
    if (!doc) {
      return NextResponse.json(
        { error: "Dokuman bulunamadi." },
        { status: 404 }
      );
    }

    const newNote = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      text: body.note,
      createdAt: new Date().toISOString(),
    };

    const updated = await updateDocument(id, {
      notes: [...(doc.notes || []), newNote],
    });

    return NextResponse.json({ document: updated });
  }

  return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role === "lab_member") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const result = await deleteDocument(id);
  if (!result) {
    return NextResponse.json(
      { error: "Dokuman bulunamadi." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
