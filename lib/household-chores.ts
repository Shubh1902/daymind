export type ChoreCategory = {
  id: string
  label: string
  emoji: string
  defaultMinutes: number
  effortScore: number // 1-5, weights fairness calculation
}

export const CHORE_CATEGORIES: ChoreCategory[] = [
  { id: "cooking", label: "Cooking", emoji: "\u{1F373}", defaultMinutes: 45, effortScore: 4 },
  { id: "dishes", label: "Dishes", emoji: "\u{1F37D}\uFE0F", defaultMinutes: 20, effortScore: 2 },
  { id: "cleaning", label: "Cleaning", emoji: "\u{1F9F9}", defaultMinutes: 40, effortScore: 3 },
  { id: "laundry", label: "Laundry", emoji: "\u{1F455}", defaultMinutes: 30, effortScore: 2 },
  { id: "groceries", label: "Groceries", emoji: "\u{1F6D2}", defaultMinutes: 60, effortScore: 3 },
  { id: "vacuuming", label: "Vacuuming", emoji: "\u{1F9F9}", defaultMinutes: 25, effortScore: 2 },
  { id: "mopping", label: "Mopping", emoji: "\u{1FAA3}", defaultMinutes: 30, effortScore: 3 },
  { id: "trash", label: "Trash", emoji: "\u{1F5D1}\uFE0F", defaultMinutes: 10, effortScore: 1 },
  { id: "bathroom", label: "Bathroom", emoji: "\u{1F6BF}", defaultMinutes: 25, effortScore: 3 },
  { id: "ironing", label: "Ironing", emoji: "\u{1F454}", defaultMinutes: 30, effortScore: 2 },
  { id: "meal_prep", label: "Meal Prep", emoji: "\u{1F957}", defaultMinutes: 60, effortScore: 4 },
  { id: "organizing", label: "Organizing", emoji: "\u{1F4E6}", defaultMinutes: 30, effortScore: 3 },
  { id: "yard_work", label: "Yard/Garden", emoji: "\u{1F33F}", defaultMinutes: 45, effortScore: 4 },
  { id: "other", label: "Other", emoji: "\u2728", defaultMinutes: 20, effortScore: 2 },
]

const choreMap = new Map(CHORE_CATEGORIES.map((c) => [c.id, c]))

export function getChoreDefaults(choreType: string): { defaultMinutes: number; effortScore: number } {
  const chore = choreMap.get(choreType)
  return chore
    ? { defaultMinutes: chore.defaultMinutes, effortScore: chore.effortScore }
    : { defaultMinutes: 20, effortScore: 2 }
}

export function getChoreEmoji(choreType: string): string {
  return choreMap.get(choreType)?.emoji ?? "\u2728"
}

export function getChoreLabel(choreType: string): string {
  return choreMap.get(choreType)?.label ?? choreType
}
