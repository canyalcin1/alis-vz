import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { v4 as uuid } from "uuid"
import { createUser, getUserByEmail } from "@/lib/db"
import type { User } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, lab, department } = body

    // Validation
    if (!email || !password || !name || !lab || !department) {
      return NextResponse.json(
        { error: "Tüm alanlar gereklidir" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı" },
        { status: 409 }
      )
    }

    // Determine role based on lab
    // By default, new users are lab_member, except for analiz lab which gets analiz_member
    let role: "lab_member" | "analiz_member" = "lab_member"
    if (lab === "analiz") {
      role = "analiz_member"
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const now = new Date().toISOString()
    const newUser: User = {
      id: uuid(),
      email: email.toLowerCase(),
      passwordHash,
      name,
      lab,
      role,
      department,
      createdAt: now,
      updatedAt: now,
    }

    await createUser(newUser)

    return NextResponse.json(
      { message: "Kayıt başarılı", userId: newUser.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Register error:", error)
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 }
    )
  }
}
