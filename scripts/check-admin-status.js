
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key) {
                const val = valueParts.join('=').trim();
                if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
                if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = val;
            }
        }
    });
}

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkUserRole(email) {
    console.log(`🔍 Checking role for user: ${email}`);

    // We can't select from auth.users directly via JS client usually, 
    // but the service role admin client has listUsers (pagination).

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error.message);
        return;
    }

    const user = data.users.find(u => u.email === email);

    if (!user) {
        console.log('❌ User not found.');
        return;
    }

    console.log('✅ User found:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role (app_metadata):', user.app_metadata?.role || '(none)');

    if (user.app_metadata?.role !== 'admin') {
        console.log('\n⚠️  User is NOT an admin. The updated policy requires "role": "admin".');
        console.log('   You need to update the user metadata.');
    } else {
        console.log('\n✨ User IS an admin. They should be able to upload once policy is updated.');
    }
}

// Check for the known email
checkUserRole('borizzzlaia@gmail.com');
