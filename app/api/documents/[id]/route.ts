import { NextResponse } from "next/server";
import { getSession, canViewFullData } from "@/lib/auth";
import {
  getDocumentById,
  getSamplesByDocumentId,
  getFootnotesByDocumentId,
  deleteDocument,
  addDocumentNote,
  checkUserDocumentAccess,
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

  // 1. KURAL: Kullanıcı Analiz Lab veya Admin mi?
  const isAnalizOrAdmin = canViewFullData(user.role);

  // EĞER DEĞİLSE: Lab içi notları API'den hiç gönderme (Güvenlik duvarı)
  if (!isAnalizOrAdmin) {
    doc.notes = [];
  }

  // 2. KURAL: Kullanıcının tam yetkisi var mı VEYA bu dosya için onaylı izni var mı?
  let fullAccess = isAnalizOrAdmin;
  if (!fullAccess) {
    fullAccess = await checkUserDocumentAccess(user.id, id);
  }

  // 3. KURAL: İzni yoksa her şeyi (Sol kolon başlıkları dahil) yıldıza çevir!
  const visibleSamples = fullAccess
    ? samples
    : samples.map((s) => ({
      ...s,
      comment: s.comment ? "*** (İçeriği görmek için erişim talep edin)" : null,
      sections: s.sections.map((sec, sIdx) => ({
        ...sec,
        title: sec.title ? `*** (Gizli Bölüm ${sIdx + 1})` : "",
        rows: sec.rows.map((r, rIdx) => ({
          // İŞTE BURASI SOL KOLONU (KSİLEN vb.) GİZLEYEN KISIM
          parameter: `*** (Gizli Analiz ${sIdx + 1}-${rIdx + 1})`,
          value: "***", // SAĞ KOLONU GİZLEYEN KISIM
        })),
      })),
    }));

  const visibleFootnotes = fullAccess
    ? footnotes
    : footnotes.map((f) => ({ ...f, text: "***" }));

  return NextResponse.json({
    document: doc,
    samples: visibleSamples,
    footnotes: visibleFootnotes,
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

  // YENİ: Sadece Analiz Lab ve Admin not ekleyebilir
  if (!canViewFullData(user.role)) {
    return NextResponse.json({ error: "Not ekleme yetkiniz yok." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.note) {
    const doc = await getDocumentById(id);
    if (!doc) {
      return NextResponse.json(
        { error: "Dokuman bulunamadi." },
        { status: 404 }
      );
    }

    try {
      await addDocumentNote(id, user.id, user.name, body.note);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Not eklenirken hata:", error);
      return NextResponse.json({ error: "Not eklenemedi." }, { status: 500 });
    }
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