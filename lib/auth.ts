import { cookies } from "next/headers"
import { getUserById } from "./db"
import type { SafeUser, User } from "./types"

const SESSION_COOKIE = "ka_session"

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user
  return safe
}

export async function getSession(): Promise<SafeUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)
  if (!sessionCookie?.value) return null

  try {
    const parsed = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8")
    )
    const user = await getUserById(parsed.userId)
    if (!user) return null
    return toSafeUser(user)
  } catch {
    return null
  }
}

export function createSessionToken(userId: string): string {
  return Buffer.from(
    JSON.stringify({ userId, createdAt: Date.now() })
  ).toString("base64")
}

export async function setSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export function canUpload(role: string): boolean {
  return role === "admin" || role === "analiz_member"
}

export function canViewFullData(role: string): boolean {
  return role === "admin" || role === "analiz_member"
}

export function canApproveRequests(role: string): boolean {
  return role === "admin" || role === "analiz_member"
}

export function canManageUsers(role: string): boolean {
  return role === "admin"
}
