export type Lab = "analiz" | "proses" | "otomotiv" | "admin"
export type Role = "admin" | "analiz_member" | "lab_member"

export interface User {
  id: string
  email: string
  passwordHash: string
  name: string
  lab: Lab
  role: Role
  department: string
  createdAt: string
  updatedAt: string
}

export type SafeUser = Omit<User, "passwordHash">

export interface Document {
  id: string
  fileName: string
  title: string
  originalFileUrl?: string // Vercel Blob storage URL for original Excel file
  uploadedBy: string
  uploadedAt: string
  status: "processing" | "ready" | "error"
  notes: DocumentNote[]
  metadata: {
    sampleCount: number
    analysisTypes: string[]
  }
}

export interface DocumentNote {
  id: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

export interface Sample {
  id: string
  documentId: string
  name: string
  sections: SampleSection[]
  comment: string | null
}

export interface SampleSection {
  title: string
  rows: AnalysisRow[]
}

export interface AnalysisRow {
  parameter: string
  value: string
}

export interface AccessRequest {
  id: string
  requesterId: string
  requesterName: string
  documentId: string
  documentTitle: string
  status: "pending" | "approved" | "rejected"
  requesterNote: string | null
  responderId: string | null
  responderName: string | null
  responderNote: string | null
  createdAt: string
  respondedAt: string | null
}

export interface DocumentFootnote {
  id: string
  documentId: string
  text: string
  order: number
}

export interface ParsedExcelResult {
  title: string
  samples: Omit<Sample, "id" | "documentId">[]
  footnotes: string[]
  analysisTypes: string[]
}

export const LAB_LABELS: Record<Lab, string> = {
  analiz: "Analiz Laboratuvari",
  proses: "Proses Laboratuvari",
  otomotiv: "Otomotiv Laboratuvari",
  admin: "Yonetim",
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  analiz_member: "Analiz Lab. Uyesi",
  lab_member: "Laboratuvar Uyesi",
}

export interface Notification {
  id: string
  userId: string
  type: "access_request" | "request_approved" | "request_rejected"
  title: string
  message: string
  relatedRequestId: string | null
  isRead: boolean
  createdAt: string
}
