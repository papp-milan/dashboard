export type RippleScheduleKind = "daily" | "weekdays" | "weekly" | "custom"

export type RippleCategory = {
  id: string
  name: string
  color: string
  archivedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type RippleHabit = {
  id: string
  name: string
  description?: string
  categoryId: string
  icon?: string
  schedule: {
    kind: RippleScheduleKind
    weekdays?: number[]
  }
  createdAt: string
  archivedAt?: string | null
}

export type RippleCompletion = {
  id: string
  habitId: string
  completedOn: string
  completedAt: string
}

export type RipplePeriod = "week" | "month" | "year"
