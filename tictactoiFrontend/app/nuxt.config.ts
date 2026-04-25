// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },
  /* Private or public tokens that need to be specified after build using environment variables. */
  runtimeConfig: {
    // The private keys which are only available server-side
    apiSecret: '123',
    // Keys within public are also exposed client-side
    // how can we change this value form terminal - nuxt_publix_base_url="test.com" instead of change BASE_URL value from terminal
    public: {
      apiBase: '/api',
      base_url: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    },
  },
  css: [
    'bootstrap-icons/font/bootstrap-icons.css',
  ],
  app: {
    head: {
      title: 'My Application',
      titleTemplate: '%s | Nuxt 3',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      script: [
        // This is just for example how to add js
        // you can  include js  by this method direact include or via import individual method as per below link
        // https://github.com/Debonex/samples/blob/master/nuxt3-bootstrap5/app.vue
        // if it is public folder then  use like href: '/js/awesome-lib.js'
        // { src: 'https://awesome-lib.js', tagPosition: 'bodyClose' },

      ],
      link: [
        // This for just example how to add css
        { rel: 'stylesheet', href: 'https://awesome-lib.css' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css?family=Poppins',
        },
      ],
    },
  },

  // This will show when npm run preview Production run
  $production:
  {
    app: {
      head: {
        title: 'My Application Production',
      },
    },
  },

  vue: {
    propsDestructure: true,
  },
  css: ['bootstrap/dist/css/bootstrap.min.css', '~/assets/css/style.css', 'bootstrap-icons/font/bootstrap-icons.css'],
  modules: [
    '@pinia/nuxt',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@nuxt/ui',
    'nuxt-toastify',
  ],
  toastify: {
    autoClose: 2000,
    position: 'top-right',
    theme: 'auto',
  },
})
