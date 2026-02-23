"use client";

import { AppHeader } from "@/components/app-header";
import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    CheckCheck,
    CheckCircle2,
    XCircle,
    FileText,
    Clock,
    ArrowRight,
} from "lucide-react";

// 1. DEĞİŞİKLİK: documentId eklendi
interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    relatedRequestId?: string | null;
    documentId?: string | null; // <-- Bura eklendi
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NotificationsPage() {
    const router = useRouter();
    const { data: notifications, error, mutate } = useSWR<Notification[]>(
        "/api/notifications",
        fetcher
    );
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    const isLoading = !notifications && !error;
    const safeNotifications = notifications || [];
    const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

    const markAsReadAndNavigate = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notificationId: notification.id }),
                });
                mutate();
            } catch (error) {
                console.error("Bildirim okundu isaretlenemedi:", error);
            }
        }

        // 2. DEĞİŞİKLİK: Yönlendirmede documentId kullanımına öncelik verildi
        if (notification.type === "access_request") {
            router.push("/dashboard/access-requests");
        } else if (notification.type === "request_approved") {
            // Eğer backend'den documentId geliyorsa onu kullan, yoksa fallback olarak relatedRequestId dene
            const targetId = notification.documentId || notification.relatedRequestId;
            if (targetId) {
                router.push(`/dashboard/documents/${targetId}`);
            }
        } else if (notification.type === "request_rejected") {
            router.push("/dashboard/requests");
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0 || isMarkingAll) return;
        setIsMarkingAll(true);

        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAll: true }),
            });
            mutate();
        } catch (error) {
            console.error("Bildirimler okundu isaretlenemedi:", error);
        } finally {
            setIsMarkingAll(false);
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case "request_approved":
                return <CheckCircle2 className="w-5 h-5 text-success" />;
            case "request_rejected":
                return <XCircle className="w-5 h-5 text-destructive" />;
            case "access_request":
                return <FileText className="w-5 h-5 text-warning" />;
            default:
                return <Bell className="w-5 h-5 text-primary" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Az önce";
        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div>
            <AppHeader title="Bildirimler" />
            <div className="p-6 space-y-4 max-w-4xl mx-auto">

                {/* Üst Kısım: Başlık ve Aksiyonlar */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Tüm Bildirimler</h2>
                        <p className="text-sm text-muted-foreground">
                            {unreadCount > 0
                                ? `${unreadCount} okunmamış bildiriminiz var.`
                                : "Tüm bildirimleri okudunuz."}
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            disabled={isMarkingAll}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                        >
                            <CheckCheck className="w-4 h-4" />
                            {isMarkingAll ? "İşaretleniyor..." : "Tümünü Okundu İşaretle"}
                        </button>
                    )}
                </div>

                {/* Hata Durumu */}
                {error && (
                    <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                        Bildirimler yüklenirken bir hata oluştu.
                    </div>
                )}

                {/* Yükleniyor Durumu */}
                {isLoading && (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Boş Durum */}
                {!isLoading && !error && safeNotifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed border-border rounded-lg bg-card/50">
                        <Bell className="w-10 h-10 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                            Henüz hiç bildiriminiz bulunmuyor.
                        </p>
                    </div>
                )}

                {/* Bildirim Listesi */}
                <div className="space-y-3">
                    {safeNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => markAsReadAndNavigate(notification)}
                            className={`group flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${!notification.isRead
                                ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                                : "bg-card border-border hover:border-primary/20"
                                }`}
                        >
                            {/* İkon */}
                            <div className={`mt-1 shrink-0 p-2 rounded-full ${!notification.isRead ? "bg-background shadow-sm" : "bg-secondary"}`}>
                                {getIconForType(notification.type)}
                            </div>

                            {/* İçerik */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className={`text-sm ${!notification.isRead ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                                        {notification.title}
                                    </h3>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <p className={`text-sm mt-1 ${!notification.isRead ? "text-foreground/90" : "text-muted-foreground"}`}>
                                    {notification.message}
                                </p>
                            </div>

                            {/* Sağ ok (Hover olunca görünür) */}
                            <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}