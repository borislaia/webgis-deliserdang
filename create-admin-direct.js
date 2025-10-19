// Direct admin creation script that works around table issues
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser() {
  console.log('🚀 Creating Admin User for WebGIS Deli Serdang');
  console.log('==============================================\n');
  
  try {
    const email = 'admin@deliserdang.com';
    const password = await question('Enter password for admin user: ');
    
    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      rl.close();
      return;
    }
    
    console.log('\n📝 Creating admin user...');
    
    // Create user using Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'admin'
      }
    });
    
    if (error) {
      console.error('❌ Error creating user:', error.message);
      rl.close();
      return;
    }
    
    if (data.user) {
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', data.user.email);
      console.log('🆔 User ID:', data.user.id);
      
      // Try to create the user_roles table and set admin role
      console.log('\n🔧 Setting up database tables...');
      
      try {
        // Create user_roles table if it doesn't exist
        const { error: tableError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS user_roles (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(user_id)
            );
          `
        });
        
        if (tableError) {
          console.log('⚠️  Could not create table via RPC, trying direct insert...');
        }
        
        // Try to insert admin role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({ 
            user_id: data.user.id, 
            role: 'admin' 
          });
        
        if (roleError) {
          console.log('⚠️  Could not set role in user_roles table:', roleError.message);
          console.log('💡 You may need to run the SQL setup script manually in Supabase dashboard');
        } else {
          console.log('✅ Admin role set successfully!');
        }
        
      } catch (dbError) {
        console.log('⚠️  Database setup issue:', dbError.message);
        console.log('💡 The user was created but you may need to set up the database tables manually');
      }
      
      console.log('\n🎉 Admin user setup complete!');
      console.log('📋 Login credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('   Role: admin');
      console.log('\n🌐 You can now login at: http://localhost:3000/login.html');
      console.log('\n📝 Next steps:');
      console.log('1. Start your backend server: npm run backend');
      console.log('2. Open http://localhost:3000/login.html');
      console.log('3. Login with the credentials above');
      
    } else {
      console.log('❌ User creation failed - no user data returned');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  } finally {
    rl.close();
  }
}

createAdminUser().catch(console.error);