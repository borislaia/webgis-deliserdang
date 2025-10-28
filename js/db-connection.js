// Direct PostgreSQL connection to Supabase
// Alternative to Supabase client for better performance

const DB_CONFIG = {
  host: 'db.your-project-ref.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'your-db-password',
  ssl: { rejectUnauthorized: false }
}

// Note: This requires a PostgreSQL client library
// Install: npm install pg

class DatabaseConnection {
  constructor() {
    this.pool = null
    this.isConnected = false
  }

  async connect() {
    try {
      // Dynamic import untuk browser compatibility
      const { Pool } = await import('https://cdn.skypack.dev/pg@8.11.3')
      
      this.pool = new Pool(DB_CONFIG)
      this.isConnected = true
      console.log('✅ Database connected')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      throw error
    }
  }

  async query(text, params = []) {
    if (!this.isConnected) {
      await this.connect()
    }
    
    try {
      const result = await this.pool.query(text, params)
      return result
    } catch (error) {
      console.error('❌ Query failed:', error)
      throw error
    }
  }

  // Authentication methods
  async authenticateUser(email, password) {
    try {
      // Get user from database
      const result = await this.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      )

      if (result.rows.length === 0) {
        return { success: false, error: 'User not found' }
      }

      const user = result.rows[0]

      // Verify password (you'll need bcrypt)
      const bcrypt = await import('https://cdn.skypack.dev/bcryptjs@2.4.3')
      const isValidPassword = await bcrypt.compare(password, user.password_hash)

      if (!isValidPassword) {
        return { success: false, error: 'Invalid password' }
      }

      // Update last login
      await this.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      )

      // Return user without password
      const { password_hash, ...userData } = user
      return { success: true, user: userData }

    } catch (error) {
      console.error('Authentication error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  async createUser(userData) {
    try {
      const bcrypt = await import('https://cdn.skypack.dev/bcryptjs@2.4.3')
      const password_hash = await bcrypt.hash(userData.password, 10)

      const result = await this.query(
        `INSERT INTO users (email, password_hash, full_name, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, full_name, role, created_at`,
        [userData.email, password_hash, userData.full_name, userData.role || 'user']
      )

      return { success: true, user: result.rows[0] }
    } catch (error) {
      console.error('User creation error:', error)
      return { success: false, error: 'User creation failed' }
    }
  }

  async getUsers() {
    try {
      const result = await this.query(
        'SELECT id, email, full_name, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
      )
      return { success: true, users: result.rows }
    } catch (error) {
      console.error('Get users error:', error)
      return { success: false, error: 'Failed to fetch users' }
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end()
      this.isConnected = false
      console.log('✅ Database connection closed')
    }
  }
}

// Export singleton instance
export const db = new DatabaseConnection()

// Usage example:
/*
// In your auth.js
import { db } from './db-connection.js'

// Login
const result = await db.authenticateUser(email, password)
if (result.success) {
  // Store user data
  localStorage.setItem('user_info', JSON.stringify(result.user))
}
*/
