# SPEC.md — App di Gestione Apiari

> **Stato**: bozza Fase 0 · **Versione**: 0.1 · **Nome app**: Apidiario

---

## 1. Visione

Un'applicazione web mobile-first (PWA installabile) per apicoltori che permette di gestire apiari e arnie in modo semplice, veloce e collaborativo. L'uso primario avviene **sul campo, su smartphone, spesso senza connessione**, durante le ispezioni alle arnie. Il design privilegia l'ergonomia di input (tap su icone, pochi campi obbligatori, valori di default intelligenti) sopra tutto il resto.

L'app deve servire bene un apicoltore con 10 arnie e scalare senza ridisegno fino a qualche centinaio.

## 2. Principi di prodotto

1. **Mobile-first reale.** Ogni schermata deve funzionare con una mano sola, con guanti, sotto il sole. Niente tabelle dense, niente form lunghi.
2. **Offline-first.** Tutte le operazioni di lettura e scrittura devono funzionare senza rete; la sincronizzazione avviene quando torna il segnale.
3. **Visivo prima che testuale.** Stati delle arnie comunicati con icone e colori; testo libero solo dove inevitabile (note, dettatura vocale).
4. **Pochi tap.** Una "ispezione standard" si completa in massimo 60 secondi.
5. **Default intelligenti.** I form precompilano dai dati dell'ultima ispezione; l'utente conferma o modifica.

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
- **Una singola arnia** (visibilità limitata a quell'arnia, con metadati minimi dell'apiario per navigazione).

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
 ├─ shares ────► ApiaryAccess (apiary_id, user_id, role)
 └─ shares ────► HiveAccess   (hive_id,  user_id, role)
