// ================== src/api/testCases.js ==================
import http from './http'
import { ElMessage } from 'element-plus'

/**
 * 通用请求处理函数（与 departments.js 一致）
 * @param {Function} apiFunc
 * @param {Array} args
 * @param {String} defaultErrorMsg
 */
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

// ========== 基础 REST API 函数 ==========

// 用例列表 GET /api/test-cases/department/:department_id
function getTestCaseList(departmentId, params = {}) {
  return http.get(`/api/test-cases/department/${departmentId}`, { params })
}

// 用例详情 GET /api/test-cases/:case_id
function getTestCase(caseId) {
  return http.get(`/api/test-cases/${caseId}`)
}

// 创建用例 POST /api/test-cases
function createTestCase(payload) {
  return http.post('/api/test-cases', payload)
}

// 更新用例 PUT /api/test-cases/:case_id
function updateTestCase(caseId, payload) {
  return http.put(`/api/test-cases/${caseId}`, payload)
}

// 删除用例 DELETE /api/test-cases/:case_id
function deleteTestCase(caseId) {
  return http.delete(`/api/test-cases/${caseId}`)
}

// 批量删除用例 DELETE /api/test-cases/batch
function batchDeleteTestCases(payload) {
  return http.delete('/api/test-cases/batch', { data: payload })
}

// 复制用例 POST /api/test-cases/:case_id/copy
function copyTestCase(caseId, payload) {
  return http.post(`/api/test-cases/${caseId}/copy`, payload)
}

// 批量导入用例 POST /api/test-cases/batch-import
function batchImportTestCases(payload, config = {}) {
  return http.post('/api/test-cases/batch-import', payload, config)
}

// 用例历史 GET /api/test-cases/:case_id/history
function getTestCaseHistory(caseId, params = {}) {
  return http.get(`/api/test-cases/${caseId}/history`, { params })
}

// ========== Service 层 ==========
export const testCaseService = {
  /**
   * 获取用例列表
   * @param {number} departmentId
   * @param {Object} params
   */
  list: (departmentId, params = {}) => {
    const finalParams = { ...params }
    Object.keys(finalParams).forEach(k => {
      if (finalParams[k] === '' || finalParams[k] === null || finalParams[k] === undefined) {
        delete finalParams[k]
      }
    })
    return handleRequest(getTestCaseList, [departmentId, finalParams], '获取用例列表失败')
  },

  /** 获取用例详情 */
  get: (caseId) => handleRequest(getTestCase, [caseId], '获取用例详情失败'),

  /** 创建用例 */
  create: (payload) => handleRequest(createTestCase, [payload], '创建用例失败'),

  /** 更新用例 */
  update: (caseId, payload) => handleRequest(updateTestCase, [caseId, payload], '更新用例失败'),

  /** 删除用例 */
  remove: (caseId) => handleRequest(deleteTestCase, [caseId], '删除用例失败'),

  /** 批量删除用例 */
  batchDelete: (payload) => handleRequest(batchDeleteTestCases, [payload], '批量删除用例失败'),

  /** 复制用例 */
  copy: (caseId, payload) => handleRequest(copyTestCase, [caseId, payload], '复制用例失败'),

  /** 通过文件导入用例 */
  batchImportFromFile: ({ department_id: departmentId, group_id: groupId, file }) => {
    if (!departmentId) {
      return Promise.resolve({ success: false, message: '部门ID不能为空', data: null })
    }

    const formData = new FormData()
    formData.append('department_id', departmentId)
    if (groupId) formData.append('group_id', groupId)
    formData.append('file', file)

    const config = { headers: { 'Content-Type': 'multipart/form-data' } }
    return handleRequest(batchImportTestCases, [formData, config], '导入用例失败')
  },

  /** 获取用例历史 */
  history: (caseId, limit) => {
    const params = {}
    if (limit !== undefined && limit !== null) params.limit = limit
    return handleRequest(getTestCaseHistory, [caseId, params], '获取用例历史失败')
  } 
}

export default testCaseService
