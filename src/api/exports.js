import http from './http'

export const exportsApi = {
  // 导出测试计划
  exportPlan(planId) {
    return http.get(`/export_plan/${planId}`, {
      responseType: 'blob'
    })
  }
}
