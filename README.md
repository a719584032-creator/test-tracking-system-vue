# PATVS Admin 前端项目

> 基于 Vue 3 + `<script setup>` + Pinia + Element Plus + ECharts + Axios + Vite 的测试管理 / 执行与统计后台前端。

---

## 🔥 核心特性
- 现代化技术栈：Vite 构建、按需组件、轻量快速
- 模块化架构：清晰的路由、状态、API、UI 分层
- 领域驱动：Plan / Case / Execution / Statistics 等领域拆分
- 统一数据访问：标准化 API 封装与错误处理
- 高可维护性：可复用组件 + composables 抽象
- 可演进：已预留权限、监控、国际化、性能优化扩展点

---

## 📂 项目结构

```
project-root/
├── .env.development / .env.production
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js
    ├── App.vue
    ├── router/
    │   ├── index.js
    │   ├── routes.js
    │   └── guards.js
    ├── stores/
    │   ├── index.js
    │   └── modules/
    │       ├── auth.js
    │       ├── filters.js
    │       └── plan.js
    ├── api/
    │   ├── http.js
    │   ├── auth.js
    │   ├── projects.js
    │   ├── plans.js
    │   ├── models.js
    │   ├── sheets.js
    │   ├── cases.js
    │   ├── statistics.js
    │   ├── exports.js
    │   └── users.js
    ├── layouts/
    │   ├── AdminLayout.vue
    │   └── AuthLayout.vue // 暂未实现
    ├── components/
    │   ├── Auth/ChangePasswordDialog.vue
    │   ├── Filters/PlanFilterBar.vue
    │   ├── Charts/{CaseCountBar.vue,PassRatePie.vue,TimeCompareBar.vue}
    │   ├── Tables/ExecutionTable.vue
    │   ├── Cases/ExecutionDetailsDialog.vue
    │   ├── Models/ModelManageDialog.vue //暂未实现
    │   ├── Users/AddUserDialog.vue //暂未实现
    │   ├── ImagePreview/{ImagePreview.vue,ImagePreviewDialog.vue}
    │   ├── PlanBoard/
    │   │   │   └── _internal/StatCard.vue
    │   │   │   └── CaseChartsGroup.vue
    │   │   │   └── CasesTable.vue
    │   │   │   └──ImageGalleryDialog.vue
    │   │   │   └── StatsCards.vue
    │   │   │   └── ImagePreviewDialog.vue  
    │   │   │   └── TimeCompareCard.vue
    │   └── Common/ (通用基础组件预留)
    ├── pages/
    │   ├── Login/LoginPage.vue
    │   ├── Dashboard/DashboardPage.vue
    │   ├── Plans/PlanBoardPage.vue    
    │   └── Users/UserManagePage.vue // 暂未实现
    ├── composables/
    │   ├── useCaseImages.js
    │   ├── useCasesBoardData.js
    │   ├── useImagePreview.js
    │   └── (useFetch / usePagination / useDialog 预留)
    ├── utils/
    │   ├── format.js
    │   ├── download.js
    │   └── imageUtils.js
    ├── assets/        # (建议新增：图标/图片)
    ├── styles/        # (建议新增：全局样式 & 变量)
    └── constants/     # (建议新增：枚举与常量映射)
```

---

## 🧱 分层架构

