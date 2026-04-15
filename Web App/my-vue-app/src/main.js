import 'bootstrap/dist/css/bootstrap.min.css' // Import Bootstrap
import { createApp } from 'vue'
import { createPinia } from 'pinia' // Import Pinia for state management
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia()) // Use Pinia for state management
app.use(router)

app.mount('#app')
