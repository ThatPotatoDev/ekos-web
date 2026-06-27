import '@mdi/font/css/materialdesignicons.css'
import { createApp } from 'vue'
import App from './App.vue'

import router from '@/plugins/router'
import vuetify from '@/plugins/vuetify'
import store from '@/plugins/vuex'
import i18n from '@/plugins/i18n.js'

import VueNativeSock from 'vue-native-websocket-vue3'

const app = createApp(App)

app.use(VueNativeSock, 'ws://' + window.location.hostname + ':3000/message/user', {
  reconnection: true,
  store: store,
  format: 'json',
})
//todo: remove
window.store = store;

app.use(vuetify);
app.use(store);
app.use(router);
app.use(i18n);

app.mount('#app')
