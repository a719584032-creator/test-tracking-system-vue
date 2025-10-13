import http from './http'
import { ElMessage } from 'element-plus'

const BASE_URL = '/api/legacy-data'

async function handleRequest(apiFunc, args = [], defaultErrorMsg = '请求失败') {
  try {
    const response = await apiFunc(...args)
    const payload = response.data || {}

    if (payload.code !== undefined && payload.code !== 200) {
      ElMessage.error(payload.message || defaultErrorMsg)
      return {
        success: false,
        message: payload.message || defaultErrorMsg,
        data: payload.data ?? null,
        code: payload.code,
      }
    }

    return {
      success: true,
      data: payload.data,
      message: payload.message || '',
      code: payload.code || 200,
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || defaultErrorMsg
    ElMessage.error(errorMsg)
    return { success: false, message: errorMsg, data: null }
  }
}

const fetchProjects = (params = {}) => http.get(`${BASE_URL}/projects`, { params })
const fetchPlans = (params = {}) => http.get(`${BASE_URL}/plans`, { params })
const fetchModels = (planId) => http.get(`${BASE_URL}/plans/${planId}/models`)
const fetchSheets = (planId) => http.get(`${BASE_URL}/plans/${planId}/sheets`)
const fetchCases = (sheetId, params = {}) => http.get(`${BASE_URL}/sheets/${sheetId}/cases`, { params })
const fetchImages = (params = {}) => http.get(`${BASE_URL}/images`, { params })
const fetchPlanStatistics = (planId) => http.get(`${BASE_URL}/plans/${planId}/statistics`)

export const legacyDataApi = {
  listProjects(keyword = '') {
    const params = {}
    if (keyword) {
      params.keyword = keyword
    }
    return handleRequest(fetchProjects, [params], '获取项目列表失败')
  },

  listPlans(projectName, keyword = '') {
    const params = { project_name: projectName }
    if (keyword) {
      params.keyword = keyword
    }
    return handleRequest(fetchPlans, [params], '获取计划列表失败')
  },

  listModels(planId) {
    return handleRequest(fetchModels, [planId], '获取机型列表失败')
  },

  listSheets(planId) {
    return handleRequest(fetchSheets, [planId], '获取 Sheet 列表失败')
  },

  listCases(sheetId, modelId) {
    const params = { model_id: modelId }
    return handleRequest(fetchCases, [sheetId, params], '获取用例数据失败')
  },

  listImages(executionIds = []) {
    if (!executionIds || executionIds.length === 0) {
      return Promise.resolve({ success: true, data: {} })
    }
    const params = { execution_ids: executionIds.join(',') }
    return handleRequest(fetchImages, [params], '获取用例图片失败')
  },

  getPlanStatistics(planId) {
    return handleRequest(fetchPlanStatistics, [planId], '获取计划统计信息失败')
  },
}

export default legacyDataApi
