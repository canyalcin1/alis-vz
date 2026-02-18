# Kansai Altan - Lab Yönetim Sistemi

Analiz laboratuvarı için kapsamlı doküman ve numune yönetim sistemi.

## Özellikler

- ✅ **Excel Parser**: 4 farklı Excel/CSV formatını otomatik tanır ve parse eder
  - Kolonlarda numune isimleri
  - Satırlarda analiz parametreleri  
  - "Solvent Kompozisyonu (%)" gibi bölüm başlıkları
  - "Analiz Yorum" satırları
  - Dipnotlar
  
- ✅ **Rol Tabanlı Erişim Kontrolü**:
  - **Admin**: Tüm işlemler + kullanıcı yönetimi
  - **Analiz Lab. Üyesi**: Dosya yükleme + onaylama + tam veri görüntüleme
  - **Lab. Üyesi**: Sadece onaylı dokümanları görüntüleme + erişim talebi gönderme (detaylı kompozisyon verileri gizli)

- ✅ **Güvenli Kimlik Doğrulama**:
  - bcryptjs ile şifrelenmiş parolalar
  - HTTP-only cookie tabanlı oturum yönetimi
  - Base64 encoded session tokens

- ✅ **Doküman Yönetimi**:
  - Drag-drop ile Excel yükleme
  - Otomatik parse ve yapılandırma
  - Numune detayları ve analizler
  - Not ekleme sistemi
  - Dipnotlar

- ✅ **Erişim Talepleri**:
  - Lab üyeleri kısıtlı dokümanlara erişim talebi gönderebilir
  - Admin ve Analiz üyeleri talepleri onaylayabilir/reddedebilir

## Teknolojiler

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS v4
- **Backend**: Next.js API Routes (sunucu tarafı)
- **Veritabanı**: JSON file-based (geliştirme için), PostgreSQL önerilir (production için)
- **Excel Parser**: xlsx kütüphanesi (sunucu tarafında)
- **UI Components**: Shadcn/ui + Lucide icons
- **Dil**: Türkçe

## Yerel Kurulum

### Gereksinimler
- Node.js 18+ 
- pnpm (önerilir) veya npm

### Adımlar

1. **Depoyu klonla veya ZIP indir**:
```bash
git clone <repo-url>
cd kansai-altan-lab
```

2. **Bağımlılıkları yükle**:
```bash
pnpm install
# veya
npm install
```

3. **Geliştirme sunucusunu başlat**:
```bash
pnpm dev
# veya
npm run dev
```

4. **Tarayıcıda aç**: http://localhost:3000

İlk çalıştırmada `data/` klasörü otomatik oluşturulur ve varsayılan kullanıcılar yüklenir.

## Varsayılan Kullanıcılar

| Email | Şifre | Rol |
|---|---|---|
| `admin@kansaialtan.com` | `lab123456` | Admin |
| `analiz@kansaialtan.com` | `lab123456` | Analiz Lab. Üyesi |
| `proses@kansaialtan.com` | `lab123456` | Lab. Üyesi |

## Proje Yapısı

```
├── app/
│   ├── api/              # API routes (backend)
│   │   ├── auth/         # Login, logout, me
│   │   ├── documents/    # Doküman CRUD
│   │   ├── requests/     # Erişim talepleri
│   │   ├── stats/        # Dashboard istatistikleri
│   │   └── upload/       # Excel yükleme ve parse
│   ├── dashboard/        # Ana uygulama sayfaları
│   │   ├── page.tsx      # Dashboard anasayfa
│   │   ├── upload/       # Dosya yükleme
│   │   ├── documents/    # Dokümanlar listesi ve detay
│   │   ├── requests/     # Talepler
│   │   └── profile/      # Kullanıcı profili
│   ├── login/            # Giriş sayfası
│   └── page.tsx          # Root (/ -> /dashboard redirect)
│
├── components/
│   ├── app-sidebar.tsx   # Sol menü
│   ├── app-header.tsx    # Üst başlık
│   ├── sample-table.tsx  # Numune verisi tablo
│   └── ui/               # Shadcn/ui bileşenleri (55 adet)
│
├── lib/
│   ├── auth.ts           # Kimlik doğrulama fonksiyonları
│   ├── auth-context.tsx  # React context (client-side)
│   ├── db.ts             # Veritabanı katmanı (JSON file-based)
│   ├── excel-parser.ts   # Excel parse motoru
│   ├── types.ts          # TypeScript tipleri
│   └── utils.ts          # Yardımcı fonksiyonlar
│
├── data/                 # JSON veritabanı (otomatik oluşur)
│   ├── users.json
│   ├── documents.json
│   ├── samples.json
│   ├── requests.json
│   └── footnotes.json
│
└── scripts/
    └── seed.js           # Seed data (ilk kurulumda otomatik çalışır)
```

## Backend Nasıl Çalışıyor?

**Backend servisi ayrı DEĞİL**, Next.js'in içinde çalışıyor:

