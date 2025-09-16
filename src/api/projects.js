import http from './http'
import { ElMessage } from 'element-plus'

const BASE_URL = '/api/projects'

/**
 * 统一请求包装，保持与其他模块一致的返回结构
 * @param {Function} apiFunc axios 请求函数
 * @param {Array} args 参数数组
 * @param {string} defaultErrorMsg 默认错误提示
 */
async function handleRequest(apiFunc, args = [], defaultErrorMsg = '操作失败') {
  try {
    const response = await apiFunc(...args)
    const payload = response.data || {}

    if (payload.code !== undefined && payload.code !== 200) {
      ElMessage.error(payload.message || defaultErrorMsg)
      return {
        success: false,
        message: payload.message || defaultErrorMsg,
        data: payload.data ?? null,
        code: payload.code
      }
    }

    return {
      success: true,
      data: payload.data,
      message: payload.message || '',
      code: payload.code || 200
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || defaultErrorMsg
    ElMessage.error(errorMsg)
    return { success: false, message: errorMsg, data: null }
  }
}

// 基础 REST API 请求函数
const listProjects = (params = {}) => http.get(BASE_URL, { params })
const getProject = (projectId) => http.get(`${BASE_URL}/${projectId}`)
const createProject = (payload) => http.post(BASE_URL, payload)
const updateProject = (projectId, payload) => http.put(`${BASE_URL}/${projectId}`, payload)
const deleteProject = (projectId) => http.delete(`${BASE_URL}/${projectId}`)

// 暴露给业务层使用的 API
export const projectsApi = {
  /**
   * 获取项目列表
   */
  list(params = {}) {
    const finalParams = { ...params }
    Object.keys(finalParams).forEach((key) => {
      const value = finalParams[key]
      if (value === '' || value === null || value === undefined) {
        delete finalParams[key]
      }
    })
    return handleRequest(listProjects, [finalParams], '获取项目列表失败')
  },

  /**
   * 获取项目详情
   */
  get(projectId) {
    return handleRequest(getProject, [projectId], '获取项目详情失败')
  },

  /**
   * 创建项目
   */
  create(payload) {
    return handleRequest(createProject, [payload], '创建项目失败')
  },

  /**
   * 更新项目
   */
  update(projectId, payload) {
    return handleRequest(updateProject, [projectId, payload], '更新项目失败')
  },

  /**
   * 删除项目
   */
  remove(projectId) {
    return handleRequest(deleteProject, [projectId], '删除项目失败')
  }
}

// 兼容调用：projectsApi.delete
projectsApi.delete = projectsApi.remove

export default projectsApi
