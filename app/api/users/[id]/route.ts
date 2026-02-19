import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { updateUser, deleteUser, getUserById } from "@/lib/db"
import { canManageUsers } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!canManageUsers(session.role)) {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, lab, role, department } = body

    // Check if user exists
    const existingUser = await getUserById(id)
    if (!existingUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      )
    }

    // Update user
    const updatedUser = await updateUser(id, {
      name,
      email,
      lab,
      role,
      department,
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Kullanıcı güncellenemedi" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Kullanıcı güncellendi", user: updatedUser })
  } catch (error) {
    console.error("[v0] Update user error:", error)
    return NextResponse.json(
      { error: "Kullanıcı güncellenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!canManageUsers(session.role)) {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 403 }
      )
    }

    const { id } = await params

    // Prevent deleting yourself
    if (id === session.id) {
      return NextResponse.json(
        { error: "Kendi hesabınızı silemezsiniz" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await getUserById(id)
    if (!existingUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      )
    }

    // Delete user
    const deleted = await deleteUser(id)
    if (!deleted) {
      return NextResponse.json(
        { error: "Kullanıcı silinemedi" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Kullanıcı silindi" })
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    return NextResponse.json(
      { error: "Kullanıcı silinirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
