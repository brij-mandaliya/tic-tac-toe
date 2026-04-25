// // eslint.config.js
// import antfu from '@antfu/eslint-config'

// export default antfu({
//   formatters: {
//     /**
//      * Format CSS, LESS, SCSS files, also the `<style>` blocks in Vue
//      * By default uses Prettier
//      */
//     css: true,
//     /**
//      * Format HTML files
//      * By default uses Prettier
//      */
//     html: true,
//     /**
//      * Format Markdown files
//      * Supports Prettier and dprint
//      * By default uses Prettier
//      */
//     markdown: 'prettier',
//   },
//   // `.eslintignore` is no longer supported in Flat config, use `ignores` instead
//   ignores: [
//     '**/node_modules',
//     // ...globs
//   ],
// })

// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
  ignores: [
    '**/node_modules',
    // ...globs
  ],
  rules: {
    // Allow console logs
    'no-console': 'off',

    // Allow usage of unused variables with underscore prefix
    'unused-imports/no-unused-vars': 'off',

    // Allow usage of process global variable
    'node/prefer-global/process': 'off',

    // Disable undefined errors for Nuxt-specific functions
    'no-undef': 'off',
  },
  globals: {
    // Define Nuxt 3 specific global variables
    defineNuxtPlugin: 'readonly',
    defineEventHandler: 'readonly',
  },
})
