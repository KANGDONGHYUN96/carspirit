import { User, UserRole } from '@/types/database.types'

export function hasRole(user: User | null, roles: UserRole[]): boolean {
  if (!user || !user.approved) return false
  return roles.includes(user.role)
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, ['admin'])
}

export function isManager(user: User | null): boolean {
  return hasRole(user, ['manager', 'admin'])
}

export function isSalesperson(user: User | null): boolean {
  return hasRole(user, ['salesperson', 'manager', 'admin'])
}

export function canAccessAdminPages(user: User | null): boolean {
  return isAdmin(user)
}

export function canAccessManagerPages(user: User | null): boolean {
  return isManager(user)
}

export function canEditUser(currentUser: User | null, targetUser: User): boolean {
  if (!currentUser) return false
  if (isAdmin(currentUser)) return true
  return currentUser.id === targetUser.id
}

export function canApproveUsers(user: User | null): boolean {
  return isAdmin(user)
}

export function canManagePromotions(user: User | null): boolean {
  return isAdmin(user)
}

export function canManageStrategicModels(user: User | null): boolean {
  return isManager(user)
}

export function canViewAllContracts(user: User | null): boolean {
  return isManager(user)
}

export function canViewAllInquiries(user: User | null): boolean {
  return isManager(user)
}
