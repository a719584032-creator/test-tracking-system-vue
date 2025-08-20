import http from './http'

// 获取项目列表
export const projectsApi = {
  // 获取用户的项目列表
  getProjectNames(userId) {
    return http.get(`/get_project_names/${userId}`)
  }
}
