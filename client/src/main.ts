// ============================================================
// main.ts — The very first file the browser loads.
// It creates the Vue application and mounts it into the page.
// ============================================================

import { createApp } from 'vue'
import { createPinia } from 'pinia' // Pinia: the central state store
import App from './App.vue'
// Importing './feathers' runs its code once (side effect):
// it sets up the Feathers client that every component will use.
import './feathers'

// createPinia() makes the auth store (stores/auth.ts) available to
// every component. It must be installed before the app is mounted.
const pinia = createPinia()

// createApp(App) → a Vue app rooted at App.vue
// .use(pinia)    → register Pinia on it
// .mount('#app') → attach it to <div id="app"> in index.html
createApp(App).use(pinia).mount('#app')
