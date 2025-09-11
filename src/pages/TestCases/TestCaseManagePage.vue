<template>
  <div class="test-case-manage-page">
    <div class="dept-select">
      <el-select
        v-model="departmentId"
        placeholder="选择部门"
        style="width: 200px; margin-bottom: 20px"
        @change="handleDeptChange"
      >
        <el-option
          v-for="d in departments"
          :key="d.id"
          :label="d.name"
          :value="d.id"
        />
      </el-select>
    </div>
    <div class="layout">
      <div class="group-tree">
        <case-group-tree :department-id="departmentId" @select="handleGroupSelect" />
      </div>
      <div class="case-table">
        <div class="toolbar">
          <el-form :inline="true" :model="filters" class="search-form">
            <el-form-item label="标题">
              <el-input v-model="filters.title" placeholder="标题" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filters.status" placeholder="状态" clearable @change="handleSearch">
                <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="优先级">
              <el-select v-model="filters.priority" placeholder="优先级" clearable @change="handleSearch">
                <el-option v-for="opt in priorityOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="filters.case_type" placeholder="类型" clearable @change="handleSearch">
                <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键字">
              <el-input v-model="filters.keywords" placeholder="多个用逗号分隔" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch" style="margin-right:10px">搜索</el-button>
              <el-button @click="handleReset" style="margin-right:10px">重置</el-button>
              <el-button type="primary" @click="handleCreate">
                <el-icon><Plus /></el-icon>
                新建用例
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        <test-case-table
          :cases="caseList"
          :loading="loading"
          @edit="handleEdit"
          @copy="handleCopy"
          @delete="handleDelete"
          @history="handleHistory"
        />
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          background
          layout="total, prev, pager, next"
          class="pagination"
          @current-change="fetchCases"
          @size-change="handleSizeChange"

        />
      </div>
    </div>
    <test-case-form ref="formRef" :department-id="departmentId" @success="handleRefresh" />
    <test-case-history ref="historyRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import CaseGroupTree from './components/CaseGroupTree.vue'
import TestCaseTable from './components/TestCaseTable.vue'
import TestCaseForm from './components/TestCaseForm.vue'
import TestCaseHistory from './components/TestCaseHistory.vue'
import { testCaseService } from '@/api/testCases'
import { departmentService } from '@/api/departments'

import {
  TEST_CASE_PRIORITY_OPTIONS,
  TEST_CASE_TYPE_OPTIONS,
  TEST_CASE_STATUS_OPTIONS
} from '@/constants/testCase'

const filters = ref({
  title: '',
  status: '',
  priority: '',
  case_type: '',
  keywords: '',
  group_id: null
})
const loading = ref(false)
const caseList = ref([])
const departments = ref([])
const departmentId = ref(null)

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const priorityOptions = TEST_CASE_PRIORITY_OPTIONS
const typeOptions = TEST_CASE_TYPE_OPTIONS
const statusOptions = TEST_CASE_STATUS_OPTIONS


const formRef = ref()
const historyRef = ref()

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

const handleGroupSelect = (id) => {
  filters.value.group_id = id
  page.value = 1
  fetchCases()
}

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

const handleDeptChange = () => {
  filters.value.group_id = null
  page.value = 1
  fetchCases()
}

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
const handleRefresh = () => {
  fetchCases()
}

const handleSearch = () => {
  page.value = 1
  fetchCases()
}
const handleReset = () => {
  filters.value.title = ''
  filters.value.status = ''
  filters.value.priority = ''
  filters.value.case_type = ''
  filters.value.keywords = ''
  page.value = 1
  fetchCases()
}
const parseKeywords = (val) => {
  if (!val) return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}
const handleSizeChange = (val) => {
  pageSize.value = val
  page.value = 1
  fetchCases()
}

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.test-case-manage-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}
.layout {
  display: flex;
}
.group-tree {
  width: 250px;
  margin-right: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.case-table {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.toolbar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dept-select {
  margin-bottom: 20px;
}
</style>
