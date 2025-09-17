<template>
  <div class="test-plan-list-page">
    <div class="page-header">
      <div>
        <h2>测试计划</h2>
        <p class="page-desc">查看测试计划列表，编辑基础信息或进入详情执行测试。</p>
      </div>
    </div>

    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline label-width="80px">
        <el-form-item label="所属项目">
          <el-select
            v-model="filters.project_id"
            placeholder="全部项目"
            clearable
            filterable
            :loading="optionsLoading.projects"
            @focus="fetchProjectsIfNeeded"
            style="width: 220px"
          >
            <el-option
              v-for="project in projectOptions"
              :key="project.value"
              :label="project.label"
              :value="project.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="计划状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option
              v-for="status in statusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="关键字">
          <el-input
            v-model="filters.keyword"
            placeholder="计划名称或描述"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="planList"
        stripe
        style="width: 100%"
        empty-text="暂无测试计划"
      >
        <el-table-column prop="id" label="ID" width="90" align="center" />

        <el-table-column prop="name" label="计划名称" min-width="180">
          <template #default="{ row }">
            <div class="plan-name">{{ row.name }}</div>
            <div class="plan-sub">{{ row.project_name || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="计划状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="resolveStatusTag(row.status)" disable-transitions>
              {{ resolveStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="start_date" label="开始日期" width="140" align="center">
          <template #default="{ row }">
            {{ formatDate(row.start_date) || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="end_date" label="结束日期" width="140" align="center">
          <template #default="{ row }">
            {{ formatDate(row.end_date) || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="测试人员" min-width="200">
          <template #default="{ row }">
            <div v-if="row.testers && row.testers.length" class="tester-tags">
              <el-tag
                v-for="tester in row.testers"
                :key="tester.id"
                size="small"
                type="info"
              >
                {{ tester.tester?.username || tester.username || tester.tester_name || `用户#${tester.user_id}` }}
              </el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="统计" min-width="220">
          <template #default="{ row }">
            <div class="stats-line">
              <span>通过：</span>
              <strong>{{ row.statistics?.passed ?? 0 }}</strong>
              <span class="split">阻塞：</span>
              <strong>{{ row.statistics?.blocked ?? 0 }}</strong>
              <span class="split">失败：</span>
              <strong>{{ row.statistics?.failed ?? 0 }}</strong>
            </div>
            <div class="stats-line">
              <span>未执行：</span>
              <strong>{{ row.statistics?.not_run ?? 0 }}</strong>
              <span class="split">总数：</span>
              <strong>{{ row.statistics?.total_results ?? 0 }}</strong>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.updated_at) || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" size="small" plain @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </el-card>

    <TestPlanEditDialog
      ref="editDialogRef"
      :status-options="statusOptions"
      @success="refreshList"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { testPlansApi } from '@/api/testPlans'
import { projectsApi } from '@/api/projects'
import TestPlanEditDialog from '@/components/TestPlans/TestPlanEditDialog.vue'
import { formatDateTime } from '@/utils/format'
import {
  TEST_PLAN_STATUS_OPTIONS,
  TEST_PLAN_STATUS_TAG_MAP,
  resolvePlanStatusLabel
} from '@/constants/testPlan'

const router = useRouter()

const filters = reactive({
  project_id: null,
  status: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const loading = ref(false)
const planList = ref([])

const projectOptions = ref([])
const optionsLoading = reactive({
  projects: false
})

const statusOptions = TEST_PLAN_STATUS_OPTIONS

const editDialogRef = ref()

const formatDate = (value) => {
  if (!value) return ''
  return String(value).slice(0, 10)
}

const fetchPlans = async () => {
  loading.value = true
  try {
    const params = {
      project_id: filters.project_id,
      status: filters.status,
      keyword: filters.keyword,
      page: pagination.page,
      page_size: pagination.pageSize
    }
    const response = await testPlansApi.list(params)
    if (!response?.success) return
    const data = response.data || {}
    const items = Array.isArray(data.items) ? data.items : []
    planList.value = items
    pagination.total = Number(data.total || items.length || 0)
  } catch (error) {
    console.error('获取测试计划失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchProjectsIfNeeded = async () => {
  if (projectOptions.value.length || optionsLoading.projects) return
  optionsLoading.projects = true
  try {
    const response = await projectsApi.list({ page: 1, page_size: 1000 })
    if (!response?.success) return
    const items = response.data?.items || response.data?.list || []
    projectOptions.value = items.map((item) => ({
      value: item.id,
      label: item.name
    }))
  } catch (error) {
    console.error('获取项目列表失败:', error)
  } finally {
    optionsLoading.projects = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchPlans()
}

const handleReset = () => {
  Object.assign(filters, {
    project_id: null,
    status: '',
    keyword: ''
  })
  pagination.page = 1
  fetchPlans()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchPlans()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchPlans()
}

const handleEdit = async (row) => {
  if (!row?.id) {
    ElMessage.warning('无法识别该测试计划')
    return
  }
  if (!projectOptions.value.length) {
    await fetchProjectsIfNeeded()
  }
  editDialogRef.value?.open(row)
}

const viewDetail = (row) => {
  if (!row?.id) return
  router.push({ name: 'TestPlanDetail', params: { id: row.id } })
}

const refreshList = () => {
  fetchPlans()
}

const resolveStatusTag = (status) => TEST_PLAN_STATUS_TAG_MAP[status] || 'info'
const resolveStatusLabel = (status) => resolvePlanStatusLabel(status)

onMounted(() => {
  fetchPlans()
  fetchProjectsIfNeeded()
})
</script>

<style scoped>
.test-plan-list-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-desc {
  color: var(--el-text-color-secondary);
  margin: 4px 0 0;
}

.filter-card,
.table-card {
  border-radius: 12px;
}

.plan-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.plan-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.tester-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stats-line {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.stats-line .split {
  margin-left: 12px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
