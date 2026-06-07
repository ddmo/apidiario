# Suggerimenti e Avvisi di Apidiario

## Dove compaiono

- **🏠 Home** — avvisi da query dedicate (trattamenti, meteo, fioriture, ispezioni molto in ritardo). Indicati prima delle arnie.
- **📋 Pagina apiario** (`/apiari/:id`) — icona termometro sulle arnie in febbre sciamatoria. Pulsante lampadina in alto a destra col numero di suggerimenti critici.
- **💡 Pagina suggerimenti** (`/apiari/:id/suggerimenti`) — tutte le regole sottostanti, per ogni arnia dell'apiario.

## Legenda

| Icona                        | Significato                   |
|------------------------------|-------------------------------|
| 🔵 Info                      | Nessuna urgenza               |
| 🟡 Avviso                    | Da controllare a breve        |
| 🔴 Critico                   | Intervento urgente            |

Ogni suggerimento ha una **scadenza** (giorni entro cui agire) oppure nessuna scadenza se puramente informativo.

---

## Regine e Covata

### Regina non vista — 🟡 Avviso
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se nell'ultima ispezione hai indicato di non aver visto la regina ("non vista").

**Suggerimento:** ti invita a cercare la regina alla prossima visita.

**Come si attiva:** regina = "non vista" nell'ultima ispezione.

---

### Sospetto orfanaggio — 🔴 Critico (scadenza: 3 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se la regina non è stata vista e non ci sono uova fresche nella covata.

**Suggerimento:** potresti essere in orfanaggio. Verifica con urgenza.

**Come si attiva:** regna non vista + uova assenti nell'ultima ispezione.

---

### Possibile fallimento regina — 🟡 Avviso (scadenza: 7 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se c'è covata opercolata (chiusa) ma nessun uovo o larva fresca.

**Suggerimento:** la regina potrebbe essere morta o non più fertile.

**Come si attiva:** covata opercolata presente, uova e larve assenti nell'ultima ispezione.

---

### Regina presente (uova fresche) — 🔵 Info
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se la regina non è stata avvistata ma ci sono uova fresche.

**Suggerimento:** rassicurazione: la regina c'è e sta ovificando.

**Come si attiva:** regina "non vista" + uova presenti nell'ultima ispezione.

---

## Sciamatura

### Celle reali — ricontrollo urgente — 🔴 Critico (scadenza: 7 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se nell'ultima ispezione hai segnalato celle reali (tolte o lasciate) e sono passati almeno 5 giorni.

**Suggerimento:** ricontrolla la situazione, potrebbero essere pronte a sciamare.

**Come si attiva:** celle reali segnalate + ultima ispezione fatta da almeno 5 giorni.

---

### Febbre sciamatoria — 🔵 Info / 🟡 Avviso / 🔴 Critico (scadenza: 7 giorni se avviso o critico)
**Dove compare:** 💡 pagina suggerimenti + 📋 icona termometro sulla card dell'arnia nella pagina apiario

**Cosa controlla:** quante e che tipo di celle reali hai tolto, più altri fattori di rischio.

**Suggerimento:** indicatore graduato del rischio sciamatura.

**Calcolo del punteggio:**

| Fattore | Punti |
|---------|-------|
| Celle reali tolte (base) | 2 |
| Celle reali opercolate (avanzate) | +2 |
| Celle con larva | +1 |
| Popolazione forte | +1 |
| Periodo di picco sciamatura (aprile-maggio) | +1 |
| Importazione polline attiva | +1 |
| Razza Carnica | +1 |
| Celle tolte in 2+ delle ultime 3 ispezioni | +2 |

**Soglie:**
- 2-3 punti: 🔵 febbre bassa
- 4-5 punti: 🟡 febbre in aumento
- 6+ punti: 🔴 febbre alta

**Come si attiva:** almeno una cella reale tolta nell'ultima ispezione.

---

### Razza tendente a sciamatura — 🔵 Info
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se l'arnia è di razza Carnica ed è primavera.

**Suggerimento:** la Carnica in primavera tende a sciamare, ispezioni più frequenti.

**Come si attiva:** razza Carnica + stagione primaverile.

---

## Salute e Patologie

### Patologia da monitorare — 🟡 Avviso (scadenza: 7 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se hai segnalato una o più patologie nell'ultima ispezione.

**Suggerimento:** monitora l'evoluzione della patologia.

**Come si attiva:** patologie (varroa, peste americana/europea, covata calcificata, nosema, virus, altro) segnalate nell'ultima ispezione.

---

### Soglia varroa superata — 🟡 Avviso (scadenza: 14 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se il conteggio varroa supera la soglia per il metodo usato.

**Soglie per metodo:**
| Metodo | Soglia |
|--------|--------|
| Caduta naturale | 3 |
| Lavaggio alcol | 2 |
| Zucchero a velo | 3 |
| Altro | 3 |

