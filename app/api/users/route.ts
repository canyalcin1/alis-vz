import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUsers } from "@/lib/db"
import { canManageUsers, toSafeUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can view all users
    if (!canManageUsers(session.role)) {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 403 }
      )
    }

    const users = await getUsers()
    const safeUsers = users.map(toSafeUser)

    return NextResponse.json(safeUsers)
  } catch (error) {
    console.error("[v0] Get users error:", error)
    return NextResponse.json(
      { error: "Kullanıcılar alınamadı" },
      { status: 500 }
    )
  }
}
