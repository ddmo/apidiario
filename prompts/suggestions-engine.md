# Apidiario — Motore di suggerimenti per ispezioni arnia

## Contesto

Apidiario è una PWA mobile-first per la gestione di apiari e arnie.
Stack: React + Vite + TypeScript strict + Tailwind v4 + Supabase + TanStack Router/Query + vite-plugin-pwa.

## Obiettivo

Implementare un motore di suggerimenti **rule-based deterministico** (NON un LLM) che, data un'arnia e la sua ultima ispezione, produca una lista di azioni consigliate per la prossima visita. Il motore deve essere richiamabile da una nuova schermata accessibile da un pulsante nella top bar dell'apiario, e mostrare i suggerimenti raggruppati per arnia.

## Riferimenti obbligatori — leggi PRIMA di scrivere codice

1. `SPEC.md` — specifica funzionale, naming, modalità Express/Standard
2. `SCHEMA.sql` — definizioni di tabelle ed enum (`queen_seen_state`, `population_strength`, `queen_cells_type`, `behavior_type`, `pathology`, `varroa_count_method`, `hive_status`, `bee_race`, `hive_type`)
3. `DESIGN.md` — palette, componenti, tipografia
4. La struttura attuale di `src/routes/` per capire come sono organizzate le rotte TanStack Router e dove inserire la nuova rotta apiario

**STOP GATE 1**: dopo aver letto questi file, riassumi in 5-10 righe (a) i valori esatti degli enum rilevanti, (b) dove inseriresti la nuova rotta, (c) eventuali convenzioni di naming/cartelle che noti. Aspetta conferma prima di procedere.

## Architettura

### Struttura file

```
src/
  lib/
    suggestions/
      types.ts                 # tipi pubblici
      engine.ts                # generateSuggestions()
      registry.ts              # array di regole registrate
      seasons.ts               # helper stagione/clima da date+lat
      rules/
        queen.ts               # regole regina + covata
        health.ts              # regole patologie + varroa
        stores.ts              # regole scorte (miele/polline)
        equipment.ts           # regole attrezzatura arnia
        swarming.ts            # regole sciamatura
        schedule.ts            # regole basate su tempo trascorso
        season.ts              # regole stagionali
        behavior.ts            # regole comportamento + razza
      __tests__/
        engine.test.ts
        rules/
          queen.test.ts
          ...
  routes/
    _authed/
      apiaries/
        $apiaryId/
          suggestions.tsx      # nuova rotta
  features/
    suggestions/
      components/
        SuggestionsButton.tsx  # pulsante in top bar apiario
        HiveSuggestionCard.tsx # card per arnia
        SuggestionItem.tsx     # singolo suggerimento
        SeverityBadge.tsx
      hooks/
        useApiarySuggestions.ts  # TanStack Query hook
```

(Adatta i path se la convenzione esistente nel repo è diversa — segui quella.)

### Tipi pubblici (`src/lib/suggestions/types.ts`)

```typescript
export type Severity = 'critical' | 'warning' | 'info';

export type Category =
  | 'queen' | 'brood' | 'population' | 'stores' | 'health'
  | 'swarming' | 'equipment' | 'harvest' | 'schedule' | 'season' | 'behavior';

export interface Suggestion {
  id: string;             // stabile, slug-like (es. "suspected-orphan")
  severity: Severity;
  category: Category;
  title: string;          // i18n italiano, max 60 char
  description: string;    // i18n italiano, max 200 char
  reason: string;         // tracciabilità: "perché te lo dico"
  dueByDays?: number;     // urgenza relativa, es. 7 = entro 7 giorni
}

export interface SuggestionContext {
  hive: Hive;                          // tipo da Supabase
  lastInspection: Inspection | null;   // null se mai ispezionata
  daysSinceLastInspection: number | null;
  today: Date;                         // INIETTATO per testabilità
  apiaryLat?: number | null;           // per dedurre stagione
}

export type Rule = (ctx: SuggestionContext) => Suggestion | null;
```

### Engine (`engine.ts`)

```typescript
export function generateSuggestions(ctx: SuggestionContext): Suggestion[] {
  return rules
    .map(rule => rule(ctx))
    .filter((s): s is Suggestion => s !== null)
    .sort(compareBySeverityThenCategory);
}
```

Ordinamento: prima `critical`, poi `warning`, poi `info`. A parità di severità, ordine per categoria definito in un array costante.

