// ================== src/api/case-groups.js ==================
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

// 获取用例分组树
function getCaseGroupTree() {
  return http.get('/api/case-groups/tree')
}

// service 层
export const caseGroupService = {
  tree: () => handleRequest(getCaseGroupTree, [], '获取用例分组失败'),
}

export default caseGroupService
