import http from './http'

export const plansApi = {
  // 根据用户ID和项目名获取计划列表 - 修改为路径参数
  getPlanNames(userId, projectName) {
    // 对项目名称进行 URL 编码以处理中文和特殊字符
    const encodedProjectName = encodeURIComponent(projectName)
    return http.get(`/get_plan_names/${userId}/${encodedProjectName}`)
  },

  // 获取计划统计数据
  getPlanStatistics(planId) {
    return http.get(`/calculate_plan_statistics/${planId}`)
  },

  // 更新计划工作量和测试人员
  updatePlanWorkloadingTester(data) {
    return http.post('/update_project_workloading_tester', data)
  }
}
