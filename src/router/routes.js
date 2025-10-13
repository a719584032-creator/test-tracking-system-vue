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
        path: 'test-plans',
        name: 'TestPlanList',
        component: () => import('../pages/TestPlans/TestPlanListPage.vue'),
        meta: { title: '测试计划', requiresAuth: true }
      },
      {
        path: 'test-plans/:id',
        name: 'TestPlanDetail',
        component: () => import('../pages/TestPlans/TestPlanDetailPage.vue'),
        meta: { title: '测试计划详情', requiresAuth: true }
      },
      {
        path: 'projects',
        name: 'ProjectManage',
        component: () => import('../pages/Projects/ProjectManagePage.vue'),
        meta: {
          title: '项目管理',
          requiresAuth: true
        }
      },
      {
        path: 'device-models',
        name: 'DeviceModelManage',
        component: () => import('../pages/DeviceModels/DeviceModelManagePage.vue'),
        meta: {
          title: '机型管理',
          requiresAuth: true
        }
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
        path: 'test-cases',
        name: 'TestCaseManage',
        component: () => import('../pages/TestCases/TestCaseManagePage.vue'),
        meta: {
          title: '用例管理',
          requiresAuth: true
        }
      },
      {
        path: 'legacy-data',
        name: 'LegacyData',
        component: () => import('../pages/LegacyData/LegacyDataPage.vue'),
        meta: {
          title: '历史用例结果',
          requiresAuth: true
        }
      },
      {
        path: 'test-cases/:id',
        name: 'TestCaseDetail',
        component: () => import('../pages/TestCases/TestCaseDetailPage.vue'),
        meta: {
          title: '用例详情',
          requiresAuth: true
        }
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
