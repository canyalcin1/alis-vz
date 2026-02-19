"use client";

import { AppHeader } from "@/components/app-header";
import { FileText, Search, Calendar, FlaskConical, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";

interface Doc {
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
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DocumentsPage() {
  const { user } = useAuth();
  const { data, error, mutate } = useSWR<{ documents: Doc[] }>(
    "/api/documents",
    fetcher
  );
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const canDelete = user?.role === "admin" || user?.role === "analiz_member";

  const docs = data?.documents || [];
  
  // Fuzzy search helper - checks if search terms appear in text (order-independent, partial match)
  const fuzzyMatch = (text: string, searchTerm: string): boolean => {
    const textLower = text.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    // Direct substring match
    if (textLower.includes(searchLower)) return true;
    
    // Split search into words and check if all words appear (in any order)
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
    if (searchWords.every(word => textLower.includes(word))) return true;
    
    // Character-by-character fuzzy match (allows for typos)
    let searchIndex = 0;
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }
    return searchIndex === searchLower.length;
  };
  
  const filtered = docs.filter((d) => {
    if (!search.trim()) return true;
    
    return (
      fuzzyMatch(d.title, search) ||
      fuzzyMatch(d.fileName, search) ||
      d.metadata.analysisTypes.some((t) => fuzzyMatch(t, search))
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Bu dokumani silmek istediginize emin misiniz?")) return;
    setDeleting(id);
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    mutate();
    setDeleting(null);
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
              {search ? "Arama sonucu bulunamadi." : "Henuz dokuman yuklenmemis."}
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
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileSpreadsheetIcon className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/dashboard/documents/${doc.id}`}>
                  <h3 className="text-sm font-semibold text-foreground truncate hover:text-primary cursor-pointer transition-colors">
                    {doc.fileName}
                  </h3>
                </Link>
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

              <div className="flex items-center gap-1 shrink-0">
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