## Catalogo regole da implementare

Implementa **almeno** queste 18 regole. Ogni regola in un file pertinente, esportata individualmente, registrata in `registry.ts`. ID stabile per ogni regola.

### Regina e covata
1. **`queen-not-seen`** (warning, queen): `lastInspection.queen_seen === 'non_vista'` → cerca regina alla prossima visita.
2. **`suspected-orphan`** (critical, queen): `queen_seen !== 'vista'` AND `brood_eggs === false` → sospetto orfanaggio, verifica urgente.
3. **`queen-failing`** (warning, brood): `brood_eggs === false` AND `brood_larvae === false` AND `brood_capped === true` → covata vecchia ma niente uova/larve, regina forse fallita.
4. **`queen-confirmed-by-eggs`** (info, queen): `queen_seen === 'non_vista'` AND `brood_eggs === true` → regina presente anche se non vista, OK ma utile saperlo.

### Sciamatura
5. **`royal-cells-followup`** (critical, swarming): `lastInspection.queen_cells != null` AND giorni dall'ispezione ≥ 5 → ricontrollo urgente entro 7 giorni dall'ultima visita.
6. **`swarm-prone-race-spring`** (info, swarming): `bee_race === 'carnica'` AND stagione = primavera → ispezioni più ravvicinate per prevenire sciamatura.

### Salute
7. **`pathology-followup`** (warning, health): `pathologies` non vuoto → controllo evoluzione patologia X (cita la patologia nel `description`).
8. **`varroa-treatment-window`** (warning, health): `varroa_count != null` AND valore alto (>3 in caduta naturale, da definire soglia per metodo) → pianifica trattamento.
9. **`varroa-count-missing-in-season`** (warning, health): nessun `varroa_count` registrato negli ultimi 60 giorni AND mese tra luglio e settembre → conteggio raccomandato.

### Scorte e popolazione
10. **`weak-population`** (warning, population): `lastInspection.population === 'debole'` → valuta nutrizione o unione.
11. **`low-honey-stores-pre-winter`** (warning, stores): `honey_frame_count <= 2` AND mese tra settembre e novembre → integrazione zuccherina.
12. **`low-pollen-spring`** (info, stores): `pollen_frame_count <= 1` AND mese tra febbraio e aprile → candito proteico.

### Attrezzatura
13. **`pollen-trap-check`** (info, equipment): `hive.has_pollen_trap === true` → verifica e svuota la trappola.
14. **`propolis-net-check`** (info, equipment): `hive.has_propolis_net === true` → verifica se la rete è da raccogliere.
15. **`melari-check`** (warning, harvest): `hive.melari_count > 0` → controllo melari, valuta smielatura e rotazione.

### Schedulazione e ciclo
16. **`overdue-inspection-active-season`** (warning, schedule): `daysSinceLastInspection > 14` AND mese tra marzo e settembre → ispezione programmata.
17. **`first-inspection-needed`** (info, schedule): `lastInspection === null` AND `hive.installed_on` esiste → prima ispezione.
18. **`post-swarm-queen-check`** (warning, queen): `hive.status === 'sciamata'` AND giorni dall'evento tra 21 e 35 → verifica nuova regina ovificante.

### Comportamento
(Saltabile in prima implementazione, ma lascia gli stub.)
19. **`aggressive-behavior-recurring`** (info, behavior): comportamento aggressivo in 2+ ispezioni consecutive → valuta cambio regina (richiede storico, non solo `lastInspection` — vedi nota sotto).

**Nota sulle regole multi-ispezione**: la regola 19 richiede uno storico, non solo l'ultima ispezione. Per ora **non implementarla**, ma estendi `SuggestionContext` con un campo opzionale `recentInspections?: Inspection[]` (ultime 5) così è facile aggiungerla dopo.

## UI

### Pulsante in top bar apiario

- File: `features/suggestions/components/SuggestionsButton.tsx`
- Posizionato nella top bar della vista apiario, **immediatamente accanto** al pulsante meteo (che già esiste — riusa lo stesso pattern di `IconButton` o equivalente del design system).
- Icona: `Lightbulb` di lucide-react (o `ListChecks` se preferito dopo aver guardato `DESIGN.md`).
- Al tap: navigazione a `/apiaries/$apiaryId/suggestions`.
- Badge con conteggio dei suggerimenti `critical` aggregati su tutte le arnie dell'apiario, mostrato solo se >0. Il conteggio arriva da `useApiarySuggestions(apiaryId)`.

