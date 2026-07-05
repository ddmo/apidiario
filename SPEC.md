# SPEC.md — App di Gestione Apiari

> **Stato**: in produzione (mobile) · layout tablet/desktop in progettazione · **Versione documento**: 0.4 (app build corrente: v0.21.0) · **Nome app**: Apidiario

---

## 1. Visione

Un'applicazione web mobile-first per apicoltori che permette di gestire apiari e arnie in modo semplice, veloce e collaborativo. L'uso primario avviene **sul campo, su smartphone** durante le ispezioni alle arnie. Il design privilegia l'ergonomia di input (tap su icone, pochi campi obbligatori, valori di default intelligenti) sopra tutto il resto.

L'app deve servire bene un apicoltore con 10 arnie e scalare senza ridisegno fino a qualche centinaio.

## Stato implementazione

| User story | Titolo | Stato |
|---|---|---|
| US-01 | Ispezione rapida sul campo | ✅ |
| US-02 | Overview visiva dell'arnia | ✅ schematico SVG con regina e telaini da ultima ispezione, icone stato e attrezzatura |
| US-03 | Lista arnie di un apiario | ✅ lista per apiario e lista globale; swipe-to-delete |
| US-04 | Anagrafica arnia | ✅ |
| US-05 | Anagrafica apiario | ✅ edit + map picker + foto + condivisione |
| US-06 | Registrazione trattamento | ✅ CRUD completo con flag blocksMelari (⚠️ manca avviso bloccante su save: vedi §6.4) |
| US-07 | Registrazione raccolto | ⬜ tabella DB pronta, zero UI |
| US-08 | Storia regina | 🟡 regina di default creata con ogni arnia; rilevazione regina da ispezione funzionante |
| US-09 | Promemoria custom | ⬜ tabella DB pronta, zero UI |
| US-10 | Condivisione apiario | ✅ bottom-sheet con invito via email, ruoli reader/editor, revoca |
| US-11 | Foto e video | ✅ upload multipli su ispezioni, anteprime, pending state, fullscreen preview |
| US-12 | Note vocali | ✅ registrazione con MediaRecorder, upload, iOS fallback file picker, player |
| US-13 | Anagrafe BDA | 🟡 campo presente su apiario, reminder automatico non implementato |
| US-14 | Storico e report | 🟡 storico ispezioni per arnia ✅; calendario mensile ✅; statistiche ✅; report aggregati ⬜ |
| — | Meteo apiario | ✅ previsioni 16 giorni con valutazione apistica |
| — | Previsione fioritura | ✅ fenologia per specie botaniche con GDD |
| — | Mappa posizione apiario | ✅ MapPickerSheet interattivo con Leaflet |
| — | Suggerimenti automatici | ✅ motore a regole (17 regole, 9 categorie) con UI |
| — | Statistiche | ✅ pagina dedicata: conteggi + spazio storage bucket |
| — | Notifiche push | ✅ SW push-only, toggle in Più, inviate su nuova ispezione in apiario condiviso |
| — | Activity log | ✅ admin: log insert/update/delete con timestamp e utente |
| — | Tema scuro/chiaro | ✅ toggle in Più, persistenza preferenza |
| — | Admin utenti | ✅ gestione utenti, inviti, eliminazione |
| — | Admin: dashboard utilizzo app | ✅ trend giornaliero, breakdown per tipo/azione, classifica utenti, filtro per utente (`/admin/utilizzo`) |
| — | Admin: monitoraggio Supabase | ✅ metriche Prometheus (DB size, storage, utenti, realtime connections) su free tier |
| — | Admin: costo API (Whisper + DeepSeek) | ✅ tracking chiamate e costo per utente |

**Home dell'app (post-login)**: lista apiari. Ogni riga apiario ha swipe-to-reveal per condividere, modificare, eliminare.

## 2. Principi di prodotto

1. **Mobile-first reale.** Ogni schermata deve funzionare con una mano sola, con guanti, sotto il sole. Niente tabelle dense, niente form lunghi.
2. **Visivo prima che testuale.** Stati delle arnie comunicati con icone e colori; testo libero solo dove inevitabile (note, dettatura vocale).
3. **Pochi tap.** Una "ispezione standard" si completa in massimo 60 secondi.
4. **Default intelligenti.** I form precompilano dai dati dell'ultima ispezione; l'utente conferma o modifica.

