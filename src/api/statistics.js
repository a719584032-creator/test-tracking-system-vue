import http from './http'

export const statisticsApi = {
  // 获取进度和通过率统计
  getProgressAndPassRate(params) {
    return http.get('/calculate_progress_and_pass_rate', {
      params
    })
  }
}
