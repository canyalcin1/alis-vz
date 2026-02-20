"use client";

import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import { useState } from "react";
import {
  ArrowLeft,
  FlaskConical,
  MessageSquare,
  Send,
  Lock,
  AlertTriangle,
  FileText,
  Download,
} from "lucide-react";
import { SampleTable } from "@/components/sample-table";

interface SampleSection {
  title: string;
  rows: { parameter: string; value: string }[];
}

interface Sample {
  id: string;
  documentId: string;
  name: string;
  sections: SampleSection[];
  comment: string | null;
}

interface Footnote {
  id: string;
  text: string;
  order: number;
}

interface DocNote {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface Doc {
  id: string;
  fileName: string;
  title: string;
  uploadedAt: string;
  status: string;
  notes: DocNote[];
  metadata: { sampleCount: number; analysisTypes: string[] };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data, error, mutate } = useSWR<{
    document: Doc;
    samples: Sample[];
    footnotes: Footnote[];
    fullAccess: boolean;
  }>(`/api/documents/${id}`, fetcher);

  const [noteText, setNoteText] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSendingNote(true);
    await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteText }),
    });
    setNoteText("");
    setSendingNote(false);
    mutate();
  };

  const handleRequestAccess = async () => {
    setRequesting(true);
    await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: id,
        note: requestNote || null,
      }),
    });
    setRequesting(false);
    setRequestSent(true);
  };

  if (error) {
    return (
      <div>
        <AppHeader title="Dokuman" />
        <div className="flex items-center justify-center h-96">
          <p className="text-sm text-destructive">Dokuman yuklenirken hata olustu.</p>
        </div>
      </div>
    );
  }

  if (!data || !data.document) {
    return (
      <div>
        <AppHeader title="Doküman Yükleniyor..." />
        <div className="flex items-center justify-center h-96">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const { document: doc, samples, footnotes, fullAccess } = data;

  return (
    <div>
      <AppHeader title={doc.title} />
      <div className="p-6 space-y-6">
        {/* Back button, Meta and Download button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/documents")}
              className="p-2 rounded-md hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-foreground text-balance">
                {doc.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>{new Date(doc.uploadedAt).toLocaleDateString("tr-TR")}</span>
                <span>{doc.fileName}</span>
                <span className="flex items-center gap-1">
                  <FlaskConical className="w-3 h-3" />
                  {samples.length} numune
                </span>
              </div>
            </div>
          </div>

          {/* Orijinal Dosya İndir Butonu */}
          <a
            href={`/api/documents/${doc.id}/download`}
            download
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            Orijinal Dosyayı İndir
          </a>
        </div>

        {/* Access restriction banner */}
        {!fullAccess && (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 space-y-3">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Kisitli Erisim
                </p>
                <p className="text-xs text-muted-foreground">
                  Bu dokumanin detayli icerigini gorebilmek icin erisim izni talep edebilirsiniz.
                </p>
              </div>
            </div>
            {!requestSent ? (
              <div className="flex gap-2 pl-8">
                <input
                  type="text"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Not ekleyin (istege bagli)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={handleRequestAccess}
                  disabled={requesting}
                  className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {requesting ? "Gonderiliyor..." : "Erisim Talep Et"}
                </button>
              </div>
            ) : (
              <p className="text-xs text-success pl-8">
                Talebiniz iletildi. Analiz Lab. ekibi en kisa surede degerlendirecek.
              </p>
            )}
          </div>
        )}

        {/* Sample data table */}
        {samples.length > 0 ? (
          <SampleTable samples={samples} fullAccess={fullAccess} />
        ) : (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <AlertTriangle className="w-6 h-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Bu dokumanda numune verisi bulunamadi.
            </p>
          </div>
        )}

        {/* Footnotes */}
        {footnotes.length > 0 && (
          <div className="p-4 rounded-lg bg-card border border-border">
            <h3 className="text-sm font-medium text-card-foreground mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Dipnotlar
            </h3>
            <ul className="space-y-1">
              {footnotes.map((fn) => (
                <li key={fn.id} className="text-xs text-muted-foreground leading-relaxed">
                  {fn.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes section */}
        <div className="p-4 rounded-lg bg-card border border-border space-y-4">
          <h3 className="text-sm font-medium text-card-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notlar ({doc.notes?.length || 0})
          </h3>

          {doc.notes && doc.notes.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {doc.notes.map((note) => (
                <div key={note.id} className="p-3 rounded-md bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">
                      {note.userName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{note.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Not ekleyin..."
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim() || sendingNote}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}