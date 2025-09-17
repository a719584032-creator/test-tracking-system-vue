<template>
  <div class="test-plan-detail-page">
    <div class="page-header">
      <el-page-header content="测试计划详情" @back="goBack" />
      <div class="header-right">
        <el-tag :type="statusTag" size="large">{{ statusLabel }}</el-tag>
      </div>
    </div>

    <el-card v-loading="loading" class="info-card" shadow="never">
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
          <span class="value">{{ planDetail?.created_by_name || `用户#${planDetail?.created_by ?? '-'}` }}</span>
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
          <span class="card-sub">共 {{ executionRows.length }} 条执行记录</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="executionRows"
        stripe
        empty-text="暂无用例数据"
      >
        <el-table-column prop="case_title" label="用例" min-width="220">
          <template #default="{ row }">
            <div class="case-title">{{ row.case_title }}</div>
            <div class="case-meta">优先级：{{ row.priority || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="device_model_name" label="执行机型" min-width="180">
          <template #default="{ row }">
            {{ row.device_model_name || row.device_model_code || (row.device_model_id ? `机型 #${row.device_model_id}` : '通用') }}
          </template>
        </el-table-column>

        <el-table-column prop="require_all_devices" label="机型要求" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.require_all_devices ? 'warning' : 'info'">
              {{ row.require_all_devices ? '需全部机型' : '任意机型' }}
            </el-tag>
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

        <el-table-column prop="executed_by" label="执行人" min-width="140">
          <template #default="{ row }">
            {{ resolveExecutor(row.executed_by) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openResultDialog(row)">
              记录结果
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { testPlansApi } from '@/api/testPlans'
import {
  EXECUTION_RESULT_TAG_MAP,
  resolveExecutionResultLabel,
  resolvePlanStatusLabel,
  TEST_PLAN_STATUS_TAG_MAP
} from '@/constants/testPlan'
import { formatDateTime } from '@/utils/format'
import TestPlanResultDialog from '@/components/TestPlans/TestPlanResultDialog.vue'

const route = useRoute()
const router = useRouter()

const planId = ref(Number(route.params.id))
const loading = ref(false)
const planDetail = ref(null)

const resultDialogRef = ref()

const testerMap = computed(() => {
  const map = new Map()
  const testers = planDetail.value?.testers || []
  testers.forEach((item) => {
    const id = item.user_id || item.tester?.id
    const name = item.tester?.username || item.username || item.tester_name
    if (id) {
      map.set(Number(id), name || `用户#${id}`)
    }
  })
  if (planDetail.value?.created_by) {
    const id = Number(planDetail.value.created_by)
    if (!map.has(id)) {
      map.set(id, planDetail.value.created_by_name || `用户#${id}`)
    }
  }
  return map
})

const testerNames = computed(() => {
  const testers = planDetail.value?.testers || []
  if (!testers.length) return '-'
  return testers
    .map((item) => item.tester?.username || item.username || item.tester_name || `用户#${item.user_id}`)
    .join('、')
})

const deviceNames = computed(() => {
  const devices = planDetail.value?.device_models || []
  if (!devices.length) return '-'
  return devices
    .map((item) => item.device_model?.name || item.device_model_name || `机型#${item.device_model_id}`)
    .join('、')
})

const executionRows = computed(() => {
  const plan = planDetail.value
  if (!plan?.cases) return []
  const rows = []
  plan.cases.forEach((caseItem) => {
    const executions = Array.isArray(caseItem.execution_results) ? caseItem.execution_results : []
    if (!executions.length) {
      rows.push({
        case_id: caseItem.case_id,
        case_title: caseItem.title,
        priority: caseItem.priority,
        require_all_devices: caseItem.require_all_devices,
        plan_case_id: caseItem.id,
        result: caseItem.latest_result,
        executed_at: null,
        executed_by: null
      })
      return
    }
    executions.forEach((exec) => {
      rows.push({
        case_id: caseItem.case_id,
        case_title: caseItem.title,
        priority: caseItem.priority,
        require_all_devices: caseItem.require_all_devices,
        plan_case_id: exec.plan_case_id || caseItem.id,
        plan_case_internal_id: caseItem.id,
        device_model_id: exec.device_model_id,
        device_model_name: exec.device_model?.name || exec.device_model_name,
        device_model_code: exec.device_model?.model_code || exec.device_model_code,
        plan_device_model_id: exec.plan_device_model_id,
        result: exec.result,
        executed_at: exec.executed_at,
        executed_by: exec.executed_by,
        remark: exec.remark,
        failure_reason: exec.failure_reason,
        bug_ref: exec.bug_ref,
        run_id: exec.run_id,
        execution_id: exec.id
      })
    })
  })
  return rows
})

const statusTag = computed(() => TEST_PLAN_STATUS_TAG_MAP[planDetail.value?.status] || 'info')
const statusLabel = computed(() => resolvePlanStatusLabel(planDetail.value?.status))

const resolveResultTag = (result) => EXECUTION_RESULT_TAG_MAP[result] || 'info'

const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

const resolveExecutor = (userId) => {
  if (!userId) return '-'
  const name = testerMap.value.get(Number(userId))
  return name || `用户#${userId}`
}

const goBack = () => {
  router.back()
}

const fetchDetail = async () => {
  if (!planId.value) return
  loading.value = true
  try {
    const response = await testPlansApi.get(planId.value)
    if (!response?.success) {
      ElMessage.error(response?.message || '获取测试计划失败')
      return
    }
    planDetail.value = response.data
  } catch (error) {
    console.error('获取计划详情失败:', error)
  } finally {
    loading.value = false
  }
}

const openResultDialog = (row) => {
  resultDialogRef.value?.open(row)
}

const handleResultSaved = async () => {
  await fetchDetail()
}

watch(
  () => route.params.id,
  (newId) => {
    const numericId = Number(newId)
    if (!Number.isNaN(numericId)) {
      planId.value = numericId
      fetchDetail()
    }
  }
)

onMounted(() => {
  if (!planId.value || Number.isNaN(planId.value)) {
    ElMessage.error('未找到测试计划')
    return
  }
  fetchDetail()
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
}
</style>
