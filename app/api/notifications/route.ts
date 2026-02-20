import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getNotificationsByUserId, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/db"; // markAllNotificationsAsRead eklendi

// GET metodu aynı kalıyor...
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const notifications = await getNotificationsByUserId(user.id);
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
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();

    // Tümünü okundu işaretleme kontrolü
    if (body.markAll) {
      await markAllNotificationsAsRead(user.id);
      return NextResponse.json({ success: true });
    }

    // Tekil bildirim okundu işaretleme
    if (body.notificationId) {
      await markNotificationAsRead(body.notificationId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });

  } catch (error) {
    console.error("[v0] Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Bildirim işaretlenirken hata oluştu" },
      { status: 500 }
    );
  }
}