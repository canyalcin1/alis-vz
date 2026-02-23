import { NextRequest, NextResponse } from "next/server"
import { getSession, canManageUsers, toSafeUser } from "@/lib/auth"
import { getUsers, createUser, getUserByEmail } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !canManageUsers(session.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const users = await getUsers()

    // YENİ: Eğer istek yapan kişi Admin değilse, listeden Admin hesaplarını gizle
    const filteredUsers = session.role === "admin"
      ? users
      : users.filter(u => u.role !== "admin")

    const safeUsers = filteredUsers.map(toSafeUser)

    return NextResponse.json(safeUsers)
  } catch (error) {
    console.error("[v0] Get users error:", error)
    return NextResponse.json({ error: "Kullanıcılar alınamadı" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !canManageUsers(session.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, lab, role, department } = body

    // YENİ: Analiz Lab üyesi Admin hesabı oluşturamaz!
    if (session.role !== "admin" && role === "admin") {
      return NextResponse.json({ error: "Admin hesabı oluşturma yetkiniz yok!" }, { status: 403 })
    }

    if (!name || !email || !password || !lab || !role) {
      return NextResponse.json({ error: "Tüm alanları doldurun" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır" }, { status: 400 })
    }

    // YENİ: E-posta kontrolü
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı" }, { status: 409 })
    }

    // YENİ: Şifre Hashleme (Bcrypt)
    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = {
      id: uuidv4(),
      email: email.toLowerCase(),
      passwordHash,
      name,
      lab,
      role,
      department: department || "-",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const created = await createUser(newUser)
    const safeUser = toSafeUser(created)

    return NextResponse.json({ message: "Kullanıcı başarıyla oluşturuldu", user: safeUser }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create user error:", error)
    return NextResponse.json({ error: "Kullanıcı oluşturulurken bir hata oluştu" }, { status: 500 })
  }
}