```

Dettagli per entità nel paragrafo 6.

## 5. User stories prioritarie

Le storie sono ordinate per priorità di implementazione. Le prime 5 sono la spina dorsale del prodotto e devono essere perfette prima di tutto il resto.

### P0 — Cuore funzionale

**US-01 — Ispezione rapida sul campo**
> Come apicoltore, in apiario, voglio aprire l'app, selezionare un'arnia e registrare un'ispezione standard in meno di 60 secondi, anche senza rete e con i guanti.

Criteri:
- Massimo 3 tap per arrivare al form di ispezione dall'apertura dell'app.
- Form a pagina singola, scroll verticale, tap su icone grandi (44×44pt minimo).
- Valori di default ricavati dall'ultima ispezione della stessa arnia.
- Salvataggio offline con indicatore "non sincronizzato" finché torna la rete.

**US-02 — Overview visiva dell'arnia**
> Come apicoltore, voglio vedere a colpo d'occhio lo stato di un'arnia tramite un disegno schematico con icone di stato sovrapposte.

Elementi visivi richiesti:
- Disegno schematico dell'arnia (nido + eventuali melari).
- Numero di telaini nel nido.
- Presenza/numero di melari.
- Icone di stato: livello scorte, presenza covata, regina vista/non vista, importazione polline, presenza celle reali.
- Colori semaforici (verde/giallo/rosso) per leggibilità immediata.
- Data ultima ispezione + chi l'ha fatta.

**US-03 — Lista arnie di un apiario**
> Come apicoltore, voglio vedere tutte le arnie di un apiario in una lista scorrevole con stato sintetico per ognuna, e poter ordinare/filtrare.

Criteri:
- Card per arnia con: nome/numero, mini-icone di stato (3-4 max), data ultima visita.
- Filtri rapidi: "da controllare", "con problemi", "sciamate", "morte".
- Ordinamento: per nome, per data ultima visita, per stato.

**US-04 — Anagrafica arnia**
> Come apicoltore, voglio creare una nuova arnia inserendo identificativo, tipo, razza, regina e origine.

**US-05 — Anagrafica apiario**
> Come apicoltore, voglio creare un apiario indicando nome, posizione GPS (auto o manuale), note, e foto di riferimento.

### P1 — Operativo essenziale

**US-06 — Registrazione trattamento**
> Come apicoltore, voglio registrare un trattamento sanitario (tipo, date inizio/fine) applicato a una o più arnie, con avviso automatico se ci sono melari incompatibili.

**US-07 — Registrazione raccolto**
> Come apicoltore, voglio registrare una smielatura indicando data, tipo di miele e kg totali.

**US-08 — Storia regina**
> Come apicoltore, voglio tracciare la storia della regina di un'arnia (anno, marcatura, origine, data sostituzione).

**US-09 — Promemoria custom**
> Come apicoltore, voglio creare promemoria personali (su un apiario o su un'arnia specifica) con notifica push.

**US-10 — Condivisione apiario / arnia**
> Come proprietario, voglio invitare un'altra persona a leggere o modificare un apiario o una singola arnia.

### P2 — Supporto e contesto

**US-11 — Foto e video**
> Come apicoltore, voglio allegare foto/video a un'arnia, a un apiario, o a una singola ispezione.

**US-12 — Note vocali**
> Come apicoltore in apiario, voglio dettare note vocali invece di scrivere.

**US-13 — Anagrafe BDA**
> Come apicoltore, voglio inserire il codice aziendale BDA per ogni apiario e ricevere un promemoria automatico a novembre per l'aggiornamento annuale dell'anagrafe apistica.

**US-14 — Storico e report**
> Come apicoltore, a fine stagione voglio vedere produzione totale per tipo di miele, numero ispezioni per arnia, trattamenti effettuati, mortalità invernale.

### P3 — Nice to have (post-MVP)

- Esportazione dati (CSV/JSON) per backup personale.
- Meteo automatico al momento dell'ispezione (geolocalizzato).
- Confronto multi-stagione (es. produzione 2024 vs 2025 per arnia).
- Promemoria stagionali predefiniti opzionali (varroa estiva, ossalico invernale).

## 6. Specifiche per area funzionale

### 6.1 Apiari

Campi:
- Nome (obbligatorio)
- Posizione GPS (lat, lng) — acquisita dal browser o inserita manualmente
- Indirizzo testuale opzionale
- Codice aziendale BDA (opzionale)
- Note ambientali (esposizione, fioriture, fonte d'acqua) — testo libero
- Foto di riferimento (multiple)
- Data creazione, owner, membri condivisi

Operazioni:
- Crea, modifica, archivia (soft-delete), condividi.
- Cancellazione hard solo se non ha arnie attive.

### 6.2 Arnie

Campi:
- Identificativo/numero (obbligatorio, univoco nell'apiario)
- Tipo arnia (Dadant-Blatt, Langstroth, Top-bar, altro)
- Razza ape (Ligustica, Buckfast, Carnica, ibrida, sconosciuta)
- Origine (sciame catturato, nucleo acquistato, divisione, pacco, sciamatura interna)
- Data insediamento
- Stato: attiva, sciamata, morta, riunita, venduta, ceduta
- Numero attuale di telaini nido (default 10, modificabile)
- Foto
- Note libere

Sotto-entità:
- **Storia regina**: anno nascita, marcatura colore (bianco/giallo/rosso/verde/blu secondo standard internazionale), origine (figlia, introdotta, sciamatura, sostituzione spontanea), data inizio, data sostituzione.

### 6.3 Ispezioni (cuore dell'app)

L'ispezione ha due modalità di input nello stesso form:

- **Standard**: solo i campi essenziali per un controllo veloce (regina, covata, popolazione, note). Pensata per ispezioni di routine in 20-30 secondi.
- **Express**: tutti i campi visibili in scroll verticale, per ispezioni approfondite (telaini, celle reali, patologie, comportamento, varroa, interventi, foto).

Quando l'utente salva in modalità Express, i campi non visibili in Express vengono salvati come NULL (semantica: "non rilevato"), distinta dalla loro forma "vuota ma osservata" disponibile solo in Standard.


Campi:

| Campo | Tipo | Default | Obbligatorio |
|---|---|---|---|
| Data e ora | datetime | now() | sì |
| Meteo | testo + icona | auto da API meteo+GPS | no |
| Regina vista | enum: vista / non vista / non cercata | non cercata | sì |
| Covata uova | bool | da ultima ispezione | no |
| Covata larve | bool | da ultima ispezione | no |
| Covata opercolata | bool | da ultima ispezione | no |
| Telaini covata (stima) | int 0-20 | da ultima ispezione | no |
| Telaini miele (stima) | int 0-20 | da ultima ispezione | no |
| Telaini polline (stima) | int 0-20 | da ultima ispezione | no |
| Popolazione | enum: debole/media/forte | media | sì |
| Importazione polline | bool | no | no |
| Celle reali | enum: nessuna / di scorta / di sciamatura / di sostituzione | nessuna | sì |
| Comportamento | enum: calmo/nervoso/aggressivo | calmo | no |
| Segni patologici | multi-enum: varroa, peste americana, peste europea, covata calcificata, nosema, virus, altro | nessuno | no |
| Conteggio varroa (opz.) | numero + metodo | nessuno | no |
| Interventi eseguiti | multi-enum + testo libero | nessuno | no |
| Foto/video | media multipli | — | no |
| Note libere | testo + dettatura vocale | vuoto | no |

**Modalità**:
I campi Express sono: data/ora, meteo, regina vista, covata uova/larve/opercolata, popolazione, note libere. Tutto il resto è Standard.

Stati derivati per la "overview" arnia (calcolati dall'ultima ispezione):
- **Livello scorte** (verde / giallo / rosso) → in base ai telaini di miele
- **Stato regina** (verde / grigio / rosso) → vista / non cercata / non vista da troppo tempo
- **Stato covata** (verde / giallo / rosso) → presente con tutte le fasi / parziale / assente
- **Allarme celle reali** → giallo/rosso se di sciamatura
- **Allarme patologie** → rosso se segni recenti

### 6.4 Trattamenti

Campi:
- Tipo prodotto (Apivar, Api-Bioxal, Apilife Var, acido formico, acido ossalico gocciolato/sublimato, Thymovar, Apiguard, altro con testo libero)
- Data inizio (obbligatoria)
- Data fine (opzionale, può essere aggiornata dopo)
- Arnie trattate (multi-select, almeno 1)
- Dosaggio/note (testo libero)
- Costo (opzionale)

Logica di avviso:
- Al salvataggio, se il trattamento è classificato "antivarroa con esclusione melari" e una o più arnie selezionate hanno melari presenti (ricavato dall'ultima ispezione), mostrare warning bloccante con opzione "ho rimosso i melari, procedi" (che genera un'ispezione automatica con `melari = 0`) oppure "annulla".

### 6.5 Raccolti

Campi:
- Data smielatura
- Tipo di miele (acacia, castagno, tiglio, millefiori, melata, sulla, agrumi, eucalipto, altro)
- Kg totali
- Apiario di provenienza (singolo, almeno per ora — niente ripartizione per arnia in v1)
- Note (umidità, lotto, contenitore) — opzionale

### 6.6 Promemoria

Campi:
- Titolo (obbligatorio)
- Descrizione (opzionale)
- Data e ora
- Ricorrenza (singolo / settimanale / mensile / annuale)
- Scope: globale / apiario specifico / arnia specifica
- Notifica push (sì/no)

Promemoria di sistema (non cancellabili):
- **BDA**: notifica annuale 1° novembre se l'apiario ha un codice aziendale, ricorda di aggiornare l'anagrafe apistica nazionale entro fine novembre.

### 6.7 Media (foto/video)

- Allegabili a: apiario, arnia, ispezione.
- Compressione lato client prima di upload.
- Limite indicativo: 10 MB per file, formati JPG/PNG/HEIC/MP4.
- Storage: bucket Supabase con accesso vincolato dalle policy di permessi della risorsa associata.

### 6.8 Anagrafe BDA

- Il codice aziendale è un campo opzionale dell'apiario.
- Validazione formato (verifica futura, per ora solo lunghezza/pattern base).
- Reminder automatico a novembre come da §6.6.
- L'app **non** comunica con la BDA; tutto è solo locale.

## 7. Modello permessi (dettaglio)

### Logica

```
canRead(user, hive):
    return  isOwner(user, hive.apiary)
         OR hasApiaryAccess(user, hive.apiary, role IN ['reader','editor'])
         OR hasHiveAccess(user, hive, role IN ['reader','editor'])

