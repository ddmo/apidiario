---
name: Apidiario
description: App da campo per apicoltori. Calda, naturale, leggibile sotto il sole.
colors:
  cream-50: "#FAF6ED"
  cream-100: "#EDE3CE"
  cream-200: "#E0D2B5"
  wood-300: "#C9B896"
  wood-400: "#A6916C"
  wood-500: "#7A6444"
  wood-600: "#5A4830"
  wood-700: "#3F311F"
  wood-800: "#2A2014"
  wood-900: "#1A130C"
  honey-300: "#F0C77A"
  honey-400: "#E5A938"
  honey-500: "#C7891A"
  honey-600: "#A06D14"
  honey-700: "#76500F"
  success-100: "#EAEED9"
  success-500: "#6E8347"
  warning-100: "#F8E6D1"
  warning-500: "#D4761F"
  danger-100: "#F2DBD0"
  danger-500: "#B0492E"
typography:
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"cv02\", \"cv03\", \"cv04\", \"cv11\""
  display-1:
    fontFamily: "Fraunces, Inter, serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.2
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, JetBrains Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.honey-500}"
    textColor: "{colors.cream-50}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "{colors.honey-600}"
    textColor: "{colors.cream-50}"
  button-primary-active:
    backgroundColor: "{colors.honey-700}"
    textColor: "{colors.cream-50}"
  button-secondary:
    backgroundColor: "{colors.cream-200}"
    textColor: "{colors.wood-700}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.wood-700}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-destructive:
    backgroundColor: "{colors.danger-500}"
    textColor: "{colors.cream-50}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  input:
    backgroundColor: "{colors.cream-50}"
    textColor: "{colors.wood-700}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.cream-100}"
    rounded: "{rounded.lg}"
    padding: "12px"
---

# Design System: Apidiario

## 1. Overview

**Creative North Star: "Il Taccuino d'Apiario"**

Apidiario e un'app da campo per apicoltori. Il design comunica calore, naturalezza e leggibilita sotto il sole. Come un taccuino tenuto in apiario: essenziale, funzionale, ma con la cura di chi annota a mano le condizioni delle proprie arnie.

Niente blu, niente celeste, niente grigi neutri. Le ombre sono marroni, mai grigio puro. Palette ispirata a legno e miele, con un accento dorato (honey) che guida le azioni primarie. L'interfaccia e volutamente chiara e ariosa, con superfici in crema e testo in marrone scuro, per ridurre l'affaticamento visivo durante l'uso all'aperto.

**Key Characteristics:**
- Naturale, chiaro, accogliente
- Palette wood/honey, niente blu o grigio puro
- Touch-first: target minimo 44x44pt (WCAG)
- Tipografia Inter per UI, Fraunces solo per wordmark
- Safe-area per dispositivi con notch

## 2. Colors

La palette si ispira ai colori del legno d'apiario e del miele. Toni caldi e terrosi, nessun colore freddo.

