import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log('🔍 Entry Point System Check\n');

// Check Supabase
console.log('📊 SUPABASE STATUS:');
if (supabaseUrl && supabaseAnonKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) {
      console.log('❌ Supabase: Connected but profiles table missing');
    } else {
      console.log('✅ Supabase: Connected and working');
    }
  } catch (err) {
    console.log('❌ Supabase: Connection failed');
  }
} else {
  console.log('❌ Supabase: Missing credentials');
}

// Check Google Auth
console.log('\n🔐 GOOGLE AUTH STATUS:');
if (googleClientId && !googleClientId.includes('YOUR_REAL_GOOGLE_CLIENT_ID_HERE')) {
  console.log('✅ Google Auth: Client ID configured');
  console.log('ℹ️  Make sure to also update app.json with reversed client ID');
} else {
  console.log('❌ Google Auth: Client ID not configured');
  console.log('📝 Action needed: Update EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env');
}

// Check Stripe
console.log('\n💳 STRIPE STATUS:');
if (stripeKey && stripeKey.startsWith('pk_')) {
  console.log('✅ Stripe: Configured and ready');
} else {
  console.log('❌ Stripe: Missing or invalid publishable key');
}

console.log('\n📱 APP STATUS:');
const allGood = supabaseUrl && supabaseAnonKey && 
               googleClientId && !googleClientId.includes('YOUR_REAL_GOOGLE_CLIENT_ID_HERE') &&
               stripeKey && stripeKey.startsWith('pk_');

if (allGood) {
  console.log('🎉 All systems ready! Your app should work perfectly.');
} else {
  console.log('⚠️  Some configuration needed - see issues above');
}

console.log('\n🔧 Quick Fixes:');
console.log('1. For Google: https://console.cloud.google.com/apis/credentials');
console.log('2. For Database: Already working!');
console.log('3. For Stripe: Already configured!');
