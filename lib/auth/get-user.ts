import { createClient } from '@/lib/supabase/server'
import { User } from '@/types/database.types'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single()

  if (error || !user) return null

  return user as User
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!user.approved) {
    throw new Error('User not approved')
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()

  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

export async function requireManager(): Promise<User> {
  const user = await requireAuth()

  if (user.role !== 'admin' && user.role !== 'manager') {
    throw new Error('Manager access required')
  }

  return user
}
