/**
 * User metadata structure
 */
export interface UserMetadata {
  full_name?: string
  name?: string
  username?: string
  avatar_url?: string
  picture?: string
  role?: string
}

/**
 * App metadata structure
 */
export interface AppMetadata {
  role?: string
}

/**
 * Extended user type with typed metadata
 */
export interface TypedUser {
  id: string
  email?: string
  user_metadata: UserMetadata
  app_metadata: AppMetadata
}
