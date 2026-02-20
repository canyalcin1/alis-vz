import { Pool } from "pg"
import type {
  User,
  Document,
  Sample,
  AccessRequest,
  DocumentFootnote,
  DocumentNote,
  Notification,
} from "./types"

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For local development with SSL disabled
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Test connection
pool.on("error", (err) => {
  console.error("[v0] Unexpected database error:", err)
})

// Helper to execute queries
async function query<T>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

// Users
export async function getUsers(): Promise<User[]> {
  const rows = await query<any>(
    "SELECT id, email, password_hash as \"passwordHash\", name, lab, role, department, created_at as \"createdAt\", updated_at as \"updatedAt\" FROM users ORDER BY created_at DESC"
  )
  return rows
}

export async function getUserById(id: string): Promise<User | undefined> {
  const rows = await query<any>(
    "SELECT id, email, password_hash as \"passwordHash\", name, lab, role, department, created_at as \"createdAt\", updated_at as \"updatedAt\" FROM users WHERE id = $1",
    [id]
  )
  return rows[0]
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const rows = await query<any>(
    "SELECT id, email, password_hash as \"passwordHash\", name, lab, role, department, created_at as \"createdAt\", updated_at as \"updatedAt\" FROM users WHERE LOWER(email) = LOWER($1)",
    [email]
  )
  return rows[0]
}

export async function createUser(user: User): Promise<User> {
  const rows = await query<any>(
    `INSERT INTO users (id, email, password_hash, name, lab, role, department, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING id, email, password_hash as "passwordHash", name, lab, role, department, created_at as "createdAt", updated_at as "updatedAt"`,
    [
      user.id,
      user.email,
      user.passwordHash,
      user.name,
      user.lab,
      user.role,
      user.department,
      user.createdAt,
      user.updatedAt,
    ]
  )
  return rows[0]
}

export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<User | undefined> {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`)
    values.push(updates.email)
  }
  if (updates.passwordHash !== undefined) {
    fields.push(`password_hash = $${paramIndex++}`)
    values.push(updates.passwordHash)
  }
  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`)
    values.push(updates.name)
  }
  if (updates.lab !== undefined) {
    fields.push(`lab = $${paramIndex++}`)
    values.push(updates.lab)
  }
  if (updates.role !== undefined) {
    fields.push(`role = $${paramIndex++}`)
    values.push(updates.role)
  }
  if (updates.department !== undefined) {
    fields.push(`department = $${paramIndex++}`)
    values.push(updates.department)
  }

  if (fields.length === 0) return getUserById(id)

  values.push(id)
  const rows = await query<any>(
    `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramIndex} 
     RETURNING id, email, password_hash as "passwordHash", name, lab, role, department, created_at as "createdAt", updated_at as "updatedAt"`,
    values
  )
  return rows[0]
}

export async function deleteUser(id: string): Promise<boolean> {
  const rows = await query("DELETE FROM users WHERE id = $1 RETURNING id", [id])
  return rows.length > 0
}

// Documents
export async function getDocuments(): Promise<Document[]> {
  const rows = await query<any>(
    `SELECT 
      d.id, 
      d.file_name as "fileName", 
      d.title, 
      d.uploaded_by as "uploadedBy", 
      d.uploaded_at as "uploadedAt", 
      d.status,
      d.sample_count as "sampleCount",
      d.analysis_types as "analysisTypes",
      COALESCE(
        json_agg(
          json_build_object(
            'id', dn.id,
            'userId', dn.user_id,
            'userName', dn.user_name,
            'text', dn.text,
            'createdAt', dn.created_at
          ) ORDER BY dn.created_at DESC
        ) FILTER (WHERE dn.id IS NOT NULL),
        '[]'
      ) as notes
    FROM documents d
    LEFT JOIN document_notes dn ON d.id = dn.document_id
    GROUP BY d.id
    ORDER BY d.uploaded_at DESC`
  )

  return rows.map((row) => ({
    ...row,
    metadata: {
      sampleCount: row.sampleCount || 0,
      analysisTypes: row.analysisTypes || [],
    },
  }))
}

export async function getDocumentById(id: string): Promise<Document | undefined> {
  const rows = await query<any>(
    `SELECT 
      d.id, 
      d.file_name as "fileName", 
      d.title, 
      d.uploaded_by as "uploadedBy", 
      d.uploaded_at as "uploadedAt", 
      d.status,
      d.sample_count as "sampleCount",
      d.analysis_types as "analysisTypes",
      COALESCE(
        json_agg(
          json_build_object(
            'id', dn.id,
            'userId', dn.user_id,
            'userName', dn.user_name,
            'text', dn.text,
            'createdAt', dn.created_at
          ) ORDER BY dn.created_at DESC
        ) FILTER (WHERE dn.id IS NOT NULL),
        '[]'
      ) as notes
    FROM documents d
    LEFT JOIN document_notes dn ON d.id = dn.document_id
    WHERE d.id = $1
    GROUP BY d.id`,
    [id]
  )

  if (rows.length === 0) return undefined

  const row = rows[0]
  return {
    ...row,
    metadata: {
      sampleCount: row.sampleCount || 0,
      analysisTypes: row.analysisTypes || [],
    },
  }
}

