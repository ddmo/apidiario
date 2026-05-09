import type { Rule } from './types'

import { queenNotSeen, suspectedOrphan, queenFailing, queenConfirmedByEggs } from './rules/queen'
import { swarmingRoyalCellsFollowup, swarmingProneRaceSpring } from './rules/swarming'
import { pathologyFollowup, varroaTreatmentWindow, varroaCountMissingInSeason } from './rules/health'
import { weakPopulation, lowHoneyStoresPreWinter, lowPollenSpring } from './rules/stores'
import { pollenTrapCheck, propolisNetCheck } from './rules/equipment'
import { melariCheck } from './rules/harvest'
import { overdueInspectionActiveSeason, firstInspectionNeeded } from './rules/schedule'
import { postSwarmQueenCheck } from './rules/season'

export const rules: Rule[] = [
  // Queen & brood
  suspectedOrphan,
  queenFailing,
  queenNotSeen,
  queenConfirmedByEggs,
  // Swarming
  swarmingRoyalCellsFollowup,
  swarmingProneRaceSpring,
  // Health
  pathologyFollowup,
  varroaTreatmentWindow,
  varroaCountMissingInSeason,
  // Population & stores
  weakPopulation,
  lowHoneyStoresPreWinter,
  lowPollenSpring,
  // Equipment
  pollenTrapCheck,
  propolisNetCheck,
  // Harvest
  melariCheck,
  // Schedule
  overdueInspectionActiveSeason,
  firstInspectionNeeded,
  // Season
  postSwarmQueenCheck,
]
