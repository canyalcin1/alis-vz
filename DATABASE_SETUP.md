# PostgreSQL Veritabanı Kurulum ve Bağlantı Rehberi

Bu rehber, Kansai Altan Lab Yönetim Sistemi için PostgreSQL veritabanını local ortamda nasıl kuracağınızı ve IDE'nizden nasıl bağlanacağınızı göstermektedir.

## 1. PostgreSQL Kurulumu

### Windows İçin:

1. **PostgreSQL İndirme:**
   - [PostgreSQL resmi websitesinden](https://www.postgresql.org/download/windows/) PostgreSQL'i indirin
   - Önerilen versiyon: PostgreSQL 15 veya 16
   - Kurulum sırasında bir şifre belirleyin (örn: `yourpassword`)
   - Port numarasını varsayılan olarak bırakın: `5432`

2. **Kurulumu Tamamlama:**
   - Stack Builder'ı kurmak zorunda değilsiniz
   - pgAdmin 4 otomatik olarak kurulacaktır (veritabanını görüntülemek için)

### Linux İçin:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Fedora/RHEL/CentOS
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS İçin:

```bash
# Homebrew ile
brew install postgresql@16
brew services start postgresql@16
```

## 2. Veritabanı Oluşturma

### pgAdmin Kullanarak (GUI):

1. pgAdmin 4'ü açın
2. Sol tarafta `Servers` → `PostgreSQL 16` → sağ tık → `Create` → `Database`
3. Database adı: `kansai_altan_lab`
4. Owner: `postgres`
5. `Save` butonuna tıklayın

### Terminal/CMD Kullanarak:

```bash
# PostgreSQL kullanıcısı olarak giriş yapın
psql -U postgres

# Veritabanını oluşturun
CREATE DATABASE kansai_altan_lab;

# Bağlantıyı kontrol edin
\c kansai_altan_lab

# Çıkış
\q
```

## 3. Veritabanı Şemasını Oluşturma

Proje klasöründe bulunan `scripts/setup-database.sql` dosyasını çalıştırın:

### pgAdmin Kullanarak:

1. pgAdmin'de `kansai_altan_lab` veritabanına sağ tıklayın
2. `Query Tool` seçeneğini seçin
3. `scripts/setup-database.sql` dosyasının içeriğini kopyalayıp yapıştırın
4. `Execute` (F5) butonuna tıklayın

### Terminal/CMD Kullanarak:

```bash
# Proje dizininde
psql -U postgres -d kansai_altan_lab -f scripts/setup-database.sql
```

Bu işlem:
- Tüm tabloları oluşturur (users, documents, samples, access_requests, notifications, vb.)
- İndexleri oluşturur
- Trigger'ları ayarlar (otomatik bildirimler için)
- Demo kullanıcıları ekler:
  - Admin: `admin@kansaialtan.com` / `lab123456`
  - Analiz Uzmanı 1: `analiz1@kansaialtan.com` / `lab123456`
  - Analiz Uzmanı 2: `analiz2@kansaialtan.com` / `lab123456`
  - Proses Mühendisi: `proses@kansaialtan.com` / `lab123456`
  - Otomotiv Uzmanı: `otomotiv@kansaialtan.com` / `lab123456`

## 4. Ortam Değişkenlerini Ayarlama

Proje ana dizininde `.env.local` dosyası oluşturun:

```bash
# .env.local dosyası
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/kansai_altan_lab
```

**ÖNEMLİ:** `yourpassword` kısmını PostgreSQL kurulumu sırasında belirlediğiniz şifre ile değiştirin.

### Production (Fabrika Sunucusu) için:

Fabrika sunucusunda SQL Server veya PostgreSQL kullanıyorsanız:

```bash
# SQL Server için connection string örneği
DATABASE_URL=postgresql://username:password@server-ip:5432/kansai_altan_lab

# Örnek:
DATABASE_URL=postgresql://factory_user:SecurePass123@192.168.1.100:5432/kansai_altan_lab
```

## 5. IDE'den Veritabanına Bağlanma

### Visual Studio Code (VS Code) Kullanarak:

1. **PostgreSQL Extension Kurulumu:**
   - Extensions'a gidin (Ctrl+Shift+X)
   - "PostgreSQL" yazın ve "PostgreSQL" eklentisini kurun
   - Ya da [SQLTools](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools) + [SQLTools PostgreSQL Driver](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools-driver-pg) kurabilirsiniz

2. **Bağlantı Oluşturma (SQLTools ile):**
   - Sol panelden SQLTools ikonuna tıklayın
   - `Add New Connection` butonuna tıklayın
   - PostgreSQL seçin
   - Bağlantı bilgilerini girin:
     ```
     Connection Name: Kansai Altan Lab
     Server: localhost
     Port: 5432
     Database: kansai_altan_lab
     Username: postgres
     Password: yourpassword
     ```
   - `Test Connection` ile test edin
   - `Save Connection` ile kaydedin

3. **Veritabanını Görüntüleme:**
   - SQLTools panelinde bağlantıya tıklayın
   - Tablolar, kolonlar, indexler vb. görüntülenecek
   - SQL sorguları çalıştırabilirsiniz

### JetBrains IDEs (WebStorm, IntelliJ, DataGrip):

1. **Database Tool Window:**
   - Sağ taraftan `Database` sekmesini açın
   - `+` ikonuna tıklayın → `Data Source` → `PostgreSQL`

2. **Bağlantı Ayarları:**
   ```
   Host: localhost
   Port: 5432
   Database: kansai_altan_lab
   User: postgres
   Password: yourpassword
   ```

3. **Driver İndirme:**
   - İlk bağlantıda driver indirmek gerekebilir
   - `Download missing driver files` butonuna tıklayın

4. **Test ve Bağlanma:**
   - `Test Connection` butonuna tıklayın
   - Başarılı olursa `OK` ile kaydedin
   - Artık Database panelinden tüm tabloları görebilirsiniz

### pgAdmin 4 Kullanarak (En Kolay Yöntem):

1. **pgAdmin 4'ü Açma:**
   - PostgreSQL ile birlikte kurulur
   - Windows: Start menüsünden `pgAdmin 4`
   - macOS/Linux: Applications'dan `pgAdmin 4`

2. **Veritabanına Erişim:**
   - Sol panelden: `Servers` → `PostgreSQL 16` → `Databases` → `kansai_altan_lab`
   - `Schemas` → `public` → `Tables` altında tüm tabloları görebilirsiniz

3. **Tablo İçeriğini Görüntüleme:**
   - Bir tabloya sağ tık → `View/Edit Data` → `All Rows`
   - Veya `Query Tool` açıp SQL sorguları çalıştırın:
     ```sql
     SELECT * FROM users;
     SELECT * FROM documents;
     SELECT * FROM access_requests;
     ```

## 6. Veritabanı Yapısı

### Ana Tablolar:

1. **users** - Kullanıcı bilgileri
   - id, email, password_hash, name, lab, role, department
   - Roller: admin, analiz_member, lab_member
   - Labs: analiz, proses, otomotiv, admin

2. **documents** - Yüklenen dökümanlar
   - id, file_name, title, uploaded_by, status
   - metadata: sample_count, analysis_types

3. **samples** - Analiz örnekleri
   - id, document_id, name, sections (JSON), comment

4. **access_requests** - Erişim talepleri
   - id, requester_id, document_id, status
   - status: pending, approved, rejected

5. **notifications** - Bildirimler
   - id, user_id, type, title, message, is_read
   - Otomatik trigger'lar ile oluşturulur

6. **document_notes** - Döküman notları
   - id, document_id, user_id, text

7. **document_footnotes** - Dipnotlar
   - id, document_id, text, order

### Otomatik İşlemler (Triggers):

- Yeni erişim talebi oluşturulduğunda → Tüm analiz lab üyelerine bildirim gider
- Erişim talebi onaylandığında/reddedildiğinde → Talep sahibine bildirim gider
- Kullanıcı güncellendiğinde → updated_at otomatik güncellenir

## 7. Projeyi Çalıştırma

```bash
# Bağımlılıkları yükleyin (eğer daha önce yapmadıysanız)
npm install

# Development server'ı başlatın
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

## 8. Veritabanı Yönetimi

### Yedekleme:

```bash
# Tüm veritabanını yedekle
pg_dump -U postgres kansai_altan_lab > backup.sql

# Sadece şemayı yedekle
pg_dump -U postgres -s kansai_altan_lab > schema.sql

# Sadece veriyi yedekle
pg_dump -U postgres -a kansai_altan_lab > data.sql
```

### Geri Yükleme:

```bash
# Yedekten geri yükle
psql -U postgres kansai_altan_lab < backup.sql
```

### Veritabanını Sıfırlama:

```bash
# Tüm verileri sil ve yeniden oluştur
psql -U postgres -d kansai_altan_lab -f scripts/setup-database.sql
```

## 9. Fabrika Sunucusuna Kurulum

Fabrika içinde SQL Server Management Studio ile PostgreSQL entegrasyonu için:

1. **PostgreSQL'i fabrika sunucusuna kurun**
2. **Güvenlik duvarı ayarlarını yapılandırın:**
   ```bash
   # Windows Firewall'da 5432 portunu açın
   netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=TCP localport=5432
   ```
3. **postgresql.conf dosyasını düzenleyin:**
   ```
   listen_addresses = '*'  # Tüm IP'lerden bağlantıya izin ver
   ```
4. **pg_hba.conf dosyasına fabrika ağını ekleyin:**
   ```
   host    all    all    192.168.1.0/24    md5
   ```
5. **PostgreSQL servisini yeniden başlatın**

### Alternatif: Mevcut SQL Server Kullanımı

Eğer fabrika içinde zaten çalışan bir SQL Server varsa ve bunu kullanmak isterseniz:

1. Veritabanı kodunu SQL Server uyumlu hale getirmek gerekir
2. `pg` paketini `mssql` paketi ile değiştirin
3. SQL syntax farklarını düzeltin (örn: `RETURNING` → `OUTPUT INSERTED.*`)

## 10. Sorun Giderme

### Bağlantı Hatası: "connection refused"

```bash
# PostgreSQL servisinin çalıştığını kontrol edin
# Windows:
services.msc → PostgreSQL'i bulun → Status: Running olmalı

# Linux:
sudo systemctl status postgresql

# macOS:
brew services list
```

### Şifre Hatası: "authentication failed"

```bash
# Şifreyi sıfırlayın
psql -U postgres
ALTER USER postgres PASSWORD 'yeni_sifre';
```

### Port Zaten Kullanımda

```bash
# 5432 portunu kullanan programı bulun
# Windows:
netstat -ano | findstr :5432

# Linux/macOS:
lsof -i :5432
```

## Yardım ve Destek

- PostgreSQL Dokümantasyonu: https://www.postgresql.org/docs/
- pgAdmin Dokümantasyonu: https://www.pgadmin.org/docs/
- Node.js PostgreSQL (pg) Paketi: https://node-postgres.com/

---

**Not:** Bu sistem production ortamında kullanılmadan önce güvenlik ayarlarını gözden geçirin:
- Güçlü şifreler kullanın
- SSL/TLS bağlantısı aktif edin
- Düzenli yedekleme yapın
- Kullanıcı yetkilerini minimum seviyede tutun
