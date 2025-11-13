import { useAuthStore } from '@/stores/modules/auth'

export function setupRouterGuards(router) {
  // 全局前置守卫
  router.beforeEach((to, from, next) => {
    const auth = useAuthStore()
    
    // 检查登录状态
    auth.checkAuth()
    
    // 需要登录的页面
    if (to.meta.requiresAuth && !auth.isLoggedIn) {
      next('/login')
      return
    }
    
    // 已登录用户访问登录页，重定向到首页
    if (to.path === '/login' && auth.isLoggedIn) {
      next('/dashboard')
      return
    }

    // 角色权限控制
    if (Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
      const userRole = auth.role
      if (!userRole || !to.meta.roles.includes(userRole)) {
        next('/dashboard')
        return
      }
    }
    next()
  })
}
