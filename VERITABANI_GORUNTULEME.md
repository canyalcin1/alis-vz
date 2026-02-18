# 🔍 Veritabanını Görüntüleme ve Yönetme Rehberi

Local PostgreSQL veritabanınızı IDE/Tool'lar üzerinden nasıl görüntüleyip yönetebileceğinizi anlatan detaylı rehber.

---

## 🎯 En İyi Seçenekler

### 1. pgAdmin 4 (PostgreSQL ile birlikte gelir)
**⭐ Başlangıç için en iyi seçim**

### 2. DBeaver Community (Ücretsiz)
**⭐ Profesyonel kullanım için en iyi**

### 3. VS Code + PostgreSQL Extension
**⭐ VS Code kullanıyorsanız en pratik**

---

## 📊 1. pgAdmin 4 ile Görüntüleme

### Kurulum
PostgreSQL ile birlikte otomatik kurulur. Başlat menüsünden **pgAdmin 4**'ü açın.

### İlk Bağlantı

1. **pgAdmin 4'ü aç**
2. Sol panelde **PostgreSQL 16** > **Servers** > Sağ tık
3. **Register** > **Server**
4. **General** tab:
   - Name: `Local Kansai Lab`
5. **Connection** tab:
   - Host: `localhost`
   - Port: `5432`
   - Database: `kansai_lab`
   - Username: `postgres`
   - Password: [sizin şifreniz]
   - ✅ Save password
6. **Save**

### Tabloları Görüntüleme

**Yol:** Servers > Local Kansai Lab > Databases > kansai_lab > Schemas > public > Tables

#### Tablo verilerini görme:
1. İstediğiniz tabloya sağ tık (örn: `users`)
2. **View/Edit Data** > **All Rows**
3. Veriler tablo formatında açılır

#### Tablonun yapısını görme:
1. Tablo adına tık (örn: `users`)
2. **Properties** paneli açılır
3. **Columns** tab'ına tık
4. Tüm kolonları, tiplerini ve constraint'leri görebilirsiniz

### Query Çalıştırma

1. `kansai_lab` veritabanına sağ tık
2. **Query Tool** seç
3. SQL yazın ve **F5** veya **Execute** butonuna bas

**Örnek Sorgular:**

```sql
-- Tüm kullanıcıları listele
SELECT * FROM users;

-- Sadece adminleri göster
SELECT name, email FROM users WHERE role = 'admin';

-- Analiz sayısı
SELECT COUNT(*) as total_analyses FROM analyses;

-- Bekleyen erişim talepleri
SELECT ar.*, u.name as requester_name 
FROM access_requests ar
JOIN users u ON ar.user_id = u.id
WHERE ar.status = 'pending';
```

### Veri Güncelleme (Dikkatli!)

```sql
-- Kullanıcı email değiştir
UPDATE users 
SET email = 'yeni@email.com' 
WHERE id = 'kullanici-id-buraya';

-- Kullanıcı şifresi sıfırla (bcrypt hash ile)
UPDATE users 
SET password = '$2a$10$rKzQZvGLHYN9xqXQvXZqxODY7xJXQZJ8qVXQvXZqxODY7xJXQZJ8q'
WHERE email = 'admin@kansaialtan.com';
-- Not: Bu hash "yenisifre123" şifresidir
```

---

## 🐦 2. DBeaver Community (Ücretsiz - ÖNERİLEN)

### Neden DBeaver?
- ✅ Tamamen ücretsiz ve açık kaynak
- ✅ Tüm veritabanlarını destekler (PostgreSQL, MySQL, SQL Server, vb.)
- ✅ Güçlü SQL editor (autocomplete, syntax highlighting)
- ✅ ER diyagramları otomatik oluşturur
- ✅ CSV/Excel export/import
- ✅ Profesyonel arayüz

### Kurulum

1. **İndir**: https://dbeaver.io/download/
2. **Windows** için: `dbeaver-ce-latest-x86_64-setup.exe`
3. Kur ve aç

### Bağlantı Kurma

1. **Database** menüsü > **New Database Connection**
2. **PostgreSQL** seç > **Next**
3. **Main** tab:
   - Host: `localhost`
   - Port: `5432`
   - Database: `kansai_lab`
   - Username: `postgres`
   - Password: [sizin şifreniz]
   - ✅ Save password locally
4. **Test Connection** > **OK**
5. **Finish**

### Kullanım

#### Tabloları görmek:
1. Sol panel: `PostgreSQL - kansai_lab` > **public** > **Tables**
2. Tabloya çift tık → veriler açılır

#### SQL çalıştırmak:
1. Veritabanına sağ tık > **SQL Editor** > **New SQL Script**
2. SQL yaz
3. **Ctrl+Enter** veya ▶ butonu

#### Tablo yapısını görmek:
1. Tabloya sağ tık > **View Table**
2. **Columns, Indexes, Foreign Keys** tab'larında detaylı bilgi

#### ER Diyagram oluşturmak:
1. Veritabanına sağ tık > **View Diagram**
2. Tablo ilişkileri görsel olarak gösterilir

