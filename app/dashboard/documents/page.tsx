"use client";

import { AppHeader } from "@/components/app-header";
import { FileText, Search, Calendar, FlaskConical, Eye, Trash2, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface Doc {
  id: string;
  fileName: string;
  title: string;
  searchableText?: string;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
  metadata: {
    sampleCount: number;
    analysisTypes: string[];
  };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DocumentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { data, error, mutate } = useSWR<{ documents: Doc[] }>(
    "/api/documents",
    fetcher
  );

  const [search, setSearch] = useState("");

  // YENİ: Tarayıcı hafızasını ve URL'i senkronize eden harika hafıza bloğu
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const savedQuery = sessionStorage.getItem("docSearchMemory");

    if (urlQuery !== null) {
      // 1. URL'de arama parametresi varsa (örn: üst bardan arama yapıldıysa veya geri tuşuna basıldıysa) onu kullan
      setSearch(urlQuery);
      sessionStorage.setItem("docSearchMemory", urlQuery);
    } else if (savedQuery) {
      // 2. URL boş ama hafızada son aranan kelime duruyorsa, onu otomatik geri yükle
      setSearch(savedQuery);
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", savedQuery);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  const [deleting, setDeleting] = useState<string | null>(null);
  const canDelete = user?.role === "admin" || user?.role === "analiz_member";

  const docs = data?.documents || [];

  const searchTerm = search.toLowerCase();
  const filtered = docs.filter((d) => {
    if (!searchTerm) return true;

    if (d.searchableText) {
      return d.searchableText.includes(searchTerm);
    }

    return (
      d.title.toLowerCase().includes(searchTerm) ||
      d.fileName.toLowerCase().includes(searchTerm) ||
      d.metadata.analysisTypes.some((t) => t.toLowerCase().includes(searchTerm))
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Bu dokumani silmek istediginize emin misiniz?")) return;
    setDeleting(id);
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    mutate();
    setDeleting(null);
  };

  // YENİ: Yazıldıkça hem URL'i hem de Tarayıcı Hafızasını güncelleyen fonksiyon
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);

    // Hafızaya kazı
    if (val) {
      sessionStorage.setItem("docSearchMemory", val);
    } else {
      sessionStorage.removeItem("docSearchMemory");
    }

    // URL'e yaz
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("q", val);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <AppHeader title="Dokumanlar" />
      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Doküman, numune, FTIR, GPC ara..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {/* İsteğe Bağlı Çarpı Butonu: Tıklayınca aramayı sıfırlar */}
          {search && (
            <button
              onClick={() => handleSearchChange({ target: { value: "" } } as any)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
            >
              ✕
            </button>
          )}
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
              {search ? `"${search}" için sonuc bulunamadi.` : "Henuz dokuman yuklenmemis."}
            </p>
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
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileSpreadsheetIcon className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Hover durumunda başlık rengi primary rengine dönecek */}
                  <h3 className="text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.uploadedAt).toLocaleDateString("tr-TR")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FlaskConical className="w-3 h-3" />
                      {doc.metadata.sampleCount} numune
                    </span>
                  </div>
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

                {/* Göz ikonunu alışkanlık yapanlar için yine de bıraktım, istersen silebilirsin */}
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="p-2 rounded-md hover:bg-secondary transition-colors"
                >
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </Link>

                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="p-2 rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
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