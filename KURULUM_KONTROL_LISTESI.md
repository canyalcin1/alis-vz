# ✅ Kurulum Kontrol Listesi

Bu listeyi adım adım takip ederek sisteminizin doğru kurulduğundan emin olun.

---

## 📋 ÖN HAZIRLIK

### □ 1. Gerekli Yazılımlar Kurulu mu?

- [ ] **Node.js** (v18+) kurulu
  ```bash
  node --version  # v18.0.0 veya üzeri olmalı
  ```

- [ ] **PostgreSQL** (v14+) kurulu
  ```bash
  psql --version  # 14.0 veya üzeri olmalı
  ```

- [ ] **npm** veya **pnpm** kurulu
  ```bash
  npm --version
  ```

---

## 🗄️ VERİTABANI KURULUMU

### □ 2. PostgreSQL Servisi Çalışıyor mu?

**Windows:**
- [ ] Görev Yöneticisi > Hizmetler > `postgresql-x64-16` → ÇALIŞIYOR

**Kontrol komutu:**
```bash
psql -U postgres -c "SELECT version();"
```

### □ 3. Veritabanı Oluşturuldu mu?

- [ ] `kansai_lab` veritabanı var mı kontrol et:

```bash
psql -U postgres -c "\l" | grep kansai_lab
```

**Yoksa oluştur:**
```bash
psql -U postgres -c "CREATE DATABASE kansai_lab;"
```

**veya pgAdmin 4 ile:**
- Databases > Sağ tık > Create > Database
- Ad: `kansai_lab` > Save

### □ 4. Veritabanına Bağlanabiliyor musun?

```bash
psql -U postgres -d kansai_lab -c "SELECT current_database();"
```

Çıktı: `kansai_lab` görmelisiniz.

---

## 📦 PROJE KURULUMU

### □ 5. Proje Bağımlılıkları Yüklendi mi?

```bash
cd /path/to/kansai-altan-lab
npm install
```

**Kontrol:**
- [ ] `node_modules/` klasörü oluştu
- [ ] `package-lock.json` oluştu
- [ ] Hata almadan tamamlandı

### □ 6. Environment Dosyası Oluşturuldu mu?

**Otomatik yol (önerilen):**
```bash
node scripts/setup-env.js
```

**Manuel yol:**
```bash
# .env dosyası oluştur
echo "DATABASE_URL=postgresql://postgres:SIFRENIZ@localhost:5432/kansai_lab" > .env
```

**Kontrol:**
- [ ] `.env` dosyası proje kök dizininde var
- [ ] `DATABASE_URL` değişkeni tanımlı
- [ ] Şifre doğru

**Test et:**
```bash
cat .env
# DATABASE_URL=postgresql://postgres:...
```

### □ 7. Veritabanı Şeması Kuruldu mu?

**Yöntem 1: pgAdmin 4 (önerilen)**
- [ ] pgAdmin 4 aç
- [ ] `kansai_lab` veritabanını seç
- [ ] Tools > Query Tool
- [ ] `scripts/setup-database.sql` dosyasını aç
- [ ] İçeriği kopyala ve Query Tool'a yapıştır
- [ ] Execute (F5)
- [ ] "Query returned successfully" mesajı gördün mü?

**Yöntem 2: Komut satırı**
```bash
psql -U postgres -d kansai_lab -f scripts/setup-database.sql
```

**Kontrol: Tablolar oluştu mu?**
```bash
psql -U postgres -d kansai_lab -c "\dt"
```

Görmeli olduğun tablolar:
- [ ] `users`
- [ ] `analyses`
- [ ] `access_requests`
- [ ] `notifications`

### □ 8. Demo Kullanıcılar Oluşturuldu mu?

```bash
psql -U postgres -d kansai_lab -c "SELECT email, role FROM users;"
```

Görmelisin:
- [ ] `admin@kansaialtan.com` - admin
- [ ] `analiz@kansaialtan.com` - analiz_member
- [ ] `lab@kansaialtan.com` - lab_member

**Toplam 3 kullanıcı olmalı.**

---

## 🔌 BAĞLANTI TESTİ

### □ 9. Bağlantı Testi Başarılı mı?

```bash
node scripts/test-connection.js
```

**Beklenen çıktı:**
```
✅ Bağlantı başarılı!
📅 Sunucu zamanı: ...
💾 Veritabanı: kansai_lab
📊 Tablolar:
   1. access_requests
   2. analyses
   3. notifications
   4. users
👥 Toplam kullanıcı sayısı: 3
```

- [ ] Bağlantı başarılı mesajı
- [ ] 4 tablo listelendi
- [ ] 3 kullanıcı gösterildi

---

## 🚀 UYGULAMA TESTİ

### □ 10. Uygulama Başladı mı?

```bash
npm run dev
```

**Kontrol:**
- [ ] Hata almadan başladı
- [ ] `Local: http://localhost:3000` mesajını gördün
- [ ] Port 3000 kullanılabilir (başka uygulama kullanmıyor)

### □ 11. Login Çalışıyor mu?

**Tarayıcıda aç:** http://localhost:3000

- [ ] Login sayfası açıldı
- [ ] Email ve şifre alanları var

**Giriş yap:**
- Email: `admin@kansaialtan.com`
- Şifre: `lab123456`

- [ ] Giriş başarılı
- [ ] Dashboard'a yönlendirildi

### □ 12. Dashboard Görünüyor mu?

Dashboard'da görmelisin:
- [ ] Sol menü (Ana Sayfa, Dosya Yükle, Dökümanlar, vb.)
- [ ] Üst header (arama, bildirim zili, profil ikonu)
- [ ] İstatistikler (Toplam Dökümanlar, Bekleyen Talepler)

### □ 13. Bildirim Sistemi Çalışıyor mu?

