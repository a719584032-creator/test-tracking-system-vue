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
        <el-menu-item index="/test-plans" class="menu-item">
          <el-icon><Document /></el-icon>
          <span>测试计划</span>
        </el-menu-item>
        <el-menu-item index="/projects" class="menu-item">
          <el-icon><FolderOpened /></el-icon>
          <span>项目管理</span>
        </el-menu-item>
        <el-menu-item index="/device-models" class="menu-item">
          <el-icon><Cpu /></el-icon>
          <span>机型管理</span>
        </el-menu-item>
        <el-menu-item index="/test-cases" class="menu-item">
          <el-icon><Document /></el-icon>
          <span>用例管理</span>
        </el-menu-item>
        <el-menu-item index="/legacy-data" class="menu-item">
          <el-icon><DataLine /></el-icon>
          <span>历史用例结果</span>
        </el-menu-item>
        <el-menu-item index="/users" class="menu-item">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/departments" class="menu-item">
          <el-icon><User /></el-icon>
          <span>部门管理</span>
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
                <el-dropdown-item command="changePassword">
                  <el-icon><Lock /></el-icon>
                  修改密码
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

    <!-- 修改密码对话框 -->
    <ChangePasswordDialog 
      v-model:visible="changePasswordVisible"
      @success="handlePasswordChangeSuccess"
    />
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth'
import { authApi } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChangePasswordDialog from '@/components/Auth/ChangePasswordDialog.vue'
import { 
  House,
  Document,
  User,
  Management,
  Bell,
  ArrowDown,
  Setting,
  SwitchButton,
  Lock, // 新增锁定图标
  FolderOpened,
  Cpu,
  DataLine
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// 修改密码对话框显示状态
const changePasswordVisible = ref(false)

const activeMenu = computed(() => route.path)

// 获取面包屑标题
const getBreadcrumbTitle = () => {
  const routeMap = {
    '/dashboard': '首页',
    '/test-plans': '测试计划',
    '/projects': '项目管理',
    '/device-models': '机型管理',
    '/users': '用户管理',
    '/departments': '部门管理',
    '/test-cases': '用例管理',
    '/legacy-data': '历史用例结果',
  }

  // 动态详情：/test-cases/:id （id 为数字）
  if (/^\/test-plans\/\d+$/.test(route.path)) {
    return '测试计划详情'
  }

  if (/^\/test-cases\/\d+$/.test(route.path)) {
    return '用例详情'
  }

  // 或者更稳：依赖路由参数是否有 id
  // if (route.path.startsWith('/test-cases/') && route.params && route.params.id) {
  //   return '用例详情'
  // }

  return routeMap[route.path] || '首页'
}



// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      // 跳转到个人资料页面
      break
    case 'changePassword':
      changePasswordVisible.value = true
      break
    case 'settings':
      // 跳转到设置页面
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 密码修改成功处理
const handlePasswordChangeSuccess = () => {
  ElMessage.success('密码修改成功，请重新登录')
  // 可选：强制用户重新登录
  setTimeout(() => {
    logout()
  }, 1500)
}

// 退出登录处理
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }
    )
    
    await logout()
  } catch (error) {
    if (error === 'cancel') {
      return
    }
    console.error('退出登录确认失败:', error)
  }
}

// 退出登录逻辑
const logout = async () => {
  try {
    const loadingMessage = ElMessage({
      message: '正在退出登录...',
      type: 'info',
      duration: 0,
      showClose: false
    })

    await authApi.logout()
    loadingMessage.close()
    auth.logout()
    ElMessage.success('退出登录成功')
    router.push('/login')
    
  } catch (error) {
    console.error('退出登录失败:', error)
    auth.logout()
    ElMessage.warning('退出登录完成')
    router.push('/login')
  }
}
</script>

<!-- 样式保持不变 -->
<style scoped>
/* 原有样式保持不变 */
.sidebar {
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

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

.main-content {
  background: #f0f2f5;
  padding: 24px;
  overflow-y: auto;
}

.el-dropdown-menu__item .el-icon {
  margin-right: 8px;
  color: #909399;
}

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
