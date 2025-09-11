import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

// Store for managing test case selection, filters and pagination
export const useTestCasesStore = defineStore('testCases', () => {
  // currently selected department and group
  const selectedDepartmentId = ref(null)
  const selectedGroupId = ref(null)

  // filter fields for querying test cases
  const filters = reactive({
    keyword: '',
    creator: '',
    status: ''
  })

  // pagination information
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // actions
  const setFilters = (newFilters = {}) => {
    Object.assign(filters, newFilters)
  }

  const changeGroup = ({ departmentId = null, groupId = null } = {}) => {
    selectedDepartmentId.value = departmentId
    selectedGroupId.value = groupId
  }

  const resetState = () => {
    selectedDepartmentId.value = null
    selectedGroupId.value = null
    Object.assign(filters, { keyword: '', creator: '', status: '' })
    Object.assign(pagination, { page: 1, pageSize: 10, total: 0 })
  }

  return {
    // getters / state
    selectedDepartmentId,
    selectedGroupId,
    filters,
    pagination,
    // actions
    setFilters,
    changeGroup,
    resetState
  }
})
