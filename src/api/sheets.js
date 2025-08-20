import http from './http'

export const sheetsApi = {
  // 根据计划ID获取用例表列表
  getSheetNames(planId) {
    return http.get(`/get_sheet_names/${planId}`)
  }
}
