import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('bs', bootstrap)
})

/* Another way */
// import { Modal, Dropdown } from "bootstrap";

// export default defineNuxtPlugin(() => ({
//   provide: {
//     bootstrap: {
//       Modal,
//       Dropdown,
//     },
//   },
// }));
