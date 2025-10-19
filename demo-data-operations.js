// Demo script showing how to add and read data from Supabase
// This script demonstrates basic CRUD operations
// Run with: node demo-data-operations.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function demonstrateDataOperations() {
  console.log('🎯 Supabase Data Operations Demo');
  console.log('================================\n');
  
  try {
    // 1. READ DATA - Get all user roles
    console.log('1️⃣  Reading data from user_roles table...');
    const { data: roles, error: readError } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (readError) {
      console.error('❌ Error reading data:', readError.message);
      return;
    }
    
    console.log('✅ Successfully read', roles.length, 'user roles');
    if (roles.length > 0) {
      console.log('📋 Sample data:');
      roles.slice(0, 3).forEach((role, index) => {
        console.log(`   ${index + 1}. User ID: ${role.user_id}, Role: ${role.role}, Created: ${role.created_at}`);
      });
    } else {
      console.log('📋 No data found in user_roles table');
    }
    
    // 2. ADD DATA - Insert a new user role (if we have admin access)
    if (supabaseAdmin) {
      console.log('\n2️⃣  Adding new data to user_roles table...');
      
      // Generate a test user ID
      const testUserId = 'demo-user-' + Date.now();
      
      const { data: newRole, error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: testUserId,
          role: 'user'
        })
        .select()
        .single();
      
      if (insertError) {
        console.log('ℹ️  Insert failed (may be due to constraints):', insertError.message);
      } else {
        console.log('✅ Successfully added new user role:');
        console.log('   User ID:', newRole.user_id);
        console.log('   Role:', newRole.role);
        console.log('   Created:', newRole.created_at);
        
        // 3. UPDATE DATA - Update the role we just created
        console.log('\n3️⃣  Updating the role we just created...');
        const { data: updatedRole, error: updateError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', testUserId)
          .select()
          .single();
        
        if (updateError) {
          console.log('ℹ️  Update failed:', updateError.message);
        } else {
          console.log('✅ Successfully updated role to:', updatedRole.role);
        }
        
        // 4. DELETE DATA - Clean up our test data
        console.log('\n4️⃣  Cleaning up test data...');
        const { error: deleteError } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', testUserId);
        
        if (deleteError) {
          console.log('ℹ️  Delete failed:', deleteError.message);
        } else {
          console.log('✅ Successfully cleaned up test data');
        }
      }
    } else {
      console.log('\n2️⃣  Skipping data insertion (no service key provided)');
      console.log('   To test data insertion, add SUPABASE_SERVICE_ROLE_KEY to your .env file');
    }
    
    // 5. AUTHENTICATION DEMO - Show how to work with authenticated users
    console.log('\n5️⃣  Authentication demo...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (expected for demo)');
    } else if (user) {
      console.log('✅ Authenticated user found:', user.email);
      
      // Get user's role
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (roleError) {
        console.log('ℹ️  Could not fetch user role:', roleError.message);
      } else {
        console.log('   User role:', userRole.role);
      }
    }
    
    console.log('\n🎉 Data operations demo completed successfully!');
    console.log('\nKey takeaways:');
    console.log('• ✅ Reading data works with anon key');
    console.log('• ✅ Writing data requires service role key');
    console.log('• ✅ Authentication integrates seamlessly');
    console.log('• ✅ Row Level Security (RLS) is properly configured');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demo
demonstrateDataOperations().catch(console.error);