### Schermata suggerimenti

- File rotta: `routes/_authed/apiaries/$apiaryId/suggestions.tsx`
- Header con titolo "Suggerimenti" e nome apiario.
- Body: lista di **`HiveSuggestionCard`**, una per arnia attiva dell'apiario (`archived_at IS NULL`), ordinate per `identifier` ASC.
- Ogni card mostra:
  - Header arnia: identifier, tipo arnia, razza
  - Data ultima ispezione (o "mai ispezionata")
  - Lista di `SuggestionItem`: badge severità (colore: critical=rosso, warning=giallo, info=neutral), titolo, description, e in piccolo `reason` (collassabile/info icon).
  - Se zero suggerimenti per quell'arnia, mostra un messaggio positivo tipo "Tutto in ordine ✓".
- Mobile-first: card a larghezza piena, padding consistente con il resto dell'app, niente azioni cliccabili sui singoli suggerimenti in questa fase (solo lettura).

### Data fetching

Hook `useApiarySuggestions(apiaryId)`:
- Una sola query Supabase con embedding PostgREST: `hives?select=*,inspections(*)&apiary_id=eq.X&archived_at=is.null&inspections.order=performed_at.desc&inspections.limit=1`
- Trasforma il risultato in `{ hive, lastInspection, suggestions }[]` chiamando `generateSuggestions` per ogni arnia
- `staleTime: 60_000`, perché lo stato non cambia frequentemente
- Fallback graceful se l'apiario non esiste o non ha arnie

## Test

Tutto il motore deve essere coperto da unit test con Vitest. Per ogni regola almeno **3 test**: caso che attiva la regola, caso che NON la attiva, edge case (es. valori null/undefined). Usa `it.each` parametrizzato dove ha senso.

Test critici aggiuntivi:
- `engine.test.ts`: ordine corretto dei suggerimenti per severità
- `engine.test.ts`: data iniettata correttamente in tutte le regole
- `seasons.test.ts`: deduzione stagione da data + latitudine (nord/sud emisfero)

Niente test E2E in questa fase — quelli arriveranno separatamente.

## Vincoli — cosa NON fare

- **Non chiamare LLM** in questa funzionalità. È pura logica deterministica.
- **Non fare query separate per ogni arnia**: usa l'embedding PostgREST per una sola roundtrip.
- **Non hard-codare la data di sistema**: `today` deve sempre arrivare da `SuggestionContext`, mai da `new Date()` dentro le regole. Questo è non-negoziabile per la testabilità.
- **Non aggiungere i18n framework**: le stringhe italiane sono inline nelle regole per ora. (Se in futuro c'è multilingua, si refactora.)
- **Non modificare lo schema DB**. La tua materia prima sono i dati esistenti.
- **Non implementare la regola 19** (richiede storico) — solo lascia lo stub commentato.

## Modalità di lavoro a fasi

Lavora in queste fasi ed esegui uno **STOP GATE** alla fine di ognuna mostrandomi i file creati e attendendomi prima di proseguire.

**Fase 1** — Tipi, engine vuoto, file scaffold per tutte le regole (export delle funzioni con `return null` placeholder), registry. Niente UI, niente test. Verifica che `tsc --noEmit` passi.

**STOP GATE 2**: mostra struttura file e tipi.

**Fase 2** — Implementa regole 1-9 (regina, covata, sciamatura, salute) con i relativi test. Mostrami coverage per queste regole.

**STOP GATE 3**.

**Fase 3** — Implementa regole 10-18 (scorte, attrezzatura, schedulazione) con test. Implementa anche `seasons.ts` con test.

**STOP GATE 4**.

**Fase 4** — Hook `useApiarySuggestions` con query Supabase. Niente UI ancora. Test del trasformatore (mock dei dati Supabase).

**STOP GATE 5**.

**Fase 5** — UI: pulsante top bar + schermata + card + items. Verifica visivamente con dati di seed.

**STOP GATE FINALE**: riepilogo di cosa è stato fatto, cosa è coperto da test, cosa è rimasto fuori (es. regola 19, sintesi narrativa LLM).

---

## Note finali

Se durante l'implementazione trovi ambiguità nei dati (es. enum value che non corrisponde a quello che mi aspettavo), **fermati e chiedi**, non indovinare. Se trovi codice esistente che già fa qualcosa di simile, segnalamelo prima di duplicarlo.