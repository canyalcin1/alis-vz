import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDocumentFileContent } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSession();
    if (!user) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    try {
        const { id } = await params;
        const docData = await getDocumentFileContent(id);

        if (!docData || !docData.fileContent) {
            return NextResponse.json({ error: "Dosya verisi bulunamadı." }, { status: 404 });
        }

        const buffer = Buffer.from(docData.fileContent, "base64");

        // TÜRKÇE KARAKTER ÇÖZÜMÜ BURADA: Dosya adını URL formatına çeviriyoruz
        const encodedFileName = encodeURIComponent(docData.fileName);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                // filename*=UTF-8'' takısı tarayıcıya Türkçe karakterleri düzgün okumasını söyler
                "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
                "Content-Length": buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json({ error: "Dosya indirilirken hata oluştu." }, { status: 500 });
    }
}