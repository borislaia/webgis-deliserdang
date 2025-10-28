import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import bcrypt from 'https://deno.land/x/bcrypt@v0.4.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, email, password, full_name, role } = await req.json()

    if (action === 'login') {
      // Login user
      const { data: user, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (error || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      if (!isValidPassword) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Update last login
      await supabaseClient
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)

      // Return user data (without password hash)
      const { password_hash, ...userData } = user
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: userData,
          message: 'Login successful' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } else if (action === 'register') {
      // Register new user
      if (!email || !password || !full_name) {
        return new Response(
          JSON.stringify({ error: 'Email, password, and full name are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseClient
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'User already exists' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Hash password
      const password_hash = await bcrypt.hash(password)

      // Create user
      const { data: newUser, error } = await supabaseClient
        .from('users')
        .insert({
          email,
          password_hash,
          full_name,
          role: role || 'user'
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Return user data (without password hash)
      const { password_hash: _, ...userData } = newUser
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: userData,
          message: 'Registration successful' 
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } else if (action === 'get_users') {
      // Get all users (admin only)
      const { data: users, error } = await supabaseClient
        .from('users')
        .select('id, email, full_name, role, is_active, last_login, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch users' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          users 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
