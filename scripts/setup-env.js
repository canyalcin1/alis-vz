#!/usr/bin/env node

/**
 * Environment Setup Helper
 * 
 * Bu script, .env dosyasını oluşturmanıza yardımcı olur.
 * 
 * Kullanım:
 *   node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('\n🔧 Environment Kurulum Yardımcısı\n');
  console.log('Bu yardımcı, .env dosyanızı oluşturmanıza yardımcı olacak.\n');

  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env dosyası zaten mevcut. Üzerine yazmak ister misiniz? (e/h): ');
    if (overwrite.toLowerCase() !== 'e') {
      console.log('\n✅ İşlem iptal edildi. Mevcut .env dosyası korundu.\n');
      rl.close();
      return;
    }
  }

  console.log('Lütfen PostgreSQL bağlantı bilgilerinizi girin:\n');

  const host = await question('Host (varsayılan: localhost): ') || 'localhost';
  const port = await question('Port (varsayılan: 5432): ') || '5432';
  const database = await question('Database adı (varsayılan: kansai_lab): ') || 'kansai_lab';
  const username = await question('Kullanıcı adı (varsayılan: postgres): ') || 'postgres';
  const password = await question('Şifre: ');

  if (!password) {
    console.log('\n❌ Şifre gereklidir!\n');
    rl.close();
    return;
  }

  // JWT Secret
  console.log('\nJWT Secret Key oluşturuluyor...');
  const jwtSecret = require('crypto').randomBytes(32).toString('hex');

  // Build DATABASE_URL
  const databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;

  // Create .env content
  const envContent = `# Kansai Altan Lab Analiz Sistemi - Environment Variables
# Bu dosya ${new Date().toLocaleString('tr-TR')} tarihinde oluşturuldu

# PostgreSQL Database Connection
DATABASE_URL=${databaseUrl}

# JWT Secret (Token oluşturma için)
JWT_SECRET=${jwtSecret}

# Node Environment
NODE_ENV=development
`;

  // Write to .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ .env dosyası başarıyla oluşturuldu!\n');
  console.log('📝 Oluşturulan bağlantı bilgileri:');
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${username}`);
  console.log('\n🔒 JWT Secret otomatik oluşturuldu.\n');

  console.log('📋 Sonraki adımlar:');
  console.log('   1. Veritabanını oluşturun (eğer yoksa):');
  console.log(`      psql -U ${username} -c "CREATE DATABASE ${database}"\n`);
  console.log('   2. Veritabanı şemasını kurun:');
  console.log(`      psql -U ${username} -d ${database} -f scripts/setup-database.sql\n`);
  console.log('   3. Bağlantıyı test edin:');
  console.log('      node scripts/test-connection.js\n');
  console.log('   4. Uygulamayı başlatın:');
  console.log('      npm run dev\n');

  rl.close();
}

setupEnvironment().catch(error => {
  console.error('\n❌ Hata:', error.message);
  rl.close();
  process.exit(1);
});
