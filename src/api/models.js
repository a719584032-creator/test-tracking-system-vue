import http from './http'

export const modelsApi = {
  // 根据计划ID获取机型列表
  getModelNames(planId) {
    return http.get(`/get_model_names/${planId}`)
  }
}
