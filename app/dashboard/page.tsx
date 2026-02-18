"use client";

import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import Link from "next/link";
import {
  FileText,
  FlaskConical,
  ClipboardList,
  Upload,
  ArrowRight,
  Calendar,
} from "lucide-react";

interface Stats {
  documentCount: number;
  sampleCount: number;
  pendingRequests: number;
  totalRequests: number;
}

interface RecentDoc {
  id: string;
  title: string;
  uploadedAt: string;
  metadata: { sampleCount: number };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { user } = useAuth();
  const { data } = useSWR<{
    stats: Stats;
    recentDocuments: RecentDoc[];
  }>("/api/stats", fetcher);

  const stats = data?.stats;
  const recentDocs = data?.recentDocuments || [];
  const canUpload = user?.role === "admin" || user?.role === "analiz_member";

  const statCards = [
    {
      label: "Dokumanlar",
      value: stats?.documentCount ?? "-",
      icon: FileText,
      href: "/dashboard/documents",
    },
    {
      label: "Numuneler",
      value: stats?.sampleCount ?? "-",
      icon: FlaskConical,
      href: "/dashboard/documents",
    },
    {
      label: "Bekleyen Talepler",
      value: stats?.pendingRequests ?? "-",
      icon: ClipboardList,
      href: "/dashboard/requests",
    },
  ];

  return (
    <div>
      <AppHeader title="Panel" />
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            Hos Geldiniz, {user?.name?.split(" ")[0]}
          </h2>
          <p className="text-sm text-muted-foreground">
            Kansai Altan Lab Yonetim Sistemi
          </p>
        </div>

        {/* Quick actions */}
        {canUpload && (
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-3 p-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Yeni Dosya Yukle</p>
              <p className="text-xs opacity-80">
                Excel veya CSV dosyanizi yukleyin
              </p>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="flex items-center gap-4 p-5 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <card.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Documents */}
        <div className="rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground">
              Son Dokumanlar
            </h3>
            <Link
              href="/dashboard/documents"
              className="text-xs text-primary hover:underline"
            >
              Tumunu gor
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <FileText className="w-6 h-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                Henuz dokuman yok
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/dashboard/documents/${doc.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-card-foreground truncate">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(doc.uploadedAt).toLocaleDateString("tr-TR")}
                      </span>
                      <span>{doc.metadata.sampleCount} numune</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
