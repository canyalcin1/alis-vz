import { NextRequest, NextResponse } from "next/server"
import { getSession, canManageUsers } from "@/lib/auth"
import { getApprovedDocumentsForUser, revokeDocumentAccess } from "@/lib/db"

// Kullanıcının erişim yetkisi olan dokümanları getirir
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || !canManageUsers(session.role)) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
        }

        const { id } = await params
        const documents = await getApprovedDocumentsForUser(id)
        return NextResponse.json(documents)
    } catch (error) {
        console.error("[v0] Erişim listesi alınamadı:", error)
        return NextResponse.json({ error: "Erişim listesi alınamadı" }, { status: 500 })
    }
}

// Kullanıcının spesifik bir dokümandaki erişim yetkisini kaldırır
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session || !canManageUsers(session.role)) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { documentId } = body

        if (!documentId) {
            return NextResponse.json({ error: "Doküman ID gerekli" }, { status: 400 })
        }

        await revokeDocumentAccess(id, documentId)
        return NextResponse.json({ message: "Erişim başarıyla kaldırıldı" })
    } catch (error) {
        console.error("[v0] Erişim kaldırılırken hata:", error)
        return NextResponse.json({ error: "Erişim kaldırılırken hata oluştu" }, { status: 500 })
    }
}