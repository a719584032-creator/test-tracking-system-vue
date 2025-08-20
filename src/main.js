import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { appInfo } from '@/config'

const app = createApp(App)

// 设置应用标题
document.title = appInfo.title

// 创建 Pinia 实例
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 挂载应用
app.mount('#app')

// 初始化认证状态
import { useAuthStore } from '@/stores/modules/auth'
const authStore = useAuthStore()
authStore.checkAuth()

