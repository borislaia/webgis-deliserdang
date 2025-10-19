// Auto admin creation script
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  console.log('🚀 Creating Admin User for WebGIS Deli Serdang');
  console.log('==============================================\n');
  
  try {
    const email = 'admin@deliserdang.com';
    const password = 'admin123456'; // Default password
    
    console.log('📝 Creating admin user...');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
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
      return;
    }
    
    if (data.user) {
      console.log('✅ Admin user created successfully!');
      console.log('🆔 User ID:', data.user.id);
      
      // Try to create the user_roles table and set admin role
      console.log('\n🔧 Setting up database tables...');
      
      try {
        // Try to insert admin role directly
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({ 
            user_id: data.user.id, 
            role: 'admin' 
          });
        
        if (roleError) {
          console.log('⚠️  Could not set role in user_roles table:', roleError.message);
          console.log('💡 You may need to run the SQL setup script manually in Supabase dashboard');
          console.log('   Then run this SQL to set the admin role:');
          console.log(`   INSERT INTO user_roles (user_id, role) VALUES ('${data.user.id}', 'admin');`);
        } else {
          console.log('✅ Admin role set successfully!');
        }
        
      } catch (dbError) {
        console.log('⚠️  Database setup issue:', dbError.message);
        console.log('💡 The user was created but you may need to set up the database tables manually');
        console.log('   Run the SQL setup script in your Supabase dashboard first');
      }
      
      console.log('\n🎉 Admin user setup complete!');
      console.log('📋 Login credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('   Role: admin');
      console.log('\n🌐 You can now login at: http://localhost:3000/login.html');
      console.log('\n📝 Next steps:');
      console.log('1. Run the SQL setup script in your Supabase dashboard');
      console.log('2. Start your backend server: npm run backend');
      console.log('3. Open http://localhost:3000/login.html');
      console.log('4. Login with the credentials above');
      
    } else {
      console.log('❌ User creation failed - no user data returned');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createAdminUser().catch(console.error);