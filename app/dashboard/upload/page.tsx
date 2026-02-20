"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/app-header";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
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

  // Tekil state'leri dizilere (array) çevirdik
  const [results, setResults] = useState<UploadResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const canUpload = user?.role === "admin" || user?.role === "analiz_member";

  const handleFiles = useCallback((files: File[]) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    const newFiles: File[] = [];
    const newErrors: string[] = [];

    files.forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!validTypes.includes(file.type) && !["xlsx", "xls", "csv"].includes(ext || "")) {
        newErrors.push(`"${file.name}" desteklenmeyen bir format.`);
      } else {
        // Aynı dosyanın tekrar eklenmesini önlemek için basit bir kontrol
        if (!selectedFiles.some(f => f.name === file.name)) {
          newFiles.push(file);
        }
      }
    });

    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setErrors([]); // Yeni başarılı dosya eklendiğinde eski hataları temizle
    }
  }, [selectedFiles]);

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setErrors([]);
    setResults([]);

    const successfulUploads: UploadResult[] = [];
    const uploadErrors: string[] = [];

    // Dosyaları sırayla (veya istersen Promise.all ile paralel) backend'e gönderiyoruz
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
          uploadErrors.push(`"${file.name}": ${data.error || "Yükleme hatası."}`);
        } else {
          successfulUploads.push(data);
        }
      } catch {
        uploadErrors.push(`"${file.name}": Bağlantı hatası.`);
      }
    }

    setResults(successfulUploads);
    setErrors(uploadErrors);

    // Yüklenen dosyaları listeden çıkar
    if (successfulUploads.length > 0) {
      setSelectedFiles([]);
    }

    setUploading(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [handleFiles]
  );

  if (!canUpload) {
    return (
      <div>
        <AppHeader title="Dosya Yükle" />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">
            Bu sayfaya erişim yetkiniz yok.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader title="Çoklu Dosya Yükle" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragging
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
                Dosyalarınızı sürükleyip bırakın
              </p>
              <p className="text-xs text-muted-foreground">
                Excel (.xlsx, .xls) veya CSV dosyaları
              </p>
            </div>
            <label className="cursor-pointer px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Dosyaları Seç
              <input
                type="file"
                multiple // ÇOKLU SEÇİM İÇİN EKLENDİ
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(Array.from(e.target.files));
                  }
                  e.target.value = ''; // Aynı dosyayı tekrar seçebilmek için input'u sıfırla
                }}
              />
            </label>
          </div>
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Seçilen Dosyalar ({selectedFiles.length})</h3>
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
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
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {selectedFiles.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? "İşleniyor..." : "Tümünü Yükle ve İşle"}
          </button>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((err, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Hata</p>
                  <p className="text-sm text-destructive/80">{err}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Başarıyla Yüklenenler</h3>
            {results.map((res, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {res.document.title}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground pl-8">
                  <span>{res.sampleCount} numune</span>
                  <span>{res.footnoteCount} dipnot</span>
                </div>
                <div className="flex gap-2 pl-8">
                  <button
                    onClick={() => router.push(`/dashboard/documents/${res.document.id}`)}
                    className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Dokümanı Gör
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <h3 className="text-sm font-medium text-card-foreground mb-2">
            Desteklenen Formatlar
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Sistem Excel dosyasını alır, ilk sheet{"'"}i işler.</li>
            <li>Kolonlarda numune isimleri, satırlarda analiz parametreleri olmalı.</li>
            <li>{"\""}Analiz Yorum{"\""} satır başında yorum olarak değerlendirilir.</li>
            <li>Dipnotlar (*, NOT: ile başlayan satırlar) ayrıca kaydedilir.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}