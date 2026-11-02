import type { RippleCategory, RippleCompletion, RippleHabit, RipplePeriod } from "./types"

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function sortNewestFirst(habits: RippleHabit[]): RippleHabit[] {
  return [...habits].sort((a, b) => {
    const dateOrder = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return dateOrder || a.id.localeCompare(b.id)
  })
}

export function isScheduledOn(habit: RippleHabit, date: Date): boolean {
  const day = date.getDay()
  switch (habit.schedule.kind) {
    case "daily": return true
    case "weekdays": return day >= 1 && day <= 5
    case "weekly": return habit.schedule.weekdays?.includes(day) ?? day === 1
    case "custom": return habit.schedule.weekdays?.includes(day) ?? false
  }
}

export function getCurrentStreak(habit: RippleHabit, completions: RippleCompletion[], today = new Date()): number {
  const completed = new Set(completions.filter(item => item.habitId === habit.id).map(item => item.completedOn))
  const cursor = new Date(today)
  let streak = 0
  // A not-yet-completed habit today may still retain the streak from yesterday.
  if (isScheduledOn(habit, cursor) && !completed.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  for (let guard = 0; guard < 3660; guard += 1) {
    if (isScheduledOn(habit, cursor)) {
      if (!completed.has(localDateKey(cursor))) break
      streak += 1
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function periodStart(period: RipplePeriod, now = new Date()): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === "week") {
    const day = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - day)
  } else if (period === "month") {
    start.setDate(1)
  } else {
    start.setMonth(0, 1)
  }
  return start
}

export function getCompletionRate(
  habits: RippleHabit[],
  completions: RippleCompletion[],
  period: RipplePeriod,
  now = new Date(),
): number {
  const start = periodStart(period, now)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const due = new Set<string>()
  for (const habit of habits) {
    if (habit.archivedAt) continue
    const cursor = new Date(start)
    for (let guard = 0; cursor <= end && guard < 370; guard += 1) {
      if (isScheduledOn(habit, cursor)) due.add(`${habit.id}:${localDateKey(cursor)}`)
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  if (due.size === 0) return 0
  const done = new Set(completions.map(item => `${item.habitId}:${item.completedOn}`))
  let completed = 0
  for (const key of due) if (done.has(key)) completed += 1
  return Math.round((completed / due.size) * 100)
}

export function categoryFor(
  habit: RippleHabit,
  categories: RippleCategory[],
): RippleCategory | undefined {
  return categories.find(category => category.id === habit.categoryId)
}