- `app/api/**/route.ts` dosyaları **Next.js API Routes**
- Her request geldiğinde Node.js sunucusu bu route'ları çalıştırır
- Sunucu tarafında (server-side) çalıştıkları için:
  - `fs` modülüyle dosya okuma/yazma yapabilir
  - `bcryptjs` ile şifre hashleme yapabilir
  - `xlsx` ile Excel parse edebilir
  - Cookie okuma/yazma yapabilir

## Excel Parse Mantığı

Parser (`lib/excel-parser.ts`) 4 farklı formatı destekler:

1. **Format 1**: Kolonlarda numune isimleri, satırlarda analizler
2. **Format 2**: İlk satırda "Analizler" header'ı, sonra kolonlarda numuneler
3. **Format 3**: "Solvent Kompozisyonu (%)" gibi bölüm başlıkları
4. **Format 4**: "Analiz Yorum" satırı (ayrı yorumlar bölümü olarak)

Parser şunları yapar:
- İlk satırı başlık olarak tanır
- Boş satırları atlar
- "Analiz Yorum" satırını algılayıp yorumlar bölümü oluşturur
- Dipnot satırlarını (*ile başlayanlar) ayırır
- Her numune için bölümler halinde organize eder

## Rol Tabanlı Erişim Kontrolü

Sistem 3 katmanda kontrol yapar:

### 1. API Route Seviyesinde:
```typescript
// Her API route şunu kontrol eder:
const user = await getSession()
if (!user) return { error: "Yetkisiz" }

// Upload için:
if (!canUpload(user.role)) return { error: "Yetkiniz yok" }

// Tam veri görüntüleme için:
if (!canViewFullData(user.role)) {
  // Detaylı kompozisyon verilerini gizle
  samples = samples.map(s => maskSensitiveData(s))
}
```

### 2. Database Seviyesinde:
```typescript
// Lab üyeleri sadece kendi taleplerini görebilir:
if (user.role === "lab_member") {
  requests = requests.filter(r => r.requesterId === user.id)
}
```

### 3. UI Seviyesinde:
```typescript
// Butonları role göre gizle:
{user.role !== "lab_member" && (
  <button>Sil</button>
)}
```

## 20 Bin Excel İçin Production Hazırlığı

⚠️ **ÖNEMLİ**: Mevcut JSON file-based sistem 20,000+ Excel için **UYGUN DEĞİL**.

Production'a geçmek için **mutlaka** şunları yap:

1. **PostgreSQL'e geç** (Neon önerilir)
2. **Vercel Blob Storage** kullan (orijinal Excel dosyalarını saklamak için)
3. **Pagination ekle** (sayfa başına 50 doküman)
4. **Full-text search** ekle (başlık ve numune isimlerinde)
5. **Redis cache** ekle (sık erişilen veriler için)

Detaylı rehber: **[MIGRATION_TO_PRODUCTION.md](./MIGRATION_TO_PRODUCTION.md)**

### Hızlı Özet:

```bash
# 1. Neon PostgreSQL ekle (v0 Connect tab)
# 2. Migration SQL'i çalıştır (MIGRATION_TO_PRODUCTION.md'de)
# 3. lib/db.ts'i güncelle:

import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)

export async function getDocuments() {
  return await sql`SELECT * FROM documents ORDER BY uploaded_at DESC`
}

# 4. Batch import script'i çalıştır:
node scripts/batch-import.ts /path/to/20k/excel/files
```

## Maliyet Tahmini (20K Excel için)

- **Neon PostgreSQL**: $19/ay (Pro plan)
- **Vercel Blob Storage**: 4GB × $0.15 = $0.60/ay
- **Vercel Hosting**: $20/ay (Pro plan)

**Toplam: ~$40/ay** (20,000 dosya için)

## Geliştirme

### Yeni kullanıcı ekle:
```bash
# data/users.json'u manuel düzenle, veya:
node scripts/add-user.js "user@email.com" "password" "analiz_member"
```

### Excel parser test et:
```bash
node scripts/test-parser.js /path/to/test.xlsx
```

### Veritabanını sıfırla:
```bash
rm -rf data/
# Sonra uygulamayı yeniden başlat (otomatik seed çalışır)
```

## Güvenlik Notları

- ✅ Şifreler bcryptjs ile hashlenmiş (10 rounds)
- ✅ Session token'lar HTTP-only cookie'de
- ✅ Production'da `secure: true` (HTTPS only)
- ✅ Role-based access control tüm API route'larda
- ✅ File upload size limit (varsayılan 10MB - değiştirilebilir)
- ❌ Rate limiting YOK (production için ekle)
- ❌ CSRF protection YOK (Next.js middleware ile ekle)

## Bilinen Sınırlamalar

1. **20K+ dosya için JSON uygun değil** → PostgreSQL'e geç
2. **Orijinal Excel dosyaları saklanmıyor** → Blob storage ekle
3. **Rate limiting yok** → Middleware ekle
4. **Email doğrulama yok** → Manuel kullanıcı ekleniyor
5. **Şifre sıfırlama yok** → Admin manuel değiştiriyor
6. **Audit log yok** → Kimin ne zaman ne yaptığı loglanmıyor

## Lisans

MIT

## Destek

Sorular için: support@kansaialtan.com
#   a l i s - v z  
 #   a l i s - v z  
 