canWrite(user, hive):
    return  isOwner(user, hive.apiary)
         OR hasApiaryAccess(user, hive.apiary, role = 'editor')
         OR hasHiveAccess(user, hive, role = 'editor')

canManagePermissions(user, apiary):
    return isOwner(user, apiary)
```

### Casi d'uso

- **Stefano possiede l'Apiario A**, condivide come editor con Marco. Marco vede tutte le arnie di A e può registrare ispezioni.
- **Stefano condivide solo l'Arnia 7** dell'Apiario A con Luca come reader. Luca vede solo l'Arnia 7 e i suoi metadati minimi (nome apiario, posizione), niente altro dell'Apiario A.
- **Stefano cancella la condivisione** con Marco. Marco perde l'accesso immediatamente.
- **Stefano viene aggiunto come editor** all'Apiario B di Anna. Vede A (che possiede) e B (a cui è invitato) nella sua home.

### Inviti

- Invito tramite email. Se l'invitato non è registrato, l'invito è in stato "pending" e si attiva alla registrazione con quella email.
- Invito revocabile in qualsiasi momento dall'owner.

## 8. Requisiti non funzionali

### 8.1 Performance
- Caricamento iniziale dell'app installata: < 2 s su 4G.
- Apertura form ispezione da home: < 1 s, anche offline.
- Salvataggio locale ispezione: istantaneo (< 200 ms percepiti).

### 8.2 Offline
- Tutte le letture su dati già sincronizzati: disponibili offline.
- Tutte le scritture: salvate localmente in coda outbox, push automatico al ripristino della rete.
- Conflict resolution: last-write-wins a livello di campo (è raro che due utenti modifichino la stessa ispezione contemporaneamente).
- Indicatore visibile dello stato di sincronizzazione (icona globale).

### 8.3 Sicurezza e privacy
- Autenticazione: email + magic link via Supabase Auth (Google OAuth in roadmap).
- Tutte le tabelle protette da Row Level Security (RLS).
- Foto/video soggetti alle stesse policy della risorsa associata.
- Backup giornalieri (forniti da Supabase su piano a pagamento).
- Nessun dato personale di terzi raccolto (solo email degli utenti registrati).

### 8.4 Accessibilità
- Contrast ratio minimo 4.5:1 per tutto il testo.
- Touch target ≥ 44×44pt.
- Tema scuro disponibile.
- Funzionamento corretto con screen reader sui flussi critici (post-MVP).

### 8.5 Internazionalizzazione
- v1: solo italiano.
- v2 in roadmap: inglese.
- Strutturare i testi in file di traduzione fin da subito.

## 9. Stack tecnologico (riassunto, dettagli in altri doc)

- **Frontend**: React + Vite + TypeScript + Tailwind, PWA con vite-plugin-pwa.
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime).
- **Stato lato client**: TanStack Query + IndexedDB (Dexie) per la cache offline.
- **Hosting frontend**: Cloudflare Pages o Vercel.
- **CI/CD**: GitHub Actions.

## 10. Fuori scope per la v1

- Gestione vendite, fatture, lotti di confezionamento miele.
- Generazione registro trattamenti formattato per ASL.
- Comunicazione automatica con BDA o sistemi pubblici.
- Ripartizione produzione per singola arnia.
- Confronti multi-stagione e analisi avanzate.
- Modalità multilingua.
- App nativa (iOS/Android store).
- Integrazione con bilance elettroniche o sensori IoT in arnia.
- Gestione finanziaria (costi/ricavi).

## 11. Decisioni aperte (da risolvere prima dello sviluppo)

1. **Nome dell'app** → Apidiario.
2. **Identità visiva**: palette definitiva, font, logo. Da definire nel DESIGN.md.
3. **Ripartizione produzione per arnia**: fuori scope per v1
4. **Audio dettato**: solo salvataggio file audio.
5. **Cancellazione account**: flusso e tempistiche di rimozione dati (per GDPR).

## 12. Glossario

- **Arnia**: contenitore che ospita la famiglia di api.
- **Telaino (telaio)**: cornice di legno con foglio cereo dove le api costruiscono il favo. Un'arnia Dadant-Blatt standard ha 10 telaini nel nido.
- **Nido**: corpo principale dell'arnia, dove vive la famiglia e c'è la covata.
- **Melario**: scomparto sopra il nido che si aggiunge in stagione per la raccolta del miele destinato al prelievo umano.
- **Covata**: insieme di uova, larve e cellette opercolate (con larve in metamorfosi) deposte dalla regina.
- **Cella reale**: cella speciale, allungata, dove viene allevata una nuova regina. Tipi: di sciamatura (segno di sciamatura imminente), di sostituzione (regina vecchia/malata), di scorta o di emergenza (regina morta).
- **Importazione di polline**: arrivo di polline da parte delle bottinatrici, visibile all'ingresso dell'arnia. Indica covata in atto.
- **Sciamatura**: divisione spontanea della famiglia con la vecchia regina che parte con metà della popolazione.
- **Smielatura**: estrazione del miele dai favi del melario.
- **BDA**: Banca Dati Apistica, sistema italiano di registrazione obbligatoria degli apiari.
- **Codice aziendale**: identificativo assegnato dalla ASL all'azienda apistica.
- **Varroa**: acaro parassita (Varroa destructor), principale problema sanitario degli alveari.

---

*Fine documento. Prossimi artefatti Fase 0: `SCHEMA.sql` e `DESIGN.md`.*