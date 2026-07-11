# Product

## Register

product

## Users

- **Apicoltore proprietario**: possiede e gestisce uno o più apiari, traccia salute, trattamenti e produzioni.
- **Co-apicoltore collaboratore**: opera su apiari di altri (socio, familiare, aiutante stagionale) con permessi editor.
- **Osservatore**: accesso in sola lettura (corso di apicoltura, mentore, veterinario).

Contesto d'uso primario: **sul campo, su smartphone, durante le ispezioni alle arnie** — spesso con una mano sola, con i guanti, sotto il sole diretto. Un uso secondario da scrivania (tablet/desktop) copre pianificazione, revisione dati e gestione di più apiari insieme, senza compromettere l'esperienza mobile primaria.

## Product Purpose

Gestire apiari e arnie in modo semplice, veloce e collaborativo: registrare ispezioni, trattamenti sanitari, raccolti e promemoria; vedere lo stato di ogni arnia a colpo d'occhio; condividere apiari con altri apicoltori con ruoli (owner/editor/reader). Successo = un'ispezione standard completata in **massimo 60 secondi**, e un'app che scala da 10 a qualche centinaio di arnie senza ridisegno.

## Brand Personality

Calda, pratica, essenziale. Un diario da campo, non una piattaforma gestionale: visivo prima che testuale (icone e colori per lo stato dell'arnia, testo libero solo dove inevitabile), tono diretto e senza fronzoli, coerente con la palette honey/wood/cream già in DESIGN.md.

## Anti-references

- **SaaS enterprise freddo**: niente dashboard corporate blu/grigie, niente gergo da "piattaforma" o "soluzione".
- **Minimalismo estremo stile Notion/Linear**: niente bianco-e-nero spoglio — l'app deve restare calda e naturale, mai fredda-minimal.
- Niente gamification/badge/streak: non è un social, è uno strumento di lavoro.

## Design Principles

1. **Mobile-first reale.** Ogni schermata funziona con una mano sola, con guanti, sotto il sole. Niente tabelle dense, niente form lunghi.
2. **Visivo prima che testuale.** Stato delle arnie comunicato con icone e colori; testo libero solo dove inevitabile (note, dettatura vocale).
3. **Pochi tap, default intelligenti.** I form precompilano dai dati dell'ultima ispezione; l'utente conferma o corregge invece di ricompilare da zero.
4. **Il desktop estende, non sostituisce.** Il layout tablet/desktop serve pianificazione e revisione dati da scrivania; il flusso mobile sul campo resta il caso d'uso primario e non va mai degradato per fare spazio al desktop.
5. **Permessi additivi e collaborativi.** Owner/editor/reader per apiario; la condivisione è un caso d'uso di prima classe, non un ripensamento.

## Accessibility & Inclusion

Standard "outdoor": contrasto alto per leggibilità sotto il sole diretto, target di tocco ≥44px pensati per uso con guanti/una mano. Nessun vincolo WCAG formale dichiarato al momento; mantenere comunque le buone pratiche di base (contrasto testo ≥4.5:1, stati di focus visibili).
