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
          <el-input
            v-model="filters.keyword"
            placeholder="搜索标题"
            clearable
            style="width: 200px; margin-right: 10px"
            @keyup.enter="fetchCases"
          />
          <el-button type="primary" @click="fetchCases" style="margin-right: 10px">搜索</el-button>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建用例
          </el-button>
        </div>
        <test-case-table
          :cases="caseList"
          :loading="loading"
          @edit="handleEdit"
          @copy="handleCopy"
          @delete="handleDelete"
          @history="handleHistory"
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
import CaseGroupTree from './components/CaseGroupTree.vue'
import TestCaseTable from './components/TestCaseTable.vue'
import TestCaseForm from './components/TestCaseForm.vue'
import TestCaseHistory from './components/TestCaseHistory.vue'
import { testCaseService } from '@/api/testCases'
import { departmentService } from '@/api/departments'

const filters = ref({
  group_id: null,
  keyword: ''
})
const loading = ref(false)
const caseList = ref([])
const departments = ref([])
const departmentId = ref(null)

const formRef = ref()
const historyRef = ref()

const fetchCases = async () => {
  if (!departmentId.value) return
  loading.value = true
  try {
    const params = {
      title: filters.value.keyword,
      group_id: filters.value.group_id
    }
    const resp = await testCaseService.list(departmentId.value, params)
    if (resp.success) {
      caseList.value = resp.data?.items || []
    }
  } finally {
    loading.value = false
  }
}

const handleGroupSelect = (id) => {
  filters.value.group_id = id
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
  const resp = await testCaseService.remove(row.id)
  if (resp.success) {
    fetchCases()
  }
}
const handleHistory = (row) => {
  historyRef.value?.open(row.id)
}
const handleRefresh = () => {
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
.dept-select {
  margin-bottom: 20px;
}
</style>
