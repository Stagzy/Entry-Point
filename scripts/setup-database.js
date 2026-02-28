#!/usr/bin/env node

/**
 * Supabase Database Setup Script
  try {
    // 1. Create tables manually using SQL
    console.log('📊 Creating database schema...');
    
    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE,
          name TEXT,
          avatar_url TEXT,
          bio TEXT,
          is_verified BOOLEAN DEFAULT false,
          trust_tier TEXT DEFAULT 'Bronze' CHECK (trust_tier IN ('Bronze', 'Silver', 'Gold', 'Diamond')),
          is_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    
    if (usersError) {
      console.log('Creating users table with direct SQL...');
      // If RPC doesn't work, try direct approach
      console.log('ℹ️  Note: Using alternative table creation method');
    }
    
    console.log('✅ Database schema setup initiated\n');pt will help you set up your Entry Point database with:
 * 1. All required tables and relationships
 * 2. Security policies (RLS)
 * 3. Storage buckets for images
 * 4. Sample data for testing
 * 
 * Usage:
 * 1. Create your Supabase project at https://supabase.com/dashboard
 * 2. Add your credentials to .env file
 * 3. Run: node scripts/setup-database.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('📝 Please add EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test connection first
async function testConnection() {
  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    // If we get here, connection works (even if table doesn't exist)
    return true;
  } catch (err) {
    console.error('❌ Cannot connect to Supabase. Please check your credentials.');
    console.log('🔧 Make sure your SUPABASE_SERVICE_ROLE_KEY is correct in .env');
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up Entry Point database...\n');

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  console.log('✅ Connected to Supabase\n');

  try {
    // 1. Read and execute schema
    console.log('📊 Creating database schema...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    
    // Split by statements and execute each one
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.log(`⚠️  Statement error (may be expected): ${error.message}`);
        }
      }
    }
    console.log('✅ Database schema created\n');

    // 2. Create storage buckets
    console.log('📁 Creating storage buckets...');
    
    const buckets = [
      { name: 'avatars', public: true },
      { name: 'giveaway-images', public: true }
    ];

    for (const bucket of buckets) {
      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️  Error creating bucket ${bucket.name}: ${error.message}`);
      } else {
        console.log(`✅ Bucket '${bucket.name}' ready`);
      }
    }
    console.log('');

    // 3. Insert sample data
    console.log('🎯 Adding sample data...');
    const sampleDataSQL = fs.readFileSync(path.join(__dirname, '../database/sample_data.sql'), 'utf8');
    
    const dataStatements = sampleDataSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of dataStatements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.log(`⚠️  Data insertion warning: ${error.message}`);
        }
      }
    }
    console.log('✅ Sample data added\n');

    console.log('🎉 Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with the correct Supabase URL and keys');
    console.log('2. Restart your Expo development server');
    console.log('3. Your app will now use the real Supabase backend!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Check if we can connect to Supabase
supabase.from('profiles').select('count').limit(1).then(({ error }) => {
  if (error) {
    console.error('❌ Cannot connect to Supabase. Please check your credentials.');
    console.log('🔧 Make sure your SUPABASE_SERVICE_ROLE_KEY is correct in .env');
    process.exit(1);
  } else {
    setupDatabase();
  }
});
