export const CANCELLATION_REASONS = [
  'Instructor Unavailability',
  'Technical / Machine Maintenance',
  'Severe Weather Conditions',
  'Power Outage / Facility Issues',
  'Low Participant Turnout',
  'Other / Unforeseen Circumstances',
] as const

export interface SessionBooking {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  status: string
  kidName?: string | null
  companionName?: string | null
  notes?: string | null
  participantsCount?: number
}

export interface SessionModule {
  id: string
  name: string
  description: string | null
  units: number
  category?: string
  price?: number | null
}

export interface SessionData {
  id: string
  category: string
  sessionDate: string
  startTime: string
  endTime: string
  durationHours: number
  capacity: number
  onlineCapacity?: number | null
  offlineCapacity?: number | null
  availableSlots: number
  status: string
  bookingsCount: number
  bookings: SessionBooking[]
  notes?: string | null
  collaborator?: string | null
  module?: SessionModule
}
