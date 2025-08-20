import http from './http'


// 是否使用本地 mock（后端未完成时为 true）
const USE_MOCK = import.meta.env.VITE_USE_USERS_MOCK === 'true'

let mock
if (USE_MOCK) {
  // 动态导入（构建时 tree-shake）
  import('../mocks/users.mock').then(m => { mock = m })
}

export function listUsers(params) {
  if (USE_MOCK) return mock.listUsers(params)
  return http.get('/users', { params })
}

export function createUser(payload) {
  const { username, password, role } = payload
  const data = { username, password, role }
  return http.post('/add_user', data)
}

export function updateUser(id, payload) {
  if (USE_MOCK) return mock.updateUser(id, payload)
  return http.put(`/users/${id}`, payload)
}

export function toggleUserStatus(id, enabled) {
  if (USE_MOCK) return mock.toggleUserStatus(id, enabled)
  return http.patch(`/users/${id}/status`, { enabled })
}

export function deleteUser(id) {
  if (USE_MOCK) return mock.deleteUser(id)
  return http.delete(`/users/${id}`)
}

export function resetPassword(id) {
  if (USE_MOCK) return mock.resetPassword(id)
  return http.post(`/users/${id}/reset-password`)
}

// 查询单个（可选）
export function getUser(id) {
  if (USE_MOCK) return mock.getUser(id)
  return http.get(`/users/${id}`)
}
