import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth"; // Make sure this matches your actual auth import
import { getNotificationsByUserId, markNotificationAsRead } from "@/lib/db";

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

    const { notificationId } = await request.json();

    await markNotificationAsRead(notificationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Bildirim işaretlenirken hata oluştu" },
      { status: 500 }
    );
  }
}