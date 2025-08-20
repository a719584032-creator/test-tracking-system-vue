import http from './http'

export const authApi = {
  
  // 用户登录
  login(data) {
    console.log('🔐 [AUTH] Login attempt:', {
      username: data.username,
      password: data.password ? '***' : 'empty',
      timestamp: new Date().toISOString()
    })
    
    return http.post('/login', {
      username: data.username,
      password: data.password
    }).then(response => {
      console.log('✅ [AUTH] Login success:', response.data)
      return response
    }).catch(error => {
      console.error('❌ [AUTH] Login failed:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: `${error.config?.baseURL}${error.config?.url}`
        }
      })
      throw error
    })
  },

  // 修改密码
  changePassword(data) {
    console.log('🔑 [AUTH] Change password attempt:', {
      username: data.username,
      timestamp: new Date().toISOString()
    })
    
    return http.post('/change_user_password', {
      username: data.username,
      old_password: data.oldPassword,
      new_password: data.newPassword
    })
  }
}
