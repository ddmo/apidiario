export type SuggestionFilterCategory = 'queen' | 'health' | 'schedule' | 'population' | 'swarming' | 'equipment' | 'harvest'

export interface SuggestionFilterOption {
  key: string
  label: string
  category: SuggestionFilterCategory
  matchPrefix?: boolean
  whenDescription: string
}

export const SUGGESTION_FILTER_OPTIONS: SuggestionFilterOption[] = [
  {
    key: 'queen-not-seen', label: 'Regina non vista', category: 'queen',
    whenDescription: "Nell'ultima ispezione la regina è stata cercata ma non avvistata.",
  },
  {
    key: 'suspected-orphan', label: 'Sospetto orfanaggio', category: 'queen',
    whenDescription: "Nell'ultima ispezione la regina non è stata vista e non ci sono uova fresche.",
  },
  {
    key: 'queen-failing', label: 'Possibile fallimento regina', category: 'queen',
    whenDescription: "C'è covata opercolata ma niente uova né larve fresche: la regina potrebbe aver smesso di ovideporre.",
  },
  {
    key: 'queen-confirmed-by-eggs', label: 'Regina presente (uova fresche)', category: 'queen',
    whenDescription: "La regina non è stata vista ma ci sono uova fresche, conferma che è attiva.",
  },
  {
    key: 'post-swarm-queen-check', label: 'Verifica nuova regina', category: 'queen',
    whenDescription: "Tra 21 e 35 giorni da quando un'arnia è stata segnata come 'sciamata', il tempo tipico per l'accoppiamento di una nuova regina.",
  },
  {
    key: 'pathology-followup', label: 'Patologia da monitorare', category: 'health',
    whenDescription: "Nell'ultima ispezione è stata rilevata una o più patologie, come promemoria a monitorarne l'evoluzione.",
  },
  {
    key: 'varroa-treatment-window', label: 'Soglia varroa superata', category: 'health',
    whenDescription: "Il conteggio varroa dell'ultima ispezione supera la soglia critica per il metodo usato (es. oltre 3 per caduta naturale).",
  },
  {
    key: 'varroa-count-missing-in-season', label: 'Conteggio varroa', category: 'health',
    whenDescription: "Tra luglio e settembre, se non è stato registrato alcun conteggio varroa nelle ispezioni recenti.",
  },
  {
    key: 'reminder', label: 'Promemoria', category: 'schedule', matchPrefix: true,
    whenDescription: "Quando c'è un promemoria attivo in scadenza o già scaduto (globale, per l'apiario o per l'arnia).",
  },
  {
    key: 'overdue-inspection-active-season', label: 'Ispezione in ritardo', category: 'schedule',
    whenDescription: "Da marzo a settembre, se sono passati più di 14 giorni dall'ultima ispezione.",
  },
  {
    key: 'first-inspection-needed', label: 'Prima ispezione consigliata', category: 'schedule',
    whenDescription: "L'arnia è stata installata ma non è mai stata ispezionata.",
  },
  {
    key: 'weak-population', label: 'Popolazione debole', category: 'population',
    whenDescription: "L'ultima ispezione riporta una popolazione 'debole'.",
  },
  {
    key: 'low-honey-stores-pre-winter', label: 'Scorte invernali insufficienti', category: 'population',
    whenDescription: "Da settembre a novembre, se l'arnia ha 2 o meno telaini di miele.",
  },
  {
    key: 'low-pollen-spring', label: 'Poco polline in primavera', category: 'population',
    whenDescription: "Da febbraio ad aprile, se l'arnia ha 1 o meno telaini di polline.",
  },
  {
    key: 'royal-cells-followup', label: 'Celle reali', category: 'swarming',
    whenDescription: "Dal 5° giorno dopo un'ispezione in cui sono state trovate o rimosse celle reali.",
  },
  {
    key: 'swarming-fever', label: 'Febbre da sciamatura', category: 'swarming',
    whenDescription: "Quando nell'ultima ispezione sono state rimosse celle reali. La gravità aumenta in base alla razza, al tipo di celle, alla stagione e a ispezioni precedenti.",
  },
  {
    key: 'swarm-prone-race-spring', label: 'Razza tendente a sciamatura', category: 'swarming',
    whenDescription: "In primavera per le arnie di razza Carnica, naturalmente più propense alla sciamatura.",
  },
  {
    key: 'pollen-trap-check', label: 'Verifica trappola polline', category: 'equipment',
    whenDescription: "Sempre presente quando l'arnia ha una trappola per polline installata.",
  },
  {
    key: 'propolis-net-check', label: 'Verifica rete propoli', category: 'equipment',
    whenDescription: "Sempre presente quando l'arnia ha una rete per propoli installata.",
  },
  {
    key: 'melari-check', label: 'Controllo melari', category: 'harvest',
    whenDescription: "Quando l'arnia ha almeno un melario installato.",
  },
]

export const SUGGESTION_CATEGORY_LABELS: Record<SuggestionFilterCategory, string> = {
  queen:      'Regina',
  health:     'Salute',
  schedule:   'Calendario',
  population: 'Scorte & Popolazione',
  swarming:   'Sciamatura',
  equipment:  'Attrezzatura',
  harvest:    'Raccolto',
}

export const ALL_SUGGESTION_FILTER_KEYS: string[] = SUGGESTION_FILTER_OPTIONS.map((o) => o.key)

export function isSuggestionVisible(suggestionId: string, enabledKeys: Set<string>): boolean {
  for (const opt of SUGGESTION_FILTER_OPTIONS) {
    const matches = opt.matchPrefix
      ? suggestionId.startsWith(opt.key + '-')
      : suggestionId === opt.key
    if (matches) return enabledKeys.has(opt.key)
  }
  return true
}
