# Kansai Altan Analiz Laboratuvarı Yönetim Sistemi

Laboratuvar analiz raporlarını yönetmek, numune verilerini depolamak ve kullanıcı erişim taleplerini takip etmek için geliştirilmiş full-stack web uygulaması.

## 🚀 Özellikler

### Kullanıcı Yönetimi ve Yetkilendirme
- **Rol Tabanlı Erişim Kontrolü:**
  - **Admin**: Tüm sistem yönetimi, kullanıcı yönetimi, dosya yükleme
  - **Analiz Lab Üyesi**: Dosya yükleme, erişim taleplerini değerlendirme, tüm verilere erişim
  - **Lab Üyesi**: Kısıtlı veri görüntüleme, erişim talebi oluşturma

- **Kayıt ve Giriş Sistemi:**
  - Güvenli şifre hashleme (bcrypt)
  - Session tabanlı authentication
  - Kullanıcı profil yönetimi

### Döküman Yönetimi
- Excel dosyalarını upload etme ve otomatik parsing
- CSV formatında analiz raporlarını sisteme yükleme
- Döküman metadata görüntüleme
- Döküman bazlı not ekleme sistemi
- Analiz türlerine göre filtreleme

### Numune Yönetimi
- Analiz edilen numunelerin detaylı görüntülenmesi
- Numune bazlı yorumlar ve dipnotlar
- Çoklu analiz sonuçlarını organize etme
- Rol bazlı veri görünürlüğü (tam/kısıtlı)

### Erişim Talep Sistemi
- Lab üyeleri dökümanlar için erişim izni talep edebilir
- Analiz lab üyelerine otomatik bildirim gider
- Taleplere not ekleyerek yanıt verme
- Talep durumu takibi (Beklemede/Onaylandı/Reddedildi)

### Bildirim Sistemi
- Yeni erişim talebi bildirimleri
- Talep yanıtı bildirimleri
- Okundu/Okunmadı durumu takibi
- PostgreSQL trigger'lar ile otomatik bildirimler

### Admin Paneli
- Kullanıcı yönetimi (CRUD işlemleri)
- Rol ve laboratuvar atamaları
- Sistem istatistikleri
- Tüm döküman ve taleplere erişim

## 🛠️ Teknoloji Stack

### Frontend
- **Next.js 16** - React framework (App Router)
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI component library
- **SWR** - Data fetching ve caching
- **Sonner** - Toast notifications

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **PostgreSQL** - İlişkisel veritabanı
- **node-postgres (pg)** - PostgreSQL client
- **bcryptjs** - Şifre hashleme
- **uuid** - Benzersiz ID oluşturma

### Utilities
- **xlsx** - Excel dosya parsing
- **date-fns** - Tarih formatlaması
- **Lucide React** - İkonlar

## 📋 Ön Gereksinimler

- **Node.js** 18.x veya üzeri
- **PostgreSQL** 15.x veya üzeri
- **npm** veya **yarn** paket yöneticisi

## 🔧 Kurulum

### 1. Projeyi Klonlayın veya İndirin

```bash
git clone [repository-url]
cd kansai-altan-lab
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
# veya
yarn install
```

### 3. PostgreSQL Veritabanını Kurun

Detaylı veritabanı kurulum talimatları için **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** dosyasına bakın.

Kısa özet:
```bash
# PostgreSQL'e bağlanın
psql -U postgres

# Veritabanını oluşturun
CREATE DATABASE kansai_altan_lab;
\c kansai_altan_lab

# Şemayı kurun
\i scripts/setup-database.sql

# Çıkış
\q
```

### 4. Ortam Değişkenlerini Ayarlayın

`.env.local` dosyası oluşturun:

```bash
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/kansai_altan_lab
```

**ÖNEMLİ:** `yourpassword` kısmını kendi PostgreSQL şifrenizle değiştirin.

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
# veya
yarn dev
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

## 👤 Demo Kullanıcılar

Veritabanı kurulumu ile otomatik oluşturulan demo kullanıcılar:

