import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'Apidiario',
  tagline: 'Il diario digitale del tuo apiario',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://apidiario-site.pages.dev',
  baseUrl: '/docs/',

  organizationName: 'ddmo',
  projectName: 'apidiario',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'it',
    locales: ['it'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Apidiario',
      logo: {
        alt: 'Apidiario',
        src: 'img/logo.png',
        srcDark: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guidaSidebar',
          position: 'left',
          label: 'Guida',
        },
        {
          href: 'https://apidiario.stefano-passiatore.workers.dev',
          label: 'Apri l\'app',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Guida',
          items: [
            { label: 'Introduzione', to: '/intro' },
            { label: 'Apiari', to: '/apiari' },
            { label: 'Arnie', to: '/arnie' },
            { label: 'Ispezioni', to: '/ispezioni' },
          ],
        },
        {
          title: 'App',
          items: [
            {
              label: 'Apri Apidiario',
              href: 'https://apidiario.stefano-passiatore.workers.dev',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Apidiario`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
