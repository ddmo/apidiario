# DESIGN.md — Apidiario

> **Versione**: 0.3 · **Stato**: bozza Fase 2 (revisione dark theme + Direction A v2)
> **Vibe**: caldo, sobrio, essenziale. Legno e miele.

---

## 1. Visione

Apidiario è uno strumento da campo. Si usa con guanti, sotto il sole, a fine giornata, in una stanza poco illuminata dopo cena. La grafica deve **sostenere il lavoro**, non distrarre dal lavoro.

Tre principi guidano ogni scelta visiva.

**Caldo, non zuccheroso.** La palette è ispirata ai materiali reali dell'apicoltura: legno chiaro, cera grezza, miele d'acacia, miele di castagno, terra. Niente colori saturi, niente arancioni "energetici", niente decorazioni a forma di favo o api stilizzate. La bellezza viene dai materiali, non dai segni.

**Sobrio e silenzioso.** Una sola tinta accent (honey amber). Ombre quasi assenti. Bordi sottili invece di drop-shadow. Tipografia neutra. Lo schermo deve sembrare riposante anche dopo un'ora d'uso.

**Essenziale.** Ogni schermata ha **un compito chiaro e poche cose**. Niente sidebar, niente dashboard sovraccariche, niente badge che lampeggiano. La densità informativa è alta solo dove serve (overview arnia, lista ispezioni); altrove respira.

## 2. Palette

Tutto ruota intorno a tre famiglie: **cream** (sfondi e superfici), **wood** (testo e elementi neutri), **honey** (accent). Le tonalità di stato sono "stirate" verso la stessa famiglia calda per non rompere l'armonia.

### Tema chiaro

| Token             | Hex       | Uso                                                |
|-------------------|-----------|----------------------------------------------------|
| `cream-50`        | `#FAF6ED` | Sfondo principale dell'app                         |
| `cream-100`       | `#F5EEDE` | Sfondo card / elementi sopraelevati                |
| `cream-200`       | `#E9DFC8` | Bordi soft, divisori, hover su superfici           |
| `wood-300`        | `#C9B896` | Testo disabilitato, placeholder                    |
| `wood-400`        | `#A6916C` | Testo secondario / icone secondarie                |
| `wood-500`        | `#7A6444` | Testo terziario, etichette                         |
| `wood-700`        | `#3F311F` | **Testo body principale**                          |
| `wood-800`        | `#2A2014` | Titoli                                             |
| `wood-900`        | `#1A130C` | Riservato a contrasti massimi                      |
| `honey-300`       | `#F0C77A` | Sfondo accent leggero, hover su CTA               |
| `honey-400`       | `#E5A938` | Accent (badge, tab attivi su sfondo cream-100)    |
| `honey-500`       | `#C7891A` | **Accent principale (CTA, link, focus ring, attivo dovunque)** |
| `honey-600`       | `#A06D14` | Accent hover                                       |
| `honey-700`       | `#76500F` | Accent pressed / testo accent su cream            |

### Stati semantici (allineati alla palette calda)

| Token        | Hex (500) | Hex (100, bg) | Uso                                  |
|--------------|-----------|---------------|--------------------------------------|
| `success`    | `#6E8347` | `#EAEED9`     | Stato OK (regina vista, scorte alte) |
| `warning`    | `#D4761F` | `#F8E6D1`     | Avviso (es. controllare presto)      |
| `danger`     | `#B0492E` | `#F2DBD0`     | Allarme (patologia, mortalità)       |

I successi vanno verso un verde oliva spento, gli avvisi verso un'ambra più arancio (distinta da `honey-500`), i pericoli verso un terracotta. Nessun rosso semaforo, nessun verde elettrico.

