// src/composables/useUsersTable.js
import { onMounted } from 'vue'
import { useUsersStore } from '@/stores/modules/users'

export function useUsersTable() {
  const store = useUsersStore()

  onMounted(() => {
    store.fetchList()
  })

  function onSearch() {
    store.fetchList({ page: 1 })
  }

  function onPageChange(p) {
    store.fetchList({ page: p })
  }

  function onSizeChange(size) {
    store.fetchList({ pageSize: size, page: 1 })
  }

  return {
    store,
    onSearch,
    onPageChange,
    onSizeChange
  }
}