#### Excel/CSV Export:
1. Tablo verilerini aç
2. **Export data** butonu (sağ üst)
3. Format seç (CSV, Excel, JSON, vb.)

---

## 💻 3. VS Code ile PostgreSQL Extension

### Kurulum

1. **VS Code Extensions** (Ctrl+Shift+X)
2. **"PostgreSQL"** ara (yayıncı: Chris Kolkman)
3. **Install**

### Bağlantı Kurma

1. Sol tarafta **PostgreSQL** ikonuna tık
2. **Add Connection** (+)
3. Bilgileri gir:
   - Hostname: `localhost`
   - User: `postgres`
   - Password: [sizin şifreniz]
   - Port: `5432`
   - Use SSL: **No**
   - Database: `kansai_lab` (veya PostgreSQL seç)
   - Display name: `Kansai Lab Local`

### Kullanım

#### Tabloları görmek:
1. **PostgreSQL** panel > **Kansai Lab Local** > **kansai_lab** > **public** > **Tables**
2. Tabloya sağ tık > **Show Table**

#### Query çalıştırmak:
1. Tabloya veya veritabanına sağ tık > **New Query**
2. SQL yaz
3. Tümünü seç (Ctrl+A)
4. Sağ tık > **Run Query** (veya F5)

#### Sonuçları görmek:
- Altta **PostgreSQL** tab'ı açılır
- Sonuçlar tablo formatında gösterilir

---

## 🧰 4. WebStorm / IntelliJ IDEA

### Database Tool Window Açma

1. **View** > **Tool Windows** > **Database**
2. Veya **Alt+1** > **Database** tab

### Bağlantı Kurma

1. **Database** panelinde **+** > **Data Source** > **PostgreSQL**
2. **General** tab:
   - Host: `localhost`
   - Port: `5432`
   - Database: `kansai_lab`
   - User: `postgres`
   - Password: [sizin şifreniz]
   - ✅ Save: Forever
3. **Test Connection** > **OK**

### Kullanım

#### Tabloları görmek:
- Sol panel: **kansai_lab@localhost** > **public** > **tables**
- Tabloya çift tık > veriler açılır

#### Query çalıştırmak:
1. Veritabanına sağ tık > **New** > **Query Console**
2. SQL yaz
3. **Ctrl+Enter** (satır çalıştır) veya **Ctrl+Shift+Enter** (tümünü çalıştır)

#### Autocomplete:
- Tablo ve kolon isimlerinde otomatik tamamlama çalışır

---

## 🔬 5. DataGrip (JetBrains - Ücretli)

**Profesyonel veritabanı yönetimi için en gelişmiş IDE**

### Kurulum
- İndir: https://www.jetbrains.com/datagrip/
- 30 gün ücretsiz deneme
- Öğrenciler için ücretsiz

### Bağlantı
WebStorm ile aynı (yukarıya bakın)

### Öne Çıkan Özellikler:
- ✅ Akıllı SQL autocomplete
- ✅ Query geçmişi
- ✅ Database refactoring
- ✅ Schema comparison
- ✅ Version control integration

---

## 📱 6. Postico (macOS için)

**Mac kullanıcıları için en iyi PostgreSQL client**

İndirin: https://eggerapps.at/postico/

---

## 🛠️ Yararlı SQL Sorguları

### Kullanıcı Yönetimi

```sql
-- Tüm kullanıcıları listele
SELECT id, name, email, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- Email ile kullanıcı ara
SELECT * FROM users WHERE email LIKE '%@kansaialtan.com';

-- Yeni kullanıcı ekle
INSERT INTO users (id, name, email, password, role, department)
VALUES (
  gen_random_uuid(),
  'Yeni Kullanıcı',
  'yeni@kansaialtan.com',
  '$2a$10$rKzQZvGLHYN9xqXQvXZqxODY7xJXQZJ8qVXQvXZqxODY7xJXQZJ8q', -- yenisifre123
  'lab_member',
  'Laboratuvar'
);

-- Kullanıcı şifre sıfırla
UPDATE users 
SET password = '$2a$10$rKzQZvGLHYN9xqXQvXZqxODY7xJXQZJ8qVXQvXZqxODY7xJXQZJ8q'
WHERE email = 'admin@kansaialtan.com';

-- Kullanıcı rolünü değiştir
UPDATE users 
SET role = 'admin' 
WHERE email = 'analiz@kansaialtan.com';

-- Kullanıcı sil
DELETE FROM users WHERE email = 'silinecek@email.com';
```

### Analiz İstatistikleri

```sql
-- Toplam analiz sayısı
SELECT COUNT(*) as total FROM analyses;

-- Kullanıcıya göre analiz sayısı
SELECT u.name, COUNT(a.id) as analysis_count
FROM users u
LEFT JOIN analyses a ON u.id = a.user_id
GROUP BY u.id, u.name
ORDER BY analysis_count DESC;

-- Son eklenen 10 analiz
SELECT 
  a.numune_adi,
  u.name as user_name,
  a.created_at
FROM analyses a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 10;

-- Aylık analiz istatistikleri
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as analysis_count
FROM analyses
GROUP BY month
ORDER BY month DESC;
```

