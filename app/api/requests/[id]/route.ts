import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRequestById, updateRequest, createNotification } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    // Sadece analiz lab ve admin onay/red verebilir
    if (!user || (user.role !== "admin" && user.role !== "analiz_member")) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Güvenlik: body'den gelen değerleri okurken fallback ekleyelim
    const status = body.status;
    const note = body.note || null;

    const request = await getRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }

    // Talebi güncelle
    const updated = await updateRequest(id, {
      status,
      responderId: user.id,
      responderName: user.name,
      responderNote: note,
      respondedAt: new Date().toISOString(),
    });

    // BİLDİRİM OLUŞTURMA
    const title = status === "approved" ? "Erişim İsteği Onaylandı" : "Erişim İsteği Reddedildi";
    const message = `"${request.documentTitle}" adlı doküman için erişim talebiniz ${status === "approved" ? "onaylandı" : "reddedildi"}.`;

    // ÇOK ÖNEMLİ: relatedRequestId parametresine request.id DEĞİL, request.documentId veriyoruz!
    await createNotification(
      request.requesterId,
      status === "approved" ? "request_approved" : "request_rejected",
      title,
      message,
      request.documentId
    );

    return NextResponse.json({ success: true, request: updated });

  } catch (error) {
    // Eğer bir hata çıkarsa, terminalde KIRMIZI renkle bize ne olduğunu söyleyecek
    console.error("PATCH İşlem Hatası (Requests):", error);
    return NextResponse.json(
      { error: "İşlem sırasında sunucu kaynaklı bir hata oluştu." },
      { status: 500 }
    );
  }
}