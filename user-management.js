#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { getUserRole, getAllUsers, getUserById } from './backend/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('👥 User Management System');
console.log('========================');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function listAllUsers() {
  try {
    console.log('📋 All Users in auth.users:');
    console.log('============================');
    
    const users = await getAllUsers();
    
    if (users.length === 0) {
      console.log('No users found');
      return;
    }
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const role = await getUserRole(user.id);
      
      console.log(`\n${i + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${role}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`);
    }
    
    console.log(`\n📊 Total users: ${users.length}`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function createNewUser() {
  try {
    console.log('\n➕ Create New User');
    console.log('==================');
    
    // For demo purposes, create a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`Creating user: ${testEmail}`);
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        role: 'user',
        created_by: 'user_management_script'
      }
    });
    
    if (userError) {
      console.log('❌ User creation error:', userError.message);
      return;
    }
    
    console.log('✅ User created successfully');
    console.log(`   Email: ${userData.user.email}`);
    console.log(`   ID: ${userData.user.id}`);
    
    // Set user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'user'
      });
    
    if (roleError) {
      console.log('❌ Role assignment error:', roleError.message);
    } else {
      console.log('✅ Role assigned successfully');
    }
    
    console.log(`\n🔑 Login credentials:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
      await listAllUsers();
      break;
    case 'create':
      await createNewUser();
      break;
    default:
      console.log('Usage:');
      console.log('  node user-management.js list    - List all users');
      console.log('  node user-management.js create  - Create a test user');
      break;
  }
}

main();