| Rol | E-posta | Şifre | Yetkileri |
|-----|---------|-------|-----------|
| Admin | admin@kansaialtan.com | lab123456 | Tam yetki |
| Analiz Uzmanı | analiz1@kansaialtan.com | lab123456 | Upload, onaylama |
| Analiz Uzmanı | analiz2@kansaialtan.com | lab123456 | Upload, onaylama |
| Proses Mühendisi | proses@kansaialtan.com | lab123456 | Görüntüleme, talep |
| Otomotiv Uzmanı | otomotiv@kansaialtan.com | lab123456 | Görüntüleme, talep |

## 📁 Proje Yapısı

```
├── app/
│   ├── api/                    # API endpoints
│   │   ├── auth/              # Authentication routes
│   │   ├── documents/         # Document CRUD
│   │   ├── requests/          # Access request management
│   │   ├── users/             # User management
│   │   └── upload/            # File upload
│   ├── dashboard/             # Protected dashboard pages
│   │   ├── documents/         # Document pages
│   │   ├── profile/           # User profile & user management
│   │   ├── requests/          # Request management
│   │   └── upload/            # Upload page
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   └── layout.tsx             # Root layout
│
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── app-header.tsx         # Dashboard header
│   ├── app-sidebar.tsx        # Navigation sidebar
│   ├── sample-table.tsx       # Sample data display
│   └── user-management.tsx    # Admin user management
│
├── lib/
│   ├── auth.ts                # Authentication utilities
│   ├── auth-context.tsx       # Auth React context
│   ├── db.ts                  # PostgreSQL database functions
│   ├── excel-parser.ts        # Excel/CSV parsing logic
│   ├── types.ts               # TypeScript types
│   └── utils.ts               # Utility functions
│
├── scripts/
│   └── setup-database.sql     # Database schema & seed data
│
├── DATABASE_SETUP.md          # Veritabanı kurulum rehberi
└── README_TR.md               # Bu dosya
```

## 🗄️ Veritabanı Şeması

### Ana Tablolar

**users**
- Kullanıcı kimlik bilgileri ve rolleri
- Lab atamaları
- Departman bilgileri

**documents**
- Upload edilen analiz raporları
- Metadata (numune sayısı, analiz türleri)
- Durum takibi (processing/ready/error)

**samples**
- Döküman bazlı numune verileri
- JSON formatında analiz sonuçları
- Yorumlar ve notlar

**access_requests**
- Lab üyelerinden gelen erişim talepleri
- Talep durumu ve yanıtlar
- İletişim notları

**notifications**
- Kullanıcı bazlı bildirimler
- Otomatik trigger'lar ile oluşturulur
- Okundu durumu takibi

**document_notes**
- Döküman bazlı kullanıcı notları

**document_footnotes**
- Analiz raporu dipnotları

### Otomatik İşlemler (Triggers)

1. **Erişim Talebi Bildirimi:**
   - Yeni talep oluşturulduğunda tüm analiz lab üyelerine bildirim gider

2. **Talep Yanıtı Bildirimi:**
   - Talep onaylandığında/reddedildiğinde talep sahibine bildirim gider

3. **Zaman Damgası Güncelleme:**
   - Kullanıcı güncellendiğinde `updated_at` otomatik güncellenir

## 🔒 Güvenlik Özellikleri

- **Şifre Güvenliği:** bcrypt ile hash (10 rounds)
- **Session Management:** HTTP-only cookies
- **SQL Injection Koruması:** Parameterized queries
- **Role-Based Access Control:** Endpoint seviyesinde yetki kontrolü
- **Input Validation:** Client ve server-side validasyon

## 📊 Kullanım Senaryoları

### Senaryo 1: Analiz Raporu Yükleme
1. Admin veya Analiz Lab üyesi giriş yapar
2. `Upload` sayfasına gider
3. Excel/CSV dosyasını seçer
4. Sistem otomatik parse eder ve veritabanına kaydeder
5. Döküman metadata ile birlikte listelenir

