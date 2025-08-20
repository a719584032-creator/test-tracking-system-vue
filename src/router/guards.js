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

    // 用户管理界面
    if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
      return { path: '/403' } // 或者重定向
    }
    next()
  })
}
