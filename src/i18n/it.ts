export const t = {
  auth: {
    emailLabel: 'Email',
    emailPlaceholder: 'la-tua@email.com',
    sendMagicLink: 'Accedi con link email',
    magicLinkSent: 'Codice inviato!',
    checkEmail: 'Controlla la tua email e inserisci il codice a 6 cifre.',
    otpLabel: 'Codice a 6 cifre',
    otpPlaceholder: '123456',
    verifyOtp: 'Verifica codice',
    backToEmail: 'Usa un\'altra email',
    errorGeneric: 'Qualcosa è andato storto. Riprova.',
  },
  nav: {
    apiari: 'Apiari',
    arnie: 'Arnie',
    visita: 'Visita',
    calendario: 'Calendario',
    altro: 'Più',
  },
  common: {
    loading: 'Caricamento…',
    error: 'Si è verificato un errore.',
    retry: 'Riprova',
    offline: 'Offline',
    syncPending: (n: number) => `${n} modific${n === 1 ? 'a' : 'he'} da sincronizzare`,
  },
  home: {
    greeting: (name: string) => `Ciao, ${name}`,
    subtitle: 'I tuoi apiari appariranno qui.',
  },
} as const
