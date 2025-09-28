import http from './http'
import { ElMessage } from 'element-plus'

const BASE_URL = '/api/test-plans'

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

const listTestPlans = (params = {}) => http.get(BASE_URL, { params })
const getTestPlan = (planId) => http.get(`${BASE_URL}/${planId}`)
const getTestPlanCases = (planId, params = {}) => http.get(`${BASE_URL}/${planId}/cases`, { params })
const getTestPlanCaseDetail = (planId, planCaseId) => http.get(`${BASE_URL}/${planId}/cases/${planCaseId}`)
const createTestPlan = (payload) => http.post(BASE_URL, payload)
const updateTestPlan = (planId, payload) => http.put(`${BASE_URL}/${planId}`, payload)
const deleteTestPlan = (planId) => http.delete(`${BASE_URL}/${planId}`)
const recordPlanResult = (planId, payload) => http.post(`${BASE_URL}/${planId}/results`, payload)

export const testPlansApi = {
  list(params = {}) {
    const finalParams = { ...params }
    Object.keys(finalParams).forEach((key) => {
      const value = finalParams[key]
      if (value === '' || value === null || value === undefined) {
        delete finalParams[key]
      }
    })
    return handleRequest(listTestPlans, [finalParams], '获取测试计划列表失败')
  },

  get(planId) {
    return handleRequest(getTestPlan, [planId], '获取测试计划详情失败')
  },

  getCases(planId, params = {}) {
    const finalParams = { ...params }
    Object.keys(finalParams).forEach((key) => {
      const value = finalParams[key]
      if (value === '' || value === null || value === undefined) {
        delete finalParams[key]
      }
    })
    return handleRequest(getTestPlanCases, [planId, finalParams], '获取计划用例失败')
  },

  getCaseDetail(planId, planCaseId) {
    return handleRequest(getTestPlanCaseDetail, [planId, planCaseId], '获取用例详情失败')
  },

  create(payload) {
    return handleRequest(createTestPlan, [payload], '创建测试计划失败')
  },

  update(planId, payload) {
    return handleRequest(updateTestPlan, [planId, payload], '更新测试计划失败')
  },

  remove(planId) {
    return handleRequest(deleteTestPlan, [planId], '删除测试计划失败')
  },

  recordResult(planId, payload) {
    return handleRequest(recordPlanResult, [planId, payload], '记录测试结果失败')
  }
}

testPlansApi.delete = testPlansApi.remove

export default testPlansApi
