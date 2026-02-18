# Production Migration Guide - 20K+ Excel Files

## Current System Limitations

The current JSON file-based system is **NOT suitable for 20,000+ Excel files**:

- ❌ All data loaded into memory on each request
- ❌ No file locking (race conditions)
- ❌ Slow search/filtering
- ❌ Original Excel files not stored (only parsed data)
- ❌ No transaction support
- ❌ No indexing for fast queries

## Required Changes for Production Scale

### 1. Database Migration (CRITICAL)

**Use PostgreSQL (Neon recommended)**

#### Schema:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  lab VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(500) NOT NULL,
  title VARCHAR(500) NOT NULL,
  original_file_url TEXT, -- Vercel Blob storage URL
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'ready',
  notes JSONB DEFAULT '[]',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  sections JSONB NOT NULL, -- Store analysis sections as JSON
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_footnotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id),
  document_id UUID REFERENCES documents(id),
  status VARCHAR(50) DEFAULT 'pending',
  requester_note TEXT,
  responder_id UUID REFERENCES users(id),
  responder_name VARCHAR(255),
  responder_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_samples_document_id ON samples(document_id);
CREATE INDEX idx_samples_name ON samples(name);
CREATE INDEX idx_footnotes_document_id ON document_footnotes(document_id);
CREATE INDEX idx_requests_requester ON access_requests(requester_id);
CREATE INDEX idx_requests_status ON access_requests(status);

-- Full-text search on sample names and document titles
CREATE INDEX idx_documents_title_search ON documents USING gin(to_tsvector('turkish', title));
CREATE INDEX idx_samples_name_search ON samples USING gin(to_tsvector('turkish', name));
```

#### Migration Steps:

1. **Add Neon Integration** in v0 (Connect tab)
2. **Run migration SQL** above in Neon dashboard
3. **Update `lib/db.ts`** to use `@neondatabase/serverless`:

```typescript
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function getDocuments(): Promise<Document[]> {
  const rows = await sql`SELECT * FROM documents ORDER BY uploaded_at DESC`
  return rows as Document[]
}

export async function createDocument(doc: Document): Promise<void> {
  await sql`
    INSERT INTO documents (id, file_name, title, original_file_url, uploaded_by, uploaded_at, status, notes, metadata)
    VALUES (${doc.id}, ${doc.fileName}, ${doc.title}, ${doc.originalFileUrl || null}, ${doc.uploadedBy}, ${doc.uploadedAt}, ${doc.status}, ${JSON.stringify(doc.notes)}, ${JSON.stringify(doc.metadata)})
  `
}

