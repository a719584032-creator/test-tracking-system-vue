// ================== src/api/users.js ==================
import http from './http'
import { ElMessage } from 'element-plus'

// 通用请求处理函数
async function handleRequest(apiFunc, args = [], defaultErrorMsg = '操作失败') {
  try {
    const response = await apiFunc(...args)
    const data = response.data

    if (data.code !== undefined && data.code !== 200) {
      ElMessage.error(data.message || defaultErrorMsg)
      return { success: false, message: data.message || defaultErrorMsg, data: null, code: data.code }
    }

    return { success: true, data: data.data, message: data.message || '', code: data.code || 200 }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || defaultErrorMsg
    ElMessage.error(errorMsg)
    return { success: false, message: errorMsg, data: null }
  }
}

// 基础接口
export function createUser(data) {
  return http.post('/api/users/create', data)
}

export function getUserList(params = {}) {
  return http.get('/api/users/list', { params })
}

export function changeUserStatus(userId, active) {
  return http.patch(`/api/users/${userId}/status`, { active })
}

export function updateUserProfile(userId, payload) {
  return http.patch(`/api/users/${userId}/profile`, payload)
}

export function updateSelfProfile(payload) {
  return http.patch('/api/users/me/profile', payload)
}

export function resetUserPassword(userId) {
  return http.post(`/api/users/${userId}/password/reset`)
}

// service 层
export const userService = {
  create: (payload) => handleRequest(createUser, [payload], '创建用户失败'),
  getList: (params) => handleRequest(getUserList, [params], '获取用户列表失败'),
  toggleStatus: (id, active) => handleRequest(changeUserStatus, [id, active], '状态切换失败'),
  update: (id, payload) => handleRequest(updateUserProfile, [id, payload], '更新用户失败'),
  updateSelf: (payload) => handleRequest(updateSelfProfile, [payload], '更新个人信息失败'),
  resetPassword: async (id) => {
    const result = await handleRequest(resetUserPassword, [id], '重置密码失败')
    if (result.success && result.data) {
      // 兼容不同字段格式
      const newPassword = result.data.new_password || result.data.newPassword
      if (newPassword) {
        result.data.newPassword = newPassword
      }
    }
    return result
  }
}

export default userService
