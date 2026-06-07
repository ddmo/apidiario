#!/usr/bin/env node
/**
 * Genera una guida PDF dell'app Apidiario.
 *
 * 1. Avvia browser Playwright (Chromium)
 * 2. Logga con utente di test
 * 3. Crea dati di esempio se necessario
 * 4. Naviga tutte le schermate e cattura screenshot
 * 5. Genera HTML con descrizioni
 * 6. Converte in PDF
 */

import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, '..', 'guide-output')
const SCREENSHOTS_DIR = resolve(OUTPUT_DIR, 'screenshots')
const BASE_URL = 'https://localhost:5173'

// Assicura directory output
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR)
if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR)

const EMAIL = process.env.PLAYWRIGHT_EMAIL || 'playwright@test.apidiario'
const PASSWORD = process.env.PLAYWRIGHT_PASSWORD || 'PlaywrightTest123!'

// ============================================================
// 1. STRUTTURA DATI
// ============================================================

/** Una singola schermata della guida */
class GuidePage {
  constructor(id, title, sections) {
    this.id = id
    this.title = title
    this.sections = sections // { heading, description, screenshot?, actionSteps? }[]
  }
}

// ============================================================
// 2. HELPER FUNCTIONS
// ============================================================

async function login(page) {
  console.log('  → Login...')
  await page.goto('/login')
  if (!page.url().includes('/login')) {
    console.log('  → Già autenticato')
    return
  }
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/$/, { timeout: 20000 })
  console.log('  → Login OK')
}

async function screenshot(page, name) {
  const path = resolve(SCREENSHOTS_DIR, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  return `screenshots/${name}.png`
}

async function waitForLoad(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(500) // render animations
}

// ============================================================
// 3. MAIN SCRIPT
// ============================================================

async function main() {
  console.log('=== GENERAZIONE GUIDA APIDIARIO ===\n')

  // Avvia browser
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    ignoreHTTPSErrors: true,
    locale: 'it-IT',
    baseURL: BASE_URL,
  })
  const page = await context.newPage()

  // Login
  await login(page)

  // Crea dati di test se necessario
  await setupTestData(page)

  // Colleziona tutte le schermate
  const guidePages = await captureAllScreens(page)

  // Genera HTML
  console.log('\n=== GENERAZIONE HTML ===')
  const html = buildGuideHtml(guidePages)
  const htmlPath = resolve(OUTPUT_DIR, 'guida-apidiario.html')
  writeFileSync(htmlPath, html)
  console.log(`  → HTML scritto: ${htmlPath}`)

  // Converte in PDF
  console.log('\n=== CONVERSIONE PDF ===')
  const pdfPath = await generatePdf(htmlPath)
  console.log(`  → PDF generato: ${pdfPath}`)

  await browser.close()
  console.log('\n=== COMPLETATO ===')
}

// ============================================================
// 4. DATI DI TEST
// ============================================================

