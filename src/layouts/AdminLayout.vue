<template>
  <el-container style="height: 100vh;">
    <!-- 左侧菜单 -->
    <el-aside width="240px" class="sidebar">
      <!-- Logo区域 -->
      <div class="logo-container">
        <div class="logo-icon">
          <el-icon size="24"><Management /></el-icon>
        </div>
        <div class="logo-text">测试管理系统</div>
      </div>
      
      <!-- 菜单区域 -->
      <el-menu
        :default-active="activeMenu"
        background-color="transparent"
        text-color="#8c9db5"
        active-text-color="#ffffff"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard" class="menu-item">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/plans/board" class="menu-item">
          <el-icon><Document /></el-icon>
          <span>用例看板</span>
        </el-menu-item>
        <el-menu-item index="/users" class="menu-item">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主体内容 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ getBreadcrumbTitle() }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <!-- 通知图标 -->
          <el-badge :value="3" class="notification-badge">
            <el-icon size="18" class="notification-icon"><Bell /></el-icon>
          </el-badge>
          
          <!-- 用户信息 -->
          <el-dropdown class="user-dropdown" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ auth.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ auth.username }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { 
  House, 
  Document, 
  User, 
  Management, 
  Bell, 
  ArrowDown, 
  Setting, 
  SwitchButton 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const activeMenu = computed(() => route.path)

// 获取面包屑标题
const getBreadcrumbTitle = () => {
  const routeMap = {
    '/dashboard': '首页',
    '/plans/board': '用例看板',
    '/users': '用户管理'
  }
  return routeMap[route.path] || '首页'
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      // 跳转到个人资料页面
      break
    case 'settings':
      // 跳转到设置页面
      break
    case 'logout':
      logout()
      break
  }
}

const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
/* 侧边栏样式 */
.sidebar {
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

/* Logo区域 */
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.logo-icon {
  color: #409eff;
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.logo-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 菜单样式 */
.sidebar-menu {
  border-right: none;
  padding: 0 12px;
}

.sidebar-menu .menu-item {
  margin: 4px 0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.sidebar-menu .menu-item:hover {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.sidebar-menu .menu-item.is-active {
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.sidebar-menu .menu-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* 顶部导航栏 */
.header {
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left .el-breadcrumb {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 通知图标 */
.notification-badge {
  cursor: pointer;
}

.notification-icon {
  color: #606266;
  transition: color 0.3s ease;
}

.notification-icon:hover {
  color: #409eff;
}

/* 用户下拉菜单 */
.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  font-weight: 600;
}

.username {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  color: #909399;
  font-size: 12px;
  transition: transform 0.3s ease;
}

.user-dropdown.is-opened .dropdown-icon {
  transform: rotate(180deg);
}

/* 主内容区域 */
.main-content {
  background: #f0f2f5;
  padding: 24px;
  overflow-y: auto;
}

/* 下拉菜单项图标 */
.el-dropdown-menu__item .el-icon {
  margin-right: 8px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 200px !important;
  }
  
  .logo-text {
    font-size: 14px;
  }
  
  .header {
    padding: 0 16px;
  }
  
  .main-content {
    padding: 16px;
  }
}
</style>
