// ================== src/api/test-cases.js ==================
import http from './http'
import { ElMessage } from 'element-plus'

// 通用请求处理函数
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

// 获取用例列表
function getTestCaseList(params = {}) {
  return http.get('/api/test-cases', { params })
}

// 批量删除用例
function batchDeleteTestCases(ids = []) {
  return http.post('/api/test-cases/batch-delete', { ids })
}

// service 层
export const testCaseService = {
  getList: (params) => handleRequest(getTestCaseList, [params], '获取用例列表失败'),
  batchDelete: (ids) => handleRequest(batchDeleteTestCases, [ids], '批量删除用例失败'),
}

export default testCaseService
