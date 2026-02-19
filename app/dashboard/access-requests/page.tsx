"use client";

import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import { useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  User,
  FileText,
  MessageSquare,
  Mail,
  Building,
  CheckSquare,
  Square,
} from "lucide-react";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/types";

interface AccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  requesterDepartment: string;
  documentId: string;
  documentTitle: string;
  status: "pending" | "approved" | "rejected";
  requesterNote: string | null;
  responderId: string | null;
  responderName: string | null;
  responderNote: string | null;
  createdAt: string;
  respondedAt: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusConfig = {
  pending: {
    label: "Beklemede",
    icon: Clock,
    bg: "bg-warning/10",
    text: "text-warning-foreground",
    border: "border-warning/20",
    dot: "bg-warning",
  },
  approved: {
    label: "Onaylandi",
    icon: CheckCircle2,
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    dot: "bg-success",
  },
  rejected: {
    label: "Reddedildi",
    icon: XCircle,
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    dot: "bg-destructive",
  },
};

export default function AccessRequestsPage() {
  const { user } = useAuth();
  const { data, mutate } = useSWR<{ requests: AccessRequest[] }>(
    "/api/requests",
    fetcher
  );
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseNote, setResponseNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<AccessRequest | null>(null);

  const canApprove = user?.role === "admin" || user?.role === "analiz_member";

  const requests = data?.requests || [];
  const filtered =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  const pendingRequests = filtered.filter((r) => r.status === "pending");

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkRespond = async (status: "approved" | "rejected") => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `${selectedIds.size} talebi ${status === "approved" ? "onaylamak" : "reddetmek"} istediginize emin misiniz?`
      )
    )
      return;

    setSubmitting(true);
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/requests/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note: null }),
        })
      )
    );
    setSelectedIds(new Set());
    setSubmitting(false);
    mutate();
  };

  const handleRespond = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    setSubmitting(true);
    await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: responseNote || null }),
    });
    setRespondingTo(null);
    setResponseNote("");
    setSubmitting(false);
    mutate();
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div>
      <AppHeader title="Erisim Talepleri" />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {["all", "pending", "approved", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setSelectedIds(new Set());
                }}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {status === "all"
                  ? `Tumu (${requests.length})`
                  : status === "pending"
                  ? `Beklemede (${pendingCount})`
                  : status === "approved"
                  ? `Onaylandi (${requests.filter((r) => r.status === "approved").length})`
                  : `Reddedildi (${requests.filter((r) => r.status === "rejected").length})`}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          {canApprove && filterStatus === "pending" && pendingRequests.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                {selectedIds.size === pendingRequests.length ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {selectedIds.size === pendingRequests.length
                  ? "Secimi Kaldir"
                  : "Hepsini Sec"}
              </button>

              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={() => handleBulkRespond("approved")}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-success text-success-foreground hover:bg-success/90 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Secilenleri Onayla ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => handleBulkRespond("rejected")}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Secilenleri Reddet ({selectedIds.size})
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <ClipboardIcon className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {requests.length === 0
                ? "Henuz talep bulunmuyor."
                : "Bu filtreye uygun talep yok."}
            </p>
          </div>
        )}

        {/* Request cards */}
        <div className="grid gap-3">
          {filtered.map((req) => {
            const config = statusConfig[req.status];
            const isResponding = respondingTo === req.id;
            const isSelected = selectedIds.has(req.id);

            return (
              <div
                key={req.id}
                className={`p-4 rounded-lg bg-card border transition-all ${
                  req.status === "pending" ? "border-warning/30" : "border-border"
                } ${isSelected ? "ring-2 ring-primary" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox for pending requests */}
                  {canApprove && req.status === "pending" && (
                    <button
                      onClick={() => toggleSelect(req.id)}
                      className="mt-1 shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  )}

                  {/* Status dot for non-pending */}
                  {req.status !== "pending" && (
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${config.dot}`}
                    />
                  )}

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Header with user info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-card-foreground">
                            {req.requesterName}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${config.bg} ${config.text} border ${config.border}`}
                          >
                            {config.label}
                          </span>
                        </div>

                        {/* User metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{req.requesterEmail}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="w-3.5 h-3.5" />
                            <span>{ROLE_LABELS[req.requesterRole as keyof typeof ROLE_LABELS] || req.requesterRole}</span>
                          </div>
                          {req.requesterDepartment && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Building className="w-3.5 h-3.5" />
                              <span>{req.requesterDepartment}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {new Date(req.createdAt).toLocaleString("tr-TR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Document reference - clickable */}
                    <button
                      onClick={() => setViewingRequest(req)}
                      className="flex items-center gap-2 text-xs text-primary hover:underline p-2 rounded-md hover:bg-primary/5 transition-colors w-full text-left"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-medium">
                        {req.documentTitle}
                      </span>
                    </button>

                    {/* Requester note */}
                    {req.requesterNote && (
                      <div className="flex items-start gap-2 p-3 rounded-md bg-secondary/50 border border-border">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground mb-1">
                            Talep Notu:
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {req.requesterNote}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Responder info */}
                    {req.responderName && (
                      <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
                        <MessageSquare className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-foreground">
                            {req.responderName}
                          </span>
                          {req.responderNote && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {req.responderNote}
                            </p>
                          )}
                          {req.respondedAt && (
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {new Date(req.respondedAt).toLocaleString("tr-TR")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons for analiz/admin */}
                    {canApprove && req.status === "pending" && (
                      <div className="pt-1">
                        {!isResponding ? (
                          <button
                            onClick={() => setRespondingTo(req.id)}
                            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            Cevapla
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={responseNote}
                              onChange={(e) => setResponseNote(e.target.value)}
                              placeholder="Not ekle (istege bagli)..."
                              className="w-full px-3 py-1.5 text-xs rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleRespond(req.id, "approved")
                                }
                                disabled={submitting}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-success text-success-foreground hover:bg-success/90 disabled:opacity-50 transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Onayla
                              </button>
                              <button
                                onClick={() =>
                                  handleRespond(req.id, "rejected")
                                }
                                disabled={submitting}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reddet
                              </button>
                              <button
                                onClick={() => {
                                  setRespondingTo(null);
                                  setResponseNote("");
                                }}
                                className="text-xs px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                              >
                                Iptal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Detail Modal */}
      {viewingRequest && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setViewingRequest(null)}
        >
          <div
            className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Talep Detayi
              </h3>
              <button
                onClick={() => setViewingRequest(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Talep Eden:
                </p>
                <p className="text-sm font-medium text-foreground">
                  {viewingRequest.requesterName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {viewingRequest.requesterEmail}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Dokuman:</p>
                <Link
                  href={`/dashboard/documents/${viewingRequest.documentId}`}
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => setViewingRequest(null)}
                >
                  {viewingRequest.documentTitle}
                </Link>
              </div>

              {viewingRequest.requesterNote && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Talep Notu:
                  </p>
                  <p className="text-sm text-foreground">
                    {viewingRequest.requesterNote}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <Link
                  href={`/dashboard/documents/${viewingRequest.documentId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  onClick={() => setViewingRequest(null)}
                >
                  <FileText className="w-4 h-4" />
                  Dokumana Git
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
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
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
