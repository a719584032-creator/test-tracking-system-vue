import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')
  const role = ref(localStorage.getItem('role') || '')
  const userid = ref(localStorage.getItem('userid') || '')
  const isLoggedIn = ref(!!token.value)

  // 添加 computed getters 以便在其他组件中使用
  const userId = computed(() => userid.value)
  const isAuthenticated = computed(() => !!token.value && !!userid.value)

  // 登录
  const login = (userInfo) => {
    console.log('🔐 [AUTH STORE] Login attempt:', {
      username: userInfo.username,
      userid: userInfo.userid,
      role: userInfo.role,
      hasToken: !!userInfo.token,
      timestamp: new Date().toISOString()
    })

    token.value = userInfo.token
    username.value = userInfo.username
    role.value = userInfo.role || ''
    userid.value = userInfo.userid || ''
    isLoggedIn.value = true

    // 保存到 localStorage
    localStorage.setItem('token', userInfo.token)
    localStorage.setItem('username', userInfo.username)
    localStorage.setItem('role', userInfo.role || '')
    localStorage.setItem('userid', userInfo.userid || '')

    console.log('✅ [AUTH STORE] Login successful:', {
      userid: userid.value,
      username: username.value,
      role: role.value,
      isAuthenticated: isAuthenticated.value
    })
  }

  // 登出
  const logout = () => {
    console.log('🔐 [AUTH STORE] Logout initiated')
    
    token.value = ''
    username.value = ''
    role.value = ''
    userid.value = ''
    isLoggedIn.value = false

    // 清除 localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    localStorage.removeItem('userid')
    localStorage.removeItem('rememberUser')

    console.log('✅ [AUTH STORE] Logout completed')
  }

  // 初始化时检查登录状态
  const checkAuth = () => {
    console.log('🔐 [AUTH STORE] Checking auth state...')
    
    const storedToken = localStorage.getItem('token')
    const storedUserid = localStorage.getItem('userid')
    
    console.log('🔐 [AUTH STORE] Stored data:', {
      hasToken: !!storedToken,
      hasUserid: !!storedUserid,
      storedUsername: localStorage.getItem('username'),
      storedRole: localStorage.getItem('role')
    })
    
    if (storedToken && storedUserid) {
      token.value = storedToken
      username.value = localStorage.getItem('username') || ''
      role.value = localStorage.getItem('role') || ''
      userid.value = storedUserid
      isLoggedIn.value = true
      
      console.log('✅ [AUTH STORE] Auth state restored:', {
        userid: userid.value,
        username: username.value,
        role: role.value,
        isAuthenticated: isAuthenticated.value
      })
      
      return true
    } else {
      console.log('❌ [AUTH STORE] No valid auth data found')
      // 清除可能不完整的数据
      logout()
      return false
    }
  }

  // 初始化认证状态的别名方法
  const initAuth = () => {
    return checkAuth()
  }

  return {
    // 状态
    token,
    username,
    role,
    userid,
    isLoggedIn,
    
    // 计算属性 getters
    userId,
    isAuthenticated,
    
    // 方法
    login,
    logout,
    checkAuth,
    initAuth
  }
})