### Erişim Talepleri

```sql
-- Bekleyen talepler
SELECT 
  ar.id,
  u.name as requester,
  a.numune_adi,
  ar.reason,
  ar.created_at
FROM access_requests ar
JOIN users u ON ar.user_id = u.id
JOIN analyses a ON ar.analysis_id = a.id
WHERE ar.status = 'pending'
ORDER BY ar.created_at ASC;

-- Onaylanan/Reddedilen talepler
SELECT 
  ar.status,
  COUNT(*) as count
FROM access_requests ar
GROUP BY ar.status;

-- Talebi onayla
UPDATE access_requests 
SET 
  status = 'approved',
  responded_at = NOW(),
  responded_by = 'admin-user-id-buraya'
WHERE id = 'request-id-buraya';
```

### Bildirimler

```sql
-- Okunmamış bildirimler
SELECT 
  n.title,
  n.message,
  u.name as user_name,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.is_read = false
ORDER BY n.created_at DESC;

-- Tüm bildirimleri okundu işaretle
UPDATE notifications 
SET is_read = true 
WHERE user_id = 'user-id-buraya';

-- Eski bildirimleri temizle (30 günden eski)
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Veritabanı Bakımı

```sql
-- Tablo boyutları
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- İndeks listesi
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Veritabanı boyutu
SELECT pg_size_pretty(pg_database_size('kansai_lab'));

-- Aktif bağlantılar
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state
FROM pg_stat_activity
WHERE datname = 'kansai_lab';
```

---

## 🔐 Güvenlik İpuçları

### Dikkat Edilmesi Gerekenler:

1. **DELETE sorguları çalıştırmadan önce önce SELECT ile test edin:**
   ```sql
   -- ❌ YANLIŞ (hemen silme!)
   DELETE FROM users WHERE role = 'admin';
   
   -- ✅ DOĞRU (önce kontrol et)
   SELECT * FROM users WHERE role = 'admin';
   -- Sonuçları kontrol et, sonra DELETE yap
   ```

2. **UPDATE sorgularında WHERE kullanmayı UNUTMAYIN:**
   ```sql
   -- ❌ TEHLİKELİ! Tüm kullanıcıların şifresi değişir!
   UPDATE users SET password = '...';
   
   -- ✅ GÜVENLİ
   UPDATE users SET password = '...' WHERE email = 'specific@email.com';
   ```

3. **Production veritabanında test yapmayın:**
   - Local'de test edin
   - Backup alın
   - Transaction kullanın:
     ```sql
     BEGIN;
     UPDATE users SET role = 'admin' WHERE id = '...';
     -- Kontrol et
     SELECT * FROM users WHERE id = '...';
     -- Sorun yoksa:
     COMMIT;
     -- Sorun varsa:
     ROLLBACK;
     ```

---

## 📦 Backup ve Restore

### Backup Alma

```bash
# Tüm veritabanını yedekle
pg_dump -U postgres -d kansai_lab -f backup.sql

# Sadece verileri yedekle (şema olmadan)
pg_dump -U postgres -d kansai_lab --data-only -f data-backup.sql

# Sıkıştırılmış backup
pg_dump -U postgres -d kansai_lab -Fc -f backup.dump
```

### Restore

```bash
# SQL dosyasından restore
psql -U postgres -d kansai_lab -f backup.sql

# Sıkıştırılmış backup'tan restore
pg_restore -U postgres -d kansai_lab backup.dump
```

---

## 🆘 Sorun Giderme

### "password authentication failed"

**Çözüm:**
```bash
psql -U postgres
\password postgres
# Yeni şifreyi gir
```

### Tablolar görünmüyor

**Kontrol:**
```sql
-- Tabloları listele
\dt

-- Veya:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Bağlantı kuramıyorum

**Kontroller:**
1. PostgreSQL servisi çalışıyor mu?
   - Windows: Görev Yöneticisi > Hizmetler > postgresql-x64-16
2. Port doğru mu? (varsayılan: 5432)
3. Şifre doğru mu?
4. Veritabanı var mı?

---

## 📚 Ek Kaynaklar

- **PostgreSQL Resmi Dokümantasyon**: https://www.postgresql.org/docs/
- **pgAdmin Dokümantasyon**: https://www.pgadmin.org/docs/
- **DBeaver Kullanım Rehberi**: https://dbeaver.com/docs/
- **SQL Tutorial (Türkçe)**: https://www.w3schools.com/sql/

---

## 🎉 Sonuç

Artık veritabanınızı görüntüleyebilir ve yönetebilirsiniz! Hangi tool'u seçerseniz seçin, PostgreSQL ile etkileşim kurmak için birçok seçeneğiniz var.

**Önerilerimiz:**
- **Başlangıç:** pgAdmin 4 (PostgreSQL ile birlikte gelir)
- **Profesyonel:** DBeaver Community (ücretsiz ve güçlü)
- **IDE kullanıyorsanız:** WebStorm/VS Code entegrasyonu

**Başarılar!** 🚀
