"use client";

import { AppHeader } from "@/components/app-header";
import { FileText, Search, Calendar, FlaskConical, Eye, CheckCircle2, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";

interface MyDocument {
  id: string;
  fileName: string;
  title: string;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
  metadata: {
    sampleCount: number;
    analysisTypes: string[];
  };
  approvedAt: string;
  responderName: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MyDocumentsPage() {
  const { user } = useAuth();
  const { data, error } = useSWR<{ documents: MyDocument[] }>(
    "/api/my-documents",
    fetcher
  );
  const [search, setSearch] = useState("");

  const docs = data?.documents || [];
  const filtered = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.fileName.toLowerCase().includes(search.toLowerCase()) ||
      d.metadata.analysisTypes.some((t) =>
        t.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div>
      <AppHeader title="Dokümanlarm" />
      <div className="p-6 space-y-4">
        {/* Info banner */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Onaylanan Dokumanlariniz
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Erisim talepleriniz onaylanan ve tam erisime sahip oldugunuz dokumanlar burada listelenmektedir.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Dokuman veya analiz tipi ara..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            Dokumanlar yuklenirken hata olustu.
          </div>
        )}

        {/* Empty state */}
        {!error && docs.length === 0 && !data && (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <FileText className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {search
                ? "Arama sonucu bulunamadi."
                : "Henuz onaylanmis dokumaniniz bulunmuyor."}
            </p>
            {!search && (
              <Link
                href="/dashboard/documents"
                className="text-xs text-primary hover:underline"
              >
                Tum dokumanlara goz atin
              </Link>
            )}
          </div>
        )}

        {/* Document cards */}
        <div className="grid gap-3">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors group"
            >
              {/* ANA TIKLANABİLİR ALAN (İkon, Başlık ve Etiketler) */}
              <Link
                href={`/dashboard/documents/${doc.id}`}
                className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <FileSpreadsheetIcon className="w-5 h-5 text-success" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                      {doc.title}
                    </h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Yuklendi: {new Date(doc.uploadedAt).toLocaleDateString("tr-TR")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="w-3 h-3" />
                      Onaylandi: {new Date(doc.approvedAt).toLocaleDateString("tr-TR")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FlaskConical className="w-3 h-3" />
                      {doc.metadata.sampleCount} numune
                    </span>
                  </div>
                  {doc.responderName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Onaylayan: {doc.responderName}
                    </p>
                  )}
                  {doc.metadata.analysisTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.metadata.analysisTypes.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-secondary text-secondary-foreground"
                        >
                          {t.length > 25 ? t.slice(0, 25) + "..." : t}
                        </span>
                      ))}
                      {doc.metadata.analysisTypes.length > 4 && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-secondary text-secondary-foreground">
                          +{doc.metadata.analysisTypes.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>

              {/* SAĞDAKİ AKSİYON BUTONLARI */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Onaylı olduğu için doğrudan indirme yetkisi var */}
                <a
                  href={`/api/documents/${doc.id}/download`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover:bg-secondary transition-colors"
                  title="Orijinal Dosyayı İndir"
                >
                  <Download className="w-4 h-4 text-muted-foreground" />
                </a>

                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="p-2 rounded-md hover:bg-secondary transition-colors"
                >
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FileSpreadsheetIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h2" />
      <path d="M14 13h2" />
      <path d="M8 17h2" />
      <path d="M14 17h2" />
    </svg>
  );
}
