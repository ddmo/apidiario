#!/usr/bin/env node
// Genera guida PDF Apidiario — basata su analisi del codice
import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'guide-output')
const SCR = resolve(OUT, 'screenshots')
if (!existsSync(OUT)) mkdirSync(OUT)
if (!existsSync(SCR)) mkdirSync(SCR)

const TEMP = resolve(__dirname, '..', 'temp')
const srcFiles = [
  'home_page.jpeg', 'condivisione_apiario.jpeg', 'dettagli_apiario.jpeg',
  'elenco_arnie.jpeg', 'elenco_visite.jpeg', 'visita_express.jpeg',
  'visita_standard.jpeg', 'visite_multiple.jpeg', 'nuovo_trattamento.jpeg',
  'previsione_fioriture.jpeg', 'promemoria.jpeg', 'registrazione_raccolti.jpeg',
  'pagina_piu.jpeg', 'calendario.jpeg',
]
for (const f of srcFiles) {
  const src = resolve(TEMP, f)
  if (!existsSync(src)) console.warn('MISSING: ' + f)
  else copyFileSync(src, resolve(SCR, f))
}

const img = (name) => `screenshots/${name}`

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Guida Apidiario</title>
<style>
  @page { margin: 2cm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #2c2417; background: #faf8f5; line-height: 1.6; margin: 0; padding: 0;
  }
  .cover {
    page-break-after: always; height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
    background: linear-gradient(160deg, #f5e6d3 0%, #fef7e0 40%, #faf8f5 100%);
    padding: 2rem; position: relative; overflow: hidden;
  }
  .cover::before {
    content: ''; position: absolute; top: -30%; right: -20%;
    width: 70%; height: 70%;
    background: radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%);
    border-radius: 50%;
  }
  .cover h1 { font-size: 3.2rem; font-weight: 700; color: #8B5E3C; margin: 0; letter-spacing: -1px; position: relative; z-index: 1; }
  .cover .bee { font-size: 4rem; margin-bottom: 1rem; position: relative; z-index: 1; }
  .cover .sub { font-size: 1.3rem; color: #6b5b4e; margin-top: 0.5rem; position: relative; z-index: 1; }
  .cover .tagline { font-size: 0.95rem; color: #8f7e6e; margin-top: 2rem; max-width: 420px; line-height: 1.5; position: relative; z-index: 1; }
  .cover .version { margin-top: 3rem; font-size: 0.8rem; color: #b8a89a; position: relative; z-index: 1; }

  .toc { page-break-after: always; padding: 3rem 3rem 2rem; background: #fff; }
  .toc h2 { font-size: 1.6rem; color: #8B5E3C; border-bottom: 2px solid #e8d5c0; padding-bottom: 0.6rem; margin: 0 0 1.5rem; }
  .toc ul { columns: 2; column-gap: 2rem; padding: 0; list-style: none; margin: 0; }
  .toc li { margin-bottom: 0.6rem; page-break-inside: avoid; padding: 0.3rem 0; }
  .toc a { color: #5a3e2b; text-decoration: none; font-weight: 500; display: flex; align-items: baseline; gap: 0.5rem; }
  .toc a:hover { color: #8B5E3C; }
  .toc .num { color: #BA7517; font-weight: 700; font-size: 0.85rem; min-width: 1.8rem; }

  .chapter { page-break-after: always; background: #fff; padding: 2.5rem 3rem; }
  .ch-hdr { margin-bottom: 1.5rem; border-bottom: 2px solid #e8d5c0; padding-bottom: 0.8rem; }
  .ch-hdr .num { font-size: 0.8rem; font-weight: 600; color: #BA7517; text-transform: uppercase; letter-spacing: 1px; }
  .ch-hdr h2 { font-size: 1.6rem; color: #8B5E3C; margin: 0.2rem 0 0; }
  .ch-hdr p { color: #6b5b4e; margin: 0.4rem 0 0; font-size: 0.95rem; }

  .sec { margin-bottom: 2rem; }
  .sec h3 { font-size: 1.1rem; color: #5a3e2b; margin: 1.2rem 0 0.5rem; }
  .sec h4 { font-size: 0.95rem; color: #6b5b4e; margin: 0.8rem 0 0.3rem; }
  .sec .badge { display: inline-block; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.15rem 0.5rem; border-radius: 4px; vertical-align: middle; }
  .b-warn { background: #fef3c7; color: #92400e; }
  .b-info { background: #e0f2fe; color: #075985; }
  .b-tip  { background: #dcfce7; color: #166534; }
  .b-nav { background: #f5e6d3; color: #75503b; }
  .sec p { color: #3a3025; margin: 0.4rem 0; font-size: 0.92rem; }
  .sec ul { margin: 0.3rem 0 0.5rem; padding-left: 1.2rem; }
  .sec li { font-size: 0.9rem; color: #3a3025; margin-bottom: 0.2rem; }
  .sec strong { color: #5a3e2b; }

  .shot { margin: 0.8rem 0; text-align: center; page-break-inside: avoid; }
  .shot img { max-width: 55%; height: auto; border: 1px solid #e8d5c0; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .shot.wide img { max-width: 70%; }
  .shot.narrow img { max-width: 40%; }

  .nav-pill {
    display: inline-block;
    background: #fff;
    border: 1px solid #e8d5c0;
    border-radius: 20px;
    padding: 0.2rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: #5a3e2b;
    margin: 0.15rem;
  }
  .nav-pill .ico { margin-right: 0.25rem; }

  .steps { background: #faf6f0; border-left: 3px solid #BA7517; border-radius: 0 8px 8px 0; padding: 0.8rem 1.2rem; margin: 0.6rem 0; page-break-inside: avoid; }
  .steps h4 { font-size: 0.85rem; color: #8B5E3C; margin: 0 0 0.3rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .steps ol { margin: 0; padding-left: 1.2rem; }
  .steps li { font-size: 0.88rem; color: #3a3025; margin-bottom: 0.15rem; }
  .steps li strong { color: #5a3e2b; }

  .tip { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.8rem 1rem; margin: 0.6rem 0; font-size: 0.88rem; color: #166534; page-break-inside: avoid; }
  .warn { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 0.8rem 1rem; margin: 0.6rem 0; font-size: 0.88rem; color: #92400e; page-break-inside: avoid; }
  .flow { background: #faf8f5; border: 1px solid #e8d5c0; border-radius: 8px; padding: 0.6rem 1rem; margin: 0.6rem 0; font-size: 0.85rem; page-break-inside: avoid; }
  .flow code { background: #f5e6d3; padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.82rem; }

  .footer { text-align: center; padding: 3rem 2rem 2rem; color: #b8a89a; font-size: 0.8rem; }

  @media print {
    body { background: #fff; }
    .chapter { padding: 2rem 2.5rem; }
    .shot img { max-width: 50%; }
  }
</style>
</head>
<body>

<div class="cover">
  <div class="bee">🐝</div>
  <h1>Apidiario</h1>
  <p class="sub">Guida all'uso della webapp</p>
  <p class="tagline">Gestisci apiari, monitora arnie, registra visite e pianifica trattamenti dal tuo telefono o computer.</p>
  <p class="version">${new Date().toISOString().slice(0, 10).replace(/-/g, '/')}</p>
</div>

<div class="toc">
  <h2>Indice</h2>
  <ul>
    <li><a href="#c1"><span class="num">01</span> Homepage — Panoramica</a></li>
    <li><a href="#c2"><span class="num">02</span> Navigazione e Barra Inferiore</a></li>
    <li><a href="#c3"><span class="num">03</span> Altro — Menu e Impostazioni</a></li>
    <li><a href="#c4"><span class="num">04</span> Gestione Apiari</a></li>
    <li><a href="#c5"><span class="num">05</span> Dettaglio Apiario e Arnie</a></li>
    <li><a href="#c6"><span class="num">06</span> Visite (Ispezioni)</a></li>
    <li><a href="#c7"><span class="num">07</span> Trattamenti</a></li>
    <li><a href="#c8"><span class="num">08</span> Promemoria</a></li>
    <li><a href="#c9"><span class="num">09</span> Raccolti</a></li>
    <li><a href="#c10"><span class="num">10</span> Calendario</a></li>
    <li><a href="#c11"><span class="num">11</span> Previsioni Fioritura</a></li>
    <li><a href="#c12"><span class="num">12</span> Suggerimenti</a></li>
    <li><a href="#c13"><span class="num">13</span> Statistiche</a></li>
    <li><a href="#c14"><span class="num">14</span> Riepilogo Gesture</a></li>
  </ul>
</div>

<!-- ════════════════════════ 01: HOMEPAGE ════════════════════════ -->
<div class="chapter" id="c1">
  <div class="ch-hdr"><div class="num">Capitolo 01</div><h2>Homepage — Panoramica</h2><p>Dashboard principale con apiari, avvisi, attività recenti e promemoria.</p></div>

  <div class="sec">
    <div class="shot narrow"><img src="${img('home_page.jpeg')}" alt="Homepage" /></div>

    <p>La homepage è il centro di controllo. Dall'alto verso il basso:</p>

    <h4>Avvisi automatici</h4>
    <p>Il sistema analizza i tuoi dati e mostra avvisi prioritari:</p>
    <ul>
      <li><strong>Trattamenti attivi</strong> — prodotti che bloccano i melari, con data fine</li>
      <li><strong>Fioriture in corso o in arrivo</strong> — basate su dati GDD temperatura e specie associate all'apiario</li>
      <li><strong>Meteo avverso</strong> — pioggia &gt;5mm o vento &gt;40 km/h previsti (oggi/domani)</li>
      <li><strong>Ispezioni in ritardo</strong> — arnie non ispezionate da oltre 35 giorni</li>
      <li><strong>Promemoria in scadenza</strong> — nei prossimi 15 giorni</li>
    </ul>
    <p>Ogni avviso ha un pulsante <strong>X</strong> per nasconderlo (persiste per la sessione). Tocca un avviso per navigare alla pagina correlata.</p>

    <h4>Promemoria in scadenza</h4>
    <p>Se ci sono promemoria nei prossimi 15 giorni, appaiono in una sezione dedicata. Se ce n'è uno solo, viene mostrata una riga con titolo e data. Se più di uno, un box riepilogativo con il conteggio. Tocca per andare alla pagina <strong>Promemoria</strong>.</p>

    <h4>I tuoi apiari</h4>
    <p>Elenco degli apiari come card. Ogni card mostra: <strong>nome</strong>, <strong>numero arnie</strong> (icona esagono), <strong>ultima attività</strong> (data relativa), icona meteo con temperatura, ed eventuale icona trattamento attivo. Tocca una card per entrare nel dettaglio dell'apiario.</p>
    <p>Se non ci sono apiari, viene mostrato un messaggio "Nessun apiario" con un pulsante per crearne uno.</p>

    <h4>Attività recenti da altri</h4>
    <p>Se l'apiario è condiviso, vedi le attività degli altri utenti raggruppate per autore: visite (toccabili per aprire il dettaglio) e trattamenti (toccabili per andare alla pagina Trattamenti).</p>
  </div>
</div>

<!-- ════════════════════════ 02: NAVIGAZIONE ════════════════════════ -->
<div class="chapter" id="c2">
  <div class="ch-hdr"><div class="num">Capitolo 02</div><h2>Navigazione e Barra Inferiore</h2><p>Come spostarsi tra le sezioni dell'app.</p></div>

  <div class="sec">
    <p>La barra di navigazione inferiore è fissa in basso, con padding adattato per la safe area dei dispositivi iOS. Contiene 5 voci:</p>

    <p><span class="nav-pill"><strong>1</strong> 🏠 Home</span>
    <span class="nav-pill"><strong>2</strong> 📅 Calendario</span>
    <span class="nav-pill"><strong>3</strong> ✅ Visita</span>
    <span class="nav-pill"><strong>4</strong> 💉 Trattamenti</span>
    <span class="nav-pill"><strong>5</strong> ⋯ Altro</span></p>

    <p>La terza voce <strong>Visita</strong> è speciale: non è un link ma un <strong>pulsante</strong> che apre un foglio di selezione arnie <em>(Hive Picker Sheet)</em>. Da lì puoi scegliere una o più arnie e avviare un'ispezione:</p>
    <ul>
      <li><strong>1 arnia selezionata</strong> → avvia ispezione singola</li>
      <li><strong>2+ arnie selezionate</strong> → avvia ispezione batch (multipla)</li>
      <li>Se non ci sono arnie, appare il messaggio: "Nessuna arnia attiva trovata. Crea prima un apiario e un'arnia."</li>
    </ul>

    <p>In tutte le pagine di dettaglio trovi il pulsante <strong>Indietro</strong> (freccia in alto a sinistra) che torna alla pagina precedente mantenendo lo stato.</p>
  </div>
</div>

<!-- ════════════════════════ 03: ALTRO ════════════════════════ -->
<div class="chapter" id="c3">
  <div class="ch-hdr"><div class="num">Capitolo 03</div><h2>Altro — Menu e Impostazioni</h2><p>Hub di navigazione secondaria e impostazioni profilo.</p></div>

  <div class="sec">
    <div class="shot narrow"><img src="${img('pagina_piu.jpeg')}" alt="Pagina Altro" /></div>

    <p>La pagina <strong>Altro</strong> (quinta icona della barra di navigazione) è il menu principale dell'app. Contiene:</p>

    <h4>Informazioni utente</h4>
    <p>In cima mostra il nome visualizzato (o l'email) dell'utente autenticato.</p>

    <h4>Voci di menu (link)</h4>
    <ul>
      <li><strong>Nuovo apiario</strong> → apre il form di creazione di un nuovo apiario</li>
      <li><strong>Previsioni fioriture</strong> → apre la pagina delle previsioni di fioritura GDD</li>
      <li><strong>Promemoria</strong> → apre la lista dei promemoria</li>
      <li><strong>Raccolti</strong> → apre la pagina di gestione raccolti</li>
      <li><strong>Statistiche</strong> → apre la dashboard con i numeri dell'attività</li>
    </ul>
    <p>Se sei amministratore, compaiono anche <strong>Gestione utenti</strong> e <strong>Attività</strong>.</p>

    <h4>Impostazioni</h4>
    <ul>
      <li><strong>Tema</strong> — selettore Chiaro / Sistema / Scuro</li>
      <li><strong>Notifiche push</strong> — toggle per ricevere notifiche quando qualcuno aggiunge un'ispezione a un apiario condiviso</li>
      <li><strong>Esci</strong> — logout, reindirizza alla pagina di login</li>
    </ul>

    <h4>Footer</h4>
    <p>Mostra la <strong>versione</strong> dell'app (es. v0.11+abc1234) e la data di <strong>ultimo aggiornamento dati</strong>.</p>
  </div>
</div>

<!-- ════════════════════════ 04: APIARI ════════════════════════ -->
<div class="chapter" id="c4">
  <div class="ch-hdr"><div class="num">Capitolo 04</div><h2>Gestione Apiari</h2><p>Creare, modificare e condividere gli apiari.</p></div>

  <div class="sec">
    <h3>Nuovo Apiario</h3>
    <p>Dalla pagina <strong>Altro</strong> → tocca <strong>"Nuovo apiario"</strong>. Si apre il form con:</p>
    <ul>
      <li><strong>Nome</strong> (obbligatorio) — es. "Apiario Val di Mello"</li>
      <li>Località — indirizzo o località descrittiva</li>
      <li>Coordinate GPS — latitudine e longitudine (servono per meteo e previsioni fioritura)</li>
      <li>Note — informazioni aggiuntive</li>
    </ul>
    <p>Dopo il salvataggio, vieni reindirizzato alla homepage con il nuovo apiario visibile.</p>
  </div>

  <div class="sec">
    <h3>Azioni rapide: Swipe</h3>
    <div class="shot narrow"><img src="${img('condivisione_apiario.jpeg')}" alt="Condivisione apiario" /></div>
    <p>Scorri verso sinistra su una card apiario in homepage per rivelare <strong>3 pulsanti</strong> (solo se sei il proprietario):</p>
    <ul>
      <li><span style="background:var(--color-honey-400,#D4A043);color:#fff;padding:0.1rem 0.6rem;border-radius:4px;font-size:0.75rem;">Condividi</span> — invita altri utenti via email, con permessi di lettura o scrittura</li>
      <li><span style="background:var(--color-wood-400,#A08060);color:#fff;padding:0.1rem 0.6rem;border-radius:4px;font-size:0.75rem;">Modifica</span> — apre il form di modifica apiario</li>
      <li><span style="background:var(--color-danger-500,#C0392B);color:#fff;padding:0.1rem 0.6rem;border-radius:4px;font-size:0.75rem;">Elimina</span> — conferma tramite foglio in basso, cancella apiario e arnie</li>
    </ul>
  </div>

  <div class="sec">
    <h3>Modifica e Foto</h3>
    <p>Dalla modifica apiario puoi cambiare nome, località, coordinate, note e aggiungere una <strong>foto principale</strong>. La foto viene visualizzata nella card in homepage e nella pagina di dettaglio. Puoi cambiarla o eliminarla in qualsiasi momento.</p>
  </div>
</div>

<!-- ════════════════════════ 05: DETTAGLIO APIARIO ════════════════════════ -->
<div class="chapter" id="c5">
  <div class="ch-hdr"><div class="num">Capitolo 05</div><h2>Dettaglio Apiario e Arnie</h2><p>Le arnie, le azioni rapide e le informazioni dell'apiario.</p></div>

  <div class="sec">
    <div class="shot narrow"><img src="${img('dettagli_apiario.jpeg')}" alt="Dettaglio apiario" /></div>

    <h4>Header</h4>
    <p>Dall'alto: <strong>Indietro</strong> (torna alla homepage), nome apiario, e a destra:</p>
    <ul>
      <li><strong>Toggle vista</strong> — icona LayoutList/PanelLeft, passa tra vista schematica e vista compatta delle card arnia</li>
      <li><strong>Meteo</strong> — icona CloudSun (solo se l'apiario ha coordinate), apre le previsioni meteo</li>
      <li><strong>Suggerimenti</strong> — icona Lightbulb con badge rosso se ci sono suggerimenti critici, apre la pagina suggerimenti</li>
    </ul>

    <h4>Elenco Arnie</h4>
    <p>Ogni arnia è una card compatta con:</p>
    <ul>
      <li><strong>Identificatore</strong> — nome/codice (es. RM-001)</li>
      <li><strong>Melari</strong> — numero e disposizione</li>
      <li><strong>Ultima visita</strong> — data relativa dell'ultima ispezione</li>
      <li><strong>Accessori</strong> — nourisher, sciamatura</li>
      <li><strong>Pulsante Ispeziona</strong> — sulla destra, icona ClipboardCheck su sfondo oro, porta direttamente a una nuova ispezione</li>
    </ul>
    <p>In basso c'è il <strong>pulsante +</strong> con scritta "Aggiungi arnia" per creare una nuova arnia in questo apiario.</p>

    <h4>Elenco Arnie globale</h4>
    <p>Dalla barra di navigazione, la sezione <strong>Arnie</strong> (elenco completo) mostra tutte le arnie di tutti gli apiari. Accessibile dalla seconda voce della nav bar.</p>
    <div class="shot narrow"><img src="${img('elenco_arnie.jpeg')}" alt="Elenco arnie" /></div>

    <h4>Nuova Arnia</h4>
    <p>Dal dettaglio apiario, tocca <strong>"Aggiungi arnia"</strong>. Campi: identificatore (unico per apiario), tipo arnia, razza ape, data installazione, note origine, telaini nido e foto.</p>
  </div>
</div>

<!-- ════════════════════════ 06: VISITE ════════════════════════ -->
<div class="chapter" id="c6">
  <div class="ch-hdr"><div class="num">Capitolo 06</div><h2>Visite (Ispezioni)</h2><p>Registra le visite alle arnie in modalità Express o Standard.</p></div>

  <div class="sec">
    <h3>Elenco Visite</h3>
    <div class="shot narrow"><img src="${img('elenco_visite.jpeg')}" alt="Elenco visite" /></div>
    <p>Dalla pagina dettaglio apiario, tocca <strong>Visite</strong> su un'arnia per vedere la cronologia delle ispezioni. Ogni riga mostra: mese+giorno, autore, stato regina, popolazione, eventuali patologie (badge rosso) e note. Swipe a sinistra per eliminare una visita. Tocca una riga per vedere il dettaglio.</p>
    <p>Il pulsante <strong>+</strong> in alto avvia una nuova ispezione per quell'arnia.</p>
  </div>

  <div class="sec">
    <h3>Avvio Ispezione</h3>
    <p>Due modi per iniziare:</p>
    <ol>
      <li><strong>Pulsante Visita</strong> nella barra di navigazione (al centro) → seleziona l'arnia dal foglio che appare</li>
      <li><strong>Pulsante Ispeziona</strong> sulla card dell'arnia (nel dettaglio apiario o nell'elenco arnie)</li>
    </ol>

    <h3>Modalità Express <span class="badge b-info">Consigliata</span></h3>
    <div class="shot narrow"><img src="${img('visita_express.jpeg')}" alt="Visita express" /></div>
    <p>Ispezioni rapide con campi essenziali: <strong>regina</strong> (vista/non vista, celle reali), <strong>popolazione</strong> (debole/media/forte), <strong>covata</strong>, <strong>scorte</strong>, <strong>melari</strong> e <strong>patologie</strong> selezionabili.</p>

    <h3>Modalità Standard</h3>
    <div class="shot narrow"><img src="${img('visita_standard.jpeg')}" alt="Visita standard" /></div>
    <p>Per ispezioni complete. Aggiunge: conteggio <strong>telaini</strong>, <strong>celle reali</strong> (tipo e posizione), <strong>comportamento</strong> api, <strong>rimedi</strong> applicati, conteggio <strong>varroa</strong>, <strong>note</strong> e <strong>foto</strong>.</p>

    <h3>Ispezione Multipla (Batch)</h3>
    <div class="shot narrow"><img src="${img('visite_multiple.jpeg')}" alt="Visite multiple" /></div>
    <p>Seleziona più arnie dal foglio "Visita" per avviare un flusso batch in 3 passi:</p>
    <ol>
      <li><strong>Seleziona</strong> le arnie (minimo 2)</li>
      <li><strong>Compila</strong> il form base (Express o Standard) — i valori verranno applicati a tutte</li>
      <li><strong>Revisiona</strong> — personalizza ogni arnia singolarmente e salva</li>
    </ol>
    <p>Ogni ispezione batch riceve un <strong>batch_id</strong> comune per raggruppamento.</p>
  </div>
</div>

<!-- ════════════════════════ 07: TRATTAMENTI ════════════════════════ -->
<div class="chapter" id="c7">
  <div class="ch-hdr"><div class="num">Capitolo 07</div><h2>Trattamenti</h2><p>Registra e monitora i trattamenti sanitari sugli apiari.</p></div>

  <div class="sec">
    <p>La pagina <strong>Trattamenti</strong> (quarta icona nav bar) mostra tutti i trattamenti registrati. I trattamenti attivi hanno un bordo colorato. Ogni card è in un contenitore swipeabile.</p>

    <p><strong>Swipe a sinistra</strong> su un trattamento per rivelare:</p>
    <ul>
      <li><strong>Modifica</strong> — apre il form di modifica</li>
      <li><strong>Elimina</strong> — rimuove il trattamento</li>
    </ul>

    <h3>Nuovo Trattamento</h3>
    <div class="shot narrow"><img src="${img('nuovo_trattamento.jpeg')}" alt="Nuovo trattamento" /></div>
    <p>Dal pulsante <strong>+</strong> in basso. Campi:</p>
    <ul>
      <li><strong>Apiario</strong> — seleziona l'apiario interessato</li>
      <li><strong>Prodotto</strong> — nome del prodotto (es. Apivar, Acido Ossalico)</li>
      <li><strong>Date</strong> — inizio e fine trattamento</li>
      <li><strong>Blocca melari</strong> — se attivo, impedisce operazioni sui melari e genera un avviso in homepage</li>
    </ul>
    <div class="warn">⚠️ Trattamenti con "Blocca melari" attivo mostrano un avviso in homepage fino alla data di fine.</div>
  </div>
</div>

<!-- ════════════════════════ 08: PROMEMORIA ════════════════════════ -->
<div class="chapter" id="c8">
  <div class="ch-hdr"><div class="num">Capitolo 08</div><h2>Promemoria</h2><p>Attività programmate con scadenza e ricorrenza.</p></div>

  <div class="sec">
    <div class="shot narrow"><img src="${img('promemoria.jpeg')}" alt="Promemoria" /></div>

    <p>Accessibile da <strong>Altro → Promemoria</strong>. La pagina mostra i promemoria in sospeso ordinati per scadenza.</p>

    <p>Ogni card mostra:</p>
    <ul>
      <li><strong>Titolo</strong> del promemoria</li>
      <li><strong>Data scadenza</strong> — in alto a destra, formattata gg mese aaaa</li>
      <li><strong>Ambito</strong> — in alto a destra sotto la data: "Generale", nome Apiario o "Apiario - Arnia"</li>
      <li><strong>Ricorrenza</strong> — badge in basso se giornaliera/settimanale/mensile/annuale</li>
    </ul>
    <p>I promemoria <strong>scaduti</strong> hanno la data in rosso con icona AlertCircle.</p>

    <h3>Swipe a sinistra</h3>
    <ul>
      <li><strong>Completa</strong> — segna come fatto (sposta in sezione "Completati" in fondo, con testo barrato)</li>
      <li><strong>Elimina</strong> — con conferma tramite foglio in basso</li>
    </ul>

    <h3>Nuovo Promemoria</h3>
    <p>Dal pulsante <strong>+</strong>. Campi: titolo (obbligatorio), descrizione, data scadenza, ambito (Generale / Apiario / Arnia), ricorrenza. I promemoria in scadenza nei prossimi 15 giorni appaiono automaticamente in homepage.</p>
  </div>
</div>

<!-- ════════════════════════ 09: RACCOLTI ════════════════════════ -->
<div class="chapter" id="c9">
  <div class="ch-hdr"><div class="num">Capitolo 09</div><h2>Raccolti</h2><p>Registra e consulta la produzione di miele.</p></div>

  <div class="sec">
    <div class="shot narrow"><img src="${img('registrazione_raccolti.jpeg')}" alt="Raccolti" /></div>

    <p>Accessibile da <strong>Altro → Raccolti</strong>. La pagina mostra lo storico dei raccolti raggruppati per anno. Ogni anno mostra il <strong>totale kg</strong> come intestazione.</p>

    <p>Ogni card raccolto mostra: <strong>tipo di miele</strong> (Millefiori, Acacia, Castagno...), <strong>apiario</strong>, <strong>data</strong>, <strong>codice lotto</strong>, <strong>kg</strong>. Tocca una card per modificare il raccolto.</p>

    <p><strong>Swipe a sinistra</strong> su una card per rivelare il pulsante <strong>Elimina</strong>. La cancellazione avviene dallo swipe, non dalla pagina di modifica.</p>

    <p><strong>Nuovo raccolto</strong> (pulsante +): seleziona apiario, data, tipo miele, kg totali, umidità %, codice lotto e note.</p>
  </div>
</div>

<!-- ════════════════════════ 10: CALENDARIO ════════════════════════ -->
<div class="chapter" id="c10">
  <div class="ch-hdr"><div class="num">Capitolo 10</div><h2>Calendario</h2><p>Vista mensile di tutte le attività apistiche.</p></div>

  <div class="sec">
    <div class="shot narrow"><img src="${img('calendario.jpeg')}" alt="Calendario" /></div>

    <p>Accessibile dalla seconda voce della nav bar. Mostra in un'unica vista mensile:</p>
    <ul>
      <li><strong>Visite</strong> — giorni con ispezioni registrate</li>
      <li><strong>Trattamenti</strong> — periodi attivi (inizio/fine)</li>
      <li><strong>Raccolti</strong> e <strong>Promemoria</strong></li>
    </ul>
    <p>Giorni con attività evidenziati con pallini colorati. Tocca un giorno per vedere gli eventi sottostanti.</p>

    <p>Due viste:</p>
    <ul>
      <li><strong>Griglia</strong> — calendario classico, tocca un giorno per vedere gli eventi</li>
      <li><strong>Lista</strong> — tutti gli eventi del mese in ordine cronologico</li>
    </ul>

    <p>Ogni evento è un link: le visite portano al dettaglio ispezione, i trattamenti alla modifica.</p>
  </div>
</div>

<!-- ════════════════════════ 11: FIORITURA ════════════════════════ -->
<div class="chapter" id="c11">
  <div class="ch-hdr"><div class="num">Capitolo 11</div><h2>Previsioni Fioritura</h2><p>Calendario fioriture basato su GDD (Growing Degree Days).</p></div>

  <div class="sec">
    <div class="shot narrow"><img src="${img('previsione_fioriture.jpeg')}" alt="Previsioni fioritura" /></div>

    <p>Accessibile da <strong>Altro → Previsioni fioriture</strong>. Il sistema:</p>
    <ul>
      <li>Recupera le temperature storiche (Open-Meteo historical-forecast API)</li>
      <li>Calcola i <strong>GDD</strong> (gradi giorno di crescita) per la posizione dell'apiario</li>
      <li>Li confronta con le soglie di fioritura delle specie botaniche configurate</li>
    </ul>
    <p>Seleziona <strong>Apiario</strong> e <strong>Pianta</strong>, poi tocca "Previsione". I risultati mostrano:</p>
    <ul>
      <li>Fase attuale (Pre-fioritura / Inizio / Picco / Post-fioritura) con colore</li>
      <li>Barra di progresso GDD con traguardi Start / Peak / End</li>
      <li>Date previste per ogni fase</li>
      <li>Toggle <strong>"Usa osservazioni personali"</strong> per correggere le date con le tue osservazioni reali</li>
      <li>Pulsante <strong>"Registra osservazione fioritura"</strong> per inserire le date reali di inizio/fine</li>
    </ul>
    <p>Le fioriture in corso o in arrivo (nei prossimi 15 giorni) generano avvisi automatici nella homepage.</p>
    <div class="tip">💡 Per avere previsioni accurate, assicurati che i tuoi apiari abbiano le coordinate GPS impostate e le specie associate.</div>
  </div>
</div>

<!-- ════════════════════════ 12: SUGGERIMENTI ════════════════════════ -->
<div class="chapter" id="c12">
  <div class="ch-hdr"><div class="num">Capitolo 12</div><h2>Suggerimenti</h2><p>Analisi automatica delle azioni consigliate per apiario.</p></div>

  <div class="sec">
    <p>Accessibile dall'icona <strong>Lightbulb</strong> nell'header della pagina di dettaglio apiario. Il badge rosso mostra il numero di suggerimenti critici.</p>

    <p>Il sistema analizza i dati e propone, per ogni arnia:</p>
    <ul>
      <li><strong>Ispezioni in ritardo</strong> — se &gt; 35 giorni dall'ultima visita</li>
      <li><strong>Trattamenti imminenti</strong> — promemoria trattamento in scadenza per l'apiario</li>
      <li><strong>Promemoria pertinenti</strong> — promemoria associati all'apiario o alle sue arnie</li>
      <li><strong>Condizioni meteo</strong> — avvisi di maltempo imminente</li>
      <li><strong>Fioriture</strong> — specie in fioritura o in arrivo</li>
    </ul>
    <div class="tip">💡 Più dati registri (visite, trattamenti, promemoria), più i suggerimenti diventano pertinenti.</div>
  </div>
</div>

<!-- ════════════════════════ 13: STATISTICHE ════════════════════════ -->
<div class="chapter" id="c13">
  <div class="ch-hdr"><div class="num">Capitolo 13</div><h2>Statistiche</h2><p>Numeri chiave della stagione apistica.</p></div>

  <div class="sec">
    <p>Accessibile da <strong>Altro → Statistiche</strong>. La dashboard mostra:</p>

    <p><strong>Riga 1</strong> (card con accento miele):</p>
    <ul>
      <li>Apiari — totale apiari</li>
      <li>Arnie — totale arnie attive</li>
      <li>Ispezioni — totale visite registrate</li>
      <li>Trattamenti — totale trattamenti</li>
    </ul>

    <p><strong>Riga 2</strong>:</p>
    <ul>
      <li>Foto/video — numero di file multimediali nelle ispezioni</li>
      <li>Note vocali — numero di registrazioni audio</li>
      <li>Storage — spazio utilizzato e numero file, limite 20 MB per file</li>
    </ul>

    <p>Per gli <strong>amministratori</strong>: card aggiuntiva con il conteggio degli utenti registrati (tramite edge function).</p>
  </div>
</div>

<!-- ════════════════════════ 14: GESTURE ════════════════════════ -->
<div class="chapter" id="c14">
  <div class="ch-hdr"><div class="num">Capitolo 14</div><h2>Riepilogo Gesture</h2><p>Tutte le interazioni in un colpo d'occhio.</p></div>

  <div class="sec">
    <h3>Swipe Left <span class="badge b-warn">Principale</span></h3>
    <p>Trascina verso sinistra per rivelare pulsanti azione. Funziona su:</p>
    <ul>
      <li><strong>Card apiario</strong> (homepage) → Condividi / Modifica / Elimina</li>
      <li><strong>Card promemoria</strong> (lista promemoria) → Completa / Elimina</li>
      <li><strong>Card trattamento</strong> (lista trattamenti) → Modifica / Elimina</li>
      <li><strong>Card raccolto</strong> (lista raccolti) → Elimina</li>
      <li><strong>Riga visita</strong> (cronologia ispezioni) → Elimina</li>
    </ul>
    <div class="steps"><h4>Come eseguire lo swipe</h4><ol><li>Tocca e tieni sull'elemento</li><li>Trascina il dito verso sinistra</li><li>I pulsanti compaiono da destra</li><li>Tocca il pulsante desiderato</li><li>Per chiudere: tocca l'elemento o trascina a destra</li></ol></div>
  </div>

  <div class="sec">
    <h3>Tap</h3>
    <p>Apre apiari, seleziona opzioni, attiva pulsanti, compila campi. Usato in tutta l'app.</p>
  </div>

  <div class="sec">
    <h3>Back (Pulsante Indietro)</h3>
    <p>Freccia in alto a sinistra in tutte le pagine di dettaglio. Torna alla pagina precedente. I form con modifiche non salvate mostrano un foglio di conferma.</p>
  </div>

  <div class="sec">
    <h3>Struttura dei Form</h3>
    <p>Tutti i form seguono lo stesso schema:</p>
    <ul>
      <li><strong>Header fisso</strong> — titolo e pulsante Indietro</li>
      <li><strong>Corpo scrollabile</strong> — campi divisi per sezioni tematiche</li>
      <li><strong>Footer fisso</strong> — pulsante Salva sempre visibile in fondo</li>
    </ul>
  </div>

  <div class="sec">
    <h3>Pulsante Visita (Nav Bar)</h3>
    <p>Al centro della barra inferiore, evidenziato con cerchio color miele. Non è un link ma apre un foglio di selezione arnie. Da lì puoi scegliere ispezione singola o multipla.</p>
  </div>
</div>

<div class="footer">
  <p>Guida generata il ${new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <p>Apidiario</p>
</div>

</body>
</html>`

// Write HTML
const htmlPath = resolve(OUT, 'guida-apidiario.html')
writeFileSync(htmlPath, html)
console.log('HTML: ' + htmlPath)

// Generate PDF
console.log('PDF in corso...')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ locale: 'it-IT' })
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' })
const pdfPath = resolve(OUT, 'guida-apidiario.pdf')
await page.pdf({
  path: pdfPath,
  format: 'A4',
  margin: { top: '0cm', bottom: '0cm', left: '0cm', right: '0cm' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:7px;color:#b8a89a;text-align:center;width:100%;padding:5px 2cm 0;font-family:sans-serif;">Apidiario — Guida all\'uso</div>',
  footerTemplate: '<div style="font-size:7px;color:#b8a89a;text-align:center;width:100%;padding:0 2cm 5px;font-family:sans-serif;">Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></div>',
})
await browser.close()
console.log('PDF: ' + pdfPath)
