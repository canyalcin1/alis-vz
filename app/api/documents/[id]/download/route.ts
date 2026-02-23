import { NextResponse } from "next/server";
import { getSession, canViewFullData } from "@/lib/auth";
import { getDocumentFileContent, checkUserDocumentAccess } from "@/lib/db"; // İzin kontrolünü buraya da aldık

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

        // GÜVENLİK DUVARI: İzin kontrolü
        let fullAccess = canViewFullData(user.role);
        if (!fullAccess) {
            fullAccess = await checkUserDocumentAccess(user.id, id);
        }

        if (!fullAccess) {
            return NextResponse.json({ error: "Bu dosyayı indirmek için erişim izniniz yok." }, { status: 403 });
        }

        const docData = await getDocumentFileContent(id);

        if (!docData || !docData.fileContent) {
            return NextResponse.json({ error: "Dosya verisi bulunamadı." }, { status: 404 });
        }

        const buffer = Buffer.from(docData.fileContent, "base64");
        const encodedFileName = encodeURIComponent(docData.fileName);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
                "Content-Length": buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json({ error: "Dosya indirilirken hata oluştu." }, { status: 500 });
    }
}