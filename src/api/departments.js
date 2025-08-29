// ================== src/api/departments.js ==================
import http from './http'
import { ElMessage } from 'element-plus'

/**
 * 通用请求处理函数（与 users.js 一致）
 * @param {Function} apiFunc 具体 http 调用函数
 * @param {Array} args 调用参数数组
 * @param {String} defaultErrorMsg 默认错误文案
 * @returns {Promise<{success:boolean, data:any, message:string, code:number}>}
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

// ========== 基础 REST API 函数（纯 http 调用层） ==========

// 创建部门 POST /api/departments
function createDepartment(payload) {
  return http.post('/api/departments', payload)
}

// 部门列表 GET /api/departments
function getDepartmentList(params = {}) {
  return http.get('/api/departments', { params })
}

// 部门详情 GET /api/departments/:dept_id
function getDepartment(deptId, params = {}) {
  return http.get(`/api/departments/${deptId}`, { params })
}

// 更新部门 PUT /api/departments/:dept_id
function updateDepartment(deptId, payload) {
  return http.put(`/api/departments/${deptId}`, payload)
}

// 禁用部门 PATCH /api/departments/:dept_id?hard=1
function deleteDepartment(deptId, { hard } = {}) {
  return http.patch(`/api/departments/${deptId}/status`, {
    params: hard ? { hard: 1 } : undefined
  })
}

// 添加成员 POST /api/departments/:dept_id/members
function addDepartmentMember(deptId, payload) {
  return http.post(`/api/departments/${deptId}/members`, payload)
}

// 成员列表 GET /api/departments/:dept_id/members
function getDepartmentMemberList(deptId, params = {}) {
  return http.get(`/api/departments/${deptId}/members`, { params })
}

// 修改成员角色 PATCH /api/departments/role/:member_id

function updateDepartmentMemberRole(memberId, payload) {
  return http.patch(`/api/departments/role/${memberId}`, payload)
}

/**
 * 移除成员 DELETE /api/departments/:member_id
 * 同上，memberId 为成员记录的 ID。
 */
function removeDepartmentMember(deptId, memberId) {
  return http.delete(`/api/departments/${deptId}/members/${memberId}`)
}

// ========== Service 封装（带统一成功 / 失败结构） ==========
export const departmentService = {
  /**
   * 创建部门
   * @param {{name:string, code?:string, description?:string}} payload
   */
  create: (payload) =>
    handleRequest(createDepartment, [payload], '创建部门失败'),

  /**
   * 获取部门列表
   * @param {{keyword?:string,status?:string,page?:number,page_size?:number,order_by?:string}} params
   */
  list: (params = {}) => {
    const finalParams = { ...params }
    Object.keys(finalParams).forEach(k => {
      if (finalParams[k] === '' || finalParams[k] === null || finalParams[k] === undefined) {
        delete finalParams[k]
      }
    })
    return handleRequest(getDepartmentList, [finalParams], '获取部门列表失败')
  },

  /**
   * 获取部门详情
   * @param {number} deptId
   * @param {{with_members?:boolean}} opts
   */
  get: (deptId, opts = {}) => {
    const params = {}
    if (opts.with_members === true) {
      // 后端接受 "1"/"true" 均可，这里统一用 1
      params.with_members = 1
    }
    return handleRequest(getDepartment, [deptId, params], '获取部门详情失败')
  },

  /**
   * 更新部门
   * @param {number} deptId
   * @param {{name?:string,code?:string,description?:string,status?:string}} payload
   */
  update: (deptId, payload) =>
    handleRequest(updateDepartment, [deptId, payload], '更新部门失败'),

  /**
   * 删除部门
   * @param {number} deptId
   * @param {{hard?:boolean}} options
   */
  delete: (deptId, options = {}) =>
    handleRequest(deleteDepartment, [deptId, options], '禁用部门失败'),

  /**
   * 添加成员
   * @param {number} deptId
   * @param {{user_id:number, role?:string, upsert?:boolean}} payload
   */
  addMember: (deptId, payload) =>
    handleRequest(addDepartmentMember, [deptId, payload], '添加成员失败'),

  /**
   * 成员列表
   * @param {number} deptId
   * @param {{keyword?:string,role?:string,page?:number,page_size?:number,order_by?:string}} params
   */
  listMembers: (deptId, params = {}) => {
    const finalParams = { ...params }
    Object.keys(finalParams).forEach(k => {
      if (finalParams[k] === '' || finalParams[k] === null || finalParams[k] === undefined) {
        delete finalParams[k]
      }
    })
    return handleRequest(getDepartmentMemberList, [deptId, finalParams], '获取成员列表失败')
  },

  /**
   * 更新成员角色
   * @param {number} memberId
   * @param {{role:string}} payload
   */
  updateMemberRole: (memberId, payload) =>
    handleRequest(updateDepartmentMemberRole, [memberId, payload], '修改成员角色失败'),

  /**
   * 移除成员
   * @param {number} memberId
   */
  removeMember: (deptId, memberId) =>
    handleRequest(removeDepartmentMember, [deptId, memberId], '移除成员失败')
}

export default departmentService