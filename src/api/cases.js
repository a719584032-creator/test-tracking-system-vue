import http from './http'

export const casesApi = {
  // 根据用例表ID和机型ID获取用例列表
  getCasesStatus(sheetId, modelId) {
    return http.get(`/get_cases_status/${sheetId}/${modelId}`)
  },

  // 重置用例状态
  resetCaseStatus(executionId) {
    return http.post(`/reset_case_status/${executionId}`)
  },

  getImages(executionId) {
    return http.post('/get_images', {
      execution_ids: [executionId]
    })
  }

}
