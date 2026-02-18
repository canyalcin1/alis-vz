# Kansai Altan Lab Analiz Sistemi - Kurulum Rehberi

## 🚀 Hızlı Başlangıç

Bu rehber, sistemi fabrika içindeki SQL Server'a entegre etmeden önce local PostgreSQL ile test etmeniz için hazırlanmıştır.

---

## 📋 Gereksinimler

1. **Node.js** (v18 veya üzeri)
2. **PostgreSQL** (v14 veya üzeri)
3. **IDE/Editor** (VS Code, WebStorm, DataGrip vb.)

---

## 🔧 Adım 1: PostgreSQL Kurulumu

### Windows İçin:

1. **PostgreSQL İndir**: https://www.postgresql.org/download/windows/
   - PostgreSQL 16.x sürümünü indirin
   - Kurulum sırasında şifre belirleyin (örn: `postgres123`)
   - Port: 5432 (varsayılan)

2. **Kurulum Tamamlandıktan Sonra**:
   - pgAdmin 4 otomatik olarak kurulacaktır
   - pgAdmin'i açın ve belirlediğiniz şifre ile giriş yapın

---

## 🗄️ Adım 2: Veritabanı Oluşturma

### Yöntem 1: pgAdmin ile (Görsel Arayüz)

1. **pgAdmin 4'ü Açın**
2. Sol panelde **PostgreSQL 16** > Sağ tık > **Servers**
3. **Databases** üzerine sağ tık > **Create** > **Database**
4. Veritabanı adı: `kansai_lab`
5. Owner: `postgres`
6. **Save** butonuna tıklayın

### Yöntem 2: SQL ile (Komut Satırı)

```bash
# Windows Komut İstemi veya PowerShell'de:
psql -U postgres

# PostgreSQL konsolunda:
CREATE DATABASE kansai_lab;
\q
```

---

## ⚙️ Adım 3: Proje Kurulumu

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Dosyası Oluşturun

Proje kök dizininde `.env` dosyası oluşturun:

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/kansai_lab
```

**Not**: `postgres123` kısmını kendi PostgreSQL şifrenizle değiştirin!

---

## 🎯 Adım 4: Veritabanı Şemasını Oluşturma

### Yöntem 1: pgAdmin ile (ÖNERİLEN)

1. **pgAdmin 4'ü açın**
2. Sol panelde **kansai_lab** veritabanını seçin
3. Üst menüden **Tools** > **Query Tool**
4. `scripts/setup-database.sql` dosyasını açın (VS Code veya Notepad ile)
5. Tüm içeriği kopyalayın
6. pgAdmin Query Tool'a yapıştırın
7. **Execute (F5)** tuşuna basın
8. "Query returned successfully" mesajını görmelisiniz

### Yöntem 2: Komut Satırı ile

```bash
# Windows PowerShell veya CMD'de:
psql -U postgres -d kansai_lab -f scripts/setup-database.sql
```

### Yöntem 3: VS Code ile

1. VS Code'da **PostgreSQL** extension'ını yükleyin
2. Extension açıldığında **Add Connection** tıklayın
3. Bilgileri girin:
   - Host: `localhost`
   - Port: `5432`
   - Database: `kansai_lab`
   - Username: `postgres`
   - Password: [sizin şifreniz]
4. `scripts/setup-database.sql` dosyasını açın
5. Tüm içeriği seçin > Sağ tık > **Run Query**

---

## ✅ Adım 5: Kurulumu Doğrulama

### 1. Tabloların Oluşturulduğunu Kontrol Edin

pgAdmin Query Tool'da çalıştırın:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Görmeniz gereken tablolar:
- users
- analyses
- access_requests
- notifications

### 2. Demo Kullanıcıları Kontrol Edin

```sql
SELECT id, name, email, role FROM users;
```

3 kullanıcı görmelisiniz:
- admin@kansaialtan.com (Admin)
- analiz@kansaialtan.com (Analiz Lab. Üyesi)
- lab@kansaialtan.com (Laboratuvar Üyesi)

### 3. Uygulamayı Başlatın

```bash
npm run dev
```

Tarayıcıda açın: http://localhost:3000

**Test için giriş yapın**:
- Email: `admin@kansaialtan.com`
- Şifre: `lab123456`

---

## 🔌 IDE ile Veritabanı Bağlantısı

### VS Code - PostgreSQL Extension

1. **Extension yükleyin**: "PostgreSQL" (Chris Kolkman)
2. **Bağlantı ekleyin**:
   - Host: `localhost`
   - Port: `5432`
   - Database: `kansai_lab`
   - User: `postgres`
   - Password: [şifreniz]
3. **Explorer panelinde PostgreSQL** ikonunu tıklayın
4. Tabloları görebilir, query çalıştırabilirsiniz

### WebStorm / IntelliJ IDEA

1. **Database Tool Window** açın (View > Tool Windows > Database)
2. **+** > **Data Source** > **PostgreSQL**
3. Bilgileri girin:
   - Host: `localhost`
   - Port: `5432`
   - Database: `kansai_lab`
   - User: `postgres`
   - Password: [şifreniz]
4. **Test Connection** > **OK**
5. Artık tablolara göz atabilir, query çalıştırabilirsiniz

### DataGrip (JetBrains)

1. **New** > **Data Source** > **PostgreSQL**
2. Bağlantı bilgilerini girin
3. **Test Connection**
4. **OK**
5. En güçlü database IDE, tüm özelliklere sahip

### DBeaver (ÜCRETSİZ - ÖNERİLEN)

1. **DBeaver Community** indirin: https://dbeaver.io/download/
2. **New Database Connection** > **PostgreSQL**
3. Bilgileri girin:
   - Host: `localhost`
   - Port: `5432`
   - Database: `kansai_lab`
   - Username: `postgres`
   - Password: [şifreniz]
4. **Test Connection** > **Finish**
5. Mükemmel ücretsiz alternatif!

---

## 📊 Veritabanını Görüntüleme ve Yönetme

### pgAdmin 4 İle

**Tabloları Görüntüleme**:
1. Sol panel: **kansai_lab** > **Schemas** > **public** > **Tables**
2. Herhangi bir tabloya sağ tık > **View/Edit Data** > **All Rows**

**Query Çalıştırma**:
1. **Tools** > **Query Tool**
2. SQL yazın ve **F5** ile çalıştırın

### Sık Kullanılan Sorgular

```sql
-- Tüm kullanıcıları listele
SELECT * FROM users ORDER BY created_at DESC;

