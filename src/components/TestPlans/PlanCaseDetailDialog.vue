<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="820px"
    top="5vh"
    :close-on-click-modal="false"
    class="plan-case-detail-dialog"
  >
    <div class="case-detail-body" v-loading="loading">
      <template v-if="caseDetail">
        <el-descriptions :column="2" border class="case-summary">
          <el-descriptions-item label="用例标题" :span="2">
            {{ caseDetail.title || `用例 #${caseDetail.case_id}` }}
          </el-descriptions-item>
          <el-descriptions-item label="所属目录">
            {{ caseDetail.group_path || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            {{ caseDetail.priority || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最新结果">
            <el-tag :type="resolveResultTag(caseDetail.latest_result)">
              {{ resolveExecutionResultLabel(caseDetail.latest_result) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="是否全机型">
            {{ caseDetail.require_all_devices ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item label="计划用时">
            {{ formatWorkload(caseDetail.workload_minutes) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="case-section" v-if="caseDetail.preconditions">
          <h4>前置条件</h4>
          <p class="case-text">{{ caseDetail.preconditions }}</p>
        </div>

        <div class="case-section" v-if="caseDetail.steps?.length">
          <h4>测试步骤</h4>
          <ol class="case-steps">
            <li v-for="step in orderedSteps" :key="`${step.no}-${step.action}`">
              <div class="step-header">
                <span class="step-no">步骤 {{ step.no }}</span>
                <span v-if="step.keyword" class="step-keyword">关键字：{{ step.keyword }}</span>
              </div>
              <div class="step-content">{{ step.action || '-' }}</div>
              <div v-if="step.expected" class="step-expected">期望：{{ step.expected }}</div>
              <div v-if="step.note" class="step-note">备注：{{ step.note }}</div>
            </li>
          </ol>
        </div>

        <div class="case-section" v-if="caseDetail.expected_result">
          <h4>预期结果</h4>
          <p class="case-text">{{ caseDetail.expected_result }}</p>
        </div>

        <div class="case-section">
          <h4>执行记录</h4>
          <template v-if="caseDetail.execution_results?.length">
            <el-timeline>
              <el-timeline-item
                v-for="execution in caseDetail.execution_results"
                :key="execution.id || `${execution.plan_case_id}-${execution.plan_device_model_id}-${execution.executed_at}`"
                :timestamp="formatDateTime(execution.executed_at) || '未记录时间'"
                placement="top"
              >
                <div class="execution-card">
                  <div class="execution-header">
                    <el-tag :type="resolveResultTag(execution.result)">
                      {{ resolveExecutionResultLabel(execution.result) }}
                    </el-tag>
                    <span class="execution-device">
                      执行机型：{{ resolveDeviceLabel(execution) }}
                    </span>
                  </div>
                  <div class="execution-meta">
                    <span>执行人：{{ execution.executed_by_name || execution.executor?.username || '-' }}</span>
                    <span>耗时：{{ formatDuration(execution.duration_ms) }}</span>
                  </div>
                  <div class="execution-meta">
                    <span>开始时间：{{ formatDateTime(execution.execution_start_time) || '-' }}</span>
                    <span>结束时间：{{ formatDateTime(execution.execution_end_time) || '-' }}</span>
                  </div>
                  <div class="execution-meta" v-if="execution.bug_ref">
                    <span>关联缺陷：{{ execution.bug_ref }}</span>
                  </div>
                  <p v-if="execution.failure_reason" class="execution-text">
                    失败原因：{{ execution.failure_reason }}
                  </p>
                  <p v-if="execution.remark" class="execution-text">
                    备注：{{ execution.remark }}
                  </p>
                  <div v-if="execution.attachments?.length" class="execution-attachments">
                    <span class="attachments-label">附件：</span>
                    <el-space wrap>
                      <el-link
                        v-for="file in execution.attachments"
                        :key="file.id || file.file_path || file.file_name"
                        :href="file.url || file.file_path"
                        type="primary"
                        target="_blank"
                      >
                        {{ file.file_name || '附件' }}
                      </el-link>
                    </el-space>
                  </div>

                  <div v-if="execution.history?.length" class="execution-history">
                    <el-collapse>
                      <el-collapse-item :title="`历史记录（${execution.history.length}）`" :name="`history-${execution.id}`">
                        <div
                          v-for="log in execution.history"
                          :key="log.id"
                          class="history-entry"
                        >
                          <div class="history-header">
                            <el-tag :type="resolveResultTag(log.result)">
                              {{ resolveExecutionResultLabel(log.result) }}
                            </el-tag>
                            <span class="history-time">{{ formatDateTime(log.executed_at) || '-' }}</span>
                          </div>
                          <div class="history-meta">
                            <span>执行人：{{ resolveExecutorName(log.executed_by) }}</span>
                            <span>耗时：{{ formatDuration(log.duration_ms) }}</span>
                          </div>
                          <p v-if="log.failure_reason" class="history-text">
                            失败原因：{{ log.failure_reason }}
                          </p>
                          <p v-if="log.remark" class="history-text">
                            备注：{{ log.remark }}
                          </p>
                          <div v-if="log.attachments?.length" class="history-attachments">
                            <span class="attachments-label">附件：</span>
                            <el-space wrap>
                              <el-link
                                v-for="file in log.attachments"
                                :key="file.id || file.file_path || file.file_name"
                                :href="file.url || file.file_path"
                                type="primary"
                                target="_blank"
                              >
                                {{ file.file_name || '附件' }}
                              </el-link>
                            </el-space>
                          </div>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </template>
          <el-empty v-else description="暂无执行记录" />
        </div>
      </template>
      <el-empty v-else-if="!loading" description="暂无用例详情" />
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { testPlansApi } from '@/api/testPlans'
import { EXECUTION_RESULT_TAG_MAP, resolveExecutionResultLabel } from '@/constants/testPlan'
import { formatDateTime } from '@/utils/format'

const props = defineProps({
  planId: { type: Number, required: true }
})

const visible = ref(false)
const loading = ref(false)
const caseDetail = ref(null)
const currentPlanCaseId = ref(null)

const dialogTitle = computed(() => {
  if (!caseDetail.value?.title) return '用例详情'
  return `用例详情 - ${caseDetail.value.title}`
})

const orderedSteps = computed(() => {
  if (!Array.isArray(caseDetail.value?.steps)) return []
  return [...caseDetail.value.steps].sort((a, b) => (a.no || 0) - (b.no || 0))
})

const resolveResultTag = (result) => EXECUTION_RESULT_TAG_MAP[result] || 'info'

const resolveDeviceLabel = (execution) => {
  const device = execution.device_model || execution.plan_device_model
  if (device?.device_model) {
    return device.device_model.name || device.device_model.model_code || `机型 #${device.device_model.id}`
  }
  if (device?.name) return device.name
  if (execution.device_model_name) return execution.device_model_name
  if (execution.device_model_code) return execution.device_model_code
  if (execution.device_model_id) return `机型 #${execution.device_model_id}`
  return '通用'
}

const resolveExecutorName = (executedBy) => {
  if (!executedBy) return '-'
  if (typeof executedBy === 'object') return executedBy.username || executedBy.name || '-'
  return `用户#${executedBy}`
}

const formatDuration = (milliseconds) => {
  if (milliseconds === null || milliseconds === undefined) return '-'
  const ms = Number(milliseconds)
  if (Number.isNaN(ms) || ms < 0) return '-'
  if (ms === 0) return '0 秒'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = []
  if (hours) parts.push(`${hours} 小时`)
  if (minutes) parts.push(`${minutes} 分`)
  if (seconds || !parts.length) parts.push(`${seconds} 秒`)
  return parts.join(' ')
}

const formatWorkload = (minutes) => {
  if (!minutes) return '-'
  const value = Number(minutes)
  if (Number.isNaN(value)) return '-'
  if (value < 60) return `${value} 分钟`
  const hours = (value / 60).toFixed(1)
  return `${hours} 小时`
}

const fetchCaseDetail = async () => {
  if (!props.planId || !currentPlanCaseId.value) return
  loading.value = true
  try {
    const response = await testPlansApi.getCaseDetail(props.planId, currentPlanCaseId.value)
    if (!response?.success) return
    caseDetail.value = response.data || null
  } catch (error) {
    console.error('获取用例详情失败:', error)
    ElMessage.error('获取用例详情失败')
  } finally {
    loading.value = false
  }
}

const open = (planCaseId) => {
  if (!planCaseId) {
    ElMessage.warning('未找到对应的计划用例')
    return
  }
  currentPlanCaseId.value = planCaseId
  visible.value = true
  fetchCaseDetail()
}

const close = () => {
  visible.value = false
  caseDetail.value = null
}

defineExpose({ open, close })
</script>

<style scoped>
.plan-case-detail-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

.case-detail-body {
  min-height: 240px;
}

.case-summary {
  margin-bottom: 16px;
}

.case-section + .case-section {
  margin-top: 20px;
}

.case-section h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.case-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
}

.case-steps {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-steps li {
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 12px;
  list-style: none;
}

.step-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 4px;
}

.step-no {
  color: var(--el-color-primary);
}

.step-keyword {
  color: var(--el-text-color-secondary);
}

.step-content {
  margin-bottom: 4px;
}

.step-expected,
.step-note {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.execution-card {
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.execution-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.execution-device {
  color: var(--el-text-color-secondary);
}

.execution-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.execution-text {
  margin: 0;
  color: var(--el-text-color-primary);
}

.execution-attachments,
.history-attachments {
  display: flex;
  gap: 8px;
  align-items: center;
}

.attachments-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.execution-history {
  margin-top: 8px;
}

.history-entry + .history-entry {
  margin-top: 12px;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-time {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.history-text {
  margin: 4px 0 0;
  color: var(--el-text-color-primary);
}
</style>
