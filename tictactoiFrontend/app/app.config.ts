/* Public tokens that are determined at build time, website configuration such as theme variant, title and any project config that are not sensitive. */
export default defineAppConfig({
  title: 'My Nuxt Application',
  theme: {
    dark: true,
    colors: {
      primary: '#ff0000',
    },
  },
})
