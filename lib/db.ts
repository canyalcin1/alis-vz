import { promises as fs } from "fs"
import path from "path"
import bcrypt from "bcryptjs"
import { v4 as uuid } from "uuid"
import type {
  User,
  Document,
  Sample,
  AccessRequest,
  DocumentFootnote,
} from "./types"

const DATA_DIR = path.join(process.cwd(), "data")

let seeded = false

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }

  if (!seeded) {
    seeded = true
    const usersPath = path.join(DATA_DIR, "users.json")
    try {
      await fs.access(usersPath)
    } catch {
      // Auto-seed on first run
      const password = "lab123456"
      const hash = bcrypt.hashSync(password, 10)
      const now = new Date().toISOString()
      const users: User[] = [
        {
          id: uuid(),
          email: "admin@kansaialtan.com",
          passwordHash: hash,
          name: "Admin Kullanici",
          lab: "admin",
          role: "admin",
          department: "Yonetim",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuid(),
          email: "analiz@kansaialtan.com",
          passwordHash: hash,
          name: "Analiz Uzmani",
          lab: "analiz",
          role: "analiz_member",
          department: "Analiz Laboratuvari",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuid(),
          email: "proses@kansaialtan.com",
          passwordHash: hash,
          name: "Proses Muhendisi",
          lab: "proses",
          role: "lab_member",
          department: "Proses Laboratuvari",
          createdAt: now,
          updatedAt: now,
        },
      ]
      await fs.writeFile(usersPath, JSON.stringify(users, null, 2))
      const emptyFiles = ["documents.json", "samples.json", "requests.json", "footnotes.json"]
      for (const f of emptyFiles) {
        const p = path.join(DATA_DIR, f)
        try { await fs.access(p) } catch { await fs.writeFile(p, "[]") }
      }
    }
  }
}

async function readJSON<T>(fileName: string): Promise<T[]> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, fileName)
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeJSON<T>(fileName: string, data: T[]): Promise<void> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, fileName)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
}

// Users
export async function getUsers(): Promise<User[]> {
  return readJSON<User>("users.json")
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getUsers()
  return users.find((u) => u.id === id)
}

export async function getUserByEmail(
  email: string
): Promise<User | undefined> {
  const users = await getUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export async function createUser(user: User): Promise<User> {
  const users = await getUsers()
  users.push(user)
  await writeJSON("users.json", users)
  return user
}

export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<User | undefined> {
  const users = await getUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return undefined
  users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() }
  await writeJSON("users.json", users)
  return users[idx]
}

// Documents
export async function getDocuments(): Promise<Document[]> {
  return readJSON<Document>("documents.json")
}

export async function getDocumentById(
  id: string
): Promise<Document | undefined> {
  const docs = await getDocuments()
  return docs.find((d) => d.id === id)
}

export async function createDocument(doc: Document): Promise<Document> {
  const docs = await getDocuments()
  docs.push(doc)
  await writeJSON("documents.json", docs)
  return doc
}

export async function updateDocument(
  id: string,
  updates: Partial<Document>
): Promise<Document | undefined> {
  const docs = await getDocuments()
  const idx = docs.findIndex((d) => d.id === id)
  if (idx === -1) return undefined
  docs[idx] = { ...docs[idx], ...updates }
  await writeJSON("documents.json", docs)
  return docs[idx]
}

export async function deleteDocument(id: string): Promise<boolean> {
  const docs = await getDocuments()
  const filtered = docs.filter((d) => d.id !== id)
  if (filtered.length === docs.length) return false
  await writeJSON("documents.json", filtered)
  // Also delete associated samples and footnotes
  const samples = await getSamples()
  await writeJSON(
    "samples.json",
    samples.filter((s) => s.documentId !== id)
  )
  const footnotes = await getFootnotes()
  await writeJSON(
    "footnotes.json",
    footnotes.filter((f) => f.documentId !== id)
  )
  return true
}

// Samples
export async function getSamples(): Promise<Sample[]> {
  return readJSON<Sample>("samples.json")
}

export async function getSamplesByDocumentId(
  documentId: string
): Promise<Sample[]> {
  const samples = await getSamples()
  return samples.filter((s) => s.documentId === documentId)
}

export async function createSamples(newSamples: Sample[]): Promise<void> {
  const samples = await getSamples()
  samples.push(...newSamples)
  await writeJSON("samples.json", samples)
}

// Requests
export async function getRequests(): Promise<AccessRequest[]> {
  return readJSON<AccessRequest>("requests.json")
}

export async function getRequestById(
  id: string
): Promise<AccessRequest | undefined> {
  const reqs = await getRequests()
  return reqs.find((r) => r.id === id)
}

export async function createRequest(
  req: AccessRequest
): Promise<AccessRequest> {
  const reqs = await getRequests()
  reqs.push(req)
  await writeJSON("requests.json", reqs)
  return req
}

export async function updateRequest(
  id: string,
  updates: Partial<AccessRequest>
): Promise<AccessRequest | undefined> {
  const reqs = await getRequests()
  const idx = reqs.findIndex((r) => r.id === id)
  if (idx === -1) return undefined
  reqs[idx] = { ...reqs[idx], ...updates }
  await writeJSON("requests.json", reqs)
  return reqs[idx]
}

// Footnotes
export async function getFootnotes(): Promise<DocumentFootnote[]> {
  return readJSON<DocumentFootnote>("footnotes.json")
}

export async function getFootnotesByDocumentId(
  documentId: string
): Promise<DocumentFootnote[]> {
  const footnotes = await getFootnotes()
  return footnotes
    .filter((f) => f.documentId === documentId)
    .sort((a, b) => a.order - b.order)
}

export async function createFootnotes(
  newFootnotes: DocumentFootnote[]
): Promise<void> {
  const footnotes = await getFootnotes()
  footnotes.push(...newFootnotes)
  await writeJSON("footnotes.json", footnotes)
}
