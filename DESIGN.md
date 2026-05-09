# DESIGN.md — Sistema di design Apidiario

> **Versione**: 0.5 · **Stato**: allineato al codice

---

## 1. Identità visiva

Apidiario è un'app da campo per apicoltori. Il design comunica calore, naturalezza e leggibilità sotto il sole.

### 1.1 Naming

- **Nome app**: Apidiario
- **Wordmark**: font Fraunces, usato esclusivamente nel logo/wordmark. Mai nel corpo testo o nella UI.

### 1.2 Palette

Palette calda ispirata a legno e miele. No blu, no celeste, no grigi neutri. Le ombre sono marroni, mai grigio puro.

| Token | Chiaro | Scuro | Ruolo |
|-------|--------|-------|-------|
| `cream-50` | `#FAF6ED` | `#0F0B07` | Sfondo pagina |
| `cream-100` | `#EDE3CE` | `#1E1812` | Sfondo card |
| `cream-200` | `#E0D2B5` | `#2D261D` | Bordi, separatori, sfondo terziario |
| `wood-300` | `#C9B896` | `#4A4035` | Icone decorative |
| `wood-400` | `#A6916C` | `#968470` | Testo secondario, placeholder |
| `wood-500` | `#7A6444` | `#B8A894` | Testo medio |
| `wood-600` | `#5A4830` | `#D4C8B4` | — |
| `wood-700` | `#3F311F` | `#EBE0D0` | Testo principale |
| `wood-800` | `#2A2014` | `#F5EFE4` | Titoli, testo enfatizzato |
| `wood-900` | `#1A130C` | `#050302` | Testo massimo contrasto |
| `honey-300` | `#F0C77A` | `#7A520C` | Sfondo accent tenue |
| `honey-400` | `#E5A938` | `#9B6310` | Accent medio |
| `honey-500` | `#C7891A` | `#E5A938` | Accent primario, focus ring |
| `honey-600` | `#A06D14` | `#F0C77A` | Accent scuro |
| `honey-700` | `#76500F` | `#F8E4B8` | Accent massimo contrasto |
| `success-100` | `#EAEED9` | `#233018` | Sfondo successo |
| `success-500` | `#6E8347` | `#9BBF7E` | Testo/icona successo |
| `warning-100` | `#F8E6D1` | `#322618` | Sfondo warning |
| `warning-500` | `#D4761F` | `#E5A050` | Testo/icona warning |
| `danger-100` | `#F2DBD0` | `#2D1818` | Sfondo errore |
| `danger-500` | `#B0492E` | `#E07060` | Testo/icona errore |

