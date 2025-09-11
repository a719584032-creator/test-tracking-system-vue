// ================== src/api/caseGroups.js ==================
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

// 创建分组 POST /api/case-groups
function createCaseGroup(payload) {
  return http.post('/api/case-groups', payload)
}

// 分组详情 GET /api/case-groups/:group_id
function getCaseGroup(groupId, params = {}) {
  return http.get(`/api/case-groups/${groupId}`, { params })
}

// 更新分组 PUT /api/case-groups/:group_id
function updateCaseGroup(groupId, payload) {
  return http.put(`/api/case-groups/${groupId}`, payload)
}

// 删除分组 DELETE /api/case-groups/:group_id
function deleteCaseGroup(groupId) {
  return http.delete(`/api/case-groups/${groupId}`)
}

// 复制分组 POST /api/case-groups/:group_id/copy
function copyCaseGroup(groupId, payload) {
  return http.post(`/api/case-groups/${groupId}/copy`, payload)
}

// 分组树 GET /api/case-groups/:department_id/tree
function getCaseGroupTree(departmentId, params = {}) {
  return http.get(`/api/case-groups/${departmentId}/tree`, { params })
}

// 子分组列表 GET /api/case-groups/:department_id/children
function getCaseGroupChildren(departmentId, params = {}) {
  return http.get(`/api/case-groups/${departmentId}/children`, { params })
}

// ========== Service 层 ==========
export const caseGroupService = {
  /** 创建分组 */
  create: (payload) => handleRequest(createCaseGroup, [payload], '创建分组失败'),

  /** 获取分组详情 */
  get: (groupId, opts = {}) => {
    const params = { ...opts }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) {
        delete params[k]
      }
    })
    return handleRequest(getCaseGroup, [groupId, params], '获取分组详情失败')
  },

  /** 更新分组 */
  update: (groupId, payload) => handleRequest(updateCaseGroup, [groupId, payload], '更新分组失败'),

  /** 删除分组 */
  delete: (groupId) => handleRequest(deleteCaseGroup, [groupId], '删除分组失败'),

  /** 复制分组 */
  copy: (groupId, payload) => handleRequest(copyCaseGroup, [groupId, payload], '复制分组失败'),

  /** 获取分组树 */
  tree: (departmentId, opts = {}) => {
    const params = {}
    if (opts.with_cases === true) params.with_cases = 1
    if (opts.only_enabled === true) params.only_enabled = 1
    return handleRequest(getCaseGroupTree, [departmentId, params], '获取分组树失败')
  },

  /** 获取子分组 */
  children: (departmentId, params = {}) => {
    const finalParams = { ...params }
    Object.keys(finalParams).forEach(k => {
      if (finalParams[k] === '' || finalParams[k] === null || finalParams[k] === undefined) {
        delete finalParams[k]
      }
    })
    return handleRequest(getCaseGroupChildren, [departmentId, finalParams], '获取分组子节点失败')
  }
}

export default caseGroupService

