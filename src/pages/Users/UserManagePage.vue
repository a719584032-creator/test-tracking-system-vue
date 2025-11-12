<!-- ================== src/pages/Users/UserManagePage.vue ================== -->
<template>
  <div class="user-manage-page">
    <!-- 筛选条件和操作按钮 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-form :model="filters" inline>
          <el-form-item label="用户名">
            <el-input
              v-model="filters.username"
              placeholder="请输入用户名"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="邮箱">
            <el-input
              v-model="filters.email"
              placeholder="请输入邮箱"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="手机号">
            <el-input
              v-model="filters.phone"
              placeholder="请输入手机号"
              clearable
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="角色">
            <el-select
              v-model="filters.role"
              placeholder="请选择角色"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="role in USER_ROLES"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select
              v-model="filters.active"
              placeholder="请选择状态"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="status in USER_STATUS_OPTIONS"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧操作按钮 -->
      <div class="filter-right">
        <el-button type="primary" @click="handleAddUser">
          <el-icon><Plus /></el-icon>
          添加用户
        </el-button>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" />

          <el-table-column prop="username" label="用户名" min-width="120" />

          <el-table-column prop="email" label="邮箱" min-width="180">
            <template #default="{ row }">
              {{ row.email || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="phone" label="电话" min-width="130">
            <template #default="{ row }">
              {{ formatPhone(row.phone) || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="role" label="角色" min-width="130">
            <template #default="{ row }">
              <el-tag :type="getRoleTagType(row.role)">
                {{ row.role_label || getRoleLabel(row.role) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="departments" label="部门" min-width="180">
            <template #default="{ row }">
              <span v-if="row.departments && row.departments.length">
                <el-tooltip
                  v-if="row.departments.join('，').length > 24"
                  effect="dark"
                  :content="row.departments.join('，')"
                  placement="top"
                >
                  <span>{{ shortDepartments(row.departments) }}</span>
                </el-tooltip>
                <span v-else>{{ row.departments.join('，') }}</span>
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="active" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.active"
                :loading="row.statusLoading"
                @change="handleStatusChange(row)"
              />
            </template>
          </el-table-column>

          <el-table-column prop="created_at" label="创建时间" min-width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="handleEditUser(row)"
              >
                编辑
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="handleResetPassword(row)"
              >
                重置密码
              </el-button>
            </template>
          </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 添加用户对话框 -->
    <AddUserDialog ref="addUserDialogRef" @success="handleRefresh" />
    <!-- 编辑用户对话框 -->
    <EditUserDialog ref="editUserDialogRef" @success="handleRefresh" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import AddUserDialog from '@/components/Users/AddUserDialog.vue'
import EditUserDialog from '@/components/Users/EditUserDialog.vue'
import { userService } from '@/api/users'
import { USER_ROLES, USER_STATUS_OPTIONS, ROLE_LABEL_MAP } from '@/constants/user'
import { formatDateTime, formatPhone } from '@/utils/format'

const loading = ref(false)
const userList = ref([])
const addUserDialogRef = ref()
const editUserDialogRef = ref()

// 筛选条件（删除了 role_label）
const filters = reactive({
  username: '',
  email: '',
  phone: '',
  role: '',
  active: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 角色中文显示
const getRoleLabel = (role) => {
  return ROLE_LABEL_MAP[role] || role
}

// 角色 tag 颜色
const getRoleTagType = (role) => {
  const typeMap = {
    sys_admin: 'danger',
    sys_operator: 'warning',
    sys_viewer: 'info',
    // 兼容旧角色
    admin: 'danger',
    dept_admin: 'warning',
    project_admin: 'info',
    user: 'success'
  }
  return typeMap[role] || 'info'
}

const shortDepartments = (deps) => {
  const joined = deps.join('，')
  return joined.length > 24 ? joined.slice(0, 24) + '...' : joined
}

// 获取用户列表
const fetchUserList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      username: filters.username,
      email: filters.email,
      phone: filters.phone,
      role: filters.role,
      active: filters.active
    }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) {
        delete params[k]
      }
    })
    const resp = await userService.getList(params)
    if (!resp.success) {
      ElMessage.error(resp.message || '获取用户列表失败')
      return
    }
    userList.value = (resp.data && resp.data.items) || []
    userList.value.forEach(u => { u.statusLoading = false })
    pagination.total = (resp.data && resp.data.total) || 0
  } catch (e) {
    console.error('获取用户列表失败:', e)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 状态切换
const handleStatusChange = async (user) => {
  try {
    user.statusLoading = true
    const resp = await userService.toggleStatus(user.id, user.active)
    if (!resp.success) {
      user.active = !user.active
      ElMessage.error(resp.message || '状态切换失败')
      return
    }
    ElMessage.success(`用户状态已${user.active ? '启用' : '禁用'}`)
  } catch (e) {
    user.active = !user.active
    console.error('状态切换失败:', e)
    ElMessage.error('状态切换失败')
  } finally {
    user.statusLoading = false
  }
}

// 重置密码
const handleResetPassword = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 "${user.username}" 的密码吗？`,
      '确认重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const resp = await userService.resetPassword(user.id)
    if (!resp.success) {
      ElMessage.error(resp.message || '重置密码失败')
      return
    }
    const newPassword = resp.data?.newPassword
    if (newPassword) {
      await ElMessageBox.alert(
        `新密码：${newPassword}`,
        '密码重置成功',
        {
          confirmButtonText: '确定',
          type: 'success'
        }
      )
    } else {
      ElMessage.success('密码重置成功')
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('重置密码失败:', e)
      ElMessage.error('重置密码失败')
    }
  }
}

// 添加用户
const handleAddUser = () => {
  addUserDialogRef.value?.open()
}

// 编辑用户
const handleEditUser = (user) => {
  editUserDialogRef.value?.open(user)
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

// 重置
const handleReset = () => {
  Object.assign(filters, {
    username: '',
    email: '',
    phone: '',
    role: '',
    active: ''
  })
  pagination.page = 1
  fetchUserList()
}

// 分页
const handlePageChange = (p) => {
  pagination.page = p
  fetchUserList()
}
const handlePageSizeChange = (s) => {
  pagination.pageSize = s
  pagination.page = 1
  fetchUserList()
}

// 刷新
const handleRefresh = () => fetchUserList()

onMounted(() => {
  fetchUserList()
})
</script>

<style scoped>
.user-manage-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.filter-left {
  flex: 1;
}
.filter-right {
  margin-left: 20px;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}
.table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
  margin-bottom: 8px;
}
</style>