**Regola**: mai usare colori fuori palette. In particolare: niente azzurro, niente blu, niente grigio (#808080).

### 1.3 Tipografia

| Ruolo | Font | Peso | Note |
|-------|------|------|------|
| Corpo UI | Inter | 400 (regular), 500 (medium), 600 (semibold), 700 (bold) | Feature ottiche `cv02` `cv03` `cv04` `cv11` attive |
| Wordmark | Fraunces | variabile | Solo nel logo/nome app |
| Mono | JetBrains Mono | 400 | Codice, coordinate |

Taglie canoniche:
- `text-[10px]` — micro-label, chip, badge
- `text-xs` — testo secondario, note, performer
- `text-sm` — corpo principale, label form, righe lista
- `text-lg` — titoli sezione, day number nel badge calendario
- `text-2xl` — titoli pagina

### 1.4 Border radius

| Token | Valore | Uso |
|-------|--------|-----|
| `sm` | 4px | Chip, badge, pulsanti piccoli |
| `md` | 8px | Card, input, pulsanti standard |
| `lg` | 12px | Sheet, modal, form container |
| `xl` | 16px | Componenti grandi |

### 1.5 Ombre

Tutte le ombre hanno tinta marrone (`rgba(60, 40, 20, …)`), mai grigio.

| Token | Valore | Uso |
|-------|--------|-----|
| `xs` | `0 1px 2px rgba(60,40,20,0.04)` | Sottile profondità |
| `sm` | `0 2px 8px rgba(60,40,20,0.06)` | Card, dropdown |
| `lg` | `0 12px 32px rgba(60,40,20,0.12)` | Sheet, modal |
| `fab` | `0 4px 12px rgba(60,40,20,0.15)` | FAB (floating action button) |

### 1.6 Spaziatura

Sistema base Tailwind v4 + token custom:
- `--spacing-13: 3.25rem` (52px) — altezza minima pulsante `lg`
- Touch target minimo: 44×44pt (raccomandazione WCAG)

---

## 2. Componenti atomici

### 2.1 Button

Varianti definite in `src/components/ui/button.tsx`:

| Variante | Uso |
|----------|-----|
| `primary` | Azione principale (salva, conferma). Sfondo `honey-500`, testo `white`. |
| `secondary` | Azione secondaria. Sfondo `cream-100`, testo `wood-700`. |
| `ghost` | Azione terziaria, annulla. Sfondo trasparente, testo `wood-500`. |
| `destructive` | Azione distruttiva (elimina). Sfondo `danger-500`, testo `white`. |

Taglie: `sm` (32px), `md` (40px), `lg` (52px).

Props speciali:
- `loading` — disabilita il pulsante e mostra spinner
- `disabled` — disabilita il pulsante

### 2.2 SegmentedControl

Componente `src/components/ui/segmented-control.tsx`:
- Contenitore orizzontale con opzioni affiancate.
- Opzione attiva: sfondo `honey-300/60`, bordo `honey-500`.
- Opzione inattiva: sfondo `cream-50`, bordo `cream-200`.
- Supporta stato `dirty` (bordo dashed).

### 2.3 Input

Componente `src/components/ui/input.tsx`:
- Sfondo `cream-50`, bordo `cream-200`.
- Focus: bordo `honey-500`, ring `honey-500/20`.
- Testo `wood-700`, placeholder `wood-400`.

### 2.4 SwipeableRow

Componente `src/components/ui/swipeable-row.tsx`:
- Contenuto principale swipabile a sinistra.
- Area reveal fissa a destra (84px default) con azione (es. elimina).
- Sfondo reveal: `danger-500`.

### 2.5 EmptyState

Componente `src/components/ui/empty-state.tsx`:
- Icona grande (40px), titolo, descrizione opzionale.
- Centrato verticalmente con padding-top.

### 2.6 Fab (Floating Action Button)

Componente `src/components/ui/fab.tsx`:
- Posizione fixed in basso a destra.
- Ombra `fab`, bordo `cream-200`.
- Sfondo `cream-50`.

### 2.7 Calendario

Componente `src/components/ui/calendar.tsx`:
- Griglia mensile 7 colonne.
- Giorni con ispezioni: pallino `honey-500`.
- Giorno selezionato: sfondo `honey-300/60`.

---

## 3. Pattern compositivi

### 3.1 Layout pagina standard

```
┌─────────────────────────┐
│ Header (sticky top-0)   │  ← titolo, back button, azioni
├─────────────────────────┤
│                         │
│ Contenuto scrollabile   │  ← flex-1 overflow-y-auto
│                         │
├─────────────────────────┤
│ Barra azioni / submit   │  ← sticky bottom-0, safe-area padding
└─────────────────────────┘
```

- Altezza header: 56px (h-14).
- Barra bottom: padding dinamico `calc(…+env(safe-area-inset-bottom))`.
- Sfondo sempre `cream-50`.

### 3.2 Card arnia (hive card)

```
┌───────────────────────────────────┐
│ ┌─────────┐                       │
│ │         │  Nome arnia           │
│ │ Schema  │  Ultima ispezione     │
│ │   SVG   │  Toggle attrezzatura  │
│ │         │                       │
│ └─────────┘                       │
└───────────────────────────────────┘
```

- Schema SVG a sinistra: sfondo `cream-200/50` (differenziato dal resto card).
- Numero telaini nel nido calcolato come somma covata + miele + polline dell'ultima ispezione.
- Regina: ♛ se "Vista", "?" se "Non cercata", nessuna icona se "Non vista".
- Melari: numero statico da `hives.melari_count`.
- Toggle attrezzatura (apiscampo, rete propoli, trappola polline) con mutazione ottimistica.
- Trappola polline attiva: sfondo `honey-500`, testo `wood-900` (scuro su oro caldo, contrasto verificato).

### 3.3 Righe lista

Pattern standard per righe link in lista:
- Link a tutta larghezza, sfondo `cream-100`, bordo `cream-200`.
- Hover/active: `active:bg-cream-200`.
- Padding: `px-4 py-3`.
- Separazione tra righe: `gap-2` in contenitore flex-col.

### 3.4 Lista ispezioni

```
┌──────┐
│  APR │  da Stefano
│  15  │  regina vista - Famiglia forte     >
└──────┘  nota...
          [pathology chips]
```

- Badge calendario a sinistra: bordo `cream-300`, mese in caps su sfondo `cream-200`, giorno in grande.
- Prima riga info: performer (opzionale).
- Seconda riga: stato regina con prefisso "Regina" + popolazione con prefisso "Famiglia", separati da " - ".
- Colori stato regina: `success-600` (vista), `danger-500` (non vista), `wood-500` (non cercata).
- Patologie: chip `danger-100` / `danger-500`.
- Freccia destra centrata verticalmente.

### 3.5 Sheet / Bottom sheet

Pattern per azioni confermative o scelte rapide:
- Overlay scuro `wood-900/40` su tutta la viewport.
- Sheet ancorato in basso (`fixed inset-x-0 bottom-0`) con `rounded-t-xl`.
- Handle visivo: barretta centrata `w-9 h-1 rounded-full bg-cream-200`.
- Padding bottom con safe-area.
- Esempi: conferma eliminazione, unsaved changes, MapPickerSheet (fullscreen).

### 3.6 Form ispezione

```
┌─────────────────────────┐
│ Back    Nome arnia  ⋮   │  ← header sticky
│         Data ora        │
├─────────────────────────┤
│ [Express | Standard]    │  ← SegmentedControl
├─────────────────────────┤
│ Banner (41px riservati) │  ← prefill banner o vuoto
├─────────────────────────┤
│                         │
│ Campi form scrollabili  │  ← ExpressBody o StandardBody
│                         │
├─────────────────────────┤
│ [Annulla] [Salva]       │  ← FormSubmitBar sticky bottom
└─────────────────────────┘
```

- Banner sempre 41px riservati (evita layout shift).
- In edit mode: nessun banner (né "prima ispezione" né "prefill").
- In nuova ispezione: banner "prima ispezione" se nessuna precedente, banner "prefill da [data]" se esiste ispezione precedente con pulsante "reset".
- Pulsante salva **disabilitato** finché `dirtyFields` vuoto.
- Dopo salvataggio riuscito (edit): navigazione automatica a pagina precedente.

### 3.7 Micro-label ALL-CAPS

Pattern `text-[10px] font-semibold uppercase tracking-wide text-wood-400`:
- Usato per etichette di sezione sopra dati (es. "ULTIMA ISPEZIONE").
- Mai in corpo testo.

### 3.8 Toast

Componente `src/components/ui/toast.tsx`:
- Posizione: in alto a destra (desktop) / top center (mobile).
- Varianti: `success` (verde), `error` (rosso).
- Auto-dismiss dopo 3 secondi.

---

## 4. Regole vincolanti

1. **Niente colori fuori palette.** In particolare: niente azzurro, niente blu, niente grigio `#808080`.
2. **Niente emoji nella UI.** Usare icone Lucide o SVG inline.
3. **Touch target ≥ 44px.** Tutti i pulsanti, link, toggle devono essere almeno `size-11` (44px).
4. **Safe area.** Tutti i contenuti fixed-bottom devono includere `env(safe-area-inset-bottom)`.
5. **Focus ring honey.** Mai rimuovere `:focus-visible` senza alternativa visibile.
6. **Tema scuro.** Tutti i colori devono funzionare con `data-theme="dark"` (contrasto WCAG AA).
7. **Niente ID nei CSS.** Usare solo classi Tailwind; nessun `#id` nei selettori.
8. **Niente `z-index` arbitrari.** Strati: header `z-10`, overlay/sheet backdrop `z-30`, sheet `z-40`, map picker `z-50`.
9. **Tabella ispezioni**: il numero melari NON è un attributo dell'ispezione. È un attributo statico dell'arnia (`hives.melari_count`).
10. **Don't repeat yourself nei colori**: se un colore è usato in più componenti per lo stesso significato, deve essere lo stesso token palette.
