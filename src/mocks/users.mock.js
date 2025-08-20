// src/mocks/users.mock.js
import { nanoid } from 'nanoid'

let USERS = [
  {
    id: 'u_admin',
    username: 'admin',
    role: 'admin',
    enabled: true,
    createdAt: '2025-08-01T09:00:00Z'
  },
  {
    id: 'u_001',
    username: 'tester1',
    role: 'user',
    enabled: true,
    createdAt: '2025-08-10T10:10:00Z'
  },
  {
    id: 'u_002',
    username: 'tester2',
    role: 'user',
    enabled: false,
    createdAt: '2025-08-12T12:40:00Z'
  }
]

function delay(ms = 480) {
  return new Promise(r => setTimeout(r, ms))
}

export async function listUsers(params = {}) {
  await delay()
  const { keyword = '', role, enabled, page = 1, pageSize = 10 } = params
  let data = USERS.slice()
  if (keyword) {
    data = data.filter(u => u.username.toLowerCase().includes(keyword.toLowerCase()))
  }
  if (role) {
    data = data.filter(u => u.role === role)
  }
  if (enabled !== undefined && enabled !== '') {
    data = data.filter(u => u.enabled === (enabled === 'true' || enabled === true))
  }
  const total = data.length
  const start = (page - 1) * pageSize
  const end = start + Number(pageSize)
  return { list: data.slice(start, end), total }
}

export async function createUser(payload) {
  await delay()
  if (USERS.some(u => u.username === payload.username)) {
    return Promise.reject(new Error('用户名已存在'))
  }
  const user = {
    id: nanoid(),
    username: payload.username,
    role: payload.role || 'user',
    enabled: true,
    createdAt: new Date().toISOString()
  }
  USERS.unshift(user)
  return user
}

export async function updateUser(id, payload) {
  await delay()
  const idx = USERS.findIndex(u => u.id === id)
  if (idx === -1) throw new Error('用户不存在')
  USERS[idx] = { ...USERS[idx], ...payload }
  return USERS[idx]
}

export async function toggleUserStatus(id, enabled) {
  await delay()
  const user = USERS.find(u => u.id === id)
  if (!user) throw new Error('用户不存在')
  user.enabled = enabled
  return user
}

export async function deleteUser(id) {
  await delay()
  USERS = USERS.filter(u => u.id !== id)
  return { success: true }
}

export async function resetPassword(id) {
  await delay(300)
  if (!USERS.find(u => u.id === id)) throw new Error('用户不存在')
  return { success: true, message: '密码已重置为默认 123456' }
}

export async function getUser(id) {
  await delay(200)
  return USERS.find(u => u.id === id)
}
