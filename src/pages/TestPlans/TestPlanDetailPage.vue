<template>
  <div class="test-plan-detail-page">
    <div class="page-header">
      <el-page-header content="测试计划详情" @back="goBack" />
      <div class="header-right">
        <el-tag :type="statusTag" size="large">{{ statusLabel }}</el-tag>
      </div>
    </div>

    <el-card v-loading="planLoading" class="info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>{{ planDetail?.name || '测试计划详情' }}</h3>
          <span class="card-sub">项目：{{ planDetail?.project_name || '-' }}</span>
        </div>
      </template>

      <div class="info-grid">
        <div class="info-item">
          <span class="label">计划周期</span>
          <span class="value">{{ formatDate(planDetail?.start_date) }} ~ {{ formatDate(planDetail?.end_date) }}</span>
        </div>
        <div class="info-item">
          <span class="label">创建人</span>
          <span class="value">{{ planDetail?.created_by_name || `用户#${planDetail?.creator.username ?? '-'}` }}</span>
        </div>
        <div class="info-item">
          <span class="label">创建时间</span>
          <span class="value">{{ formatDateTime(planDetail?.created_at) || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">更新时间</span>
          <span class="value">{{ formatDateTime(planDetail?.updated_at) || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">测试人员</span>
          <span class="value">{{ testerNames }}</span>
        </div>
        <div class="info-item">
          <span class="label">关联机型</span>
          <span class="value">{{ deviceNames }}</span>
        </div>
      </div>

      <el-descriptions
        v-if="planDetail?.description"
        class="description-block"
        :column="1"
        border
      >
        <el-descriptions-item label="计划描述">
          <div class="plan-description">{{ planDetail.description }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="stats-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>执行统计</h3>
        </div>
      </template>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">通过</span>
          <span class="stat-value success">{{ planDetail?.statistics?.passed ?? 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">失败</span>
          <span class="stat-value danger">{{ planDetail?.statistics?.failed ?? 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">阻塞</span>
          <span class="stat-value warning">{{ planDetail?.statistics?.blocked ?? 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">跳过</span>
          <span class="stat-value info">{{ planDetail?.statistics?.skipped ?? 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">未执行</span>
          <span class="stat-value">{{ planDetail?.statistics?.not_run ?? 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总计</span>
          <span class="stat-value">{{ planDetail?.statistics?.total_results ?? 0 }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="cases-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>计划用例</h3>
          <span class="card-sub">共 {{ planCases.length }} 条用例</span>
        </div>
      </template>

      <el-form :inline="true" :model="caseFilters" class="case-filter-form">
        <el-form-item label="目录">
          <el-select
            v-model="caseFilters.group_path"
            placeholder="全部目录"
            clearable
            filterable
            class="filter-item"
          >
            <el-option
              v-for="path in groupPathOptions"
              :key="path"
              :label="formatGroupPathLabel(path)"
              :value="path"
            />
          </el-select>
        </el-form-item>
      <el-form-item label="优先级">
        <el-select
          v-model="caseFilters.priority"
          placeholder="全部优先级"
          clearable
          class="filter-item"
        >
          <el-option
            v-for="option in priorityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="设备">
        <el-select
          v-model="caseFilters.device_model_id"
          placeholder="全部设备"
          clearable
          filterable
          class="filter-item"
        >
          <el-option
            v-for="option in deviceOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="结果">
        <el-select
          v-model="caseFilters.status"
          placeholder="全部状态"
            clearable
            class="filter-item"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="caseFilters.keyword"
            placeholder="搜索用例标题"
            clearable
            class="filter-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <el-icon class="search-icon"><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="casesLoading"
        :data="executionRows"
        stripe
        empty-text="暂无用例数据"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="case-expand">
              <div class="expand-section" v-if="row.caseInfo.preconditions">
                <h4>前置条件</h4>
                <p>{{ row.caseInfo.preconditions }}</p>
              </div>
              <div class="expand-section" v-if="row.caseInfo.steps?.length">
                <h4>测试步骤</h4>
                <ol>
                  <li v-for="step in row.caseInfo.steps" :key="`${step.no}-${step.action}`">
                    <div class="step-line">
                      <strong>步骤 {{ step.no }}：</strong>{{ step.action || '-' }}
                    </div>
                    <div v-if="step.expected" class="step-note">期望：{{ step.expected }}</div>
                    <div v-if="step.note" class="step-note">备注：{{ step.note }}</div>
                  </li>
                </ol>
              </div>
              <div class="expand-section" v-if="row.caseInfo.expected_result">
                <h4>预期结果</h4>
                <p>{{ row.caseInfo.expected_result }}</p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="case_title" label="用例" min-width="220">
          <template #default="{ row }">
            <div class="case-title">{{ row.case_title }}</div>
            <div class="case-meta">
              <span>优先级：{{ row.caseInfo.priority || '-' }}</span>
              <span v-if="row.caseInfo.group_path" class="case-meta-divider">|</span>
              <span v-if="row.caseInfo.group_path">目录：{{ formatGroupPathLabel(row.caseInfo.group_path) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="device_model_name" label="执行机型" min-width="180">
          <template #default="{ row }">
            {{ row.device_model_name || row.device_model_code || (row.device_model_id ? `机型 #${row.device_model_id}` : '通用') }}
          </template>
        </el-table-column>

        <el-table-column prop="result" label="结果" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="resolveResultTag(row.result)" disable-transitions>
              {{ resolveExecutionResultLabel(row.result) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="executed_at" label="执行时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.executed_at) || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="executed_by" label="执行人" min-width="160">
          <template #default="{ row }">
            {{ row.executed_by_name || resolveUserName(row.executed_by) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openResultDialog(row)">
              记录结果
            </el-button>
            <el-button size="small" @click="openCaseDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <TestPlanResultDialog
      ref="resultDialogRef"
      :plan-id="planId"
      @success="handleResultSaved"
    />
    <PlanCaseDetailDialog ref="caseDetailDialogRef" :plan-id="planId" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { testPlansApi } from '@/api/testPlans'
import {
  EXECUTION_RESULT_OPTIONS,
  EXECUTION_RESULT_TAG_MAP,
  resolveExecutionResultLabel,
  resolvePlanStatusLabel,
  TEST_PLAN_STATUS_TAG_MAP
} from '@/constants/testPlan'
import { TEST_CASE_PRIORITY_LABEL_MAP, TEST_CASE_PRIORITY_OPTIONS } from '@/constants/testCase'
import { formatDateTime } from '@/utils/format'
import TestPlanResultDialog from '@/components/TestPlans/TestPlanResultDialog.vue'
import PlanCaseDetailDialog from '@/components/TestPlans/PlanCaseDetailDialog.vue'

const route = useRoute()
const router = useRouter()

const planId = ref(Number(route.params.id))
const planLoading = ref(false)
const casesLoading = ref(false)
const planDetail = ref(null)
const planCases = ref([])

const resultDialogRef = ref()
const caseDetailDialogRef = ref()

const caseFilters = reactive({
  group_path: '',
  priority: '',
  device_model_id: '',
  status: '',
  keyword: ''
})

const priorityOptions = ref(TEST_CASE_PRIORITY_OPTIONS.map((option) => ({ ...option })))
const statusOptions = EXECUTION_RESULT_OPTIONS
const groupPathOptions = ref([])
const deviceOptions = computed(() => {
  const devices = planDetail.value?.device_models || []
  const map = new Map()
  devices.forEach((item) => {
    const id =
      item.device_model_id || item.device_model?.id || item.id || item.device_model?.device_model_id
    if (!id) return
    const normalizedId = Number(id)
    if (Number.isNaN(normalizedId)) return
    if (!map.has(normalizedId)) {
      const name =
        item.device_model?.name ||
        item.name ||
        item.device_model_name ||
        item.device_name ||
        `机型#${normalizedId}`
      map.set(normalizedId, name)
    }
  })
  return Array.from(map, ([value, label]) => ({ value, label }))
})

/** 将 user_id -> 显示名 做一个映射，方便回退展示执行人 */
const testerMap = computed(() => {
  const map = new Map()
  const testers = planDetail.value?.testers || []
  testers.forEach((item) => {
    const id = item.user_id || item.tester?.id
    const name = item.tester?.username || item.username || item.name || item.tester_name
    if (id) map.set(Number(id), name || `用户#${id}`)
  })
  if (planDetail.value?.created_by) {
    const id = Number(planDetail.value.created_by)
    if (!map.has(id)) map.set(id, planDetail.value.created_by_name || `用户#${id}`)
  }
  return map
})

const testerNames = computed(() => {
  const testers = planDetail.value?.testers || []
  if (!testers.length) return '-'
  return testers
    .map((item) => item.tester?.username || item.username || item.name || item.tester_name || `用户#${item.user_id}`)
    .join('、')
})

const deviceNames = computed(() => {
  const devices = planDetail.value?.device_models || []
  if (!devices.length) return '-'
  return devices
    .map((item) => item.device_model?.name || item.name || item.device_model_name || `机型#${item.device_model_id}`)
    .join('、')
})

/** 展平 cases -> execution_results 为表格行 */
const executionRows = computed(() => {
  const cases = planCases.value
  if (!cases?.length) return []
  const rows = []
  cases.forEach((caseItem) => {
    const executions = Array.isArray(caseItem.execution_results) ? caseItem.execution_results : []
    const caseInfo = {
      plan_case_id: caseItem.id,
      case_id: caseItem.case_id,
      title: caseItem.title,
      priority: caseItem.priority,
      group_path: caseItem.group_path,
      preconditions: caseItem.preconditions,
      steps: Array.isArray(caseItem.steps) ? caseItem.steps : [],
      expected_result: caseItem.expected_result,
      latest_result: caseItem.latest_result
    }
    if (!executions.length) {
      rows.push({
        case_id: caseItem.case_id,
        case_title: caseItem.title,
        plan_case_id: caseItem.id,
        result: caseItem.latest_result,
        executed_at: null,
        executed_by: null,
        executed_by_name: null,
        device_model_id: null,
        device_model_name: null,
        device_model_code: null,
        plan_device_model_id: null,
        remark: null,
        failure_reason: null,
        bug_ref: null,
        run_id: null,
        execution_id: null,
        caseInfo
      })
      return
    }
    executions.forEach((exec) => {
      rows.push({
        case_id: caseItem.case_id,
        case_title: caseItem.title,
        plan_case_id: exec.plan_case_id || caseItem.id,
        plan_case_internal_id: caseItem.id,
        device_model_id: exec.device_model_id,
        device_model_name:
          exec.device_model?.name || exec.device_model?.device_model?.name || exec.device_model_name,
        device_model_code:
          exec.device_model?.model_code || exec.device_model?.device_model?.model_code || exec.device_model_code,
        plan_device_model_id: exec.plan_device_model_id,
        result: exec.result,
        executed_at: exec.executed_at,
        executed_by: exec.executed_by,
        executed_by_name: exec.executed_by_name,
        remark: exec.remark,
        failure_reason: exec.failure_reason,
        bug_ref: exec.bug_ref,
        run_id: exec.run_id,
        execution_id: exec.id,
        caseInfo
      })
    })
  })
  return rows
})

const statusTag = computed(() => TEST_PLAN_STATUS_TAG_MAP[planDetail.value?.status] || 'info')
const statusLabel = computed(() => resolvePlanStatusLabel(planDetail.value?.status))

const resolveResultTag = (result) => EXECUTION_RESULT_TAG_MAP[result] || 'info'

const formatDate = (value) => (value ? String(value).slice(0, 10) : '-')

const stripGroupRootPrefix = (path = '') => {
  const normalized = String(path)
  if (normalized === 'root' || normalized === 'root/') return ''
  if (normalized.startsWith('root/')) return normalized.slice(5)
  return normalized
}

const formatGroupPathLabel = (path) => {
  if (!path) return ''
  const stripped = stripGroupRootPrefix(path)
  return stripped || '根目录'
}

const resolveUserName = (userId) => {
  if (!userId) return '-'
  const name = testerMap.value.get(Number(userId))
  return name || `用户#${userId}`
}

const goBack = () => {
  router.back()
}

const fetchDetail = async () => {
  if (!planId.value) return
  planLoading.value = true
  try {
    const response = await testPlansApi.get(planId.value)
    if (!(response && response.code === 200)) {
      ElMessage.error(response?.message || '获取测试计划失败')
      return
    }
    planDetail.value = response.data
    if (caseFilters.device_model_id) {
      const selectedId = Number(caseFilters.device_model_id)
      const hasDevice = deviceOptions.value.some((option) => option.value === selectedId)
      if (!hasDevice) {
        caseFilters.device_model_id = ''
      }
    }
  } catch (error) {
    console.error('获取计划详情失败:', error)
  } finally {
    planLoading.value = false
  }
}

const fetchPlanCases = async () => {
  if (!planId.value) return
  casesLoading.value = true
  try {
    const params = {
      group_path: caseFilters.group_path,
      priority: caseFilters.priority,
      device_model_id: caseFilters.device_model_id,
      status: caseFilters.status
    }
    if (caseFilters.keyword) {
      params.keyword = caseFilters.keyword
    }
    const response = await testPlansApi.getCases(planId.value, params)
    if (!response?.success) return
    const cases = Array.isArray(response.data?.cases) ? response.data.cases : []
    planCases.value = cases
    const uniquePaths = new Set(groupPathOptions.value)
    const uniquePriorities = new Map(priorityOptions.value.map((option) => [option.value, option.label]))
    cases.forEach((item) => {
      if (item.group_path) uniquePaths.add(item.group_path)
      if (item.priority) {
        const priorityValue = String(item.priority)
        const label = TEST_CASE_PRIORITY_LABEL_MAP[priorityValue] || priorityValue
        uniquePriorities.set(priorityValue, label)
      }
    })
    groupPathOptions.value = Array.from(uniquePaths).sort()
    priorityOptions.value = Array.from(uniquePriorities, ([value, label]) => ({ value, label }))
  } catch (error) {
    console.error('获取计划用例失败:', error)
  } finally {
    casesLoading.value = false
  }
}

const handleSearch = () => {
  fetchPlanCases()
}

const resetFilters = () => {
  caseFilters.group_path = ''
  caseFilters.priority = ''
  caseFilters.device_model_id = ''
  caseFilters.status = ''
  caseFilters.keyword = ''
  fetchPlanCases()
}

const openResultDialog = (row) => {
  resultDialogRef.value?.open(row)
}

const openCaseDetail = (row) => {
  const planCaseId = row.caseInfo?.plan_case_id || row.plan_case_internal_id || row.plan_case_id
  caseDetailDialogRef.value?.open(planCaseId)
}

const handleResultSaved = async () => {
  await fetchDetail()
  await fetchPlanCases()
}

watch(
  () => route.params.id,
  (newId) => {
    const numericId = Number(newId)
    if (!Number.isNaN(numericId)) {
      planId.value = numericId
      caseFilters.device_model_id = ''
      fetchDetail()
      fetchPlanCases()
    }
  }
)

watch(
  () => [
    caseFilters.group_path,
    caseFilters.priority,
    caseFilters.device_model_id,
    caseFilters.status
  ],
  () => {
    fetchPlanCases()
  }
)

onMounted(() => {
  if (!planId.value || Number.isNaN(planId.value)) {
    ElMessage.error('未找到测试计划')
    return
  }
  fetchDetail()
  fetchPlanCases()
})
</script>

<style scoped>
.test-plan-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-card,
.stats-card,
.cases-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-sub {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.info-item .value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.description-block {
  margin-top: 16px;
}

.plan-description {
  line-height: 1.6;
  white-space: pre-wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-item {
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.stat-label {
  color: var(--el-text-color-secondary);
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.stat-value.success {
  color: var(--el-color-success);
}

.stat-value.danger {
  color: var(--el-color-danger);
}

.stat-value.warning {
  color: var(--el-color-warning);
}

.stat-value.info {
  color: var(--el-color-info);
}

.case-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.case-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.case-meta-divider {
  color: var(--el-text-color-disabled);
}

.case-filter-form {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.filter-item {
  min-width: 160px;
}

.filter-input {
  width: 220px;
}

.search-icon {
  color: var(--el-text-color-placeholder);
}

.case-expand {
  padding: 12px 4px;
  display: grid;
  gap: 12px;
}

.case-expand h4 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
}

.case-expand p {
  margin: 0;
  white-space: pre-wrap;
}

.case-expand ol {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.case-expand li {
  list-style: decimal;
}

.step-line {
  font-weight: 500;
}

.step-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