- [ ] Header'da zil ikonu (🔔) var
- [ ] Zil ikonuna tıklayınca dropdown açılıyor
- [ ] "Bildirim bulunmuyor" mesajı görünüyor (henüz bildirim yok)

### □ 14. Kullanıcı Yönetimi Çalışıyor mu?

**Profile sayfasına git:**
- Dashboard > Sol menü > Profil

- [ ] Profil bilgileri görünüyor
- [ ] **User Management** bölümü görünüyor (sadece admin için)
- [ ] Kullanıcı listesi gösteriliyor (3 kullanıcı)

**Test et:**
- [ ] "Add User" butonuna tıkla
- [ ] Form açılıyor
- [ ] İptal et

### □ 15. Kayıt Sayfası Çalışıyor mu?

**Logout yap ve kayıt sayfasına git:**
- http://localhost:3000/register

- [ ] Kayıt formu görünüyor
- [ ] İsim, email, şifre, departman alanları var
- [ ] Departman seçenekleri: "Analiz Lab. Uyesi", "Laboratuvar Uyesi"

**Test kayıt (opsiyonel):**
- [ ] Form doldur
- [ ] "Kayıt Ol" butonuna tıkla
- [ ] Başarılı mesajı ve login sayfasına yönlendirme

---

## 🗄️ VERİTABANI GÖRÜNTÜLEME

### □ 16. IDE ile Veritabanına Bağlanabildin mi?

**Seçeneklerden birini dene:**

#### pgAdmin 4:
- [ ] Servers > Register > Server
- [ ] Bağlantı bilgilerini gir (localhost, 5432, kansai_lab, postgres)
- [ ] Bağlantı başarılı
- [ ] Tabloları görebiliyorum

#### DBeaver (önerilen):
- [ ] https://dbeaver.io/ indirildi
- [ ] New Connection > PostgreSQL
- [ ] Test Connection başarılı
- [ ] Tabloları görebiliyorum

#### VS Code:
- [ ] PostgreSQL extension yüklendi
- [ ] Add Connection tamamlandı
- [ ] Tabloları görebiliyorum

**Detay:** VERITABANI_GORUNTULEME.md

---

## 📊 VERİ TESTİ

### □ 17. Analiz Ekleme Çalışıyor mu?

- [ ] Dashboard > Dosya Yükle
- [ ] Örnek Excel dosyası yükle (eğer varsa)
- [ ] Başarılı mesajı

**Veritabanında kontrol:**
```sql
SELECT COUNT(*) FROM analyses;
-- 1 veya daha fazla olmalı
```

### □ 18. Bildirimler Oluşuyor mu?

**Analiz ekledikten sonra:**
- [ ] Analiz Lab üyesi olarak giriş yap (analiz@kansaialtan.com / lab123456)
- [ ] Header'daki zil ikonunda bildirim sayacı var mı?
- [ ] Bildirime tıklayınca "Yeni analiz eklendi" mesajı var mı?

**Veritabanında kontrol:**
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
```

---

## 🎯 SON KONTROL

### □ 19. Tüm Özellikler Çalışıyor mu?

- [ ] ✅ Login/Logout
- [ ] ✅ Register (yeni kullanıcı kaydı)
- [ ] ✅ Dashboard (istatistikler)
- [ ] ✅ Kullanıcı Yönetimi (admin paneli)
- [ ] ✅ Bildirimler (header'da zil)
- [ ] ✅ Profil sayfası
- [ ] ✅ Veritabanı bağlantısı

### □ 20. Dokümantasyonu Okudun mu?

- [ ] HIZLI_BASLANGIC.md
- [ ] VERITABANI_GORUNTULEME.md
- [ ] KURULUM_REHBERI.md (SQL Server entegrasyonu için)

---

## ✅ KURULUM TAMAMLANDI!

Eğer tüm checkboxlar işaretliyse, kurulum başarılı! 🎉

---

## ❌ SORUN GİDERME

### Hata: "password authentication failed"

**Çözüm:**
```bash
psql -U postgres
\password postgres
# Yeni şifre gir
```
Sonra `.env` dosyasındaki şifreyi güncelle.

### Hata: "database kansai_lab does not exist"

**Çözüm:**
```bash
psql -U postgres -c "CREATE DATABASE kansai_lab;"
```

### Hata: "relation users does not exist"

**Çözüm:** SQL script'ini çalıştır:
```bash
psql -U postgres -d kansai_lab -f scripts/setup-database.sql
```

### Hata: "Cannot find module 'pg'"

**Çözüm:**
```bash
npm install pg @types/pg
```

### Hata: Port 3000 already in use

**Çözüm:** Başka uygulamayı kapat veya farklı port kullan:
```bash
PORT=3001 npm run dev
```

### Bağlantı kuramıyorum

**Kontroller:**
1. PostgreSQL servisi çalışıyor mu?
2. Port 5432 açık mı?
3. Şifre doğru mu?
4. `.env` dosyası var mı?

**Test:**
```bash
node scripts/test-connection.js
```

---

## 📞 EK YARDIM

Sorun devam ediyorsa:

1. **Logları kontrol et:**
   - PostgreSQL log: `C:\Program Files\PostgreSQL\16\data\log\`
   - Terminal'deki hata mesajları

2. **Veritabanını sıfırla:**
   ```bash
   psql -U postgres -c "DROP DATABASE kansai_lab;"
   psql -U postgres -c "CREATE DATABASE kansai_lab;"
   psql -U postgres -d kansai_lab -f scripts/setup-database.sql
   ```

3. **Node modules'ü temizle:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Dokümantasyona bak:**
   - KURULUM_REHBERI.md
   - DATABASE_SETUP.md
   - VERITABANI_GORUNTULEME.md

---

**Başarılar!** 🚀