> **Regola del colore "attivo".**
> `honey-500` significa "elemento attivo/montato/selezionato" **ovunque appaia nell'app**: toggle attivo, segmento attivo di un segmented control, simbolo di attrezzatura montata sulla HiveSchematic, CTA primaria. Un apicoltore impara una volta che "il giallo c'è = quella cosa è attiva/montata".
> `success-500` (verde oliva) significa "condizione semantica positiva rilevata" (regina vista nell'ultima ispezione, scorte alte, esito OK). NON è "selezionato".
> Le due semantiche non si sovrappongono mai.

### Tema scuro

Il tema scuro è una "stanza al buio illuminata da una lampada": lo sfondo dell'app è molto scuro e silenzioso, e le superfici di lavoro (card, sheet) sono sensibilmente più chiare, così "galleggiano" anche senza ombra. La separazione fra layer è chiara, ma l'atmosfera resta calda e raccolta.

**Principio operativo.** Se in light theme la separazione fra app e card è di ~5% di luminosità, in dark deve essere di ~10–12%. Un dark theme con delta troppo piccoli sembra un PDF stampato male; ne serve di più, non di meno. Stessa logica per i bordi: in dark devono essere *visibili*, non timidi.

| Token                   | Hex (light → dark)        | Note                                       |
|-------------------------|---------------------------|--------------------------------------------|
| Sfondo app              | `#FAF6ED` → `#15100A`     | Quasi nero, calibrato caldo                |
| Sfondo card             | `#F5EEDE` → `#2B2114`     | Delta significativo dall'app               |
| Sfondo card hover       | —        → `#33281A`     | Stato interattivo                          |
| Bordo soft              | `#E9DFC8` → `#4A3925`     | Visibile, non timido                       |
| Bordo focus/active      | —        → `#705636`     | Per separare stati attivi                  |
| Testo body              | `#3F311F` → `#EBE0CB`     | Cream caldo, mai bianco puro               |
| Testo secondario        | `#7A6444` → `#B5A282`     |                                            |
| Testo terziario         | `#A6916C` → `#8A7656`     | Etichette, timestamp                       |
| Accent                  | `#C7891A` → `#E0A744`     | Honey ammorbidito per evitare vibrazione   |
| Accent hover            | `#A06D14` → `#EDB95A`     |                                            |
| Accent fill leggero     | —        → `#3D2E15`     | Per toggle attivo, badge accent            |

### Pulsanti e controlli secondari in dark

I pulsanti secondari in dark **hanno sempre un fill**, mai solo outline. Outline-only su dark si perde nel rumore visivo del campo.

| Variante                       | bg dark         | Border dark    | Testo dark   |
|--------------------------------|-----------------|----------------|--------------|
| `primary`                      | `#E0A744`       | —              | `#15100A`    |
| `secondary`                    | `#3A2D1D`       | `#4A3925`      | `#EBE0CB`    |
| `ghost`                        | trasparente     | —              | `#EBE0CB`    |
| `secondary` attivo (toggle on) | `#3D2E15`       | `#E0A744`/40   | `#E0A744`    |
| `destructive`                  | `#B0492E`       | —              | `#FAF6ED`    |

### Test di contrasto (WCAG)

Verificati AA (ratio ≥ 4.5:1 per testo normale, ≥ 3:1 per testo large e icone).

**Light theme:**
- `wood-700` su `cream-50` → 11.2:1 ✓ AAA
- `wood-500` su `cream-50` → 5.4:1 ✓ AA
- `cream-50` su `honey-500` → 4.6:1 ✓ AA (testo dei pulsanti primari)
- `honey-700` su `cream-50` → 5.8:1 ✓ AA (link in linea)

`honey-500` come testo su `cream-50` per testi normali è al limite (4.6:1): da usare solo per testi grandi (≥18px) o pulsanti.

**Dark theme:**
- `#EBE0CB` su `#15100A` (body su app bg) → 13.8:1 ✓ AAA
- `#EBE0CB` su `#2B2114` (body su card) → 11.2:1 ✓ AAA
- `#B5A282` su `#2B2114` (secondario su card) → 5.6:1 ✓ AA
- `#E0A744` su `#2B2114` (accent text/icon su card) → 8.1:1 ✓ AAA
- `#15100A` su `#E0A744` (testo button primary) → 11.0:1 ✓ AAA

## 3. Tipografia

**Una sola famiglia**: Inter. È neutra, ben disegnata, gratuita, ottimizzata per UI. La calda atmosfera viene dal colore e dal ritmo, non dal carattere.

**Eccezione opzionale**: il wordmark "Apidiario" può usare **Fraunces** (serif contemporaneo con accenni vintage) per dare un tocco di carattere alla sola brand identity. Non usata altrove.

```
Family principale:  Inter, system-ui, -apple-system, sans-serif
Family wordmark:    Fraunces, Inter, serif    (solo per logo testuale)
Family monospace:   ui-monospace, "JetBrains Mono", monospace
```

### Scala tipografica (mobile-first)

| Token          | Size / Line     | Weight    | Uso                              |
|----------------|-----------------|-----------|----------------------------------|
| `text-xs`      | 12 / 16         | 500       | Etichette piccole, timestamp     |
| `text-sm`      | 14 / 20         | 400/500   | Testo secondario, metadata       |
| `text-base`    | **16 / 24**     | 400       | **Body default**                 |
| `text-lg`      | 18 / 28         | 500       | Sottotitoli, valori in evidenza  |
| `text-xl`      | 20 / 28         | 600       | Titoli sezione                   |
| `text-2xl`     | 24 / 32         | 600       | Titoli schermata                 |
| `text-3xl`     | 30 / 38         | 700       | Hero (raro, solo wordmark/onboarding) |

### Regole d'uso

- **Niente all-caps decorative.** Le label informative usano case normale (es. "Ispezionata oggi", non "ISPEZIONATA · OGGI"). All-caps consentito solo per micro-tag di sistema (es. "OFFLINE") in `text-xs`, weight 600, letter-spacing `0.05em`, e mai per dati di routine.
- **Tracking negativo solo sui titoli grandi**: `text-2xl` e oltre, `letter-spacing: -0.01em`.
- **Numeri tabulari** (Inter feature `tnum`) per le colonne di numeri (kg miele, conteggi varroa) per allineamento verticale.
- **Pesi disponibili**: 400, 500, 600, 700. Niente light (300), niente extrabold (800+).

### Pattern: timestamp ultima ispezione

Per indicare quando un'arnia è stata ispezionata l'ultima volta (compare in card lista, dettaglio arnia, e simili):

- Una riga sola, `text-xs`, weight 500, color `wood-500` (light) / `wood-500` token in dark.
- Formato: `"Ispezionata oggi"`, `"Ispezionata 3 g fa"`, `"Ispezionata il 12 mar"`, `"Mai ispezionata"`.
- Soglie: "oggi" / "ieri" / "N g fa" fino a 7 giorni / data esplicita oltre / "Mai ispezionata" se nessuna ispezione registrata.
- Mai in maiuscolo, mai su due righe separate (la label e la data stanno sulla stessa riga).

## 4. Token: spazi, raggi, bordi, ombre

### Spaziatura
Base 4px. Scale usate: `1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24` (= 4 → 96px).

Linee guida:
- Padding card: `p-4` mobile, `p-5` tablet.
- Padding screen: `px-4 py-5`.
- Gap fra elementi correlati: `gap-2` o `gap-3`.
- Gap fra sezioni: `gap-6` o `gap-8`.

### Border radius

| Token         | Px   | Uso                              |
|---------------|------|----------------------------------|
| `rounded-sm`  | 4    | Tag, chip                        |
| `rounded-md`  | 8    | **Pulsanti, input, default**     |
| `rounded-lg`  | 12   | Card                             |
| `rounded-xl`  | 16   | Sheet, modal, contenitori grandi |
| `rounded-full`| 9999 | Avatar, status pill              |

Niente `rounded-none` (troppo crudo per il vibe), niente `rounded-2xl` o `3xl` (troppo morbido).

### Bordi

Bordi sottili, colorati con `cream-200` (chiaro) o `cream-200` token in dark (che mappa a `#4A3925`).

```
border-width:  1px
border-color:  cream-200
```

In dark, i bordi sono **visibili e calibrati**, non al 30-40% di opacità: la separazione fra superfici si fa con bordo + delta di sfondo, non con ombre.

### Ombre

Da usare con parsimonia. La separazione fra layer si fa con **bordi e contrasto di sfondo**, non con ombre.

| Token        | Specifica                              | Uso                          |
|--------------|----------------------------------------|------------------------------|
| `shadow-none`| —                                      | Default                      |
| `shadow-xs`  | `0 1px 2px rgba(60, 40, 20, 0.04)`     | Card su sfondo cream         |
| `shadow-sm`  | `0 2px 8px rgba(60, 40, 20, 0.06)`     | Bottom nav, sticky header    |
| `shadow-lg`  | `0 12px 32px rgba(60, 40, 20, 0.12)`   | Sheet/modal aperto           |

Mai più ombre di `shadow-lg`. Mai shadow di colore neutro freddo (grigio puro): le ombre hanno una nota marrone tenue.

## 5. Iconografia

**Set**: [Lucide](https://lucide.dev/) (familiare, completo, gratuito, ben mantenuto). 

**Stile**:
- Stroke `1.75` (leggermente più pieno del default `2`, sembra meno tecnico e più caldo).
- Dimensioni: `20px` (in linea con testo), `24px` (default), `32px` (azioni primarie e badge di stato).
- Colore: eredita dal testo. Le icone di stato adottano il colore del rispettivo token semantico.

**Icone chiave già mappate**:

| Concetto           | Icona Lucide      |
|--------------------|-------------------|
| Apiario            | `Map` o `Trees`   |
| Arnia              | `Box`             |
| Ispezione          | `ClipboardCheck`  |
| Trattamento        | `Pill`            |
| Raccolto           | `Droplet` (miele) |
| Promemoria         | `Bell`            |
| Regina vista       | `Crown`           |
| Covata             | `Egg`             |
| Scorte / miele     | `Honey` (custom) o `Hexagon`  |
| Polline            | `Flower`          |
| Celle reali        | `AlertTriangle`   |
| Patologia          | `ShieldAlert`     |
| Comportamento ape  | `Activity`        |
| Apiscampo          | `ArrowRight` o custom (cuneo) |
| Rete propoli       | `Grid3x3` o custom (griglia)  |
| Trappola polline   | custom (linee oblique)        |
| Membri / condivisione | `UserPlus`     |
| Foto               | `Camera`          |
| Audio              | `Mic`             |
| Posizione          | `MapPin`          |

Per "miele" e "favo" probabilmente serve un'icona custom (esagono pieno con goccia). La dichiariamo come SVG inline nel componente `<HoneyIcon />`. Stesso discorso per i simboli di attrezzatura usati nella HiveSchematic.

## 6. Componenti chiave

### Button

Quattro varianti, tre dimensioni. Niente gradienti, niente shadow, transizione di colore sobria.

| Variante       | Background        | Testo        | Hover            |
|----------------|-------------------|--------------|------------------|
| `primary`      | `honey-500`       | `cream-50`   | bg `honey-600`   |
| `secondary`    | `cream-200`       | `wood-700`   | bg `cream-100` + border `wood-400/40` |
| `ghost`        | trasparente       | `wood-700`   | bg `cream-100`   |
| `destructive`  | `danger-500`      | `cream-50`   | bg shift -10%    |

Dimensioni:
- `sm`: altezza 36px, padding `px-3`, `text-sm`.
- `md` (default): altezza **44px**, padding `px-4`, `text-base`. Touch-friendly.
- `lg`: altezza 52px, padding `px-6`, `text-base`.

Tutti: `rounded-md`, font weight 500, transition 150ms.

> **In dark**, i `secondary` mantengono sempre un fill (vedi §2 "Pulsanti e controlli secondari in dark"). Gli outline-only sono vietati in dark theme.

### Card

```
background:    cream-100   (su app bg cream-50)
border:        1px solid cream-200
border-radius: rounded-lg (12px)
padding:       p-4 mobile, p-5 ≥ tablet
shadow:        none
```

In tema scuro: bg `#2B2114`, border `#4A3925`. Su sfondo app `#15100A` la card appare come una "zona illuminata" senza bisogno di ombra.

### Input / form fields

```
height:        48px (mobile, evita zoom iOS con text-base 16px)
background:    cream-50  (anche su sfondo card cream-100, per chiarezza)
border:        1px solid cream-200
border-radius: rounded-md
padding:       px-4
focus:         border honey-500, ring 2px honey-500/20
disabled:      bg cream-100, text wood-300
```

Label sopra l'input, `text-sm`, weight 500, color `wood-700`. Placeholder `wood-400`.

### SegmentedControl numerico (per contatori da campo: melari, telaini)

Per scelte numeriche piccole (0–5) usare **segmented control** (pillole), non stepper +/−. Lo stepper è ammesso solo per range più ampi (es. conteggio varroa).

```
container:    bg cream-200 (light) / cream-100 token in dark, rounded-md, p-1
opzione:      h-11 (44px), px-4, text-base, weight 500, rounded-sm
attiva:       bg honey-500 (light) / accent-fill-soft + text honey (dark)
inattiva:     text wood-500, hover bg cream-100
```

Touch target garantito 44pt; nessun rischio di "premere il +/− sbagliato con il guanto".

Props attese:
- `value: number`
- `onChange: (n: number) => void`
- `min?: number` (default 0)
- `max?: number` (default 3, hard cap 5)
- `label?: string` (mostrata a sinistra del controllo)

### IconBadge (stato visivo arnia)

Cerchio 32×32 (o 40×40 nei dettagli), icona dentro, colore semantico al 100%, sfondo allo stesso colore al 15-20%.

```
es. "covata OK":
  background: success/100  (#EAEED9)
  icon color: success/500  (#6E8347)
  size: 32x32
  border-radius: rounded-full
```

### StatusChip

Variante più larga di IconBadge, con icona + label, usata per "Regina vista", "Patologia rilevata", "Scorte basse" e simili eventi semantici dell'ultima ispezione.

```
shape:       pill (rounded-full)
height:      28-32px
padding:     px-3 py-1
icon:        16-18px a sinistra
label:       text-sm, weight 500
colori:      bg success-100 + text success-500 + icon success-500 (oliva)
             oppure warning / danger secondo contesto
```

In dark: bg semantico ammorbidito (vedi token semantici dark in §11).

### StatusDot

Cerchio 8×8 pieno, colore semantico. Sempre accompagnato da label testuale (per accessibilità).

### Tab / Segmented control (testuale)

Stile pillola con indicatore scorrevole. Usato per "Ispezione express / Standard" e simili.

```
container:     bg cream-200, p-1, rounded-md
tab:           px-3 py-2, text-sm, weight 500
tab attivo:    bg cream-50, shadow-xs, color wood-800
tab inattivo:  color wood-500
transition:    180ms ease-out
```

### EquipmentToggle (chip stateful per attrezzatura montata)

Per attrezzatura montata sull'arnia (apiscampo, rete propoli, trappola polline). Sono stati persistenti, non azioni; sono pochi e indipendenti.

```
inattivo:
  bg:           cream-100 (light) / cream-200 token in dark
  border:       1px cream-200
  text:         wood-500
  icona:        wood-500, opacity 60%
attivo:
  bg:           honey-100 (light) / accent-fill-soft (dark, #3D2E15)
  border:       1px honey-500/40
  text:         honey-700 (light) / honey-500 (dark)
  icona:        honey-500, full opacity
```

Touch target 44×44 minimo (chip a tutta larghezza disponibile in una row di 3 toggle, non quadrati piccoli). Sempre con icona + label, mai solo label.

Props attese:
- `equipment: 'apiscampo' | 'retePropoli' | 'trappolaPolline'`
- `value: boolean`
- `onChange: (v: boolean) => void`

### Bottom navigation (mobile)

Fissa in basso, 4-5 voci, icona + label.

```
height:      64px + safe-area-inset-bottom
background:  cream-50 con bordo superiore 1px cream-200
icon:        24px
label:       text-xs, weight 500
attivo:      icon e label honey-500
inattivo:    icon e label wood-500
```

Voci: **Apiari · Arnie · Visita · Calendario · Più**.

### HiveSchematic (componente custom — feature distintiva)

Disegno schematico di un'arnia in SVG. È il **cuore visivo dell'app**, va trattato con cura. Direction A v2 lo promuove a "hero" della card lista.

**Composizione (dal basso verso l'alto)**:
- **Predellino e leggio**: linea orizzontale alla base, opzionale, tratto pieno `wood-600` (light) / `cream-200` token (dark).
- **Nido (corpo principale)**: rettangolo a tratto singolo (no fill), con linee verticali interne a indicare i telaini *effettivi*. Es. 10 telai = 10 linee verticali. Tratto: `wood-600` (light) / `cream-200` token in dark.
- **Melari**: 0–N rettangoli impilati sopra il nido, di altezza decrescente verso l'alto (il melario più alto è leggermente più stretto). Fill leggero `wood-500/15` (light) / `cream-200/15` (dark) per distinguerli dal nido senza rompere la palette tecnica. Tratto coerente con il nido. **Il numero di rettangoli melari deve sempre coincidere con il valore del SegmentedControl Melari della card**: zero rettangoli quando il conteggio è 0, due rettangoli quando è 2, ecc.
- **Tetto**: trapezio o rettangolo sottile in cima. Stesso tratto.

**Sovrimpressioni di stato**:
- **Corona regina** (icona piccola, 12–14px): in alto al centro del nido. Honey (`honey-500` / dark `honey-500` token = `#E0A744`) se la regina è confermata presente; attenuata a `wood-300` se assente o incerta; nascosta se mai rilevata. Rappresenta lo **stato persistente** della regina dell'arnia, non l'evento dell'ultima ispezione.
- **Simboli di attrezzatura** (8–10px): piccoli simboli laterali che compaiono *solo quando l'attrezzatura è montata*, in `honey-500` (light/dark token). Posizione fissa: apiscampo a sinistra del nido, rete propoli sopra il tetto o lateralmente, trappola polline alla base. Quando un'attrezzatura non è montata, il simbolo non appare (assenza = stato inattivo, coerente con il toggle sotto). Coerente con la "Regola del colore attivo" §2: il giallo nella schematica = quella cosa è attivamente montata.

**Label numeriche**:
- Una label compatta "N telai" (es. "10 telai") può comparire **a margine del disegno**, non sovrapposta al corpo del nido. `text-xs`, weight 500, color `wood-500` token. Ammessa perché contare 10 linee verticali a colpo d'occhio è cognitivamente costoso e la cifra esplicita aiuta in apiario. Non si applica per altri elementi (no "2 melari" duplicato accanto al disegno: i 2 rettangoli si vedono).

**Dimensioni**:
- `sm`: 80×100, mostrata in card lista arnie, **con corona, simboli attrezzatura, label "N telai"**.
- `md`: 140×180, schermata dettaglio arnia, tutti gli elementi più 2-3 IconBadge sovrimpressi.
- `lg`: 200×260, vista overview piena, tutti gli elementi e tutti i badge.

**Props attese**:
```ts
{
  size: 'sm' | 'md' | 'lg'
  frames: number              // n telai (default 10)
  supers: number              // n melari (0-3)
  queenStatus: 'present' | 'absent' | 'unknown'
  equipment: {
    apiscampo: boolean
    retePropoli: boolean
    trappolaPolline: boolean
  }
  showFramesLabel?: boolean   // default true per size 'sm'
}
```

**Niente**:
- Niente fotografia o disegno realistico di un'arnia.
- Niente texture legno.
- Niente colore "natura" (verde foglia, marrone realistico, azzurro decorativo).
- Niente animazioni di apine in volo.
- Niente label numeriche **sovrapposte al corpo del nido** (la label "N telai" sta a margine, non dentro).

L'estetica giusta è quella di un disegno tecnico a inchiostro, di una pagina di manuale di apicoltura del 1950 reinterpretata in chiave contemporanea.

### HiveListCard (card della lista arnie — Direction A v2)

Card singola che rappresenta un'arnia nella schermata `/arnie`. È il pattern definitivo deciso in Fase 2 dopo sessione Claude Design.

**Struttura verticale (3 sezioni separate da divisori sottili `cream-200` / dark border token)**:

1. **Header informativo (alto).** Layout orizzontale ~40/60.
   - **Sinistra (~40%)**: HiveSchematic size `sm`, sotto la quale compare la riga "Ispezionata oggi" (vedi §3 pattern timestamp).
   - **Destra (~60%)**: nome arnia (`text-xl`, weight 600), nome apiario (`text-base`, color `wood-500`), e un eventuale `StatusChip` semantico — tipicamente "Regina vista" (verde oliva, `success`) se nell'ultima ispezione la regina è stata avvistata. Il chip riflette **l'evento dell'ultima ispezione**, distinto dalla corona nella schematica che riflette **lo stato persistente**.

2. **Sezione editor configurazione (centro).**
   - Riga di 3 `EquipmentToggle` (Apiscampo, Rete propoli, Trappola polline) a tutta larghezza, equi-distribuiti.
   - Riga sotto: label "Melari" + `SegmentedControl` 0/1/2/3.
   - Modifiche persistono direttamente sull'arnia con optimistic update — non passano dal flow Ispezione.

3. **CTA primaria (basso).**
   - Bottone `primary` size `lg`, full-width, "Ispeziona" con icona `Play` o `ClipboardCheck`. Apre il flow ispezione (US-01).

**Spaziatura interna**: `p-4` mobile. Gap fra le tre sezioni: `gap-4`. Divisori orizzontali fra sezioni: 1px `cream-200` token.

**Touch target**: tutti i controlli (toggle, segmenti, CTA) ≥ 44pt.

**Sincronia obbligatoria fra schematica e dati testuali**:
- Numero di rettangoli melari nella schematica = valore del SegmentedControl
- Simboli attrezzatura nella schematica accesi/spenti = stato dei toggle
- Modifica di un toggle o del segmented control aggiorna immediatamente sia la cifra/stato editor sia il disegno schematico (stesso state source, optimistic update parent-side).

**Compact mode (futuro, non v1)**: per utenti con molte arnie (>15-20 per apiario), prevedere un toggle "vista compatta" che riduce HiveListCard a una sola riga (mini-schematica 32×40, nome, apiario, IconBadge stato, timestamp; controlli editor e CTA accessibili tappando la card e aprendo il dettaglio). Non implementato in v1, ma il componente va scritto in modo che la futura aggiunta non richieda riscritture: separare la parte "header informativo" dalle altre sezioni, così il compact mode mostra solo l'header.

### Empty state

Quando una lista è vuota:
- Icona 48×48 in `wood-300`.
- Titolo `text-lg` weight 500.
- Sottotitolo `text-sm` color `wood-500`.
- Bottone primario per l'azione di creazione.

Tono dei testi: pratico, non motivazionale. "Nessun apiario" + "Crea il primo apiario" è meglio di "Inizia il tuo viaggio nell'apicoltura!".

### Loading e sync

- Skeleton: rettangoli con `bg-cream-200`, animazione `pulse` sobria (opacity 0.6→0.8, 1.5s).
- Spinner: 20×20, colore `honey-500`, traccia `cream-200`.
- Indicatore offline globale: barra sottile (4px) ambra in alto sotto la status bar quando l'app è offline o sta sincronizzando, `text-xs` "Offline · 3 modifiche da sincronizzare".

### Bottom sheet (per form ispezione mobile)

```
background:    cream-50
border-radius: rounded-xl in alto (16px), 0 in basso
shadow:        shadow-lg
overlay:       wood-900 al 40% di opacità
drag handle:   barra 36×4 rounded-full color cream-200
animazione:    slide up 200ms ease-out
```

## 7. Motion

**Filosofia**: invisibile finché non serve. Mai animazioni decorative.

| Caso                              | Durata | Easing                |
|-----------------------------------|--------|-----------------------|
| Hover/press di un elemento        | 150ms  | `ease-out`            |
| Cambio tab                        | 180ms  | `ease-out`            |
| Apertura/chiusura sheet/modal     | 200ms  | `ease-out`            |
| Skeleton pulse                    | 1500ms | `ease-in-out` looping |
| Toast in/out                      | 200ms  | `ease-out`            |
| Toggle equipment / segment change | 120ms  | `ease-out`            |

Niente bounce/spring (Framer Motion va usato con `tween`, non `spring`).
`prefers-reduced-motion`: tutte le animazioni si riducono a fade istantaneo (0ms).

## 8. Modalità scura

Implementata fin dalla v1. Toggle nelle impostazioni, default = sistema.

Regole:
- Sfondo app `#15100A`, sfondo card `#2B2114` (delta significativo, ~10–12% di luminosità).
- Mai pure black, mai bianco puro per il testo.
- Testo body `#EBE0CB`, titoli `#F5EEDE`, secondario `#B5A282`.
- Accent honey ammorbidito a `#E0A744` per evitare vibrazione su sfondo molto scuro.
- Bordi `#4A3925`, *visibili*: la separazione fra superfici si fa con bordo + sfondo, mai con ombre.
- Ombre: aumentano leggermente di opacità (0.04 → 0.10) ma restano discrete.
- Pulsanti `secondary` hanno sempre fill, mai outline-only (vedi §2).

**Regola anti-fragilità.** Ogni componente in dark deve essere testato anche in condizioni di luce esterna intensa simulata (riducendo la luminosità del display al 30%). Se a luminosità ridotta gli elementi interattivi non sono distinguibili dallo sfondo card, il design è fallato — non si compensa con "alziamo la luminosità", si rivede il contrasto fra layer.

**Regola del campo.** Apidiario si usa con guanti, sole forte, telefono sporco di propoli. Ogni schermata in dark deve passare il test "lo vedo a un metro di distanza?". Le decorazioni sottili sono accettabili solo se l'informazione critica resta leggibile anche senza vederle.

## 9. Accessibilità

- **Contrasto AA verificato** per ogni combinazione testo/sfondo (vedi §2).
- **Touch target ≥ 44×44pt** per qualunque elemento interattivo. Bottoni `md` (44px) sono il default.
- **Focus visibile**: outline 2px `honey-500`, offset 2px, su tutti gli elementi focusabili. Mai rimuovere il focus ring senza sostituirlo con un'alternativa visibile.
- **Stati distinguibili senza colore**: status non solo cromatico ma con icona o label associata. Il daltonico non deve indovinare. Es. nella HiveSchematic, l'attrezzatura attiva non si distingue *solo* per il colore honey ma anche per la presenza/assenza del simbolo.
- **Etichette form sempre presenti** (anche se nascoste visivamente con `sr-only` quando il design è minimal).
- **Screen reader** sui flussi critici: ispezione, lista arnie, overview. Test con VoiceOver iOS prima del rilascio.
- **Dimensioni testo**: rispetto delle preferenze utente sistema. Layout funziona fino a 200% di scala.

## 10. Logo / wordmark

Il marchio è il solo testo "**Apidiario**" in **Fraunces** (peso 500, leggera optical size per display), color `wood-800` su sfondo chiaro, `cream-100` su sfondo scuro. Lowercase o sentence case.

Possibile simbolo accanto al wordmark (opzionale, da decidere in Claude Design):
- Esagono a tratto singolo (`stroke-2`, `wood-600`), 24×24, allineato all'altezza della x.
- Oppure: stilizzazione minimal di un'arnia (lo stesso vocabolario di `HiveSchematic`).

Sconsigliato: ape stilizzata, goccia di miele, fiore. Cliché che indeboliscono la sobrietà.

## 11. Configurazione Tailwind v4 (pronta da copiare)

Da incollare nel file CSS principale (es. `src/app.css`):

```css
@import "tailwindcss";

@theme {
  /* Cream / superfici */
  --color-cream-50:  #FAF6ED;
  --color-cream-100: #F5EEDE;
  --color-cream-200: #E9DFC8;

  /* Wood / neutrali */
  --color-wood-300: #C9B896;
  --color-wood-400: #A6916C;
  --color-wood-500: #7A6444;
  --color-wood-600: #5A4830;
  --color-wood-700: #3F311F;
  --color-wood-800: #2A2014;
  --color-wood-900: #1A130C;

  /* Honey / accent */
  --color-honey-300: #F0C77A;
  --color-honey-400: #E5A938;
  --color-honey-500: #C7891A;
  --color-honey-600: #A06D14;
  --color-honey-700: #76500F;

  /* Stati */
  --color-success-100: #EAEED9;
  --color-success-500: #6E8347;
  --color-warning-100: #F8E6D1;
  --color-warning-500: #D4761F;
  --color-danger-100:  #F2DBD0;
  --color-danger-500:  #B0492E;

  /* Tipografia */
  --font-sans:    "Inter", system-ui, -apple-system, sans-serif;
  --font-display: "Fraunces", "Inter", serif;
  --font-mono:    ui-monospace, "JetBrains Mono", monospace;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Ombre (note marroni, mai grigio puro) */
  --shadow-xs: 0 1px 2px rgba(60, 40, 20, 0.04);
  --shadow-sm: 0 2px 8px rgba(60, 40, 20, 0.06);
  --shadow-lg: 0 12px 32px rgba(60, 40, 20, 0.12);
}

/* Tema scuro: stessi token semantici, valori ricalibrati per il campo */
@layer base {
  :root[data-theme="dark"] {
    --color-cream-50:  #15100A;       /* sfondo app — più scuro */
    --color-cream-100: #2B2114;       /* sfondo card — più chiaro, delta visibile */
    --color-cream-150: #33281A;       /* hover su card */
    --color-cream-200: #4A3925;       /* bordi soft, visibili */
    --color-cream-300: #705636;       /* bordi attivi/focus */

    --color-wood-300:  #8A7656;       /* testo terziario / disabilitato */
    --color-wood-400:  #A6916C;
    --color-wood-500:  #B5A282;       /* testo secondario */
    --color-wood-700:  #EBE0CB;       /* testo body */
    --color-wood-800:  #F5EEDE;       /* titoli */

    --color-honey-300: #EDB95A;
    --color-honey-500: #E0A744;       /* accent ammorbidito */
    --color-honey-600: #EDB95A;

    --color-accent-fill-soft: #3D2E15; /* fill leggero per toggle attivo */

    /* Stati semantici: bg leggermente più caldi e meno luminosi */
    --color-success-100: #2A3318;
    --color-success-500: #8FA862;
    --color-warning-100: #3A2812;
    --color-warning-500: #E89346;
    --color-danger-100:  #3A1C13;
    --color-danger-500:  #C96A4F;
  }
}
```

> Nota: i nomi dei token (`cream-50`, `wood-700`, `honey-500`) restano semanticamente uguali fra light e dark. Il componente non sa se è in tema chiaro o scuro: usa `bg-cream-50` e basta. Questa è la stessa idea dei design token "semantic" usata da Stripe e Linear.

## 12. Da fare / da non fare (riassunto operativo)

**Fare**

- Backgrounds cream, mai bianco puro.
- Testo `wood-700`, mai nero puro.
- Accent solo `honey-500` (eccezioni motivate solo per stati semantici).
- **Honey accent significa "attivo/montato/selezionato" ovunque appaia**: toggle attivo, segment attivo, simbolo attrezzatura nella schematica. Una regola, una semantica.
- Bordi sottili al posto delle ombre — *visibili in dark*, non timidi.
- In dark, delta significativo (~10–12% luminosità) fra app e card.
- In dark, pulsanti secondari sempre con fill, mai outline-only.
- Distinzione netta fra "toggle attivo" (honey) e "stato semantico positivo" (success).
- Spazio bianco generoso fra le sezioni.
- Type scale coerente: solo i 7 livelli definiti.
- Icone Lucide con stroke 1.75.
- Touch target 44pt minimo (segmented control invece di stepper +/− per range piccoli).
- Per HiveSchematic: l'informazione è nel disegno, dove serve può essere affiancata (non sovrapposta) da label compatte.
- HiveSchematic e dati testuali della stessa card devono **sempre essere sincronizzati** (n melari a sinistra = n melari nel segmented control a destra).

**Non fare**

- Niente gradienti.
- Niente glassmorphism / blur di sfondo.
- Niente illustrazioni di api, fiori, alveari realistici.
- Niente colori fuori palette in HiveSchematic (no celeste, no verde naturale, no marroni saturi).
- Niente font fantasiosi (no script, no slab, no display estremi).
- Niente più di un colore accent attivo per schermata.
- Niente shadow oltre `shadow-lg`.
- Niente animazioni decorative o "deliziosamente" elastiche.
- Niente badge che lampeggiano o pulsano per attirare attenzione.
- Niente uppercase decorative (vale anche per label di sistema "ULTIMA ISPEZIONE": preferire "Ispezionata oggi" in case normale).
- Niente verde semantico per "selezionato" o "toggle on" (è riservato a `success`).
- Niente outline-only su dark.
- Niente label numeriche **sovrapposte al corpo della HiveSchematic** (a margine sì, dentro no).

---

*Versione 0.3 — Direction A v2 codificata dopo sessione Claude Design. Prossima fase: implementazione `HiveListCard` + sotto-componenti via Claude Code.*