// 项目：PATVS Admin 前端重构
// 技术栈：Vue 3 + <script setup> + Pinia + Element Plus + ECharts + Axios + Vite

// ========== 目录结构 ==========
project-root/
├── .env.development
├── .env.production
├── index.html
├── package.json
├── vite.config.js
├── pnpm-lock.yaml (或 package-lock.json)
├── src/
│   ├── main.js                      // 应用入口
│   ├── App.vue
│   ├── router/                      // 路由模块
│   │   ├── index.js
│   │   ├── routes.js
│   │   └── guards.js
│   ├── stores/                       // Pinia 状态管理
│   │   ├── index.js
│   │   └── modules/
│   │       ├── auth.js
│   │       ├── filters.js
│   │       ├── plan.js
│   │       └── user.js
│   ├── api/                         // 接口封装
│   │   ├── http.js                  // axios 封装
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── plans.js
│   │   ├── models.js
│   │   ├── sheets.js
│   │   ├── cases.js
│   │   ├── executions.js
│   │   ├── statistics.js
│   │   ├── exports.js
│   │   ├── users.js
│   │   └── uploads.js
│   ├── layouts/                      // UI 布局层
│   │   ├── AdminLayout.vue
│   │   └── AuthLayout.vue
│   ├── components/                  // 可复用组件
│   │   ├── Filters/
│   │   │   └── PlanFilterBar.vue
│   │   ├── Charts/
│   │   │   ├── CaseCountBar.vue
│   │   │   ├── PassRatePie.vue
│   │   │   └── TimeCompareBar.vue
│   │   ├── Tables/
│   │   │   └── ExecutionTable.vue
│   │   ├── Cases/
│   │   │   └── BatchEditCaseTitleDialog.vue
│   │   ├── Models/
│   │   │   └── ModelManageDialog.vue
│   │   ├── Users/
│   │   │   └── AddUserDialog.vue
│   │   ├── ImagePreview/
│   │   │   ├── ImagePreviewDialog.vue
│   │   │   └── ImagePreview.vue
│   │   └── Common/
│   │       
│   ├── pages/                       // 页面视图
│   │   ├── Login/
│   │   │   └── LoginPage.vue
│   │   ├── Dashboard/
│   │   │   └── DashboardPage.vue
│   │   ├── Plans/
│   │   │   └── PlanBoardlPage.vue
│   │   └── Users/
│   │       └── UserManagePage.vue
│   ├── composables/                // 组合式函数
│   │   ├── useImageManager.js
│   │   ├── 
│   │   └── 
│   ├── utils/
│   │   ├── format.js
│   │   ├── download.js
│   │   └── imageUtils.js
│   ├── constants/
│   │   └── index.js
│   ├── mocks/                      // mock 数据（可选）
│   ├── assets/
│   │   └── logo.png
│   └── styles/
│       ├── base.css
│       └── variables.css