**Nuovo (in corso):** l'uso mobile sul campo resta il caso d'uso primario e non va compromesso. In parallelo si sta progettando un layout tablet/desktop per l'uso da scrivania (pianificazione, revisione dati, gestione più apiari insieme) — vedi §11.

## 3. Personas e ruoli

### Personas
- **Apicoltore proprietario** (Stefano). Possiede e gestisce uno o più apiari. Vuole tracciare lo stato di salute, i trattamenti e le produzioni.
- **Co-apicoltore collaboratore.** Membro autorizzato a operare su uno o più apiari di proprietà di altri (es. socio, familiare, aiutante stagionale).
- **Osservatore.** Persona autorizzata solo a leggere lo stato di un apiario (es. corso di apicoltura, mentore, veterinario).

### Ruoli a livello di risorsa
- **Owner**: chi ha creato l'apiario. Diritti pieni, può cancellare, può gestire condivisioni.
- **Editor**: può creare/modificare ispezioni, trattamenti, raccolti, arnie. Non può cancellare l'apiario né modificare i permessi.
- **Reader**: può solo leggere.

I permessi si applicano a:
- **Un intero apiario** (e di conseguenza tutte le sue arnie).

I permessi sono additivi: vale sempre il livello più alto tra quelli ottenuti.

## 4. Entità principali (modello concettuale)

```
User
 ├─ owns ──────► Apiary ──┬─ contains ──► Hive ──┬─ has ──► Inspection
 │                        │                      ├─ has ──► Treatment (può essere su più arnie)
 │                        │                      ├─ has ──► QueenHistory
 │                        │                      └─ has ──► Media
 │                        ├─ has ──► Harvest (per tipo di miele)
 │                        ├─ has ──► Reminder
 │                        └─ has ──► Media (foto generali apiario)
 │
 └─ shares ────► ApiaryAccess (apiary_id, user_id, role)
```

Dettagli per entità nel paragrafo 6.

## 5. User stories prioritarie

### P0 — Cuore funzionale

**US-01 — Ispezione rapida sul campo**
✅ Implementata.

**US-02 — Overview visiva dell'arnia**
✅ Implementata.

Elementi visivi:
- Disegno schematico SVG dell'arnia (nido con telaini, melari, apiscampo, rete propoli, trappola polline).
- Numero di telaini nel nido ricavato dalla somma dei telaini covata + miele + polline dell'ultima ispezione (fallback: `nido_frame_count` statico dell'arnia).
- Presenza/assenza regina: ♛ se "Vista", "?" se "Non cercata", nessuna icona se "Non vista". Se nessuna ispezione, fallback sulla tabella `queens` (regina attiva).
- Toggle attrezzatura: apiscampo, rete propoli, trappola polline con mutazione ottimistica.
- Numero melari dal dato statico dell'arnia.

**US-03 — Lista arnie di un apiario**
✅ Implementata.

**US-04 — Anagrafica arnia**
✅ Implementata. Alla creazione viene generata automaticamente una regina di default con `marking_color = 'non_marcata'`, `origin = 'sconosciuta'`. Operazione atomica via RPC `create_hive_with_queen`.

**US-05 — Anagrafica apiario**
✅ Implementata. Include foto principale, coordinate GPS (acquisizione browser o manuale o mappa interattiva), codice BDA.

### P1 — Operativo essenziale

**US-06 — Registrazione trattamento**
✅ CRUD implementato, con:
- Tipo prodotto (Apivar, Api-Bioxal, acido formico/ossalico, Thymovar, Apiguard, altro)
- Data inizio, data fine opzionale
- Selezione apiario + arnie (multi-select o "tutte")
- Flag `blocksMelari`, costo, dosaggio, note
- Elenco trattamenti attivi con indicatore blocco melari

⚠️ **Gap**: la specifica (sezione 6.4) richiede un avviso bloccante al salvataggio se il trattamento ha `blocksMelari` e una o più arnie hanno melari dall'ultima ispezione. Al momento il flag è solo informativo. Da implementare.

**US-07 — Registrazione raccolto** ⬜
**US-08 — Storia regina** 🟡
**US-09 — Promemoria custom** ⬜

**US-10 — Condivisione apiario**
✅ Implementata:
- Bottom-sheet su swipe apiario nella home
- Invito via email (Edge Function `grant-apiary-access` cerca utente, verifica proprietario, inserisce in `apiary_access`)
- Ruoli: lettura / scrittura
- Revoca immediata
- Notifica push automatica quando un collaboratore aggiunge un'ispezione

