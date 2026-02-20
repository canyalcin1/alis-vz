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
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseExcelBuffer(buffer);
    const docId = uuid();

    // DOSYAYI BASE64 FORMATINA ÇEVİRİYORUZ (DB'de saklamak için)
    const base64FileContent = buffer.toString("base64");

    const doc: Document = {
      id: docId,
      fileName: file.name,
      title: file.name,
      fileContent: base64FileContent, // URL yerine dosyanın kendisini gömüyoruz
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

    // Numuneler
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

    // Dipnotlar
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
      document: { id: doc.id, title: doc.title, fileName: doc.fileName }, // Sadece gerekenleri dön, frontend şişmesin
      sampleCount: samples.length,
      footnoteCount: parsed.footnotes.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Dosya işlenirken hata oluştu." }, { status: 500 });
  }
}