<!-- src/pages/TestCases/TestCaseManagePage.vue -->
<template>
  <div class="test-case-manage-page">
    <div class="page-header">
      <h1 class="page-title">测试用例管理</h1>
      <div class="header-actions">
        <el-select
          v-model="departmentId"
          placeholder="选择部门"
          @change="handleDeptChange"
          style="width: 200px; margin-right: 12px;"
        >
          <el-option
            v-for="dept in departments"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          />
        </el-select>
        <el-button
          type="primary"
          @click="handleRefresh"
          class="refresh-btn"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="layout">
      <div class="group-tree">
        <CaseGroupTree
          ref="groupTreeRef"
          :department-id="departmentId"
          @group-select="handleGroupSelect"
          @case-click="handleCaseClick"
        />
      </div>

      <div class="case-table">
        <div class="table-header">
          <h3 class="table-title">用例列表</h3>
          <el-button
            type="primary"
            @click="handleCreate"
            class="create-btn"
          >
            <el-icon><Plus /></el-icon>
            新建用例
          </el-button>
        </div>

        <div class="toolbar">
          <el-form
            :model="filters"
            inline
            class="search-form"
            @submit.prevent="handleSearch"
          >
            <el-form-item label="标题">
              <el-input
                v-model="filters.title"
                placeholder="请输入用例标题"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filters.status" placeholder="请选择状态" clearable>
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="优先级">
              <el-select v-model="filters.priority" placeholder="请选择优先级" clearable>
                <el-option
                  v-for="opt in priorityOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="filters.case_type" placeholder="请选择类型" clearable>
                <el-option
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input
                v-model="filters.keywords"
                placeholder="多个关键词用逗号分隔"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset">
                <el-icon><RefreshLeft /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <TestCaseTable
          :cases="caseList"
          :loading="loading"
          @edit="handleEdit"
          @copy="handleCopy"
          @delete="handleDelete"
          @history="handleHistory"
          @create="handleCreate"
        />

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="fetchCases"
          />
        </div>
      </div>
    </div>

    <!-- 用例表单 -->
    <TestCaseForm
      ref="formRef"
      :department-id="departmentId"
      @success="fetchCases"
    />

    <!-- 历史记录 -->
    <TestCaseHistory ref="historyRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  RefreshLeft
} from '@element-plus/icons-vue'

import CaseGroupTree from './components/CaseGroupTree.vue'
import TestCaseTable from './components/TestCaseTable.vue'
import TestCaseForm from './components/TestCaseForm.vue'
import TestCaseHistory from './components/TestCaseHistory.vue'

import { testCaseService } from '@/api/testCases'
import { departmentService } from '@/api/departments'
import {
  TEST_CASE_STATUS_OPTIONS,
  TEST_CASE_PRIORITY_OPTIONS,
  TEST_CASE_TYPE_OPTIONS
} from '@/constants/testCase'

const router = useRouter()

// 响应式数据
const departmentId = ref(null)
const departments = ref([])
const caseList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const filters = ref({
  title: '',
  status: '',
  priority: '',
  case_type: '',
  keywords: '',
  group_id: null
})

// 选项数据
const statusOptions = TEST_CASE_STATUS_OPTIONS
const priorityOptions = TEST_CASE_PRIORITY_OPTIONS
const typeOptions = TEST_CASE_TYPE_OPTIONS

// 组件引用
const groupTreeRef = ref()
const formRef = ref()
const historyRef = ref()

// 获取用例列表
const fetchCases = async () => {
  if (!departmentId.value) return
  loading.value = true
  try {
    const kw = parseKeywords(filters.value.keywords)
    const params = {
      title: filters.value.title,
      status: filters.value.status,
      priority: filters.value.priority,
      case_type: filters.value.case_type,
      keywords: kw.length ? kw : undefined,
      group_id: filters.value.group_id,
      page: page.value,
      page_size: pageSize.value
    }
    const resp = await testCaseService.list(departmentId.value, params)
    if (resp.success) {
      caseList.value = resp.data?.items || []
      total.value = resp.data?.total || 0
    }
  } finally {
    loading.value = false
  }
}

// 处理分组选择
const handleGroupSelect = (id) => {
  filters.value.group_id = id
  page.value = 1
  fetchCases()
}

// 处理用例点击（跳转到详情页）
const handleCaseClick = (caseId) => {
  router.push({ name: 'TestCaseDetail', params: { id: caseId } })
}

// 获取部门列表
const fetchDepartments = async () => {
  const resp = await departmentService.list()
  if (resp.success) {
    departments.value = resp.data?.items || []
    if (departments.value.length && !departmentId.value) {
      departmentId.value = departments.value[0].id
      fetchCases()
    }
  }
}

// 处理部门变化
const handleDeptChange = () => {
  filters.value.group_id = null
  groupTreeRef.value?.clearSelection()
  page.value = 1
  fetchCases()
}

// 用例操作
const handleCreate = () => {
  formRef.value?.open('create')
}

const handleEdit = (row) => {
  formRef.value?.open('edit', row)
}

const handleCopy = (row) => {
  formRef.value?.open('copy', row)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该用例吗？', '提示', { type: 'warning' })
    const resp = await testCaseService.remove(row.id)
    if (resp.success) {
      fetchCases()
    }
  } catch {}
}

const handleHistory = (row) => {
  historyRef.value?.open(row.id)
}


// 搜索和重置
const handleSearch = () => {
  page.value = 1
  fetchCases()
}

const handleReset = () => {
  Object.assign(filters.value, {
    title: '',
    status: '',
    priority: '',
    case_type: '',
    keywords: '',
    group_id: null
  })
  page.value = 1
  groupTreeRef.value?.clearSelection()
  fetchCases()
}

const handleSizeChange = () => {
  page.value = 1
  fetchCases()
}

const handleRefresh = () => {
  fetchCases()
  groupTreeRef.value?.refresh()
}

// 工具函数
const parseKeywords = (val) => {
  if (!val) return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.test-case-manage-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
}

.refresh-btn {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
}

.layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.group-tree {
  width: 300px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.case-table {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.table-title {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.create-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.toolbar {
  margin-bottom: 20px;
}

.search-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.search-form .el-form-item {
  margin-bottom: 16px;
  margin-right: 20px;
}

.search-form .el-form-item__label {
  color: #606266;
  font-weight: 500;
}

.search-form .el-input {
  width: 180px;
}

.search-form .el-select {
  width: 150px;
}

.search-form .el-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .layout {
    flex-direction: column;
    height: auto;
  }

  .group-tree {
    width: 100%;
    height: 400px;
  }

  .case-table {
    height: auto;
  }
}

@media (max-width: 768px) {
  .test-case-manage-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .search-form {
    padding: 16px;
  }

  .search-form .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .search-form .el-input,
  .search-form .el-select {
    width: 100%;
  }
}
</style>