### P2 — Supporto e contesto

**US-11 — Foto e video**
✅ Implementata (ispezioni):
- Picker con griglia 3 colonne, anteprime locali "Da salvare" con stato pending
- Upload multiplo a Supabase Storage, limite 20 MB per file
- Commit differito: in ispezioni nuove, i file restano pending fino al primo salvataggio
- Fullscreen preview per foto e video
- Rimozione con cancellazione da Storage e DB

**US-12 — Note vocali**
✅ Implementata:
- Registrazione con `MediaRecorder` (WebM/opus)
- Upload a Supabase Storage, link a `inspection_voice_notes`
- Player embedded nel form ispezione
- Fallback iOS: se la Web Speech API non supporta registrazione diretta, l'utente seleziona file audio già registrati
- Commit differito per ispezioni nuove
- Rimozione con cancellazione file

**US-13 — Anagrafe BDA** 🟡
**US-14 — Storico e report** 🟡

### P3 — Nice to have (post-MVP)

- Esportazione dati (CSV/JSON) per backup personale.
- Confronto multi-stagione (es. produzione 2024 vs 2025 per arnia).
- Promemoria stagionali predefiniti opzionali (varroa estiva, ossalico invernale).

## 6. Specifiche per area funzionale

### 6.1 Apiari

Campi:
- Nome (obbligatorio)
- Posizione GPS (lat, lng) — acquisita dal browser o inserita manualmente o da mappa
- Indirizzo testuale opzionale
- Codice aziendale BDA (opzionale)
- Note ambientali (esposizione, fioriture, fonte d'acqua) — testo libero
- Foto principale (singola)
- Data creazione, owner, membri condivisi

**Acquisizione posizione GPS**: alla creazione, l'app propone "Usa la mia posizione attuale" tramite browser Geolocation API. In alternativa inserimento manuale o MapPickerSheet interattivo (Leaflet, tile OSM, cerchio 3 km raggio bottinatura). La posizione è opzionale.

Operazioni:
- Crea, modifica, archivia (soft-delete `archived_at`), condividi.
- Swipe-to-reveal nella home: condividi, modifica, elimina.

### 6.2 Arnie

Campi:
- Identificativo/numero (obbligatorio, univoco nell'apiario)
- Tipo arnia (Dadant-Blatt, Langstroth, Top-bar, altro)
- Razza ape (Ligustica, Buckfast, Carnica, Sicula, ibrida, sconosciuta)
- Origine (sciame catturato, nucleo acquistato, divisione, pacco, sciamatura interna)
- Data insediamento
- Stato: attiva, sciamata, morta, riunita, venduta, ceduta
- Numero telaini nido (default 10)
- Numero melari, apiscampo, rete propoli, trappola polline (attrezzatura toggle)
- Foto, note libere

Sotto-entità:
- **Regina**: anno nascita, marcatura colore (standard internazionale), origine, data inizio, data sostituzione. Creata di default all'inserimento arnia.

### 6.3 Ispezioni (cuore dell'app)

Due modalità:

- **Express**: solo campi essenziali (regina, covata, popolazione, note). I campi non visibili vengono salvati come NULL nel DB ("non rilevato" ≠ "vuoto ma osservato").
- **Standard**: tutti i campi in scroll verticale.

Campi:

| Campo | Tipo | Default | Obbligatorio |
|---|---|---|---|
| Data e ora | datetime | now() | sì |
| Meteo | testo + icona | auto da API meteo+GPS | no |
| Regina vista | enum: vista / non vista / non cercata | non cercata | sì |
| Covata uova | bool | da ultima ispezione | no |
| Covata larve | bool | da ultima ispezione | no |
| Covata opercolata | bool | da ultima ispezione | no |
| Telaini covata | int 0-20 | da ultima ispezione | no |
| Telaini miele | int 0-20 | da ultima ispezione | no |
| Telaini polline | int 0-20 | da ultima ispezione | no |
| Popolazione | debole/media/forte | media | sì |
| Importazione polline | bool | no | no |
| Celle reali | nessuna/di scarto/di sciamatura/di sostituzione | nessuna | sì |
| Comportamento | calmo/nervoso/aggressivo | calmo | no |
| Segni patologici | multi-enum | nessuno | no |
| Conteggio varroa | numero + metodo | nessuno | no |
| Interventi eseguiti | multi-enum + testo | nessuno | no |
| Foto/video | media multipli | — | no |
| Note vocali | audio registrato/caricato | — | no |
| Note libere | testo | vuoto | no |

**Comportamento edit**: form precompilato con dati esistenti. Pulsante salva disabilitato finché nessun campo sporcato. Back senza modifica non chiede conferma.

**Stati derivati** per overview arnia (calcolati da ultima ispezione):
- Livello scorte (verde/giallo/rosso) → telaini miele
- Stato regina (verde/grigio/rosso) → vista/non cercata/non vista
- Stato covata (verde/giallo/rosso) → presente con tutte le fasi/parziale/assente
- Allarme celle reali → giallo/rosso se di sciamatura
- Allarme patologie → rosso se segni recenti

**Elenco ispezioni** per arnia: riga con badge calendario a sinistra, stato regina + popolazione, patologie come chip, note, performer, swipe-to-delete.

### 6.4 Trattamenti

✅ CRUD implementato — vedi US-06.

⚠️ **Da implementare (gap)**: avviso bloccante al salvataggio. Se il trattamento ha `blocksMelari` e una o più arnie selezionate hanno melari dall'ultima ispezione, mostrare warning con opzioni "ho rimosso i melari, procedi" (genera ispezione automatica con melari=0) o "annulla".

### 6.5 Raccolti ⬜

### 6.6 Promemoria ⬜

### 6.7 Media (foto/video)

✅ Implementato per ispezioni (US-11).
- Upload a bucket Supabase `apidiario-media`, path `inspections/{id}/media/{uuid}.{ext}`
- Signed URL con scadenza 1 ora per visualizzazione
- Limite 20 MB per file, formati immagine e video
- Stato pending per ispezioni non ancora salvate

### 6.8 Anagrafe BDA 🟡

### 6.9 Meteo apiario

✅ Implementato.
- Previsioni 16 giorni da Open-Meteo API (gratuita, nessuna chiave)
- Elevazione da endpoint separato Open-Meteo
- Griglia: giorno, icona WMO, precipitazioni, barra temperatura, vento, valutazione apistica
- **Valutazione apistica** (indice 1-5) calcolata lato client:
  - 5 stelle: T 15-30°C, vento <15 km/h, nessuna pioggia
  - Penalità: pioggia (>0.5mm -1, >5mm -2), vento (>20 km/h -1, >35 km/h -2), temperature (<10°C o >35°C -2, <5°C o >38°C -3)
  - Minimo 1 stella

### 6.10 Previsione fioritura (fenologia)

✅ Implementato.
- Modello Growing Degree Days (GDD) con dati Open-Meteo
- Specie in tabella `phenology_species` con `base_temp` e `gdd_threshold`
- GDD cumulativo da inizio anno per coordinate apiario
- Stima data inizio fioritura, barra progresso, GDD attuale vs soglia

### 6.11 Mappa posizione apiario (MapPickerSheet)

✅ Implementato.
- Fullscreen sheet con Leaflet (tile OSM gratuiti)
- Mirino CSS centrale, cerchio raggio 3 km
- Bottone "Conferma posizione" sticky in basso
- Inizializzazione: coordinate fornite / geolocalizzazione browser / fallback Italia centrale
- Integrato in ApiaryForm

### 6.12 Suggerimenti automatici

✅ Implementato. Motore a regole che analizza dati ispezione + calendario e produce suggerimenti contextuali.

17 regole in 9 categorie:
- **Regina**: età, sostituzione, sciamatura imminente
- **Covata**: assente in stagione, ridotta
- **Salute**: segni patologici, varroa
- **Scorte**: basse, raccolto possibile
- **Attrezzatura**: aggiunta/rimozione melari, apiscampo
- **Raccolto**: pronto per smielatura
- **Calendario**: trattamenti stagionali
- **Stagione**: preparazione invernale, controllo primaverile
- **Comportamento**: anomalie

Accessibile da icona nell'header del dettaglio apiario (badge con conteggio critici).

### 6.13 Statistiche

✅ Implementato. Rotta `/statistiche`.
- Conteggi: apiari, arnie, ispezioni, trattamenti, foto/video, note vocali
- Spazio storage bucket (bytes + conteggio file) via RPC `get_storage_usage`
- Utenti totali registrati (admin only) via Edge Function `admin-list-users`
- Accessibile da pagina Più

### 6.14 Notifiche push

✅ Implementato.

Architettura:
- Service worker `/sw.js` push-only (nessun fetch handler = zero caching)
- Registrato in `main.tsx` all'avvio
- Toggle in pagina Più: subscribe/unsubscribe via Push API
- VAPID keys per Web Push Protocol
- Subscription salvata in tabella `push_subscriptions` (RLS scoped a user_id)
- Alla creazione di una nuova ispezione su apiario condiviso, Edge Function `send-push-notification` invia notifica a tutti gli altri utenti con accesso
- Click sulla notifica apre l'ispezione

### 6.15 Activity log (admin)

✅ Implementato. Rotta `/admin/attivita`.
- Logga operazioni insert/update/delete via funzione `logActivity()`
- Tabella `activity_log` con user_id, tipo azione, risorsa, descrizione, timestamp
- Vista admin-only

### 6.16 Admin utenti

✅ Implementato. Rotta `/admin/users`.
- Lista utenti registrati
- Invito nuovo utente via email (Edge Function `admin-invite-user`)
- Eliminazione utente (solo admin, con conferma)

### 6.17 Pagina "Più" e navigazione

Rotta `/piu` accessibile da bottom nav:
- Info utente (nome, email)
- Ultimo aggiornamento dati (da React Query `dataUpdatedAt`)
- Link: Previsioni fioritura, Statistiche
- Admin: Gestione utenti, Attività
- Tema: chiaro/sistema/scuro
- Toggle notifiche push
- Logout
- Versione app in fondo

### 6.18 Calendario ispezioni

✅ Implementato. Rotta `/calendario`.
- Vista mensile, giorni colorati per presenza ispezioni
- Click giorno → lista ispezioni
- Navigazione tra mesi

## 7. Modello permessi (dettaglio)

### Logica

```
canRead(user, hive):
    return  isOwner(user, hive.apiary)
         OR hasApiaryAccess(user, hive.apiary, role IN ['reader','editor'])

canWrite(user, hive):
    return  isOwner(user, hive.apiary)
         OR hasApiaryAccess(user, hive.apiary, role = 'editor')

canManagePermissions(user, apiary):
    return isOwner(user, apiary)
```

### Casi d'uso

- **Stefano possiede l'Apiario A**, condivide come editor con Marco. Marco vede tutte le arnie di A e può registrare ispezioni.
- **Stefano cancella la condivisione** con Marco. Marco perde l'accesso immediatamente.
- **Stefano viene aggiunto come editor** all'Apiario B di Anna. Vede A (che possiede) e B (a cui è invitato) nella sua home.

### Inviti

La condivisione avviene solo verso utenti già registrati. Accesso tramite Edge Function `grant-apiary-access` che usa `supabase.auth.admin.listUsers()` per risolvere l'email. Revoca immediata via delete su `apiary_access` (garantito da RLS).

## 8. Requisiti non funzionali

### 8.1 Performance
- Caricamento iniziale: < 2 s su 4G.
- Query apiari/arnie/ispezioni cached con TanStack Query (staleTime configurato per tipo).

### 8.2 Offline
- 🟡 **Parziale.** L'app è una PWA installabile: service worker (`src/sw.ts`, Workbox via `vite-plugin-pwa` strategia `injectManifest`) precacha l'app shell e gli asset statici, e cachea immagini/font/foto Supabase Storage (`StaleWhileRevalidate`/`CacheFirst`). I dati applicativi (apiari, arnie, ispezioni...) sono persistiti lato client con `@tanstack/react-query-persist-client` su IndexedDB, quindi l'ultima vista rimane consultabile offline.
- **Non implementato**: scrittura offline. Non c'è outbox/coda di sincronizzazione: creare o modificare dati richiede connessione attiva. Dexie resta installato come dipendenza ma non utilizzato.

### 8.3 Sicurezza e privacy
- Autenticazione: email + OTP a 6 cifre via Supabase Auth
- Tutte le tabelle protette da Row Level Security (RLS)
- Foto/video soggetti alle stesse policy della risorsa associata, con SECURITY DEFINER su storage.objects per evitare ricorsione RLS
- Backup giornalieri (Supabase)

### 8.4 Accessibilità
- Touch target ≥ 44×44pt
- Tema scuro disponibile
- Contrasto verificato sulla palette

### 8.5 Internazionalizzazione
- v1: solo italiano. File traduzione presente: `src/i18n/it.ts`.

## 9. Stack tecnologico

- **Frontend**: React 18 + Vite + TypeScript strict + Tailwind v4
- **Routing**: TanStack Router file-based (convenzione flat con underscore)
- **Stato server**: TanStack Query (persistenza in sessione, non offline)
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions Deno)
- **Mappe**: Leaflet + react-leaflet (tile OSM, nessuna API key)
- **Meteo**: Open-Meteo API (gratuita, nessuna chiave)
- **Compressione immagini**: `browser-image-compression`
- **Notifiche push**: Web Push API + VAPID + Service Worker minimale
- **Motore suggerimenti**: custom rules engine lato client
- **Hosting frontend**: Cloudflare Workers (wrangler deploy, non Pages)
- **PWA**: ✅ abilitata. `vite-plugin-pwa` (strategia `injectManifest`), manifest con icone/maskable, installabile (`display: standalone`). ⚠️ **`orientation: 'portrait'` fissato nel manifest** — da rivedere per il supporto tablet (vedi §11).
- **CI/CD**: push su GitHub → Cloudflare Workers deploy automatico

## 10. Fuori scope per la v1

- Gestione vendite, fatture, lotti di confezionamento miele
- Generazione registro trattamenti formattato per ASL
- Comunicazione automatica con BDA o sistemi pubblici
- Ripartizione produzione per singola arnia
- Confronti multi-stagione e analisi avanzate
- Modalità multilingua (inglese)
- App nativa (iOS/Android store)
- Integrazione con bilance elettroniche o sensori IoT in arnia
- Gestione finanziaria (costi/ricavi)
- Login OAuth (Google, Apple)
- Offline-first per la scrittura (sync engine, outbox queue) — la lettura offline via precache/IndexedDB è invece già implementata (§8.2)

## 11. Decisioni aperte

1. ~~**Nome dell'app**~~ ✅ Apidiario.
2. ~~**Identità visiva**~~ ✅ palette caldo legno-miele, Inter, Fraunces per wordmark.
3. ~~**Audio dettato**~~ ✅ risolto: Web Speech API del browser per v1. Limite noto su iOS Safari, accettato.
4. **Offline sync (scrittura)**: Dexie presente nelle dipendenze ma non utilizzato. Decisione rimandata.
5. **Layout tablet/desktop**: in progettazione (mockup via Claude Design). Stato tecnico di partenza, verificato nel codice:
   - Oggi l'intera app (`src/routes/_auth.tsx`) è incapsulata in un `<main className="max-w-lg mx-auto ...">`: su schermi larghi resta una colonna stretta centrata con molto spazio vuoto ai lati. Nessuna route applicativa (fuori dall'admin) ha classi responsive (`md:`/`lg:`) oggi.
   - Navigazione attuale: `BottomNav` fisso in basso con 5 voci (Home, Calendario, FAB "Visita" per nuova ispezione, Trattamenti, Più) — pattern pensato per pollice/mano singola, da ripensare per mouse/tastiera su schermi grandi.
   - **Precedente da NON riusare visivamente**: il pannello admin (`/admin/*`) ha già un layout desktop (sidebar fissa + drawer mobile) ma usa una palette scura amber/stone completamente diversa dal design system cream/wood/honey descritto in DESIGN.md. È uno strumento interno, non un riferimento per il layout tablet/desktop dell'app principale.
   - ⚠️ **Conflitto da risolvere**: il manifest PWA ha `orientation: 'portrait'` fisso (vedi §9). Se l'app installata deve supportare l'uso in landscape su tablet, questo vincolo va rimosso o reso condizionale.

## 12. Glossario

- **Arnia**: contenitore che ospita la famiglia di api.
- **Telaino (telaio)**: cornice di legno con foglio cereo dove le api costruiscono il favo.
- **Nido**: corpo principale dell'arnia, dove vive la famiglia e c'è la covata.
- **Melario**: scomparto sopra il nido per la raccolta del miele.
- **Covata**: insieme di uova, larve e cellette opercolate deposte dalla regina.
- **Cella reale**: cella speciale per allevare una nuova regina.
- **Sciamatura**: divisione spontanea della famiglia.
- **BDA**: Banca Dati Apistica, sistema italiano di registrazione obbligatoria.
- **Varroa**: acaro parassita (Varroa destructor), principale problema sanitario.
- **GDD**: Growing Degree Days, calore accumulato per modelli fenologici.
- **VAPID**: Voluntary Application Server Identification, standard Web Push.

---

*Fine documento.*
