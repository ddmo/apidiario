# TODO — Apidiario

Cose deliberatamente rinviate, da affrontare nelle fasi successive.

## Da risolvere prima del deploy in produzione

- [ ] **Icone PWA reali**: sostituire `public/icons/icon-192.svg` e `icon-512.svg` 
      con PNG progettati (Fase grafica).
- [ ] **Code splitting**: lazy-load delle route quando avremo più di 3-4 schermate, 
      per portare il bundle iniziale sotto i 300 kB.

## Da implementare nelle fasi successive

- [ ] **Dark mode toggle UI**: i token CSS sono pronti (`[data-theme="dark"]`), 
      `src/lib/theme.ts` esiste come utility. Manca il toggle in una pagina impostazioni.
- [ ] **SyncIndicator funzionale**: implementare coda di scrittura offline 
      (Fase 4 hardening, dopo che le schermate principali sono in piedi).
- [ ] **Auth callback per magic link** (opzionale): valutare se aggiungere 
      `supabase.auth.exchangeCodeForSession` su `/auth/callback` per supportare 
      anche il flow link-email, oltre all'OTP attuale. Per la v1 OTP è sufficiente.
- [ ] **Overview arnia (HiveSchematic)**: gestire stato "non rilevato" (NULL) per
      `queen_cells` e `pathologies` oltre ai campi numerici. L'icona di stato deve
      mostrare un quarto stato neutro (grigio o tratteggio) quando il valore è NULL
      nell'ultima ispezione, distinto da "verde / giallo / rosso". Questo NULL deriva
      da ispezioni salvate in Express mode, dove i campi non visibili vengono
      intenzionalmente lasciati NULL ("non rilevato" ≠ "nessuna/tutto ok").

## Generale

- [ ] Test unitari sui componenti del design system (Vitest + Testing Library), 
      quando avremo logica non banale da testare.
- [ ] CI/CD su GitHub Actions: typecheck, lint, build su PR.