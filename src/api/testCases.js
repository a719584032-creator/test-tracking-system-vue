// ================== src/api/testCases.js ==================
import http from './http'
import { ElMessage } from 'element-plus'

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
function getTestCaseList(params = {}) {
  return http.get('/api/test-cases', { params })
}
function getTestCase(id) {
  return http.get(`/api/test-cases/${id}`)
}
function createTestCase(payload) {
  return http.post('/api/test-cases', payload)
}
function updateTestCase(id, payload) {
  return http.put(`/api/test-cases/${id}`, payload)
}
function copyTestCase(id, payload) {
  return http.post(`/api/test-cases/${id}/copy`, payload)
}
function deleteTestCase(id) {
  return http.delete(`/api/test-cases/${id}`)
}
function restoreTestCase(id) {
  return http.post(`/api/test-cases/${id}/restore`)
}
function getTestCaseHistory(id) {
  return http.get(`/api/test-cases/${id}/history`)
}
function getCaseGroups() {
  return http.get('/api/test-cases/groups')
}

export const testCaseService = {
  list: (params) => handleRequest(getTestCaseList, [params], '获取用例列表失败'),
  get: (id) => handleRequest(getTestCase, [id], '获取用例详情失败'),
  create: (payload) => handleRequest(createTestCase, [payload], '创建用例失败'),
  update: (id, payload) => handleRequest(updateTestCase, [id, payload], '更新用例失败'),
  copy: (id, payload) => handleRequest(copyTestCase, [id, payload], '复制用例失败'),
  delete: (id) => handleRequest(deleteTestCase, [id], '删除用例失败'),
  restore: (id) => handleRequest(restoreTestCase, [id], '恢复用例失败'),
  history: (id) => handleRequest(getTestCaseHistory, [id], '获取用例历史失败'),
  groups: () => handleRequest(getCaseGroups, [], '获取用例分组失败')
}

export default testCaseService

