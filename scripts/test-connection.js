#!/usr/bin/env node

/**
 * PostgreSQL Bağlantı Test Script'i
 * 
 * Bu script, veritabanı bağlantısını test eder ve tablo yapısını kontrol eder.
 * 
 * Kullanım:
 *   node scripts/test-connection.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  console.log('\n🔍 Veritabanı Bağlantısı Test Ediliyor...\n');
  
  try {
    // Bağlantı testi
    const client = await pool.connect();
    console.log('✅ Bağlantı başarılı!\n');
    
    // Zaman bilgisi
    const timeResult = await client.query('SELECT NOW()');
    console.log('📅 Sunucu zamanı:', timeResult.rows[0].now);
    
    // Veritabanı bilgisi
    const dbResult = await client.query('SELECT current_database()');
    console.log('💾 Veritabanı:', dbResult.rows[0].current_database);
    
    // Tablo listesi
    console.log('\n📊 Tablolar:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ Hiç tablo bulunamadı!');
      console.log('\n💡 Çözüm: scripts/setup-database.sql dosyasını çalıştırın');
      console.log('   psql -U postgres -d kansai_lab -f scripts/setup-database.sql\n');
    } else {
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
      
      // Kullanıcı sayısı
      const userCountResult = await client.query('SELECT COUNT(*) FROM users');
      console.log(`\n👥 Toplam kullanıcı sayısı: ${userCountResult.rows[0].count}`);
      
      if (parseInt(userCountResult.rows[0].count) === 0) {
        console.log('⚠️  Kullanıcı bulunamadı. Demo verileri yüklenmemiş olabilir.');
      } else {
        console.log('\n👤 Kullanıcılar:');
        const usersResult = await client.query('SELECT id, name, email, role FROM users ORDER BY role');
        usersResult.rows.forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
        });
      }
      
      // Analiz sayısı
      const analysisCountResult = await client.query('SELECT COUNT(*) FROM analyses');
      console.log(`\n📈 Toplam analiz sayısı: ${analysisCountResult.rows[0].count}`);
      
      console.log('\n✅ Veritabanı kurulumu tamamlanmış!\n');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Hata:', error.message);
    console.error('\n📝 Çözüm önerileri:');
    console.error('   1. PostgreSQL çalışıyor mu kontrol edin');
    console.error('   2. .env dosyasında DATABASE_URL doğru mu kontrol edin');
    console.error('   3. Veritabanı oluşturulmuş mu kontrol edin: CREATE DATABASE kansai_lab;');
    console.error('   4. Şifre doğru mu kontrol edin\n');
    console.error('Örnek DATABASE_URL:');
    console.error('   DATABASE_URL=postgresql://postgres:SIFRENIZ@localhost:5432/kansai_lab\n');
    process.exit(1);
  }
}

testConnection();
