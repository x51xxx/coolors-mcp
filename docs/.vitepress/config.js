import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'Coolors MCP',
    titleTemplate: ':title | Coolors MCP Docs',
    description: 'Advanced color operations MCP server with Material Design 3 support, CSS theme matching, image color extraction, and accessibility compliance.',
    base: '/coolors-mcp/',
    lastUpdated: true,
    cleanUrls: true,
    
    // Force dark mode by default
    //appearance: 'dark',
    
    head: [
      // Using emoji as favicon
      ['link', { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎨</text></svg>' }],
      ['meta', { name: 'theme-color', content: '#0ea5e9' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:locale', content: 'en' }],
      ['meta', { property: 'og:title', content: 'Coolors MCP | Advanced Color Operations for MCP' }],
      ['meta', { property: 'og:site_name', content: 'Coolors MCP' }],
      ['meta', { property: 'og:description', content: 'MCP server for advanced color operations, Material Design themes, CSS refactoring, and image color extraction.' }],
      ['meta', { property: 'og:url', content: 'https://x51xxx.github.io/coolors-mcp/' }]
    ],
    
    themeConfig: {
    // No logo - using text branding instead
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Tools', link: '/tools/README' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Installation', link: '/installation' },
          { text: 'Getting Started', link: '/getting-started' }
        ]
      },
      {
        text: 'Core Concepts',
        collapsed: false,
        items: [
          { text: 'Color Spaces', link: '/concepts/color-spaces' },
          { text: 'HCT Color System', link: '/concepts/hct' },
          { text: 'Material Design 3', link: '/concepts/material-design' },
          { text: 'Theme Matching', link: '/concepts/theme-matching' },
          { text: 'Image Analysis', link: '/concepts/image-analysis' },
          { text: 'Accessibility', link: '/concepts/accessibility' }
        ]
      },
      {
        text: 'Tools Reference',
        collapsed: false,
        items: [
          { text: 'Color Operations', link: '/tools/color-operations' },
          { text: 'Material Design', link: '/tools/material-design' },
          { text: 'Theme Matching', link: '/tools/theme-matching' },
          { text: 'Image Extraction', link: '/tools/image-extraction' },
          { text: 'Accessibility', link: '/tools/accessibility' }
        ]
      },
      {
        text: 'Examples',
        collapsed: false,
        items: [
          { text: 'Basic Color Operations', link: '/examples/basic-colors' },
          { text: 'Creating Themes', link: '/examples/creating-themes' },
          { text: 'CSS Refactoring', link: '/examples/css-refactoring' },
          { text: 'Image Color Extraction', link: '/examples/image-extraction' }
        ]
      },
      {
        text: 'Resources',
        collapsed: false,
        items: [
          { text: 'Troubleshooting', link: '/resources/troubleshooting' },
          { text: 'FAQ', link: '/resources/faq' },
          { text: 'Contributing', link: '/contributing' }
        ]
      },
      {
        text: 'Advanced',
        collapsed: true,
        items: [
          { text: 'Custom Palettes', link: '/advanced/custom-palettes' },
          { text: 'Batch Processing', link: '/advanced/batch-processing' },
          { text: 'Integration Patterns', link: '/advanced/integration' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/x51xxx/coolors-mcp' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: `Copyright © ${new Date().getFullYear()} Coolors MCP Contributors`
    },

    search: {
      provider: 'local',
      options: {
        placeholder: 'Search docs...',
        detailedView: true,
        translations: {
          button: {
            buttonText: 'Search',
            buttonAriaLabel: 'Search documentation'
          },
          modal: {
            noResultsText: 'No results found',
            resetButtonTitle: 'Clear search',
            footer: {
              selectText: 'to select',
              navigateText: 'to navigate',
              closeText: 'to close'
            }
          }
        }
      }
    },

    editLink: {
      pattern: 'https://github.com/x51xxx/coolors-mcp/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },

    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    },

    outline: {
      label: 'On this page',
      level: [2, 3]
    },

    returnToTopLabel: 'Return to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme'
  }
})
)
