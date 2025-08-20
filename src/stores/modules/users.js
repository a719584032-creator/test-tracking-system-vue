// src/stores/modules/users.js
import { defineStore } from 'pinia'
import {
  listUsers,
  createUser,
  deleteUser,
  toggleUserStatus,
  resetPassword
} from '@/api/users'

export const useUsersStore = defineStore('users', {
  state: () => ({
    loading: false,
    list: [],
    total: 0,
    query: {
      keyword: '',
      role: '',
      enabled: '',
      page: 1,
      pageSize: 10
    }
  }),
  actions: {
    async fetchList(extra = {}) {
      this.loading = true
      try {
        const params = { ...this.query, ...extra }
        const resp = await listUsers(params)
        this.list = resp.list
        this.total = resp.total
        this.query = { ...this.query, ...extra }
      } finally {
        this.loading = false
      }
    },
    async addUser(data) {
      const user = await createUser(data)
      // 简单策略：重新拉取，或者可以直接 unshift
      await this.fetchList({ page: 1 })
      return user
    },
    async removeUser(id) {
      await deleteUser(id)
      // 若当前页只有 1 条被删且不是第一页，回退页码
      if (this.list.length === 1 && this.query.page > 1) {
        await this.fetchList({ page: this.query.page - 1 })
      } else {
        await this.fetchList()
      }
    },
    async switchStatus(id, enabled) {
      const bak = [...this.list]
      // 乐观更新
      this.list = this.list.map(u => u.id === id ? { ...u, enabled } : u)
      try {
        await toggleUserStatus(id, enabled)
      } catch (e) {
        this.list = bak
        throw e
      }
    },
    async resetPwd(id) {
      return resetPassword(id)
    }
  }
})
