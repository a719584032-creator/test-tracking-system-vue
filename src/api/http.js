// ================== src/api/http.js ==================
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/modules/auth'
import router from '@/router'

// 获取环境配置
const baseURL = import.meta.env.VITE_API_BASE_URL || ''
const timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 10000
const shouldIgnoreSSL = import.meta.env.VITE_IGNORE_SSL === 'true'
const isDev = import.meta.env.DEV

// 创建 axios 实例的基础配置
const axiosConfig = {
  baseURL,
  timeout,
  headers: {
    'Content-Type': 'application/json'
  }
}


const http = axios.create(axiosConfig)

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    const auth = useAuthStore()
    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`
    }
    
    // 开发环境下打印请求信息
    if (isDev) {
      console.log('🚀 API Request:', {
        url: config.url,
        method: config.method?.toUpperCase(),
        baseURL: config.baseURL,
        data: config.data
      })
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 开发环境下打印响应信息
    if (isDev) {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        statusText: response.statusText,
        data: response.data
      })
    }
    
    return response
  },
  (error) => {
    // 开发环境下打印错误详情
    if (isDev) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        code: error.code,
        data: error.response?.data
      })
    }
    
    // SSL/TLS 相关错误处理
    if (error.code === 'CERT_HAS_EXPIRED' || 
        error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
        error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
        error.message.includes('certificate') ||
        error.message.includes('SSL')) {
      
      console.error('🔒 SSL Certificate Error:', error.message)
      ElMessage.error('SSL 证书验证失败，请联系管理员检查证书配置')
      return Promise.reject(error)
    }
    
    // HTTP 状态码错误处理
    const status = error.response?.status
    if (status === 401) {
      const auth = useAuthStore()
      auth.logout()
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else if (status === 403) {
      ElMessage.error('权限不足，无法访问该资源')
    } else if (status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (status >= 500) {
      ElMessage.error('服务器内部错误，请稍后重试')
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络连接')
    } else if (error.message.includes('Network Error')) {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else if (error.response?.data?.message) {
      // 显示后端返回的错误信息
      ElMessage.error(error.response.data.message)
    }
    
    return Promise.reject(error)
  }
)

export default http
