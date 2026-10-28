// Shared types for the Registrations module
// These are extracted from RegistrationsClient.tsx to be shared across components.

export type ActiveTab = 'VERIFICATION' | 'RESERVED' | 'STAGING' | 'ALL'
export type DirTab = 'UPCOMING' | 'TODAY' | 'PAST'
export type DirStatusFilter = 'ALL' | 'PENDING' | 'FULL' | 'AVAILABLE'
export type DirCapacityFilter = 'ALL' | 'HAS_SLOTS' | 'FULL'
export type DirSort = 'NEAREST' | 'MOST_REGS' | 'REMAINING_SLOTS'
export type ModalType =
  | 'RESERVE'
  | 'RESCHEDULE'
  | 'STATUS'
  | 'WALK_IN'
  | 'VERIFY_PAYMENT'
  | 'MOVE_TO_STAGING'
  | 'RESCHEDULE_FROM_STAGING'
  | null

export type WalkInStep1Filter = 'ALL' | 'FREE' | 'PAID'

export interface SessionEntry {
  session: any
  pendingCount: number
  reservedCount: number
  onlineReservedCount: number
  walkInReservedCount: number
  totalCount: number
}

export interface SummaryStats {
  pendingVerification: number
  awaitingPayment: number
  reservedConfirmed: number
  total: number
}