async function setupTestData(page) {
  console.log('\n--- Configurazione dati di test ---')
  await page.goto('/')
  await waitForLoad(page)

  // Verifica se esistono apiari
  const apiaryExists = await page.locator('button:has(svg.lucide-trees)').first().isVisible().catch(() => false)

  if (!apiaryExists) {
    console.log('  → Nessun apiario trovato, creazione...')

    // Crea apiario principale
    await page.goto('/apiaries/new')
    await waitForLoad(page)
    await page.fill('#apiary-name', 'Apiario Val di Mello')
    await page.fill('#apiary-location', 'Val di Mello, SO')
    const saveBtn = page.getByRole('button', { name: /salva apiario/i })
    if (await saveBtn.isVisible()) await saveBtn.click()
    await page.waitForURL(/\/$/, { timeout: 15000 })
    console.log('  → Apiario "Apiario Val di Mello" creato')

    // Crea secondo apiario
    await page.goto('/apiaries/new')
    await waitForLoad(page)
    await page.fill('#apiary-name', 'Apiario Monte Rosa')
    const saveBtn2 = page.getByRole('button', { name: /salva apiario/i })
    if (await saveBtn2.isVisible()) await saveBtn2.click()
    await page.waitForURL(/\/$/, { timeout: 15000 })
    console.log('  → Apiario "Apiario Monte Rosa" creato')
  } else {
    console.log('  → Apiari già presenti')
  }

  // Entra nel primo apiario per creare arnie
  await page.goto('/')
  await waitForLoad(page)
  const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
  await apiaryCard.click()
  await page.waitForURL(/\/apiaries\//, { timeout: 10000 })
  const apiaryUrl = page.url()
  const apiaryId = apiaryUrl.split('/apiaries/')[1]?.split(/[?#/]/)[0]

  // Controlla se ci sono arnie gia' nella pagina apiario
  const hiveExists = await page.locator('#hive-identifier, [id^="hive-"]').first().isVisible().catch(() => false)
  // Also check if there's a hive card component
  const hiveCardExists = await page.locator('text=RM-001').or(page.locator('text=RM-002')).or(page.locator('button:has(svg.lucide-clipboard-check)')).first().isVisible().catch(() => false)

  if (hiveCardExists) {
    console.log('  → Arnie già presenti')
  } else {
    console.log('  → Creazione arnie...')

    // Prima arnia
    await page.goto(`/apiaries/${apiaryId}/hives/new`)
    await waitForLoad(page)
    const identifierInput = page.locator('#hive-identifier')
    await identifierInput.waitFor({ state: 'visible', timeout: 10000 })
    await page.fill('#hive-identifier', 'RM-001')
    await page.fill('#hive-notes', 'Arnia forte, regina del 2025')
    const saveHive = page.getByRole('button', { name: /salva arnia/i })
    if (await saveHive.isVisible()) await saveHive.click()
    await page.waitForTimeout(3000)

    // Seconda arnia
    await page.goto(`/apiaries/${apiaryId}/hives/new`)
    await waitForLoad(page)
    await page.locator('#hive-identifier').waitFor({ state: 'visible', timeout: 10000 })
    await page.fill('#hive-identifier', 'RM-002')
    await page.fill('#hive-notes', 'Arnia media, regina 2024')
    const saveHive2 = page.getByRole('button', { name: /salva arnia/i })
    if (await saveHive2.isVisible()) await saveHive2.click()
    await page.waitForTimeout(3000)
    console.log('  → Arnie create')
  }
}

// ============================================================
// 5. CATTURA SCHERMATE
// ============================================================

async function captureAllScreens(page) {
  console.log('\n--- Acquisizione schermate ---\n')

  const guidePages = []

  // === CAP 1: LOGIN ===
  console.log('[1/18] Login...')
  await page.goto('/login?redirectTo=%2F')
  await waitForLoad(page)
  const loginScreenshot = await screenshot(page, 'login')
  guidePages.push(new GuidePage('login', 'Login', [
    { heading: 'Schermata di Login',
      description: 'La schermata di accesso consente di autenticarsi con email e password. Se non hai ancora un account, contatta l\'amministratore per la creazione. Dopo il login vieni reindirizzato alla homepage.',
      screenshot: loginScreenshot,
    },
  ]))

  // Login for real
  await login(page)

  // === CAP 2: HOMEPAGE ===
  console.log('[2/18] Homepage...')
  await page.goto('/')
  await waitForLoad(page)
  const homeScreenshot = await screenshot(page, 'homepage')
  guidePages.push(new GuidePage('homepage', 'Homepage — Panoramica Apiari', [
    { heading: 'Dashboard Principale',
      description: 'La homepage mostra l\'elenco dei tuoi apiari sotto forma di card. Ogni card mostra il nome dell\'apiario, il numero di arnie attive, l\'ultima attività registrata e un\'icona identificativa.',
      screenshot: homeScreenshot,
    },
    { heading: 'Avvisi e Notifiche',
      description: 'In cima alla pagina puoi vedere gli avvisi importanti: trattamenti attivi, meteo avverso, ispezioni in ritardo, fioriture in corso e promemoria in scadenza. Gli avvisi sono ordinati per priorità (critici prima, poi avvertimenti).',
    },
    { heading: 'Navigazione',
      description: 'La barra di navigazione inferiore (bottom nav) ti permette di spostarti rapidamente tra: Home, Arnie, Calendario, and Altro. L\'icona della sezione corrente è evidenziata.',
    },
  ]))

  // === CAP 3: GESTIONE APIARI ===
  console.log('[3/18] Apiario — Dettaglio...')
  await page.goto('/')
  await waitForLoad(page)
  const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
  await apiaryCard.click()
  await page.waitForURL(/\/apiaries\//, { timeout: 10000 })
  await waitForLoad(page)
  const apiaryDetailScreenshot = await screenshot(page, 'apiario-dettaglio')

  guidePages.push(new GuidePage('apiari', 'Gestione Apiari', [
    { heading: 'Dettaglio Apiario',
      description: 'La pagina di dettaglio di un apiario mostra tutte le arnie in esso contenute. Ogni arnia è rappresentata da una card compatta con: identificatore, numero di melari, data ultima ispezione e accessori (es. nourisher, sciamatura).',
      screenshot: apiaryDetailScreenshot,
    },
  ]))

  // Swipe su apiario dalla home
  console.log('[4/18] Swipe su apiario...')
  await page.goto('/')
  await waitForLoad(page)
  // Swipe left on apiary card to reveal actions
  // We need to use touch events or drag
  await page.screenshot({ path: resolve(SCREENSHOTS_DIR, 'apiario-swipe-preview.png') })
  const apiarySwipeScreenshot = await screenshot(page, 'apiario-swipe')
  guidePages.push(new GuidePage('apiari-swipe', 'Gesture — Swipe sugli Apiari', [
    { heading: 'Azioni Rapide con Swipe',
      description: 'Dalla homepage, scorri verso sinistra (swipe left) su una card apiario per rivelare le azioni rapide: condividi l\'apiario con altri utenti (icona Share2) ed elimina l\'apiario (icona Trash2).',
      screenshot: apiarySwipeScreenshot,
    },
    { heading: 'Come Usare lo Swipe',
      description: 'Tocca e tieni premuto sulla card, poi trascina verso sinistra. I pulsanti delle azioni appariranno da destra. Tocca il pulsante desiderato per eseguire l\'azione. Per chiudere, tocca la card o trascinala verso destra.',
      actionSteps: [
        '1. Tocca e tieni sulla card dell\'apiario',
        '2. Trascina verso sinistra',
        '3. Appariranno i pulsanti "Condividi" e "Elimina"',
        '4. Tocca il pulsante desiderato',
        '5. Per eliminare, conferma nel foglio che appare in basso',
      ],
    },
  ]))

  // === CAP 4: CREAZIONE APIARIO ===
  console.log('[5/18] Nuovo apiario...')
  await page.goto('/apiaries/new')
  await waitForLoad(page)
  const newApiaryScreenshot = await screenshot(page, 'apiario-nuovo')

  const apiaryFormScreenshot = await screenshot(page, 'apiario-form')

  guidePages.push(new GuidePage('apiario-nuovo', 'Creazione Nuovo Apiario', [
    { heading: 'Compilazione del Form',
      description: 'Il form di creazione apiario richiede il nome (campo obbligatorio). Opzionalmente puoi specificare: località/indirizzo, coordinate GPS (latitudine/longitudine) e note. Le coordinate sono usate per le previsioni meteo e le previsioni di fioritura.',
      screenshot: newApiaryScreenshot,
    },
    { heading: 'Inserimento Manuale delle Coordinate',
      description: 'Se conosci le coordinate GPS del tuo apiario, inseriscile nei campi latitudine e longitudine. In alternativa, lasciali vuoti: potrai aggiungerli in seguito dalla modifica apiario.',
      actionSteps: [
        '1. Inserisci il nome dell\'apiario (es. "Apiario Valle Spluga")',
        '2. Opzionale: aggiungi località, coordinate e note',
        '3. Tocca "Salva Apiario"',
        '4. Verrai reindirizzato alla homepage col nuovo apiario',
      ],
    },
    { heading: 'Modifica Apiario',
      description: 'Dalla homepage, premi sulla matita (icona Pencil) in basso a destra sulla card dell\'apiario per modificarlo. Puoi cambiare nome, località, coordinate e foto dell\'apiario.',
    },
  ]))

  // === CAP 5: FOTO APIARIO ===
  await page.goto('/')
  await waitForLoad(page)
  // Find edit button on first apiary
  const editBtn = page.locator('button:has(svg.lucide-pencil)').first()
  if (await editBtn.isVisible().catch(() => false)) {
    await editBtn.click()
    await waitForLoad(page)
    const editApiaryScreenshot = await screenshot(page, 'apiario-modifica')
    guidePages.push(new GuidePage('apiario-foto', 'Foto dell\'Apiario', [
      { heading: 'Aggiungere una Foto',
        description: 'Nella schermata di modifica apiario, tocca l\'area della foto per caricare un\'immagine. Puoi scattare una foto con la fotocamera o sceglierne una dalla galleria. La foto viene visualizzata anche nella homepage.',
        screenshot: editApiaryScreenshot,
      },
    ]))
  }

  // === CAP 6: GESTIONE ARNIE ===
  console.log('[6/18] Arnie (lista compatta)...')
  await page.goto('/arnie')
  await waitForLoad(page)
  const arnieListScreenshot = await screenshot(page, 'arnie-lista')
  guidePages.push(new GuidePage('arnie', 'Elenco Arnie', [
    { heading: 'Vista Compatta delle Arnie',
      description: 'La pagina "Arnie" mostra tutte le arnie di tutti gli apiari in un\'unica lista compatta. Ogni card mostra: identificatore, nome dell\'apiario di appartenenza, numero di melari, stato ultima visita e accessori.',
      screenshot: arnieListScreenshot,
    },
    { heading: 'Pulsante Ispeziona',
      description: 'Sulla destra di ogni card c\'è il pulsante "Ispeziona" (icona ClipboardCheck) che ti porta direttamente alla creazione di una nuova ispezione per quell\'arnia, senza passare dalla pagina dell\'apiario.',
    },
  ]))

  // === CAP 7: NUOVA ARNIA ===
  console.log('[7/18] Nuova arnia...')
  // Go to apiary detail first
  await page.goto('/')
  await waitForLoad(page)
  const firstApiaryCard = page.locator('button:has(svg.lucide-trees)').first()
  await firstApiaryCard.click()
  await page.waitForURL(/\/apiaries\//, { timeout: 10000 })
  const apiaryUrl = page.url()

  // Navigate to new hive
  await page.goto(apiaryUrl + '/hives/new')
  await waitForLoad(page)
  const newHiveScreenshot = await screenshot(page, 'arnia-nuova')

  await page.goto(apiaryUrl + '/hives/new')
  await waitForLoad(page)

  guidePages.push(new GuidePage('arnia-nuova', 'Creazione Nuova Arnia', [
    { heading: 'Inserimento Arnia',
      description: 'Per aggiungere un\'arnia, naviga nella pagina dell\'apiario desiderato e premi il pulsante "+" o vai a "Nuova Arnia". I campi disponibili sono: identificatore (obbligatorio, es. RM-003), note, tipo arnia, e opzioni come nourisher e melari.',
      screenshot: newHiveScreenshot,
    },
    { heading: 'Dopo il Salvataggio',
      description: 'Dopo aver salvato, l\'arnia appare nell\'elenco dell\'apiario. Da qui puoi: ispezionarla, modificarne i dati (icona matita sullo swipe o tasto ispeziona), o vedere lo storico delle visite.',
    },
  ]))

  // === CAP 8: MODIFICA ARNIA CON FOTO ===
  // Get the first hive ID
  await page.goto(apiaryUrl)
  await waitForLoad(page)
  const inspectBtns = page.locator('button:has(svg.lucide-clipboard-check)')
  if (await inspectBtns.first().isVisible().catch(() => false)) {
    await inspectBtns.first().click()
    await waitForLoad(page)
    // Should be on inspection page - back to apiary
    const backBtn = page.locator('[aria-label="Indietro"]')
    if (await backBtn.isVisible().catch(() => false)) await backBtn.click()
    await waitForLoad(page)
  }

  // Try to navigate to edit of a hive
  const editHiveLink = page.locator('a:has(svg.lucide-pencil), button:has(svg.lucide-pencil)').first()
  if (await editHiveLink.isVisible().catch(() => false)) {
    await editHiveLink.click()
    await waitForLoad(page)
    const editHiveScreenshot = await screenshot(page, 'arnia-modifica')
    guidePages.push(new GuidePage('arnia-foto', 'Foto dell\'Arnia', [
      { heading: 'Aggiungere o Cambiare la Foto',
        description: 'Nella scheda di modifica dell\'arnia puoi aggiungere una foto principale. L\'immagine viene mostrata nella scheda di dettaglio dell\'arnia. Puoi scattare una nuova foto, sceglierne una dalla galleria o eliminare quella esistente.',
        screenshot: editHiveScreenshot,
      },
    ]))
  }

  // === CAP 9: VISITA (ISPEZIONE) ===
  console.log('[8/18] Nuova ispezione...')
  await page.goto(apiaryUrl)
  await waitForLoad(page)
  const ispezionaBtn = page.locator('button:has(svg.lucide-clipboard-check), button:has(svg.lucide-clipboard-list)').first()
  if (await ispezionaBtn.isVisible().catch(() => false)) {
    await ispezionaBtn.click()
    await page.waitForURL(/\/inspections\//, { timeout: 10000 })
    await waitForLoad(page)

    const inspectionExpressScreenshot = await screenshot(page, 'visita-express')

    // Try switching to standard mode
    const standardTab = page.locator('text=Standard').first()
    if (await standardTab.isVisible().catch(() => false)) {
      await standardTab.click()
      await waitForLoad(page)
    }

    const inspectionStandardScreenshot = await screenshot(page, 'visita-standard')

    // Fill some data in express mode
    await page.goto(page.url()) // reload
    await waitForLoad(page)
    const queenVista = page.locator('label:has-text("Vista")').first()
    if (await queenVista.isVisible().catch(() => false)) {
      await queenVista.click()
    }
    const popForte = page.locator('label:has-text("Forte")').first()
    if (await popForte.isVisible().catch(() => false)) {
      await popForte.click()
    }
    const inspectionFilledScreenshot = await screenshot(page, 'visita-compilata')

    guidePages.push(new GuidePage('visite', 'Ispezioni (Visite)', [
      { heading: 'Modalità Express',
        description: 'La modalità Express è ideale per ispezioni rapide. Puoi registrare: avvistamento regina, popolazione, covata, scorte e melari. I campi essenziali sono sufficienti per un monitoraggio veloce.',
        screenshot: inspectionExpressScreenshot,
      },
      { heading: 'Modalità Standard',
        description: 'La modalità Standard aggiunge campi più dettagliati: conteggio telaini, celle reali, comportamento delle api, patologie, rimedi applicati e note approfondite. Ideale per ispezioni periodiche complete.',
        screenshot: inspectionStandardScreenshot,
      },
      { heading: 'Compilazione e Salvataggio',
        description: 'Compila i campi desiderati e premi "Salva" in fondo al form. Dopo il salvataggio, la visita viene registrata e l\'arnia aggiornata con la data dell\'ultima ispezione. Dalla scheda visita puoi aggiungere foto e note vocali.',
        screenshot: inspectionFilledScreenshot,
      },
      { heading: 'Ispezione Batch',
        description: 'Dalla pagina dell\'apiario puoi avviare un\'ispezione batch che ti permette di ispezionare più arnie in sequenza, senza tornare alla lista tra un\'ispezione e l\'altra.',
      },
    ]))
  }

  // === CAP 10: TRATTAMENTI ===
  console.log('[9/18] Trattamenti...')
  await page.goto('/trattamenti')
  await waitForLoad(page)

  // Crea un trattamento se non esiste
  const noTreatments = await page.locator('text=Nessun trattamento').isVisible().catch(() => false)
  if (noTreatments) {
    await page.goto('/trattamenti/new')
    await waitForLoad(page)
    // Fill in treatment form
    const nameInput = page.locator('#treatment-name, input[placeholder*="prodotto"]').first()
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Apivar')
      // Try to fill other fields
      const doseInput = page.locator('#treatment-dose, input[placeholder*="dose"]').first()
      if (await doseInput.isVisible().catch(() => false)) await doseInput.fill('2 strisce')
      const saveTreatment = page.getByRole('button', { name: /salva/i }).first()
      if (await saveTreatment.isVisible().catch(() => false)) await saveTreatment.click()
      await page.waitForTimeout(2000)
    }
    await page.goto('/trattamenti')
    await waitForLoad(page)
  }
  const tratListScreenshot = await screenshot(page, 'trattamenti-lista')

  await page.goto('/trattamenti/new')
  await waitForLoad(page)
  const tratNewScreenshot = await screenshot(page, 'trattamenti-nuovo')

  guidePages.push(new GuidePage('trattamenti', 'Gestione Trattamenti', [
    { heading: 'Elenco Trattamenti',
      description: 'La pagina Trattamenti mostra tutti i trattamenti in corso e passati. I trattamenti attivi appaiono con un bordo colorato e possono bloccare l\'accesso ai melari (se configurato).',
      screenshot: tratListScreenshot,
    },
    { heading: 'Nuovo Trattamento',
      description: 'Per registrare un nuovo trattamento: seleziona l\'apiario, inserisci il nome del prodotto, le date di inizio e fine (se nota), la dose e se blocca i melari. I trattamenti attivi generano un avviso nella homepage.',
      screenshot: tratNewScreenshot,
    },
    { heading: 'Swipe sui Trattamenti',
      description: 'Dalla lista, scorri verso sinistra su un trattamento per rivelare il pulsante "Nascondi", utile per rimuovere trattamenti completati dalla vista corrente.',
      actionSteps: [
        '1. Tocca e tieni sul trattamento',
        '2. Trascina verso sinistra',
        '3. Appare il pulsante "Nascondi"',
        '4. Toccalo per nascondere il trattamento',
      ],
    },
  ]))

  // === CAP 11: PROMEMORIA ===
  console.log('[10/18] Promemoria...')
  await page.goto('/promemoria')
  await waitForLoad(page)

  const noReminders = await page.locator('text=Nessun promemoria').isVisible().catch(() => false)
  if (noReminders) {
    await page.goto('/promemoria/new')
    await waitForLoad(page)
    await page.fill('#reminder-title, input[placeholder*="titolo"]', 'Controllo scorte invernali')
    // Set date
    const dateInput = page.locator('#reminder-due_at, input[type="date"]').first()
    if (await dateInput.isVisible().catch(() => false)) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      await dateInput.fill(futureDate.toISOString().slice(0, 10))
    }
    const saveReminder = page.getByRole('button', { name: /salva/i }).first()
    if (await saveReminder.isVisible().catch(() => false)) await saveReminder.click()
    await page.waitForTimeout(2000)

    // Create second reminder
    await page.goto('/promemoria/new')
    await waitForLoad(page)
    await page.fill('#reminder-title, input[placeholder*="titolo"]', 'Trattamento antivarroa')
    const dateInput2 = page.locator('#reminder-due_at, input[type="date"]').first()
    if (await dateInput2.isVisible().catch(() => false)) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 14)
      await dateInput2.fill(futureDate.toISOString().slice(0, 10))
    }
    // Select apiary scope
    const scopeSelect = page.locator('select:has(option[value="apiary"])').first()
    if (await scopeSelect.isVisible().catch(() => false)) {
      await scopeSelect.selectOption('apiary')
      await page.waitForTimeout(500)
    }
    const saveReminder2 = page.getByRole('button', { name: /salva/i }).first()
    if (await saveReminder2.isVisible().catch(() => false)) await saveReminder2.click()
    await page.waitForTimeout(2000)

    await page.goto('/promemoria')
    await waitForLoad(page)
  }
  const promemoriaListScreenshot = await screenshot(page, 'promemoria-lista')

  await page.goto('/promemoria/new')
  await waitForLoad(page)
  const promemoriaNewScreenshot = await screenshot(page, 'promemoria-nuovo')

  guidePages.push(new GuidePage('promemoria', 'Gestione Promemoria', [
    { heading: 'Elenco Promemoria',
      description: 'La pagina Promemoria mostra i promemoria in sospeso ordinati per scadenza. Ogni card mostra: titolo, data di scadenza, ambito (Generale, Apiario o Arnia) e ricorrenza. I promemoria scaduti hanno la data evidenziata in rosso con un\'icona di avviso.',
      screenshot: promemoriaListScreenshot,
    },
    { heading: 'Nuovo Promemoria',
      description: 'Per creare un promemoria: inserisci titolo (obbligatorio), descrizione, data di scadenza, ambito (globale, per apiario, per arnia) e ricorrenza (nessuna, giornaliera, settimanale, mensile, annuale). I promemoria in scadenza nei prossimi 15 giorni compaiono anche nella homepage.',
      screenshot: promemoriaNewScreenshot,
    },
    { heading: 'Swipe sui Promemoria',
      description: 'Scorri verso sinistra su un promemoria per rivelare le azioni: "Completa" (segna come fatto) e "Elimina" (con conferma). I promemoria completati appaiono in una sezione separata in fondo alla lista.',
      actionSteps: [
        '1. Swipe a sinistra sul promemoria',
        '2. Tocca "Completa" per segnarlo come fatto',
        '3. Oppure tocca "Elimina" e conferma',
        '4. I promemoria in scadenza appaiono anche nella homepage',
      ],
    },
  ]))

  // === CAP 12: RACCOLTI ===
  console.log('[11/18] Raccolti...')
  await page.goto('/raccolti')
  await waitForLoad(page)
  const raccoltiScreenshot = await screenshot(page, 'raccolti-lista')

  await page.goto('/raccolti/new')
  await waitForLoad(page)
  const raccoltiNewScreenshot = await screenshot(page, 'raccolti-nuovo')

  guidePages.push(new GuidePage('raccolti', 'Gestione Raccolti', [
    { heading: 'Elenco Raccolti',
      description: 'La pagina Raccolti mostra lo storico dei raccolti di miele. Per ogni raccolta vedi: apiario, data, tipo di miele, quantità e numero di melari.',
      screenshot: raccoltiScreenshot,
    },
    { heading: 'Nuovo Raccolto',
      description: 'Per registrare un raccolto: seleziona l\'apiario, inserisci la data, il tipo di miele (es. Millefiori, Acacia, Castagno), la quantità in kg e il numero di melari utilizzati.',
      screenshot: raccoltiNewScreenshot,
    },
  ]))

  // === CAP 13: CALENDARIO ===
  console.log('[12/18] Calendario...')
  await page.goto('/calendario')
  await waitForLoad(page)
  const calendarioScreenshot = await screenshot(page, 'calendario')
  guidePages.push(new GuidePage('calendario', 'Calendario', [
    { heading: 'Vista Calendario',
      description: 'Il calendario mostra tutte le attività registrate: visite, trattamenti, raccolti e promemoria. I giorni con attività sono evidenziati. Puoi navigare tra i mesi usando le frecce in alto.',
      screenshot: calendarioScreenshot,
    },
  ]))

  // === CAP 14: SUGGERIMENTI ===
  console.log('[13/18] Suggerimenti...')
  // Navigate to apiary suggestions
  await page.goto('/')
  await waitForLoad(page)
  const apiaryCard2 = page.locator('button:has(svg.lucide-trees)').first()
  await apiaryCard2.click()
  await page.waitForURL(/\/apiaries\//, { timeout: 10000 })
  const currentUrl = page.url()
  // Extract apiaryId
  const apiaryId = currentUrl.split('/apiaries/')[1]?.split('/')?.[0] || currentUrl.split('/').pop()
  await page.goto(`/apiaries/${apiaryId}/suggerimenti`)
  await waitForLoad(page)
  const suggerimentiScreenshot = await screenshot(page, 'suggerimenti')
  guidePages.push(new GuidePage('suggerimenti', 'Suggerimenti', [
    { heading: 'Suggerimenti per l\'Apiario',
      description: 'La sezione Suggerimenti analizza i dati dell\'apiario e propone azioni consigliate: ispezioni in ritardo, trattamenti imminenti, promemoria pertinenti, condizioni meteo avverse e fioriture in arrivo.',
      screenshot: suggerimentiScreenshot,
    },
  ]))

  // === CAP 15: METEO ===
  console.log('[14/18] Meteo...')
  await page.goto(`/apiaries/${apiaryId}/meteo`)
  await waitForLoad(page)
  const meteoPrevScreenshot = await screenshot(page, 'meteo')
  guidePages.push(new GuidePage('meteo', 'Previsioni Meteo', [
    { heading: 'Meteo per l\'Apiario',
      description: 'Le previsioni meteo sono generate in base alle coordinate GPS dell\'apiario (da Open-Meteo). Mostrano temperature, precipitazioni, vento e altri dati utili per la pianificazione delle attività apistiche.',
      screenshot: meteoPrevScreenshot,
    },
  ]))

  // === CAP 16: PREVISIONI FIORITURA ===
  console.log('[15/18] Previsioni fioritura...')
  await page.goto('/previsioni')
  await waitForLoad(page)
  const fiorituraScreenshot = await screenshot(page, 'fioritura')
  guidePages.push(new GuidePage('fioritura', 'Previsioni Fioritura', [
    { heading: 'Calendario Fioriture',
      description: 'La pagina Previsioni Fioritura mostra il calendario delle fioriture delle specie botaniche associate ai tuoi apiari. Basandoti sui dati GDD (Growing Degree Days) e sulle coordinate dell\'apiario, puoi vedere le date previste di inizio e picco fioritura.',
      screenshot: fiorituraScreenshot,
    },
  ]))

  // === CAP 17: STATISTICHE ===
  console.log('[16/18] Statistiche...')
  await page.goto('/statistiche')
  await waitForLoad(page)
  const statisticheScreenshot = await screenshot(page, 'statistiche')
  guidePages.push(new GuidePage('statistiche', 'Statistiche', [
    { heading: 'Dashboard Statistiche',
      description: 'La pagina Statistiche offre una panoramica numerica della tua attività apistica: numero di apiari, arnie attive, totale visite effettuate, trattamenti registrati e raccolti. Utile per monitorare l\'andamento stagionale.',
      screenshot: statisticheScreenshot,
    },
  ]))

  // === CAP 18: ALTRO (IMPOSTAZIONI) ===
  console.log('[17/18] Altro (Impostazioni)...')
  await page.goto('/piu')
  await waitForLoad(page)
  const piuScreenshot = await screenshot(page, 'altro')
  guidePages.push(new GuidePage('altro', 'Altro — Profilo e Impostazioni', [
    { heading: 'Menu Altro',
      description: 'La pagina "Altro" contiene: link alle Previsioni Fioritura, sezione Promemoria, Statistiche, informazioni sull\'app (versione e aggiornamenti) e dati di sessione utente.',
      screenshot: piuScreenshot,
    },
  ]))

  // === GESTURE RIEPILOGO ===
  guidePages.push(new GuidePage('gesture', 'Riepilogo Gesture e Interazioni', [
    { heading: 'Swipe Left (Scorri a Sinistra)',
      description: 'La gesture principale dell\'app. Funziona su: card apiario (homepage), card promemoria e card trattamento. Trascina verso sinistra per rivelare pulsanti azione.',
    },
    { heading: 'Tap (Tocco Singolo)',
      description: 'Usato per: aprire un apiario, modificare un elemento, selezionare opzioni, compilare form. Il comportamento predefinito in tutta l\'app.',
    },
    { heading: 'Back (Indietro)',
      description: 'Pulsante "Indietro" in alto a sinistra nelle pagine di dettaglio. Torna alla pagina precedente mantenendo lo stato.',
    },
    { heading: 'Compilazione Form',
      description: 'I form seguono uno schema comune: header fisso (con titolo e back), corpo scrollabile (con campi), footer fisso (con pulsanti Salva/Annulla). Le modifiche non salvate attivano un avviso di conferma.',
    },
  ]))

  return guidePages
}

// ============================================================
// 6. GENERAZIONE HTML
// ============================================================

function buildGuideHtml(guidePages) {
  const sections = guidePages.map((gp, idx) => {
    const sectionContent = gp.sections.map(s => {
      let html = ''
      if (s.heading) html += `<h3>${s.heading}</h3>\n`
      if (s.description) html += `<p>${s.description}</p>\n`
      if (s.screenshot) {
        html += `<div class="screenshot-wrapper"><img src="${s.screenshot}" alt="${s.heading}" /></div>\n`
      }
      if (s.actionSteps) {
        html += `<div class="steps"><h4>Passaggi:</h4>\n<ol>\n`
        for (const step of s.actionSteps) {
          html += `  <li>${step}</li>\n`
        }
        html += `</ol></div>\n`
      }
      return html
    }).join('\n')

    return `
    <div class="chapter" id="${gp.id}">
      <h2>Capitolo ${idx + 1}: ${gp.title}</h2>
      ${sectionContent}
    </div>
    `
  }).join('\n')

  const tocItems = guidePages.map((gp, idx) =>
    `<li><a href="#${gp.id}">Capitolo ${idx + 1}: ${gp.title}</a></li>`
  ).join('\n')

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Guida Apidiario</title>
<style>
  @page { margin: 2cm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #2c2417;
    background: #fff;
    line-height: 1.6;
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }
  .cover {
    text-align: center;
    padding: 6rem 2rem 4rem;
    background: linear-gradient(135deg, #f5e6d3 0%, #ffd70015 100%);
    border-radius: 16px;
    margin-bottom: 3rem;
    page-break-after: always;
  }
  .cover h1 { font-size: 2.5rem; color: #8B5E3C; margin-bottom: 0.5rem; }
  .cover .subtitle { font-size: 1.2rem; color: #6b5b4e; }
  .cover .version { margin-top: 2rem; font-size: 0.9rem; color: #999; }
  .toc {
    page-break-after: always;
    margin-bottom: 3rem;
  }
  .toc h2 { color: #8B5E3C; border-bottom: 2px solid #8B5E3C; padding-bottom: 0.5rem; }
  .toc ul { columns: 2; column-gap: 2rem; padding: 0; list-style: none; }
  .toc li { margin-bottom: 0.5rem; page-break-inside: avoid; }
  .toc a { color: #5a3e2b; text-decoration: none; }
  .toc a:hover { text-decoration: underline; }
  .chapter {
    page-break-after: always;
    margin-bottom: 3rem;
  }
  .chapter h2 {
    color: #8B5E3C;
    border-bottom: 2px solid #e8d5c0;
    padding-bottom: 0.5rem;
    margin-top: 0;
  }
  .chapter h3 {
    color: #5a3e2b;
    margin-top: 1.5rem;
  }
  .chapter h4 { color: #7a6b5e; }
  .chapter p { margin: 0.5rem 0; }
  .screenshot-wrapper {
    margin: 1rem 0;
    text-align: center;
    page-break-inside: avoid;
  }
  .screenshot-wrapper img {
    max-width: 100%;
    height: auto;
    border: 1px solid #e8d5c0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .steps {
    background: #faf6f0;
    border: 1px solid #e8d5c0;
    border-radius: 8px;
    padding: 1rem 1.5rem;
    margin: 1rem 0;
    page-break-inside: avoid;
  }
  .steps h4 { margin: 0 0 0.5rem; }
  .steps ol { margin: 0; padding-left: 1.2rem; }
  .steps li { margin-bottom: 0.3rem; }
  @media print {
    body { padding: 0; }
    .chapter { page-break-after: always; }
    .cover { page-break-after: always; }
    .toc { page-break-after: always; }
  }
</style>
</head>
<body>

<div class="cover">
  <h1>🐝 Apidiario</h1>
  <p class="subtitle">Guida all'uso della webapp per la gestione dell'apiario</p>
  <p class="version">Versione ${new Date().toISOString().slice(0, 10)}</p>
</div>

<div class="toc">
  <h2>Indice</h2>
  <ul>${tocItems}</ul>
</div>

${sections}

<p style="text-align:center;margin-top:3rem;color:#999;font-size:0.85rem;">
  Guida generata automaticamente il ${new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}.
</p>

</body>
</html>`
}

// ============================================================
// 7. GENERAZIONE PDF
// ============================================================

async function generatePdf(htmlPath) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ locale: 'it-IT' })
  const page = await context.newPage()

  const htmlContent = readFileSync(htmlPath, 'utf-8')
  await page.setContent(htmlContent, { waitUntil: 'networkidle' })

  const pdfPath = resolve(OUTPUT_DIR, 'guida-apidiario.pdf')
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '2cm', bottom: '2cm', left: '1.5cm', right: '1.5cm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;color:#999;text-align:center;width:100%;padding:5px;">Apidiario — Guida all\'uso</div>',
    footerTemplate: '<div style="font-size:8px;color:#999;text-align:center;width:100%;padding:5px;">Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></div>',
  })

  await browser.close()
  return pdfPath
}

// ============================================================
// 8. ESECUZIONE
// ============================================================

main().catch(err => {
  console.error('ERRORE:', err)
  process.exit(1)
})
