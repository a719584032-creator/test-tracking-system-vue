<!-- ================== src/pages/TestCases/components/TestCaseTable.vue ================== -->
<template>
  <div class="test-case-table">
    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filters" inline>
        <el-form-item label="标题">
          <el-input
            v-model="filters.title"
            placeholder="请输入标题"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable style="width: 140px">
            <el-option label="草稿" value="draft" />
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-select v-model="filters.priority" placeholder="请选择优先级" clearable style="width: 140px">
            <el-option label="P0" value="P0" />
            <el-option label="P1" value="P1" />
            <el-option label="P2" value="P2" />
            <el-option label="P3" value="P3" />
          </el-select>
        </el-form-item>

        <el-form-item label="类型">
          <el-select v-model="filters.case_type" placeholder="请选择类型" clearable style="width: 140px">
            <el-option label="功能" value="functional" />
            <el-option label="性能" value="performance" />
            <el-option label="兼容" value="compatibility" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键字">
          <el-input
            v-model="filters.keywords"
            placeholder="请输入关键字"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="分组ID">
          <el-input
            v-model="filters.group_id"
            placeholder="请输入分组ID"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
            批量删除
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 用例列表 -->
    <el-table
      v-loading="loading"
      :data="caseList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="priority" label="优先级" width="100" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="case_type" label="类型" width="120" />
      <el-table-column prop="group_name" label="分组" min-width="120" />
      <el-table-column prop="creator_name" label="创建人" width="120" />
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column prop="updated_at" label="更新时间" width="180" />
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { testCaseService } from '@/api/test-cases'

const filters = reactive({
  title: '',
  status: '',
  priority: '',
  case_type: '',
  keywords: '',
  group_id: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const caseList = ref([])
const loading = ref(false)
const selectedIds = ref([])

const fetchCaseList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...filters
    }
    const resp = await testCaseService.getList(params)
    if (resp.success) {
      caseList.value = resp.data?.items || []
      pagination.total = resp.data?.total || 0
    }
  } catch (e) {
    console.error('获取用例列表失败', e)
    ElMessage.error('获取用例列表失败')
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows) => {
  selectedIds.value = rows.map((r) => r.id)
}

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return
  try {
    await ElMessageBox.confirm('确定要删除选中的用例吗？', '提示', { type: 'warning' })
    const resp = await testCaseService.batchDelete(selectedIds.value)
    if (resp.success) {
      ElMessage.success('删除成功')
      fetchCaseList()
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('批量删除失败', e)
      ElMessage.error('删除失败')
    }
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchCaseList()
}

const handleReset = () => {
  Object.keys(filters).forEach((k) => (filters[k] = ''))
  pagination.page = 1
  fetchCaseList()
}

const handlePageChange = (p) => {
  pagination.page = p
  fetchCaseList()
}

const handlePageSizeChange = (s) => {
  pagination.pageSize = s
  pagination.page = 1
  fetchCaseList()
}

onMounted(fetchCaseList)
</script>

<style scoped>
.test-case-table {
  padding: 20px;
  background: #f5f7fa;
}
.filter-section {
  margin-bottom: 20px;
}
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
