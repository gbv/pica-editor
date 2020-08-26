// Load vue
import { createApp } from "vue"
import App from "./App.vue"
const app = createApp(App)

/*
// Load and configure vue-router
import { createRouter, createWebHistory } from "vue-router"
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: import.meta.env.BASE_URL, component: App },
  ],
})
app.use(router)
*/

// Import CSS
//import "./styles/main.css"

app.mount("#app")
