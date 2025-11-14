<template>
  <div class="department-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <div class="title-section">
          <h2>{{ departmentInfo.name || '部门详情' }}</h2>
          <el-tag :type="getStatusTagType(departmentInfo.active)">
            {{ getStatusLabel(departmentInfo.active) }}
          </el-tag>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleManageMembers">
          <el-icon><Plus /></el-icon>
          成员管理
        </el-button>
      </div>
    </div>

    <!-- 部门基本信息 -->
    <div class="info-section">
      <el-card>
        <template #header>
          <span>基本信息</span>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="部门名称">{{ departmentInfo.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="部门编码">{{ departmentInfo.code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(departmentInfo.active)">
              {{ getStatusLabel(departmentInfo.active) }}
            </el-tag>
          </el-descriptions-item>    
          <el-descriptions-item label="创建时间">{{ formatDateTime(departmentInfo.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(departmentInfo.updated_at) }}</el-descriptions-item>
          <el-descriptions-item label="成员数量">{{ departmentInfo.counts?.members || 0 }}</el-descriptions-item>
          <el-descriptions-item label="项目数量">{{ departmentInfo.counts?.projects || 0 }}</el-descriptions-item>
          <el-descriptions-item label="测试用例">{{ departmentInfo.counts?.test_cases || 0 }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ departmentInfo.counts?.device_models || 0 }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="3">{{ departmentInfo.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- 成员列表筛选 -->
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

          <el-form-item label="手机号">
            <el-input
              v-model="filters.phone"
              placeholder="请输入手机号"
              clearable
              style="width: 150px"
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

          <el-form-item label="状态">
            <el-select
              v-model="filters.active"
              placeholder="请选择状态"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="status in MEMBER_STATUS_OPTIONS"
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
    </div>

    <!-- 成员列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="memberList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="department_member_id" label="成员ID" width="90">
          <template #default="{ row }">
            {{ row.department_member_id || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="username" label="用户名" min-width="120" />

        <el-table-column prop="email" label="邮箱" min-width="180">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="phone" label="手机号" min-width="130">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="department_role" label="部门角色" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.department_role || row.role)">
              {{ row.department_role_label || row.role_label || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="active" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.active)">
              {{ getStatusLabel(row.active) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEditMember(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleRemoveMember(row)"
            >
              移除
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

    <!-- 成员管理对话框 -->
    <ManageMembersDialog ref="manageMembersDialogRef" @success="handleRefresh" />
    
    <!-- 编辑成员角色对话框 -->
    <EditMemberRoleDialog ref="editMemberRoleDialogRef" @success="handleRefresh" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import ManageMembersDialog from '@/components/Departments/ManageMembersDialog.vue'
import EditMemberRoleDialog from '@/components/Departments/EditMemberRoleDialog.vue'
import { departmentService } from '@/api/departments'
import { formatDateTime } from '@/utils/format'
import { MEMBER_STATUS_OPTIONS } from '@/constants/department'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const departmentInfo = ref({})
const memberList = ref([])
const manageMembersDialogRef = ref()
const editMemberRoleDialogRef = ref()

const departmentId = computed(() => parseInt(route.params.id))


// 筛选条件
const filters = reactive({
  username: '',
  phone: '',
  email: '',
  active: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 状态标签颜色
const getStatusTagType = (active) => {
  return active ? 'success' : 'danger'
}

// 状态中文显示
const getStatusLabel = (active) => {
  return active ? '正常' : '禁用'
}

// 部门角色标签颜色，兼容旧字段
const getRoleTagType = (role) => {
  const roleKey = role || ''
  const roleTypes = {
    admin: 'warning',
    dept_admin: 'warning',
    dept_project_admin: 'warning',
    project_admin: 'warning',
    dept_member: 'info',
    member: 'info'
  }
  return roleTypes[roleKey] || 'info'
}


// 获取部门信息
const fetchDepartmentInfo = async () => {
  try {
    const resp = await departmentService.get(departmentId.value)
    if (!resp.success) {
      ElMessage.error(resp.message || '获取部门信息失败')
      return
    }
    departmentInfo.value = resp.data || {}
    console.log('部门信息:', departmentInfo.value) // 调试用
  } catch (e) {
    console.error('获取部门信息失败:', e)
    ElMessage.error('获取部门信息失败')
  }
}

// 获取成员列表
const fetchMemberList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize
    }
    
    // 只有非空值才添加到参数中
    if (filters.username) {
      params.username = filters.username
    }
    if (filters.phone) {
      params.phone = filters.phone
    }
    if (filters.email) {
      params.email = filters.email
    }
    if (filters.active !== '') {
      params.active = filters.active
    }
    
    const resp = await departmentService.listMembers(departmentId.value, params)
    if (!resp.success) {
      ElMessage.error(resp.message || '获取成员列表失败')
      return
    }
    
    memberList.value = (resp.data && resp.data.items) || []
    pagination.total = (resp.data && resp.data.total) || 0
  } catch (e) {
    console.error('获取成员列表失败:', e)
    ElMessage.error('获取成员列表失败')
  } finally {
    loading.value = false
  }
}

// 成员管理（替代原来的添加成员）
const handleManageMembers = () => {
  manageMembersDialogRef.value?.open(departmentInfo.value)
}

// 编辑成员角色
const handleEditMember = (member) => {
  editMemberRoleDialogRef.value?.open(member)
}

// 移除成员
const handleRemoveMember = async (member) => {
  try {
    await ElMessageBox.confirm(
      `确定要将 "${member.username}" 从部门中移除吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const resp = await departmentService.removeMember(departmentId.value, member.id)
    if (!resp.success) {
      ElMessage.error(resp.message || '移除成员失败')
      return
    }
    
    ElMessage.success('成员移除成功')
    fetchMemberList()
    // 同时更新部门信息中的成员数量
    fetchDepartmentInfo()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('移除成员失败:', e)
      ElMessage.error('移除成员失败')
    }
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchMemberList()
}

// 重置
const handleReset = () => {
  Object.assign(filters, {
    username: '',
    phone: '',
    email: '',
    active: ''
  })
  pagination.page = 1
  fetchMemberList()
}

// 分页
const handlePageChange = (p) => {
  pagination.page = p
  fetchMemberList()
}

const handlePageSizeChange = (s) => {
  pagination.pageSize = s
  pagination.page = 1
  fetchMemberList()
}

// 刷新
const handleRefresh = () => {
  fetchDepartmentInfo()
  fetchMemberList()
}

onMounted(() => {
  fetchDepartmentInfo()
  fetchMemberList()
})
</script>

<style scoped>
.department-detail-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-section h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.info-section {
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-left {
  flex: 1;
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