// YENİ: Sadece indirme işlemi yapıldığında büyük dosya verisini çeken fonksiyon
export async function getDocumentFileContent(id: string): Promise<{ fileContent: string; fileName: string } | undefined> {
  const rows = await query<any>(
    `SELECT file_content as "fileContent", file_name as "fileName" FROM documents WHERE id = $1`,
    [id]
  )
  return rows[0]
}

export async function createDocument(doc: Document): Promise<Document> {
  const rows = await query<any>(
    `INSERT INTO documents (id, file_name, title, file_content, uploaded_by, uploaded_at, status, sample_count, analysis_types) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING id, file_name as "fileName", title, uploaded_by as "uploadedBy", 
               uploaded_at as "uploadedAt", status, sample_count as "sampleCount", analysis_types as "analysisTypes"`,
    [
      doc.id,
      doc.fileName,
      doc.title,
      doc.fileContent || null, // Base64 verisi buraya gidiyor
      doc.uploadedBy,
      doc.uploadedAt,
      doc.status,
      doc.metadata.sampleCount,
      doc.metadata.analysisTypes,
    ]
  )
  return {
    ...rows[0],
    notes: [],
    metadata: {
      sampleCount: rows[0].sampleCount || 0,
      analysisTypes: rows[0].analysisTypes || [],
    },
  }
}

export async function updateDocument(
  id: string,
  updates: Partial<Document>
): Promise<Document | undefined> {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.fileName !== undefined) {
    fields.push(`file_name = $${paramIndex++}`)
    values.push(updates.fileName)
  }
  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`)
    values.push(updates.title)
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`)
    values.push(updates.status)
  }
  if (updates.metadata !== undefined) {
    if (updates.metadata.sampleCount !== undefined) {
      fields.push(`sample_count = $${paramIndex++}`)
      values.push(updates.metadata.sampleCount)
    }
    if (updates.metadata.analysisTypes !== undefined) {
      fields.push(`analysis_types = $${paramIndex++}`)
      values.push(updates.metadata.analysisTypes)
    }
  }

  if (fields.length === 0) return getDocumentById(id)

  values.push(id)
  const rows = await query<any>(
    `UPDATE documents SET ${fields.join(", ")} 
     WHERE id = $${paramIndex} 
     RETURNING id, file_name as "fileName", title, 
               uploaded_by as "uploadedBy", uploaded_at as "uploadedAt", status, 
               sample_count as "sampleCount", analysis_types as "analysisTypes"`,
    values
  )

  if (rows.length === 0) return undefined

  return {
    ...rows[0],
    notes: [],
    metadata: {
      sampleCount: rows[0].sampleCount || 0,
      analysisTypes: rows[0].analysisTypes || [],
    },
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  const rows = await query("DELETE FROM documents WHERE id = $1 RETURNING id", [id])
  return rows.length > 0
}

export async function addDocumentNote(
  documentId: string,
  userId: string,
  userName: string,
  text: string
): Promise<DocumentNote> {
  const rows = await query<any>(
    `INSERT INTO document_notes (document_id, user_id, user_name, text) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, document_id as "documentId", user_id as "userId", user_name as "userName", text, created_at as "createdAt"`,
    [documentId, userId, userName, text]
  )
  return rows[0]
}

// Samples
export async function getSamples(): Promise<Sample[]> {
  const rows = await query<any>(
    "SELECT id, document_id as \"documentId\", name, sections, comment FROM samples ORDER BY name"
  )
  return rows
}

export async function getSamplesByDocumentId(documentId: string): Promise<Sample[]> {
  const rows = await query<any>(
    "SELECT id, document_id as \"documentId\", name, sections, comment FROM samples WHERE document_id = $1 ORDER BY name",
    [documentId]
  )
  return rows
}

export async function createSamples(newSamples: Sample[]): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    for (const sample of newSamples) {
      await client.query(
        "INSERT INTO samples (id, document_id, name, sections, comment) VALUES ($1, $2, $3, $4, $5)",
        [sample.id, sample.documentId, sample.name, JSON.stringify(sample.sections), sample.comment]
      )
    }
    await client.query("COMMIT")
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

// Requests
export async function getRequests(): Promise<AccessRequest[]> {
  const rows = await query<any>(
    `SELECT 
      ar.id, 
      ar.requester_id as "requesterId", 
      ar.requester_name as "requesterName", 
      u.email as "requesterEmail",
      u.role as "requesterRole",
      u.department as "requesterDepartment",
      ar.document_id as "documentId", 
      ar.document_title as "documentTitle", 
      ar.status, 
      ar.requester_note as "requesterNote", 
      ar.responder_id as "responderId", 
      ar.responder_name as "responderName", 
      ar.responder_note as "responderNote", 
      ar.created_at as "createdAt", 
      ar.responded_at as "respondedAt" 
    FROM access_requests ar
    LEFT JOIN users u ON u.id = ar.requester_id
    ORDER BY ar.created_at DESC`
  )
  return rows
}

