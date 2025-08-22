export const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/Login/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' }, 
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../pages/Dashboard/DashboardPage.vue'),
      },
      {
        path: 'plans/board',
        name: 'planBoard',
        component: () => import('../pages/Plans/PlanBoardPage.vue'),
        meta: { title: '用例看板' }
      },
      {
        path: 'users',
        name: 'userManage',
        component: () => import('../pages/Users/UserManagePage.vue'),
        meta:{
          title: '用户管理',
          requiresAuth: true,
          roles: ['admin'] // 路由守卫中校验
        },
      },
      {
        path: 'departments',
        name: 'DepartmentManage',
        component: () => import('../pages/Departments/DepartmentManagePage.vue'),
        meta:{
          title: '部门管理',
          requiresAuth: true
        //  roles: ['admin'] // 路由守卫中校验
        },
      },
      {
        path: '/departments/:id',
        name: 'DepartmentDetail',
        component: () => import('../pages/Departments/DepartmentDetail.vue'),
        meta: {
          title: '部门详情',
          requiresAuth: true
        }
      }
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: { template: '<div style="padding:40px">404 Not Found</div>' },
  },
]
