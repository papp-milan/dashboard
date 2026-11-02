import type { RippleCategory, RippleCompletion, RippleHabit } from "./types"
import { localDateKey } from "./ripple-utils"

const today = new Date()
const day = (offset: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() + offset)
  return date
}
const stamp = (offset: number) => day(offset).toISOString()

export const demoCategories: RippleCategory[] = [
  { id: "fitness", name: "Fitness", color: "#F4680A", createdAt: stamp(-60), updatedAt: stamp(-60) },
  { id: "learning", name: "Learning", color: "#F99D45", createdAt: stamp(-58), updatedAt: stamp(-58) },
  { id: "health", name: "Health", color: "#FF4D8D", createdAt: stamp(-56), updatedAt: stamp(-56) },
  { id: "personal", name: "Personal", color: "#00D9FF", createdAt: stamp(-54), updatedAt: stamp(-54) },
]

export const demoHabits: RippleHabit[] = [
  { id: "read", name: "Read 20 pages", categoryId: "learning", icon: "book", schedule: { kind: "daily" }, createdAt: stamp(-1) },
  { id: "workout", name: "Strength training", categoryId: "fitness", icon: "dumbbell", schedule: { kind: "weekdays" }, createdAt: stamp(-3) },
  { id: "water", name: "Drink 2L water", categoryId: "health", icon: "droplets", schedule: { kind: "daily" }, createdAt: stamp(-5) },
  { id: "coding", name: "Practice coding", categoryId: "learning", icon: "code", schedule: { kind: "daily" }, createdAt: stamp(-7) },
  { id: "walk", name: "Go for a walk", categoryId: "fitness", icon: "footprints", schedule: { kind: "daily" }, createdAt: stamp(-9) },
  { id: "journal", name: "Evening journal", categoryId: "personal", icon: "notebook-pen", schedule: { kind: "daily" }, createdAt: stamp(-11) },
  { id: "sleep", name: "Sleep before 23:00", categoryId: "health", icon: "moon", schedule: { kind: "daily" }, createdAt: stamp(-13) },
]

export const demoCompletions: RippleCompletion[] = demoHabits.flatMap((habit, index) =>
  Array.from({ length: 5 + (index % 3) }, (_, offset) => {
    const date = day(-offset)
    return {
      id: `${habit.id}-${localDateKey(date)}`,
      habitId: habit.id,
      completedOn: localDateKey(date),
      completedAt: date.toISOString(),
    }
  }),
)
