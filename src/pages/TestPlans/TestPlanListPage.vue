<template>
  <div class="test-plan-list-page">
<!--    <div class="page-header">-->
<!--      <div>-->
<!--        <h2>测试计划</h2>-->
<!--        <p class="page-desc">查看测试计划列表，编辑基础信息或进入详情执行测试。</p>-->
<!--      </div>-->
<!--    </div>-->

    <el-card class="filter-card" shadow="never">
      <div class="filter-header">
        <el-form :model="filters" inline label-width="80px" class="filter-form">
          <el-form-item label="所属部门">
            <el-select
              v-model="filters.department_id"
              placeholder="全部部门"
              clearable
              filterable
              :loading="optionsLoading.departments"
              @focus="fetchDepartments"
              style="width: 220px"
            >
              <el-option
                v-for="dept in departmentOptions"
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="所属项目">
            <el-select
              v-model="filters.project_id"
              placeholder="全部项目"
              clearable
              filterable
              :disabled="!filters.department_id"
              :loading="optionsLoading.projects"
              @focus="fetchProjects"
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

        <el-button type="primary" class="create-plan-btn" @click="openCreateDrawer">
          新建测试计划
        </el-button>
      </div>
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

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="plan-actions">
              <el-tooltip
                v-if="isPlanArchived(row)"
                content="已归档的计划不可编辑"
                placement="top"
              >
                <span class="disabled-tooltip-wrapper">
                  <el-button type="primary" size="small" disabled>编辑</el-button>
                </span>
              </el-tooltip>
              <el-button
                v-else
                type="primary"
                size="small"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button type="info" size="small" plain @click="viewDetail(row)">详情</el-button>
            </div>
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
    <TestPlanCreateDrawer
      ref="createDrawerRef"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { testPlansApi } from '@/api/testPlans'
import { projectsApi } from '@/api/projects'
import { departmentService } from '@/api/departments'
import TestPlanEditDialog from '@/components/TestPlans/TestPlanEditDialog.vue'
import TestPlanCreateDrawer from '@/components/TestPlans/TestPlanCreateDrawer.vue'
import { formatDateTime } from '@/utils/format'
import {
  TEST_PLAN_STATUS_OPTIONS,
  TEST_PLAN_STATUS_TAG_MAP,
  resolvePlanStatusLabel
} from '@/constants/testPlan'

const router = useRouter()

const filters = reactive({
  department_id: null,
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

const departmentOptions = ref([])
const projectOptions = ref([])
const optionsLoading = reactive({
  departments: false,
  projects: false
})

const statusOptions = TEST_PLAN_STATUS_OPTIONS

const editDialogRef = ref()
const createDrawerRef = ref()

const formatDate = (value) => {
  if (!value) return ''
  return String(value).slice(0, 10)
}

const fetchPlans = async () => {
  loading.value = true
  try {
    const params = {
      department_id: filters.department_id,
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

const fetchDepartments = async () => {
  if (departmentOptions.value.length || optionsLoading.departments) return
  optionsLoading.departments = true
  try {
    const response = await departmentService.list({ page: 1, page_size: 1000 })
    if (!response?.success) return
    const items = response.data?.items || response.data?.list || []
    departmentOptions.value = items.map((item) => ({
      value: Number(item.id),
      label: item.name || item.label || `部门#${item.id}`
    }))
  } catch (error) {
    console.error('获取部门列表失败:', error)
  } finally {
    optionsLoading.departments = false
  }
}

let projectFetchToken = 0

const fetchProjects = async () => {
  const token = ++projectFetchToken
  optionsLoading.projects = true
  try {
    const params = { page: 1, page_size: 1000 }
    if (filters.department_id) {
      params.department_id = filters.department_id
    }
    const response = await projectsApi.list(params)
    if (!response?.success) return
    const items = response.data?.items || response.data?.list || []
    if (token !== projectFetchToken) return
    projectOptions.value = items.map((item) => ({
      value: Number(item.id),
      label: item.name || item.label || `项目#${item.id}`
    }))
    if (filters.project_id) {
      const exists = projectOptions.value.some((item) => item.value === filters.project_id)
      if (!exists) {
        filters.project_id = null
      }
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
  } finally {
    if (token === projectFetchToken) {
      optionsLoading.projects = false
    }
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchPlans()
}

const handleReset = () => {
  Object.assign(filters, {
    department_id: null,
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
  if (isPlanArchived(row)) {
    ElMessage.info('已归档的测试计划不可编辑')
    return
  }
  const { success, data } = await testPlansApi.get(row.id)
  if (!success) {
    return
  }
  const planData = { ...row, ...(data || {}) }
  editDialogRef.value?.open(planData)
}

const viewDetail = (row) => {
  if (!row?.id) return
  router.push({ name: 'TestPlanDetail', params: { id: row.id } })
}

const refreshList = () => {
  fetchPlans()
}

const openCreateDrawer = async () => {
  if (!departmentOptions.value.length) {
    await fetchDepartments()
  }
  createDrawerRef.value?.open({
    departmentId: filters.department_id,
    projectId: filters.project_id
  })
}

const handleCreateSuccess = () => {
  fetchPlans()
}

const resolveStatusTag = (status) => TEST_PLAN_STATUS_TAG_MAP[status] || 'info'
const resolveStatusLabel = (status) => resolvePlanStatusLabel(status)

const isPlanArchived = (plan) => plan?.status === 'archived'

watch(
  () => filters.department_id,
  () => {
    projectOptions.value = []
    filters.project_id = null
    fetchProjects()
  }
)

onMounted(() => {
  fetchDepartments()
  fetchProjects()
  fetchPlans()
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

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.filter-form {
  flex: 1;
}

.create-plan-btn {
  align-self: flex-start;
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
.plan-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.disabled-tooltip-wrapper {
  display: inline-flex;
}

.disabled-tooltip-wrapper .el-button {
  pointer-events: none;
}
</style>
