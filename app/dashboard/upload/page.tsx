"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/app-header";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface UploadResult {
  document: {
    id: string;
    title: string;
    fileName: string;
  };
  sampleCount: number;
  footnoteCount: number;
}

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const canUpload = user?.role === "admin" || user?.role === "analiz_member";

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (validTypes.includes(file.type) || ["xlsx", "xls", "csv"].includes(ext || "")) {
        validFiles.push(file);
      }
    }
    
    if (validFiles.length === 0) {
      setError("Sadece Excel (.xlsx, .xls) ve CSV dosyalari kabul edilir.");
      return;
    }
    
    if (validFiles.length !== fileArray.length) {
      setError(`${fileArray.length - validFiles.length} dosya gecersiz format nedeniyle atlandı.`);
    } else {
      setError(null);
    }
    
    setResults([]);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);

    const uploadResults: UploadResult[] = [];
    let errorCount = 0;

    try {
      for (const file of selectedFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) {
            errorCount++;
          } else {
            uploadResults.push(data);
          }
        } catch {
          errorCount++;
        }
      }

      if (errorCount > 0) {
        setError(`${errorCount} dosya yuklenirken hata olustu.`);
      }
      
      setResults(uploadResults);
      setSelectedFiles([]);
    } catch {
      setError("Baglanti hatasi.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFiles(files);
    },
    [handleFiles]
  );

  if (!canUpload) {
    return (
      <div>
        <AppHeader title="Dosya Yukle" />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">
            Bu sayfaya erisim yetkiniz yok.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader title="Dosya Yukle" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Dosyanizi surukleyip birakin
              </p>
              <p className="text-xs text-muted-foreground">
                Excel (.xlsx, .xls) veya CSV dosyasi
              </p>
            </div>
            <label className="cursor-pointer px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Dosya Sec (Birden Fazla)
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) handleFiles(files);
                }}
              />
            </label>
          </div>
        </div>

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {selectedFiles.length} dosya secildi
              </p>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Tümünü Kaldir
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  <FileSpreadsheet className="w-6 h-6 text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="p-1 rounded hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button */}
        {selectedFiles.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading
              ? `Isleniyor... (${selectedFiles.length} dosya)`
              : `${selectedFiles.length} Dosyayi Yukle ve Isle`}
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Hata</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-success">
                {results.length} dosya basariyla yuklendi
              </p>
              <button
                onClick={() => {
                  setResults([]);
                  setSelectedFiles([]);
                }}
                className="text-xs px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Yeni Yukleme
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {result.document.fileName}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>{result.sampleCount} numune</span>
                        <span>{result.footnoteCount} dipnot</span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/documents/${result.document.id}`)
                      }
                      className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Gor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <h3 className="text-sm font-medium text-card-foreground mb-2">
            Desteklenen Formatlar
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>
              Sistem Excel dosyasini alir, ilk sheet{"'"}i CSV{"'"}ye donusturur ve isler.
            </li>
            <li>
              Kolonlarda numune isimleri, satirlarda analiz parametreleri olmali.
            </li>
            <li>
              {"\""}Analiz Yorum{"\""} satir basinda yorum olarak degerlendirilir.
            </li>
            <li>
              {"\""}Analiz Yorum{"\""} kolonda ise Numune degil Yorum olarak islenir.
            </li>
            <li>
              Dipnotlar (*, NOT: ile baslayan satirlar) ayrica kaydedilir.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
