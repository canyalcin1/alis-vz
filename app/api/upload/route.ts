import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSession, canUpload } from "@/lib/auth";
import { parseExcelBuffer } from "@/lib/excel-parser";
import {
  createDocument,
  createSamples,
  createFootnotes,
} from "@/lib/db";
import type { Document, Sample, DocumentFootnote } from "@/lib/types";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || !canUpload(user.role)) {
    return NextResponse.json(
      { error: "Yetkisiz erisim." },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadi." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcelBuffer(buffer);

    const docId = uuid();
    const doc: Document = {
      id: docId,
      fileName: file.name,
      title: parsed.title || file.name.replace(/\.[^.]+$/, ""),
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
      status: "ready",
      notes: [],
      metadata: {
        sampleCount: parsed.samples.length,
        analysisTypes: parsed.analysisTypes,
      },
    };

    await createDocument(doc);

    // Create samples
    const samples: Sample[] = parsed.samples.map((s) => ({
      id: uuid(),
      documentId: docId,
      name: s.name,
      sections: s.sections,
      comment: s.comment,
    }));

    if (samples.length > 0) {
      await createSamples(samples);
    }

    // Create footnotes
    if (parsed.footnotes.length > 0) {
      const footnotes: DocumentFootnote[] = parsed.footnotes.map((text, i) => ({
        id: uuid(),
        documentId: docId,
        text,
        order: i,
      }));
      await createFootnotes(footnotes);
    }

    return NextResponse.json({
      document: doc,
      sampleCount: samples.length,
      footnoteCount: parsed.footnotes.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Dosya islenirken hata olustu." },
      { status: 500 }
    );
  }
}
