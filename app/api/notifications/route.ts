import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const notifications = await db.getNotifications(user.id);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Bildirimler alınırken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { notificationId } = await request.json();

    await db.markNotificationAsRead(notificationId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Bildirim işaretlenirken hata oluştu" },
      { status: 500 }
    );
  }
}
