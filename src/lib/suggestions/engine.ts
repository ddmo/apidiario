import type { Suggestion, SuggestionContext } from './types'
import { rules } from './registry'

const CATEGORY_ORDER: Record<string, number> = {
  queen: 0,
  brood: 1,
  population: 2,
  health: 3,
  swarming: 4,
  stores: 5,
  equipment: 6,
  harvest: 7,
  schedule: 8,
  season: 9,
  behavior: 10,
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

function compareBySeverityThenCategory(a: Suggestion, b: Suggestion): number {
  const sev = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
  if (sev !== 0) return sev
  return (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99)
}

export function generateSuggestions(ctx: SuggestionContext): Suggestion[] {
  return rules
    .map((rule) => rule(ctx))
    .filter((s): s is Suggestion => s !== null)
    .sort(compareBySeverityThenCategory)
}
