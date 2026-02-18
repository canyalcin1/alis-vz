import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db";
import { setSessionCookie, toSafeUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve parola gerekli." },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Gecersiz e-posta veya parola." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Gecersiz e-posta veya parola." },
        { status: 401 }
      );
    }

    await setSessionCookie(user.id);

    return NextResponse.json({ user: toSafeUser(user) });
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatasi." },
      { status: 500 }
    );
  }
}