### Senaryo 2: Erişim Talebi
1. Proses/Otomotiv lab üyesi dökümanları görüntüler
2. Detaylı veriye erişim için talep oluşturur
3. Tüm Analiz lab üyelerine bildirim gider
4. Analiz üyesi talebi görüntüler ve yanıt verir
5. Talep sahibine bildirim gider

### Senaryo 3: Kullanıcı Yönetimi
1. Admin `Profile` sayfasına gider
2. Kullanıcı Yönetimi bölümünü görür
3. Yeni kullanıcı ekler veya mevcut kullanıcıları düzenler
4. Rol ve laboratuvar atamaları yapar

## 🚢 Production'a Alma (Fabrika Sunucusu)

### Seçenek 1: Vercel'e Deploy (Önerilir)

```bash
# Vercel CLI kurulumu
npm i -g vercel

# Deploy
vercel --prod
```

### Seçenek 2: Fabrika İçi Sunucu

1. **Build Alma:**
```bash
npm run build
```

2. **Production Server Başlatma:**
```bash
npm start
```

3. **PM2 ile Sürekli Çalıştırma:**
```bash
npm i -g pm2
pm2 start npm --name "kansai-lab" -- start
pm2 save
pm2 startup
```

4. **Nginx Reverse Proxy (Opsiyonel):**
```nginx
server {
    listen 80;
    server_name lab.kansaialtan.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variables (Production)

```bash
# .env.production
DATABASE_URL=postgresql://user:password@server-ip:5432/kansai_altan_lab
NODE_ENV=production
```

## 🧪 Test Etme

### Manuel Test Adımları

1. **Authentication Test:**
   - Login/Logout işlevselliği
   - Yetkilendirilmemiş sayfalara erişim denemesi
   - Register ile yeni kullanıcı oluşturma

2. **Upload Test:**
   - Excel dosyası upload
   - CSV dosyası upload
   - Parsing doğruluğunu kontrol

3. **Access Request Test:**
   - Lab üyesi olarak talep oluşturma
   - Analiz üyesi olarak bildirim alma
   - Talebi onaylama/reddetme
   - Bildirim alma

4. **User Management Test:**
   - Admin olarak kullanıcı ekleme
   - Rol değiştirme
   - Kullanıcı silme

## 🐛 Sorun Giderme

### Veritabanı Bağlantı Hatası

```bash
# PostgreSQL servisinin çalıştığını kontrol edin
# Windows
services.msc

# Linux
sudo systemctl status postgresql

# Connection string'i kontrol edin
echo $DATABASE_URL
```

### Build Hataları

```bash
# Node modules'u temizle ve tekrar yükle
rm -rf node_modules package-lock.json
npm install

# Cache'i temizle
npm cache clean --force
```

### Port Zaten Kullanımda

```bash
# 3000 portunu kullanan process'i bulun
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Farklı port kullanın
PORT=3001 npm run dev
```

## 📝 Geliştirme Notları

### Yeni Özellik Ekleme

1. Veritabanı değişikliği gerekiyorsa:
   - `scripts/` altına yeni migration script ekleyin
   - SQL dosyasını çalıştırın

2. API endpoint ekleme:
   - `app/api/` altında yeni route oluşturun
   - Authentication kontrolü ekleyin
   - `lib/db.ts`'de gerekli database fonksiyonlarını ekleyin

3. UI component ekleme:
   - `components/` altında yeni component oluşturun
   - Mevcut shadcn/ui component'lerini kullanın
   - TypeScript types tanımlayın

### Code Style

- **TypeScript:** Strict mode
- **Formatting:** Prettier (otomatik)
- **Linting:** ESLint
- **Naming:** camelCase (functions), PascalCase (components)

## 📚 Ek Kaynaklar

- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Katkıda Bulunma

Bu proje Kansai Altan için geliştirilmiştir. Özellik talepleri veya hata raporları için lütfen iletişime geçin.

## 📄 Lisans

Bu proje Kansai Altan'a aittir. Tüm hakları saklıdır.

---

**Geliştirici Notu:** Bu sistem production'a alınmadan önce güvenlik testlerinden geçirilmeli ve performans optimizasyonu yapılmalıdır.