**Suggerimento:** pianifica un trattamento.

**Come si attiva:** conteggio varroa superiore alla soglia nell'ultima ispezione.

---

### Conteggio varroa raccomandato — 🟡 Avviso (scadenza: 14 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se siamo in estate (luglio-settembre) e nessun conteggio varroa registrato di recente.

**Suggerimento:** fai un conteggio per decidere se trattare.

**Come si attiva:** periodo luglio-settembre + nessun conteggio varroa nelle ultime ispezioni.

---

## Popolazione e Scorte

### Popolazione debole — 🟡 Avviso (scadenza: 7 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se hai indicato popolazione "debole" nell'ultima ispezione.

**Suggerimento:** valuta nutrizione di sostegno o unione con altra famiglia.

**Come si attiva:** popolazione = "debole" nell'ultima ispezione.

---

### Scorte invernali insufficienti — 🟡 Avviso (scadenza: 14 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se siamo in autunno (settembre-novembre) e hai ≤2 telaini di miele.

**Suggerimento:** integra con alimentazione zuccherina.

**Come si attiva:** periodo settembre-novembre + ≤2 telaini di miele nell'ultima ispezione.

---

### Poco polline in primavera — 🔵 Info
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se siamo in primavera (febbraio-aprile) e hai ≤1 telaino di polline.

**Suggerimento:** il polline è essenziale per la covata, valuta candito proteico.

**Come si attiva:** periodo febbraio-aprile + ≤1 telaino di polline nell'ultima ispezione.

---

## Attrezzatura

### Verifica trappola polline — 🔵 Info
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se la trappola polline è installata.

**Suggerimento:** controlla se è piena e svuotala.

**Come si attiva:** trappola polline installata (dati arnia).

---

### Verifica rete propoli — 🔵 Info
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se la rete propoli è installata.

**Suggerimento:** verifica se raccoglierla e sostituirla.

**Come si attiva:** rete propoli installata (dati arnia).

---

## Raccolto

### Controllo melari — 🟡 Avviso (scadenza: 7 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se l'arnia ha melari installati.

**Suggerimento:** verifica stato melari, valuta smielatura.

**Come si attiva:** numero melari > 0 (dati arnia).

---

## Calendario

### Ispezione in ritardo — 🟡 Avviso (scadenza: 7 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se sono passati >14 giorni dall'ultima ispezione in stagione attiva (marzo-settembre).

**Suggerimento:** in stagione ispeziona ogni 14 giorni circa.

**Come si attiva:** ultima ispezione >14 giorni fa + periodo marzo-settembre.

---

### Prima ispezione consigliata — 🔵 Info (scadenza: 7 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se l'arnia non è mai stata ispezionata ma ha data installazione.

**Suggerimento:** pianifica la prima ispezione.

**Come si attiva:** arnia installata, mai ispezionata.

---

### Promemoria in scadenza / in ritardo — 🔵 Info / 🟡 Avviso
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** promemoria attivi (globali, per apiario, per arnia).

**Suggerimento:** mostra il promemoria più vicino.

**Gravità:**
- 🔵 Info: non ancora scaduto
- 🟡 Avviso: scaduto

**Come si attiva:** promemoria attivo associato all'arnia/apiario o globale.

---

## Stagionali

### Verifica nuova regina (dopo sciamatura) — 🟡 Avviso (scadenza: 7 giorni)
**Dove compare:** 💡 pagina suggerimenti

**Cosa controlla:** se l'arnia è "sciamata" da 21-35 giorni.

**Suggerimento:** verifica presenza nuova regina ovificante.

**Come si attiva:** stato arnia = "sciamata" + tra 21 e 35 giorni dall'aggiornamento.

---

## Avvisi della Home (non dal motore suggerimenti)

Questi avvisi compaiono solo in **🏠 Home** e sono generati da query separate:

### Trattamento attivo — 🟡 Avviso
**Cosa controlla:** trattamenti in corso che bloccano i melari.

**Suggerimento:** mostra prodotto, apiario e data fine.

---

### Meteo avverso — 🟡 Avviso
**Cosa controlla:** previsioni pioggia >5mm o vento >40km/h per oggi o domani.

**Suggerimento:** sconsiglia visite in apiario.

---

### Ispezione molto in ritardo — 🟡 / 🔴 Avviso
**Cosa controlla:** arnie non ispezionate da >35 giorni (giallo) o >60 giorni (rosso). Soglia diversa dal suggerimento "Ispezione in ritardo" (che scatta a 14 giorni).

**Suggerimento:** programma un'ispezione.

---

### Fioritura attiva / in arrivo — 🟡 Avviso
**Cosa controlla:** specie mellifere configurate per l'apiario, in fioritura o in arrivo nei prossimi 15 giorni.

**Suggerimento:** segnala inizio/piena fioritura e giorni rimanenti.
