import http from './http'
import { ElMessage } from 'element-plus'

const BASE_URL = '/api/device-models'

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

const listDeviceModels = (params = {}) => http.get(BASE_URL, { params })
const getDeviceModel = (id) => http.get(`${BASE_URL}/${id}`)
const createDeviceModel = (payload) => http.post(BASE_URL, payload)
const updateDeviceModel = (id, payload) => http.put(`${BASE_URL}/${id}`, payload)
const enableDeviceModel = (id) => http.post(`${BASE_URL}/${id}/enable`)
const disableDeviceModel = (id) => http.post(`${BASE_URL}/${id}/disable`)

export const deviceModelsApi = {
  list(params = {}) {
    const finalParams = { ...params }
    Object.keys(finalParams).forEach((key) => {
      const value = finalParams[key]
      if (value === '' || value === null || value === undefined) {
        delete finalParams[key]
      }
    })
    return handleRequest(listDeviceModels, [finalParams], '获取机型列表失败')
  },

  get(id) {
    return handleRequest(getDeviceModel, [id], '获取机型详情失败')
  },

  create(payload) {
    return handleRequest(createDeviceModel, [payload], '创建机型失败')
  },

  update(id, payload) {
    return handleRequest(updateDeviceModel, [id, payload], '更新机型失败')
  },

  enable(id) {
    return handleRequest(enableDeviceModel, [id], '启用机型失败')
  },

  disable(id) {
    return handleRequest(disableDeviceModel, [id], '停用机型失败')
  }
}

export default deviceModelsApi
