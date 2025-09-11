<template>
  <div class="test-case-manage-page">
    <div class="layout">
      <div class="group-tree">
        <case-group-tree @select="handleGroupSelect" />
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
          @view="handleView"
        />
      </div>
    </div>
    <test-case-form ref="formRef" @success="handleRefresh" />
    <test-case-history ref="historyRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import CaseGroupTree from './components/CaseGroupTree.vue'
import TestCaseTable from './components/TestCaseTable.vue'
import TestCaseForm from './components/TestCaseForm.vue'
import TestCaseHistory from './components/TestCaseHistory.vue'
import { testCaseService } from '@/api/testCases'

const router = useRouter()

const filters = ref({
  group_id: null,
  keyword: ''
})
const loading = ref(false)
const caseList = ref([])

const formRef = ref()
const historyRef = ref()

const fetchCases = async () => {
  loading.value = true
  try {
    const resp = await testCaseService.list(filters.value)
    if (resp.success) {
      caseList.value = resp.data || []
    }
  } finally {
    loading.value = false
  }
}

const handleGroupSelect = (id) => {
  filters.value.group_id = id
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
  const resp = await testCaseService.delete(row.id)
  if (resp.success) {
    fetchCases()
  }
}
const handleHistory = (row) => {
  historyRef.value?.open(row.id)
}
const handleView = (row) => {
  router.push({ name: 'TestCaseDetail', params: { id: row.id } })
}
const handleRefresh = () => {
  fetchCases()
}

onMounted(fetchCases)
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
</style>