### Primary
- **Honey** (#C7891A / oklch(63% 0.12 75)): Accento primario. Usato per pulsanti primari, focus ring, icone accentuate, FAB. Mai su superfici estese (>10% dello schermo in modalita Restrained).
- **Honey-600** (#A06D14): Hover degli elementi accent. Testo su sfondo honey chiaro.
- **Honey-300** (#F0C77A): Sfondo accent tenue (segmented control attivo, badge melari).

### Neutral
- **Cream-50** (#FAF6ED): Sfondo pagina principale. Caldo, mai bianco puro.
- **Cream-100** (#EDE3CE): Sfondo card, contenitori secondari.
- **Cream-200** (#E0D2B5): Bordi, separatori, sfondo terziario, segmented control inattivo.
- **Wood-300** (#C9B896): Icone decorative, placeholder su sfondo scuro.
- **Wood-400** (#A6916C): Testo secondario, placeholder, label meno importanti.
- **Wood-500** (#7A6444): Testo corpo medio, icone neutre.
- **Wood-600** (#5A4830): Testo enfatizzato su dark mode.
- **Wood-700** (#3F311F): Testo principale.
- **Wood-800** (#2A2014): Titoli, testo enfatizzato.
- **Wood-900** (#1A130C): Testo massimo contrasto.

### Semantic
- **Success** (bg #EAEED9, text #6E8347): Operazioni riuscite, regina vista, indicatori positivi.
- **Warning** (bg #F8E6D1, text #D4761F): Trattamenti attivi, attenzione.
- **Danger** (bg #F2DBD0, text #B0492E): Errori, eliminazione, regina non vista, patologie.

### Named Rules
**The No-Blue Rule.** Nessun colore fuori palette. In particolare: niente azzurro, niente blu, niente grigio #808000. Le ombre usano sempre tinta marrone (rgba(60, 40, 20, ...)), mai grigio puro.

**The Hex-in-CSS Rule.** I colori sono definiti come custom properties CSS nel file `src/app.css` tramite `@theme`. Il tema scuro inverte la scala (numeri bassi = scuri, alti = chiari) con contrasti verificati WCAG AA.

## 3. Typography

**Display Font:** Fraunces (con fallback Inter, serif)
**Body Font:** Inter (con fallback system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (con fallback ui-monospace)

**Character:** Coppia funzionale: Inter per tutta la UI (leggibile, neutra, ottimizzata per schermi), Fraunces esclusivamente per il wordmark. Nessun uso decorativo del display font.

### Hierarchy
- **Display-1** (Fraunces 500, 24px/1.2): Titolo pagina "Apidiario" nell'header home. Mai nel corpo UI.
- **Title** (Inter 600, 15px/1.3): Nome apiario nelle liste, titoli sezione.
- **Body** (Inter 400, 14px/1.5): Testo principale, label form, righe lista. Max 75ch.
- **Body Small** (Inter 500, 13px/1.4): Testo secondario, note, performer name.
- **Label** (Inter 600, 10px/1, tracking 0.05em, uppercase): Micro-label, chip, badge, etichette sezione ALL-CAPS.
- **Mono** (JetBrains Mono 400, 12px): Coordinate, codice, valori tecnici.

### Named Rules
**The Fraunces Purity Rule.** Fraunces e usato solo ed esclusivamente nel wordmark dell'app. Mai per titoli, corpo testo, pulsanti o qualsiasi altro elemento UI.

## 4. Elevation

Il sistema usa ombre morbide con tinta marrone per creare profondità. Le superfici a riposo sono piatte; le ombre appaiono come risposta a stato o tipo di componente. Shadow vocabulary definito in `src/app.css` come custom properties `@theme`.

### Shadow Vocabulary
- **xs** (`0 1px 2px rgba(60,40,20,0.04)`): Sottile profondita per elementi altrimenti piatti.
- **sm** (`0 2px 8px rgba(60,40,20,0.06)`): Card, dropdown, segmented control attivo.
- **lg** (`0 12px 32px rgba(60,40,20,0.12)`): Sheet, modal, bottom sheet.
- **fab** (`0 4px 12px rgba(60,40,20,0.15)`): Floating action button (FAB).

### Named Rules
**The Brown Shadow Rule.** Tutte le ombre usano esclusivamente tinta marrone `rgba(60, 40, 20, ...)`. Mai ombre grigie, nere pure, o colorate.

## 5. Components

### Buttons

- **Shape:** Rettangolare con angoli leggermente arrotondati (8px).
- **Padding:** 16px orizzontali (sm: 12px, lg: 24px). Altezze: sm 36px, md 44px (touch standard), lg 52px.
- **Transitions:** `transition-colors duration-150`. Nessuna animazione di layout.
- **Loading:** Spinner circolare animato + stato disabled.
- **Focus:** `outline-2 outline-honey-500 outline-offset-2`.

| Variant | BG | Text | Hover | Active |
|---------|----|------|-------|--------|
| Primary | honey-500 | cream-50 | honey-600 | honey-700 |
| Secondary | cream-200 | wood-700 | cream-100 | — |
| Ghost | transparent | wood-700 | cream-100 | — |
| Destructive | danger-500 | cream-50 | danger-500/90 | — |

### Inputs & Select

- **Shape:** Rettangolare con angoli arrotondati (8px).
- **Height:** 48px (touch-friendly).
- **Style:** Bordo cream-200, sfondo cream-50. Testo wood-700, placeholder wood-400.
- **Focus:** Bordo honey-500 + ring 2px honey-500/20.
- **Error:** Bordo danger-500 + ring danger-500/20. Label errore sotto il campo.
- **Disabled:** Sfondo cream-100, testo wood-300, cursore not-allowed.

### Segmented Control

- **Shape:** Contenitore cream-200 con padding 4px, rounded-md (8px).
- **Active:** Sfondo cream-50 + shadow-xs per stato non-dirty. Sfondo cream-50/60 + bordo dashed honey-500/60 per stato dirty.
- **Inactive:** Testo wood-500, hover wood-700.
- **Compact variant:** Altezza 28px per spazi stretti.

### Cards / Containers

- **Shape:** Angoli arrotondati (12px).
- **Background:** cream-100.
- **Border:** cream-200 (1px solido).
- **Shadow:** sm su hover o stato selezionato.
- **Internal Padding:** 12-16px.

### Chips / Badges

- **Style:** Testo 9-10px, font semibold, rounded-full, padding 4-6px orizzontale.
- **Colors:** Varianti per stato (success-100/success-500 per OK, danger-100/danger-500 per patologie, warning per melari).
- **Uso:** Tag sulle ispezioni (regina vista, popolazione, melari).

### Toast

- **Position:** Fisso in alto (desktop) o top-center (mobile).
- **Shape:** Rounded-lg (12px) con bordo, shadow-sm.
- **Variants:** Success (bg success-100, border success-500/40, icon CheckCircle). Error (bg danger-100, border danger-500/40, icon AlertCircle).
- **Auto-dismiss:** 3s (success), 5s (error). Dismissibile manualmente con pulsante ×.
- **Animation:** Fade-in + slide-in-from-bottom, durata 200ms.

### SwipeableRow

- **Pattern:** Griglia CSS a due colonne: contenuto principale (1fr) + rivelazione (84-240px).
- **Meccanismo:** Touch tracking con snap a soglia (>1/3 della larghezza reveal). Chiude tutte le altre righe all'apertura (modulo closeRegistry).
- **Reveal Content:** Azioni contestuali (condividi/modifica/elimina per owner apiario, nascondi per activity).
- **Overlay:** Quando rivelato, overlay trasparente sull'area contenuto per intercettare tap e chiudere.

### FAB (Floating Action Button)

- **Position:** Fisso in basso a destra (offset da BottomNav: `calc(64px + 16px + env(safe-area-inset-bottom))`).
- **Shape:** Circolare (56x56px), rounded-full.
- **Style:** BG honey-500, icon cream-50, shadow-fab.
- **States:** Hover honey-600, active honey-700.

### BottomNav

- **Position:** Fisso in basso, larghezza piena.
- **Style:** BG cream-50/95 con backdrop blur, bordo superiore cream-200, padding-bottom con safe-area.
- **Items:** Icona + label, colore wood-400 (inattivo) / honey-600 (attivo), testo 10px.

### Bottom Sheet

- **Pattern:** Overlay wood-900/40, sheet fisso in basso (`fixed inset-x-0 bottom-0`), rounded-t-xl.
- **Handle:** Barretta centrata w-9 h-1 rounded-full bg-cream-200.
- **Padding bottom:** Con safe-area-inset-bottom.
- **Z-index:** Overlay z-30, sheet z-40.

### EmptyState

- **Centrato verticalmente** con padding-top, icona grande (40px) lucide, titolo e descrizione opzionale.
- **Azione:** Pulsante CTA opzionale per azione primaria (es. "Crea primo apiario").

## 6. Do's and Don'ts

### Do:
- **Do** usare i token palette definiti in `src/app.css`. Mai colori fuori palette.
- **Do** mantenere il target touch minimo 44x44pt (WCAG).
- **Do** includere `env(safe-area-inset-bottom)` in tutti i contenuti fixed-bottom.
- **Do** usare il focus ring honey-500 su tutti gli elementi interattivi.
- **Do** verificare contrasti WCAG AA per tema chiaro e scuro.
- **Do** usare solo classi Tailwind; nessun `#id` nei selettori CSS.
- **Do** stratificare z-index: header z-10, bottom nav z-20, overlay z-30, sheet z-40, map picker z-50.

### Don't:
- **Don't** usare side-stripe borders (border-left >1px colorato) su alert, modali o componenti interattivi. Eccezione consentita: la card apiario (`apiary-list-item`) usa la stripe sinistra come accento decorativo caldo per aggiungere profondità visiva alla lista.
- **Don't** usare `#000` o `#fff` come sfondo. Usare cream-50/100/200 come alternativa calda.
- **Don't** usare gradient text (`background-clip: text` + gradient). Singolo colore solido.
- **Don't** usare emoji nella UI. Preferire icone Lucide.
- **Don't** rimuovere `:focus-visible` senza alternativa visibile.
- **Don't** usare `border-left: 3px solid` come accento decorativo (side-tab pattern).
- **Don't** em dashes (—). Usare virgole, punti, o parentesi.
- **Don't** niente modali come prima scelta. Esaurire alternative inline/progressive prima.
