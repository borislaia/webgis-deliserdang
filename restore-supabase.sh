#!/bin/bash

# Script untuk restore Supabase database dan storage
# Pastikan Anda sudah login ke Supabase CLI dan project sudah di-link

echo "🚀 Starting Supabase Recovery Process..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI tidak terinstall"
    echo "Install dengan: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project belum di-link ke Supabase"
    echo "Jalankan: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "✅ Supabase CLI terdeteksi"
echo ""

# Step 1: Push migrations
echo "📦 Step 1: Menjalankan migrasi database..."
supabase db push
if [ $? -eq 0 ]; then
    echo "✅ Migrasi database berhasil"
else
    echo "❌ Migrasi database gagal"
    exit 1
fi

echo ""
echo "📋 Step 2: Buat storage buckets secara manual di Supabase Dashboard:"
echo "   - geojson (public)"
echo "   - images (public)"
echo "   - csv (public, jika diperlukan)"
echo ""
echo "💡 Storage policies sudah dibuat oleh migrasi"
echo ""

echo "👤 Step 3: Setup admin user di Supabase Dashboard atau jalankan SQL:"
echo ""
cat << 'EOF'
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb), 
  '{role}', 
  to_jsonb('admin'::text), 
  true
),
raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  to_jsonb('admin'::text), 
  true
)
WHERE email = 'borizzzlaia@gmail.com';
EOF

echo ""
echo "✅ Recovery process selesai!"
echo "📝 Jangan lupa untuk:"
echo "   1. Buat storage buckets di Dashboard"
echo "   2. Setup admin user"
echo "   3. Upload data backup (jika ada)"
echo "   4. Test aplikasi"
