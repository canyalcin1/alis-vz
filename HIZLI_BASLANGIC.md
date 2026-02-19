# 🚀 Hızlı Başlangıç - 5 Dakikada Çalıştır

## 1️⃣ PostgreSQL'i İndir ve Kur

**Windows için:**
- https://www.postgresql.org/download/windows/ adresinden indir
- Kurulum sırasında şifre belirle (örn: `postgres123`)
- Port: 5432 (varsayılan)

## 2️⃣ Veritabanını Oluştur

**pgAdmin 4'ü aç** (PostgreSQL ile birlikte gelir):
1. Sol panelde **Databases** > Sağ tık > **Create** > **Database**
2. Ad: `kansai_lab`
3. **Save**

## 3️⃣ Proje Kurulumu

```bash
# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
echo DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/kansai_lab > .env
```

**ÖNEMLİ:** `postgres123` kısmını kendi şifrenizle değiştirin!

## 4️⃣ Veritabanı Şemasını Oluştur

**pgAdmin 4'te:**
1. **kansai_lab** veritabanını seç
2. **Tools** > **Query Tool**
3. `scripts/setup-database.sql` dosyasını aç (Notepad ile)
4. Tüm içeriği kopyala ve Query Tool'a yapıştır
5. **Execute (F5)** tuşuna bas

VEYA

**Komut satırında:**
```bash
psql -U postgres -d kansai_lab -f scripts/setup-database.sql
```

## 5️⃣ Bağlantıyı Test Et

```bash
node scripts/test-connection.js
```

✅ görmeli ve 3 kullanıcı listelenmeli:
- admin@kansaialtan.com
- analiz@kansaialtan.com
- lab@kansaialtan.com

## 6️⃣ Uygulamayı Başlat

```bash
npm run dev
```

http://localhost:3000 adresini aç

**Giriş yap:**
- Email: `admin@kansaialtan.com`
- Şifre: `lab123456`

---

## 🎉 Tebrikler!

Sistem çalışıyor. Artık:
- ✅ Analiz ekleyebilir
- ✅ Kullanıcı yönetimi yapabilir
- ✅ Erişim izinlerini kontrol edebilirsiniz

---

## 🔧 Sorun mu var?

### Bağlantı hatası alıyorsanız:

1. **PostgreSQL çalışıyor mu?**
   - Windows: Görev Yöneticisi > Hizmetler > postgresql-x64-16 ÇALIŞIYOR olmalı

2. **Şifre doğru mu?**
   ```bash
   psql -U postgres
   # Şifre sor: [sizin şifrenizi girin]
   ```

3. **Veritabanı var mı?**
   ```bash
   psql -U postgres
   \l
   # kansai_lab görünmeli
   ```

### Daha fazla yardım:
- `KURULUM_REHBERI.md` - Detaylı kurulum
- `DATABASE_SETUP.md` - Veritabanı dokümantasyonu
- `README_TR.md` - Proje dokümantasyonu

---

**Başarılar!** 🚀