-- Tüm analizleri listele
SELECT a.*, u.name as user_name 
FROM analyses a 
LEFT JOIN users u ON a.user_id = u.id 
ORDER BY a.created_at DESC;

-- Bekleyen erişim istekleri
SELECT ar.*, u.name as requester_name, a.numune_adi
FROM access_requests ar
JOIN users u ON ar.user_id = u.id
JOIN analyses a ON ar.analysis_id = a.id
WHERE ar.status = 'pending'
ORDER BY ar.created_at DESC;

-- Bildirimleri görüntüle
SELECT n.*, u.name as user_name
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.is_read = false
ORDER BY n.created_at DESC;

-- Kullanıcı şifresi değiştir (bcrypt hash ile)
-- Yeni şifre: yenisifre123
UPDATE users 
SET password = '$2a$10$rKzQZvGLHYN9xqXQvXZqxODY7xJXQZJ8qVXQvXZqxODY7xJXQZJ8q' 
WHERE email = 'admin@kansaialtan.com';
```

---

## 🏭 Fabrika SQL Server'a Entegrasyon

Sistemi test ettikten sonra fabrika SQL Server'ınıza entegre etmek için:

### 1. SQL Server İçin Bağımlılık Ekleyin

```bash
npm install mssql
npm install --save-dev @types/mssql
```

### 2. .env Dosyasını Güncelleyin

```env
# SQL Server bağlantısı
DB_SERVER=192.168.1.100
DB_DATABASE=KansaiLabAnalysis
DB_USER=lab_user
DB_PASSWORD=lab_password123
DB_PORT=1433
DB_ENCRYPT=true
```

### 3. lib/db.ts Dosyasını SQL Server İçin Uyarlayın

```typescript
import sql from 'mssql';

const config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

export async function query(text: string, params?: any[]) {
  const pool = await sql.connect(config);
  const result = await pool.request().query(text);
  return result;
}
```

### 4. SQL Server'da Veritabanı Oluşturma

SQL Server Management Studio (SSMS) kullanarak:

1. `scripts/setup-database.sql` dosyasını açın
2. PostgreSQL syntax'ını SQL Server'a uyarlayın:
   - `SERIAL` → `INT IDENTITY(1,1)`
   - `TEXT` → `NVARCHAR(MAX)`
   - `TIMESTAMP` → `DATETIME2`
   - `gen_random_uuid()` → `NEWID()`
3. SSMS'de çalıştırın

---

## 🆘 Sorun Giderme

### Hata: "password authentication failed"

**Çözüm**: .env dosyasındaki şifreyi kontrol edin

```bash
# PostgreSQL şifresini sıfırla:
psql -U postgres
\password postgres
# Yeni şifreyi girin
```

### Hata: "database kansai_lab does not exist"

**Çözüm**: Veritabanını oluşturun

```bash
psql -U postgres
CREATE DATABASE kansai_lab;
\q
```

### Hata: "relation users does not exist"

**Çözüm**: SQL script'ini çalıştırın

```bash
psql -U postgres -d kansai_lab -f scripts/setup-database.sql
```

### Bağlantı Testi

Node.js ile bağlantıyı test edin:

```javascript
// test-db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres123@localhost:5432/kansai_lab'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Bağlantı hatası:', err);
  } else {
    console.log('Bağlantı başarılı:', res.rows[0]);
  }
  pool.end();
});
```

Çalıştır:
```bash
node test-db.js
```

---

## 📖 Ek Kaynaklar

- **PostgreSQL Dokümantasyonu**: https://www.postgresql.org/docs/
- **pgAdmin Kullanımı**: https://www.pgadmin.org/docs/
- **Node.js pg Kütüphanesi**: https://node-postgres.com/
- **SQL Server Migration**: https://learn.microsoft.com/sql/

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. `DATABASE_SETUP.md` dosyasını inceleyin
2. `README_TR.md` dosyasına bakın
3. PostgreSQL loglarını kontrol edin: `C:\Program Files\PostgreSQL\16\data\log\`

---

## ✅ Kurulum Tamamlandı!

Artık sisteminiz local PostgreSQL ile çalışıyor. Test ettikten sonra fabrika SQL Server'ınıza entegre edebilirsiniz.

**Başarılar!** 🎉
