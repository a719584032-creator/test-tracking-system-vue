<!-- ================== \src\pages\Departments\DepartmentManagePage.vue ================== -->
<template>
  <div class="department-manage-page">
    <!-- 筛选条件和操作按钮 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-form :model="filters" inline>
          <el-form-item label="部门名称">
            <el-input
              v-model="filters.name"
              placeholder="请输入部门名称"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="部门编码">
            <el-input
              v-model="filters.code"
              placeholder="请输入部门编码"
              clearable
              style="width: 150px"
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
                v-for="status in DEPARTMENT_STATUS_OPTIONS"
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
        <el-button type="primary" @click="handleAddDepartment">
          <el-icon><Plus /></el-icon>
          添加部门
        </el-button>
      </div>
    </div>

    <!-- 部门列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="departmentList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" />

        <el-table-column prop="name" label="部门名称" min-width="150" />

        <el-table-column prop="code" label="部门编码" min-width="120">
          <template #default="{ row }">
            {{ row.code || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.description && row.description.length > 30"
              effect="dark"
              :content="row.description"
              placement="top"
            >
              <span>{{ row.description.slice(0, 30) }}...</span>
            </el-tooltip>
            <span v-else>{{ row.description || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="成员数量" width="100" align="center">
          <template #default="{ row }">
            <el-link
              v-if="row.members > 0"
              type="primary"
              @click="handleViewDetails(row)"
            >
              {{ row.members }}
            </el-link>
            <span v-else>0</span>
          </template>
        </el-table-column>

        <el-table-column label="项目数量" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.projects || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="测试用例" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.test_cases || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="设备型号" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.device_models || 0 }}</span>
          </template>
        </el-table-column>

        <!-- 修改状态列 - 去掉文字显示 -->
        <el-table-column prop="active" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>

        <!-- 修改操作列 - 详情按钮改为蓝色 -->
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEditDepartment(row)"
            >
              编辑
            </el-button>
            <el-button
              type="primary"
              size="small"
              plain
              @click="handleViewDetails(row)"
            >
              详情
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

    <!-- 添加部门对话框 -->
    <AddDepartmentDialog ref="addDepartmentDialogRef" @success="handleRefresh" />
    <!-- 编辑部门对话框 -->
    <EditDepartmentDialog ref="editDepartmentDialogRef" @success="handleRefresh" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import AddDepartmentDialog from '@/components/Departments/AddDepartmentDialog.vue'
import EditDepartmentDialog from '@/components/Departments/EditDepartmentDialog.vue'
import { departmentService } from '@/api/departments'
import { formatDateTime } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const departmentList = ref([])
const addDepartmentDialogRef = ref()
const editDepartmentDialogRef = ref()

// 部门状态选项 - 改为布尔值
const DEPARTMENT_STATUS_OPTIONS = [
  { label: '启用', value: true },
  { label: '禁用', value: false }
]

// 筛选条件 - 参数名称调整
const filters = reactive({
  name: '',      // 从 keyword 改为 name
  code: '',      // 新增部门编码筛选
  active: ''     // 从 status 改为 active，值为布尔类型
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 获取部门列表
const fetchDepartmentList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize
    }
    
    // 只有非空值才添加到参数中
    if (filters.name) {
      params.name = filters.name
    }
    if (filters.code) {
      params.code = filters.code
    }
    if (filters.active !== '') {
      params.active = filters.active
    }
    
    const resp = await departmentService.list(params)
    if (!resp.success) {
      ElMessage.error(resp.message || '获取部门列表失败')
      return
    }
    
    departmentList.value = (resp.data && resp.data.items) || []
    pagination.total = (resp.data && resp.data.total) || 0
  } catch (e) {
    console.error('获取部门列表失败:', e)
    ElMessage.error('获取部门列表失败')
  } finally {
    loading.value = false
  }
}

// 切换部门状态
const handleToggleStatus = async (department) => {
  const action = department.active ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}部门 "${department.name}" 吗？`,
      `确认${action}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const resp = await departmentService.update(department.id, { active: department.active })
    if (!resp.success) {
      // 恢复原状态
      department.active = !department.active
      ElMessage.error(resp.message || `${action}部门失败`)
      return
    }
    
    ElMessage.success(`部门${action}成功`)
  } catch (e) {
    if (e !== 'cancel') {
      console.error(`${action}部门失败:`, e)
      ElMessage.error(e.message || `${action}部门失败`)
    }
    // 恢复原状态
    department.active = !department.active
  }
}

// 添加部门
const handleAddDepartment = () => {
  addDepartmentDialogRef.value?.open()
}

// 编辑部门
const handleEditDepartment = (department) => {
  editDepartmentDialogRef.value?.open(department)
}

// 查看详情 - 跳转到详情页面
const handleViewDetails = (department) => {
  router.push({
    name: 'DepartmentDetail',
    params: { id: department.id }
  })
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchDepartmentList()
}

// 重置
const handleReset = () => {
  Object.assign(filters, {
    name: '',
    code: '',
    active: ''
  })
  pagination.page = 1
  fetchDepartmentList()
}

// 分页
const handlePageChange = (p) => {
  pagination.page = p
  fetchDepartmentList()
}

const handlePageSizeChange = (s) => {
  pagination.pageSize = s
  pagination.page = 1
  fetchDepartmentList()
}

// 刷新
const handleRefresh = () => fetchDepartmentList()

onMounted(() => {
  fetchDepartmentList()
})
</script>

<style scoped>
.department-manage-page {
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
