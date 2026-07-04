import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  guidaSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Gestione apiario',
      collapsed: false,
      items: ['apiari', 'arnie'],
    },
    {
      type: 'category',
      label: 'Attività',
      collapsed: false,
      items: ['ispezioni', 'trattamenti'],
    },
    {
      type: 'category',
      label: 'Analisi',
      collapsed: false,
      items: ['statistiche', 'report'],
    },
    'faq',
  ],
}

export default sidebars