export async function getRequestById(id: string): Promise<AccessRequest | undefined> {
  const rows = await query<any>(
    `SELECT id, requester_id as "requesterId", requester_name as "requesterName", 
            document_id as "documentId", document_title as "documentTitle", status, 
            requester_note as "requesterNote", responder_id as "responderId", 
            responder_name as "responderName", responder_note as "responderNote", 
            created_at as "createdAt", responded_at as "respondedAt" 
     FROM access_requests WHERE id = $1`,
    [id]
  )
  return rows[0]
}

export async function createRequest(req: AccessRequest): Promise<AccessRequest> {
  const rows = await query<any>(
    `INSERT INTO access_requests (id, requester_id, requester_name, document_id, document_title, status, requester_note, created_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING id, requester_id as "requesterId", requester_name as "requesterName", 
               document_id as "documentId", document_title as "documentTitle", status, 
               requester_note as "requesterNote", responder_id as "responderId", 
               responder_name as "responderName", responder_note as "responderNote", 
               created_at as "createdAt", responded_at as "respondedAt"`,
    [
      req.id,
      req.requesterId,
      req.requesterName,
      req.documentId,
      req.documentTitle,
      req.status,
      req.requesterNote,
      req.createdAt,
    ]
  )
  return rows[0]
}

export async function updateRequest(
  id: string,
  updates: Partial<AccessRequest>
): Promise<AccessRequest | undefined> {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`)
    values.push(updates.status)
  }
  if (updates.responderId !== undefined) {
    fields.push(`responder_id = $${paramIndex++}`)
    values.push(updates.responderId)
  }
  if (updates.responderName !== undefined) {
    fields.push(`responder_name = $${paramIndex++}`)
    values.push(updates.responderName)
  }
  if (updates.responderNote !== undefined) {
    fields.push(`responder_note = $${paramIndex++}`)
    values.push(updates.responderNote)
  }
  if (updates.respondedAt !== undefined) {
    fields.push(`responded_at = $${paramIndex++}`)
    values.push(updates.respondedAt)
  }

  if (fields.length === 0) return getRequestById(id)

  values.push(id)
  const rows = await query<any>(
    `UPDATE access_requests SET ${fields.join(", ")} 
     WHERE id = $${paramIndex} 
     RETURNING id, requester_id as "requesterId", requester_name as "requesterName", 
               document_id as "documentId", document_title as "documentTitle", status, 
               requester_note as "requesterNote", responder_id as "responderId", 
               responder_name as "responderName", responder_note as "responderNote", 
               created_at as "createdAt", responded_at as "respondedAt"`,
    values
  )
  return rows[0]
}

// Footnotes
export async function getFootnotes(): Promise<DocumentFootnote[]> {
  const rows = await query<any>(
    `SELECT id, document_id as "documentId", text, "order" FROM document_footnotes ORDER BY "order"`
  )
  return rows
}

export async function getFootnotesByDocumentId(
  documentId: string
): Promise<DocumentFootnote[]> {
  const rows = await query<any>(
    `SELECT id, document_id as "documentId", text, "order" FROM document_footnotes WHERE document_id = $1 ORDER BY "order"`,
    [documentId]
  )
  return rows
}

export async function createFootnotes(newFootnotes: DocumentFootnote[]): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    for (const footnote of newFootnotes) {
      await client.query(
        'INSERT INTO document_footnotes (id, document_id, text, "order") VALUES ($1, $2, $3, $4)',
        [footnote.id, footnote.documentId, footnote.text, footnote.order]
      )
    }
    await client.query("COMMIT")
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

// Notifications
export async function getNotificationsByUserId(userId: string): Promise<Notification[]> {
  const rows = await query<any>(
    `SELECT id, user_id as "userId", type, title, message, related_request_id as "relatedRequestId", 
            is_read as "isRead", created_at as "createdAt" 
     FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  )
  return rows
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const rows = await query(
    "UPDATE notifications SET is_read = true WHERE id = $1 RETURNING id",
    [id]
  )
  return rows.length > 0
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const rows = await query(
    "UPDATE notifications SET is_read = true WHERE user_id = $1 RETURNING id",
    [userId]
  )
  return rows.length > 0
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const rows = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false",
    [userId]
  )
  return parseInt(rows[0]?.count || "0", 10)
}

// Get approved documents for a user
export async function getApprovedDocumentsForUser(userId: string): Promise<any[]> {
  const rows = await query<any>(
    `SELECT 
      d.id,
      d.file_name as "fileName",
      d.title,
      d.uploaded_by as "uploadedBy",
      d.uploaded_at as "uploadedAt",
      d.status,
      d.metadata,
      ar.responded_at as "approvedAt",
      u.name as "responderName"
    FROM analyses d
    INNER JOIN access_requests ar ON ar.document_id = d.id
    INNER JOIN users u ON u.id = ar.responder_id
    WHERE ar.requester_id = $1 AND ar.status = 'approved'
    ORDER BY ar.responded_at DESC`,
    [userId]
  )
  return rows
}