// ... update all other db functions
```

### 2. File Storage (CRITICAL)

**Store original Excel files in Vercel Blob Storage**

#### Why?
- Parse edilen datada hata varsa orijinal dosyaya donebilirsin
- Kullanicilar orijinal dosyayi indirebilir
- Yeniden parse gerektiginde (algorithm guncellemesi) dosya hazir

#### Implementation:

1. **Add Vercel Blob Integration** in v0
2. **Update upload API** (`app/api/upload/route.ts`):

```typescript
import { put } from '@vercel/blob'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || !canUpload(user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  
  // 1. Upload original file to Blob storage
  const blob = await put(file.name, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  // 2. Parse Excel
  const buffer = Buffer.from(await file.arrayBuffer())
  const parsed = parseExcelBuffer(buffer)

  // 3. Save to database with blob URL
  const doc: Document = {
    id: uuid(),
    fileName: file.name,
    title: parsed.title || file.name.replace(/\.[^.]+$/, ""),
    originalFileUrl: blob.url, // ← Store blob URL
    uploadedBy: user.id,
    uploadedAt: new Date().toISOString(),
    status: "ready",
    notes: [],
    metadata: {
      sampleCount: parsed.samples.length,
      analysisTypes: parsed.analysisTypes,
    },
  }

  await createDocument(doc)
  // ... rest of code
}
```

3. **Add download endpoint** (`app/api/documents/[id]/download/route.ts`):

```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })

  const doc = await getDocumentById(params.id)
  if (!doc || !doc.originalFileUrl) {
    return NextResponse.json({ error: "Dosya bulunamadi." }, { status: 404 })
  }

  // Redirect to blob storage URL
  return NextResponse.redirect(doc.originalFileUrl)
}
```

### 3. Batch Import for 20K Excel Files

**Create a batch import script** (`scripts/batch-import.ts`):

```typescript
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { parseExcelBuffer } from '../lib/excel-parser'
import { put } from '@vercel/blob'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function batchImport(folderPath: string) {
  const files = await readdir(folderPath)
  const excelFiles = files.filter(f => f.match(/\.(xlsx?|csv)$/i))
  
  console.log(`Found ${excelFiles.length} Excel files`)
  
  let processed = 0
  let failed = 0

  for (const fileName of excelFiles) {
    try {
      const filePath = join(folderPath, fileName)
      const buffer = await readFile(filePath)
      
      // 1. Upload to Blob
      const blob = await put(fileName, buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN!,
      })
      
      // 2. Parse
      const parsed = parseExcelBuffer(buffer)
      
      // 3. Insert to DB
      const docId = crypto.randomUUID()
      await sql`
        INSERT INTO documents (id, file_name, title, original_file_url, uploaded_by, status, metadata)
        VALUES (
          ${docId},
          ${fileName},
          ${parsed.title || fileName},
          ${blob.url},
          ${ADMIN_USER_ID}, -- Your admin user ID
          'ready',
          ${JSON.stringify({ sampleCount: parsed.samples.length })}
        )
      `
      
      // 4. Insert samples
      for (const sample of parsed.samples) {
        await sql`
          INSERT INTO samples (id, document_id, name, sections, comment)
          VALUES (
            ${crypto.randomUUID()},
            ${docId},
            ${sample.name},
            ${JSON.stringify(sample.sections)},
            ${sample.comment}
          )
        `
      }
      
      processed++
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${excelFiles.length}`)
      }
      
    } catch (err) {
      console.error(`Failed to import ${fileName}:`, err)
      failed++
    }
  }
  
  console.log(`Done! Processed: ${processed}, Failed: ${failed}`)
}

// Usage: node scripts/batch-import.ts /path/to/excel/folder
batchImport(process.argv[2])
```

### 4. Performance Optimizations

#### Pagination for Documents List:

```typescript
export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })
  
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = (page - 1) * limit
  
  const docs = await sql`
    SELECT * FROM documents 
    ORDER BY uploaded_at DESC 
    LIMIT ${limit} OFFSET ${offset}
  `
  
  const [{ count }] = await sql`SELECT COUNT(*) as count FROM documents`
  
  return NextResponse.json({
    documents: docs,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  })
}
```

#### Search with Full-Text:

```typescript
export async function GET(req: Request) {
  const url = new URL(req.url)
  const query = url.searchParams.get('q')
  
  if (query) {
    const docs = await sql`
      SELECT * FROM documents
      WHERE to_tsvector('turkish', title) @@ plainto_tsquery('turkish', ${query})
      ORDER BY uploaded_at DESC
      LIMIT 50
    `
    return NextResponse.json({ documents: docs })
  }
  
  // ... normal list
}
```

### 5. Caching with Redis (Optional but Recommended)

For frequently accessed data:

```typescript
import { kv } from '@vercel/kv' // or Upstash Redis

export async function getDocuments() {
  const cacheKey = 'documents:recent:50'
  const cached = await kv.get(cacheKey)
  if (cached) return cached
  
  const docs = await sql`SELECT * FROM documents ORDER BY uploaded_at DESC LIMIT 50`
  await kv.set(cacheKey, docs, { ex: 60 }) // cache 60 seconds
  return docs
}
```

## Summary: Migration Checklist

- [ ] Add Neon PostgreSQL integration
- [ ] Run migration SQL schema
- [ ] Update `lib/db.ts` to use Neon SQL client
- [ ] Add Vercel Blob integration
- [ ] Update upload API to store files in Blob
- [ ] Create batch import script for 20K files
- [ ] Add pagination to documents list
- [ ] Add full-text search
- [ ] (Optional) Add Redis caching for hot data
- [ ] Update Document type to include `originalFileUrl?: string`
- [ ] Test with subset of files first (100-500)
- [ ] Run full batch import
- [ ] Monitor performance and adjust indexes

## Cost Estimation (Vercel + Neon + Blob)

**20,000 Excel files** (avg 200KB each = 4GB total):

- **Neon PostgreSQL**: Free tier → $19/month (Pro)
- **Vercel Blob**: $0.15/GB/month = $0.60/month for 4GB
- **Next.js Hosting**: Hobby free → Pro $20/month (for production)

**Total: ~$40/month** for 20K files with decent performance.

## Alternative: Keep JSON for Demo, DB for Production

You can keep the current JSON system for development/demo, and only use PostgreSQL + Blob in production:

```typescript
// lib/db.ts
const USE_POSTGRES = process.env.DATABASE_URL !== undefined

export async function getDocuments() {
  if (USE_POSTGRES) {
    return await sql`SELECT * FROM documents ORDER BY uploaded_at DESC`
  } else {
    // Current JSON implementation
    return await readJSON<Document>("documents.json")
  }
}
```

This way you don't need to pay for hosting during development.
