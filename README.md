# Apidiario

App web mobile-first (PWA) per la gestione di apiari e arnie.

**Stack**: React 18 · Vite 6 · TypeScript strict · Tailwind CSS v4 · Supabase · TanStack Router · TanStack Query

---

## Prerequisiti

- Node.js ≥ 18
- Docker Desktop (per Supabase locale)
- (opzionale) Supabase CLI globale: `brew install supabase/tap/supabase`

---

## Setup iniziale

### 1. Installa dipendenze

```bash
npm install
```

### 2. Avvia Supabase locale

> Docker Desktop deve essere in esecuzione.

```bash
npx supabase start
```

Al termine stampa le credenziali locali:

```
API URL:   http://127.0.0.1:54321
anon key:  eyJ...
```

### 3. Crea il file `.env.local`

Copia `.env.example` e inserisci i valori stampati al passo precedente:

```bash
cp .env.example .env.local
# poi modifica con API URL e anon key di supabase start
```

### 4. Applica le migrazioni

```bash
npx supabase db push
```

### 5. Genera i tipi TypeScript

```bash
npm run db:types
```

Questo comando sovrascrive `src/types/database.ts` con i tipi generati dallo schema reale.

### 6. Avvia il dev server

```bash
npm run dev
```

App disponibile su `http://localhost:5173`.

---

## Login con magic link in locale

Supabase locale include **Mailpit**, un server email fittizio.

1. Apri l'app → inserisci un'email qualsiasi → clicca "Accedi con link email"
2. Apri Mailpit su `http://127.0.0.1:54324`
3. Trova l'email ricevuta → clicca il link → sei loggato

---

## Comandi utili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia dev server con HMR |
| `npm run build` | Build produzione |
| `npm run preview` | Anteprima build produzione |
| `npm run type-check` | Type check TypeScript (genera routeTree prima) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (write) |
| `npm run format:check` | Prettier (check, usato in CI) |
| `npm run router:gen` | Rigenera `src/routeTree.gen.ts` manualmente |
| `npm run db:types` | Rigenera `src/types/database.ts` dallo schema locale |
| `npx supabase start` | Avvia stack Supabase locale |
| `npx supabase stop` | Ferma stack locale |
| `npx supabase status` | Mostra URL e chiavi locali |
| `npx supabase db push` | Applica migrazioni pendenti |

---

## Struttura directory

```
src/
├── components/
│   ├── layout/      # BottomNav, SyncIndicator
│   └── ui/          # Button, Card, Input, IconBadge, StatusDot
├── features/
│   └── auth/        # LoginForm
├── hooks/           # useAuth
├── i18n/            # it.ts — stringhe UI italiane
├── lib/             # supabase.ts, query-client.ts, theme.ts, utils.ts
├── routes/          # TanStack Router file-based routes
├── types/           # database.ts (generato)
├── app.css          # @theme Tailwind v4 + dark mode
├── main.tsx         # Entry point
└── router.ts        # Router instance

supabase/
└── migrations/      # SQL migrations (fonte di verità schema DB)
```

---

## Note tecniche

- **`src/routeTree.gen.ts`** — generato automaticamente da `@tanstack/router-plugin` a ogni save in `src/routes/`. Non modificare.
- **`src/types/database.ts`** — generato da `npm run db:types`. Non modificare. Va rigenerato dopo ogni migrazione.
- **Tema scuro** — attivato automaticamente da `prefers-color-scheme`. Toggle UI in lavorazione (Fase 2+).
- **Offline** — TanStack Query persiste la cache in IndexedDB (`apidiario-query-cache`). La coda di scrittura offline è in lavorazione (Fase offline).
- **PWA** — icone in `public/icons/` sono placeholder SVG. Sostituire con PNG 192×192 e 512×512 prima del deploy in produzione.