| 层 | 目录 | 说明 |
|----|------|------|
| App Shell | main.js / App.vue / layouts / router | 应用启动 / 路由与布局 |
| 页面 (Page) | pages/* | 组合 feature 组件，调度 store |
| 特性组件 (Feature) | components/* | 领域相关 UI 与交互 |
| UI/基础组件 | components/Common | 纯展示或基础交互 |
| 状态管理 | stores/modules/* | 领域状态 + 业务动作 |
| 数据访问 | api/* | REST API 封装 |
| 组合逻辑 | composables/* | 可复用行为逻辑 |
| 工具纯函数 | utils/* | 纯逻辑、无副作用 |
| 横切 | router/guards.js, http.js | 鉴权、错误、拦截、日志 |

数据流示意：

```
User → Component → Store(Action) → API(http) → Server
                       ↓
                  Store State → Reactive update → UI
```

---

## 🔐 鉴权与权限（规划）

- 登录流程：LoginPage → authStore.login() → token 注入 axios → 路由守卫
- 路由守卫：guards.js 中校验 token / 角色
- 计划扩展：
  - v-permission 指令（按钮/菜单级控制）
  - 动态路由基于用户权限清单过滤
  - 刷新 token（401 拦截 + refresh + 重放原请求）

---

## 🌐 API 封装规范

- 每资源一个文件：plans.js / users.js ...
- 命名建议：listX / getX / createX / updateX / deleteX / exportX
- 统一响应结构（拦截器归一化）：
```
{ success: boolean, data, code, message }
```
- 失败抛出统一错误对象（可扩展 ApiError）

示例（plans.js）：
```js
import http from './http'

export const listPlans = (params) => http.get('/plans', { params })
export const getPlan = (id) => http.get(`/plans/${id}`)
export const createPlan = (data) => http.post('/plans', data)
export const exportPlan = (id) => http.get(`/plans/${id}/export`, { responseType: 'blob' })
```

---

## 🗃️ 状态管理（Pinia）规范

- Action 前缀：fetch / load / create / update / remove / reset
- Getter 仅做派生，不含副作用
- 建议新增：
  - uiStore（主题 / 折叠 / 全局 loading 计数）
  - cacheStore（本地最近使用 ID / 偏好）
- 持久化策略：
  - Token：localStorage
  - 筛选条件：sessionStorage
  - 主题偏好：localStorage

---

## 🧩 Composables 建议清单

| 名称 | 作用 |
|------|------|
| useFetch(resourceKey, fetcher, options) | 通用数据获取 + 缓存 |
| usePagination() | 页码 / 每页数 / 重置工具 |
| useDialog() | 统一对话框开关与数据传递 |
| usePolling(interval) | 轮询任务（可暂停） |
| useShortcut(keys) | 快捷键绑定 |
| usePermission() | 权限判断 / 指令辅助 |

---

## 🛠️ 工具（utils）规划

- format.js：统一入口（数值/时间/百分比/文件）
- 后续拆分：
  - date.js / number.js / string.js / file.js
- 单测框架：Vitest（覆盖边界值和异常路径）

常用格式化约定：
| 场景 | 方法 |
|------|------|
| 更新时间标签 | formatRelativeTime |
| 短时间 | formatTimeShort |
| 文件大小 | formatSize |
| 百分比 | formatPercentage(value, digits) |
| 统计数字 | formatNumber |
| 金额 | formatCurrency(amount, '¥', 2) |

---

## 📊 性能与优化策略

| 目标 | 措施 |
|------|------|
| 首屏加速 | 路由懒加载 + ECharts 按需 + gzip |
| 渲染优化 | 表格大数据虚拟滚动 / 防抖输入 |
| API 减压 | SWR 缓存 + 请求合并/取消 |
| 构建体积 | rollup visualizer 分析 + Tree-shaking |
| 感知监控 | Web Vitals 上报 / 接口 P95 监控 |

---

## 🕵️ 可观测性（规划）

| 维度 | 指标 | 实现 |
|------|------|------|
| 性能 | FCP/LCP/CLS | web-vitals |
| 接口 | 成功率 / P95 | http 拦截收集 |
| 错误 | JS / Promise / API | 全局 errorHandler + 上报 |
| 行为 | 关键点击 | data-track + 埋点收集 |

---

## 🔐 安全措施（现状与计划）

| 类别 | 状态 | 计划 |
|------|------|------|
| Token 注入 | 已在 http.js | 加刷新逻辑 |
| CSRF | N/A | 若用 Cookie 模式：同步 XSRF-TOKEN |
| XSS | 仅默认转义 | 引入 DOMPurify 处理 v-html |
| 权限 | 路由层 | 按钮/字段级 v-permission |
| CSP | 未配置 | index.html 注入 CSP 头策略 |

---

## 🚀 演进路线图

| 阶段 | 目标 | 关键输出 |
|------|------|----------|
| P1 | 基础结构规范 | 修正命名 / uiStore / routes 分拆 |
| P2 | 抽象复用 | useFetch / usePagination / v-permission |
| P3 | 监控可观测 | Logger + API 计时 + Web Vitals |
| P4 | 国际化与主题 | vue-i18n + 暗黑模式 |
| P5 | 性能提升 | 虚拟表格 + 缓存策略 |
| P6 | 质量保障 | Vitest + E2E (Playwright) |
| P7 | 安全强化 | CSP + DOMPurify + 权限矩阵 |

---

## ✅ 代码规范

| 项目 | 约定 |
|------|------|
| 文件命名 | kebab-case (组件 PascalCase.vue 可接受) |
| 组件结构 | `<script setup>` + `<template>` + `<style scoped>` |
| Import 顺序 | Vue → 第三方 → @ 别名 → 相对路径 |
| Store 命名 | 与领域一致（plan.js / user.js） |
| 提交规范 | feat / fix / refactor / perf / chore / docs / test |
| Lint | ESLint + Prettier（建议集成 pre-commit） |

---

## 🧪 测试（规划）

| 层级 | 工具 | 覆盖重点 |
|------|------|----------|
| 单元 | Vitest | utils / composables |
| 组件 | Vitest + Vue Test Utils | 组件交互 & 渲染 |
| 集成 | Playwright | 登录 / 计划管理流程 |
| 合规模拟 | Mock Service Worker | API 行为一致性 |

---

## 📌 待办清单（Backlog）

- [ ] 修正 PlanBoardlPage.vue 命名
- [ ] 添加 uiStore（主题/侧边栏/全局 loading）
- [ ] 引入 useFetch 抽象
- [ ] 规划权限指令 v-permission
- [ ] format.js 单元测试补齐
- [ ] 路由模块化拆分 (modules/*.routes.js)
- [ ] 全局 ApiError 分类与统一提示策略
- [ ] 表格大数据虚拟滚动探索

---

## 🧭 ASCII 架构图

```
+---------------- App Shell (main / router / layouts) ---------------+
| Pages (Dashboard / Plans / Users / Login)                          |
|   -> Feature Components (Filters / Tables / Charts / Dialogs)      |
|        -> UI/Base Components (Common/*)                            |
+--------------------------------------------------------------------+
                  ↓ actions / getters
             [ Pinia Stores (auth/plan/user/filters) ]
                  ↓ API calls
             [ API Layer (plans/users/...) + http.js ]
                  ↓
                 Backend
```

---

## 💬 常见扩展 FAQ

| 问题 | 方案 |
|------|------|
| 如何新增一个领域模块？ | 新建 api/xxx.js + store modules/xxx.js + 页面与组件 |
| 如何统一错误提示？ | http 拦截器标准化 + 全局 errorHandler 分类处理 |
| 如何支持国际化？ | 引入 vue-i18n，format 函数接受 locale 注入 |
| 如何加权限到按钮？ | v-permission 指令：隐藏 / 禁用 DOM |

---

## 📄 License
内部项目

---

## 🤝 贡献
1. Fork / 分支：feature/xxx
2. 提交：遵循 commit 规范
3. PR：附变更说明与截图/测试结果

---


