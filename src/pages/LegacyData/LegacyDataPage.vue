<template>
  <div class="legacy-data-page">
    <el-card class="filter-card" shadow="never">
      <div class="card-header">
        <div class="title">
          <el-icon><DataAnalysis /></el-icon>
          <span>历史用例结果看板</span>
        </div>
        <el-button type="primary" text @click="handleRefresh" :loading="refreshing">
          <el-icon class="button-icon"><RefreshRight /></el-icon>
          刷新当前数据
        </el-button>
      </div>
      <el-form :inline="true" label-position="top" class="filter-form">
        <el-form-item label="项目">
          <el-select
            v-model="selectedProject"
            placeholder="请选择项目"
            filterable
            clearable
            :loading="projectsLoading"
            no-data-text="暂无项目"
            class="filter-select"
            @change="onProjectChange"
          >
            <el-option
              v-for="project in projects"
              :key="project"
              :label="project"
              :value="project"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划">
          <el-select
            v-model="selectedPlanId"
            placeholder="请选择计划"
            filterable
            clearable
            :disabled="!selectedProject"
            :loading="plansLoading"
            no-data-text="请选择项目后查看计划"
            class="filter-select"
            @change="onPlanChange"
          >
            <el-option
              v-for="plan in plans"
              :key="plan.id"
              :label="plan.plan_name"
              :value="plan.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="机型">
          <el-select
            v-model="selectedModelId"
            placeholder="请选择机型"
            filterable
            clearable
            :disabled="!selectedPlanId"
            :loading="modelsLoading"
            no-data-text="请选择计划后查看机型"
            class="filter-select"
          >
            <el-option
              v-for="model in models"
              :key="model.model_id"
              :label="model.model_name"
              :value="model.model_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Sheet">
          <el-select
            v-model="selectedSheetId"
            placeholder="请选择 Sheet"
            filterable
            clearable
            :disabled="!selectedPlanId"
            :loading="sheetsLoading"
            no-data-text="请选择计划后查看 Sheet"
            class="filter-select"
          >
            <el-option
              v-for="sheet in sheets"
              :key="sheet.id"
              :label="sheet.sheet_name"
              :value="sheet.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="form-actions">
          <el-button @click="handleReset" :disabled="!hasAnySelection">重置筛选</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="result-header">
          <div>
            <div class="result-title">用例执行结果</div>
            <div class="result-subtitle">
              {{ selectionSummary }}
            </div>
          </div>
          <div class="result-meta" v-if="cases.length">
            <el-tag type="info" effect="plain">共 {{ cases.length }} 条</el-tag>
            <div class="result-stat-tags">
              <el-tag size="small" type="danger" effect="plain">
                失败 {{ statusSummary.fail }}
              </el-tag>
              <el-tag size="small" type="warning" effect="plain">
                阻塞 {{ statusSummary.block }}
              </el-tag>
            </div>
          </div>
        </div>
      </template>

      <div v-if="!isSelectionReady" class="placeholder-container">
        <el-empty description="请依次选择项目、计划、机型和 Sheet 查看结果" />
      </div>
      <div v-else>
        <el-table
          v-loading="casesLoading"
          :data="cases"
          element-loading-text="正在加载用例数据..."
          border
          stripe
          class="case-table"
          empty-text="暂无用例数据"
        >
          <el-table-column prop="caseId" label="用例ID" width="120" />
          <el-table-column prop="title" label="用例标题" min-width="260">
            <template #default="{ row }">
              <div class="case-title">{{ row.title }}</div>
              <div v-if="row.preConditions" class="case-sub">前置条件：{{ row.preConditions }}</div>
            </template>
          </el-table-column>
          <el-table-column label="执行情况" min-width="220">
            <template #default="{ row }">
              <div class="case-result">
                <el-tag :type="getResultTagType(row.result)" effect="dark" size="small">
                  {{ formatResultLabel(row.result) }}
                </el-tag>
                <div class="result-metrics">
                  <el-tag size="small" effect="plain" type="danger">
                    失败 {{ row.failCount ?? 0 }}
                  </el-tag>
                  <el-tag size="small" effect="plain" type="warning">
                    阻塞 {{ row.blockCount ?? 0 }}
                  </el-tag>
                </div>
              </div>
              <div class="case-sub case-sub--time" v-if="row.testTime">执行时长：{{ row.testTime }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="executor" label="执行人" width="120" />
          <el-table-column label="执行时间" width="220">
            <template #default="{ row }">
              <div>开始：{{ formatDateTime(row.startTime) || '-' }}</div>
              <div>结束：{{ formatDateTime(row.endTime) || '-' }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="comments" label="备注" min-width="200">
            <template #default="{ row }">
              <div class="case-comment">{{ row.comments || '-' }}</div>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="openCaseDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      width="760px"
      top="6vh"
      destroy-on-close
      :title="`用例详情 - ${activeCase?.title || ''}`"
    >
      <template v-if="activeCase">
        <el-descriptions :column="2" border size="small" class="case-descriptions">
          <el-descriptions-item label="用例ID">{{ activeCase.caseId }}</el-descriptions-item>
          <el-descriptions-item label="执行ID">{{ activeCase.executionId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="执行人">{{ activeCase.executor || '-' }}</el-descriptions-item>
          <el-descriptions-item label="执行结果">
            <el-tag :type="getResultTagType(activeCase.result)" size="small">
              {{ formatResultLabel(activeCase.result) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="失败次数">
            <el-tag size="small" type="danger" effect="plain">
              {{ activeCase.failCount ?? 0 }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="阻塞次数">
            <el-tag size="small" type="warning" effect="plain">
              {{ activeCase.blockCount ?? 0 }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDateTime(activeCase.startTime) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDateTime(activeCase.endTime) || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">用例步骤</el-divider>
        <el-scrollbar max-height="160">
          <pre class="case-block">{{ activeCase.steps || '无执行步骤信息' }}</pre>
        </el-scrollbar>

        <el-divider content-position="left">预期结果</el-divider>
        <el-scrollbar max-height="120">
          <pre class="case-block">{{ activeCase.expected || '无预期结果信息' }}</pre>
        </el-scrollbar>

        <el-divider content-position="left">备注</el-divider>
        <el-scrollbar max-height="100">
          <pre class="case-block">{{ activeCase.comments || '无备注' }}</pre>
        </el-scrollbar>

        <el-divider content-position="left">执行截图</el-divider>
        <div class="case-images">
          <div v-if="imagesLoading" class="image-loading">
            <el-skeleton animated :rows="3" />
          </div>
          <template v-else>
            <el-empty
              v-if="!activeCase.executionId"
              description="该用例未记录执行 ID，无法获取图片"
            />
            <el-empty
              v-else-if="!caseImages.length"
              description="未找到相关截图"
            />
            <div v-else class="image-grid">
              <el-image
                v-for="(image, index) in caseImages"
                :key="image.execution_id + '_' + index"
                :src="image.url"
                :preview-src-list="previewSrcList"
                :initial-index="index"
                fit="cover"
                @error="() => handleImageError(index)"
              >
                <template #error>
                  <div class="image-error">加载失败</div>
                </template>
              </el-image>
            </div>
          </template>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, RefreshRight } from '@element-plus/icons-vue'
import { legacyDataApi } from '@/api/legacyData'
import { formatDateTime } from '@/utils/format'
import { apiConfig } from '@/config'

const projects = ref([])
const plans = ref([])
const models = ref([])
const sheets = ref([])
const cases = ref([])

const projectsLoading = ref(false)
const plansLoading = ref(false)
const modelsLoading = ref(false)
const sheetsLoading = ref(false)
const casesLoading = ref(false)
const refreshing = ref(false)

const selectedProject = ref('')
const selectedPlanId = ref(null)
const selectedModelId = ref(null)
const selectedSheetId = ref(null)

const detailVisible = ref(false)
const activeCase = ref(null)
const caseImages = ref([])
const imagesLoading = ref(false)

const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL ||
  apiConfig.baseURL ||
  (typeof window !== 'undefined' ? window.location.origin : '') ||
  'https://patvs.lenovo.com'

const previewSrcList = computed(() => caseImages.value.map((item) => item.url))

const hasAnySelection = computed(() => Boolean(selectedProject.value || selectedPlanId.value || selectedModelId.value || selectedSheetId.value))
const isSelectionReady = computed(() => Boolean(selectedProject.value && selectedPlanId.value && selectedModelId.value && selectedSheetId.value))

const selectedPlanInfo = computed(() => plans.value.find((plan) => plan.id === selectedPlanId.value) || null)
const selectedModelInfo = computed(() => models.value.find((model) => model.model_id === selectedModelId.value) || null)
const selectedSheetInfo = computed(() => sheets.value.find((sheet) => sheet.id === selectedSheetId.value) || null)

const selectionSummary = computed(() => {
  if (!isSelectionReady.value) {
    return '未完成筛选'
  }
  const parts = [
    selectedProject.value,
    selectedPlanInfo.value?.plan_name,
    selectedModelInfo.value?.model_name,
    selectedSheetInfo.value?.sheet_name,
  ].filter(Boolean)
  return parts.join(' / ')
})

const getResultTagType = (result) => {
  if (!result) return 'info'
  const value = String(result).toUpperCase()
  if (value.includes('PASS') || value.includes('SUCCESS')) return 'success'
  if (value.includes('FAIL') || value.includes('ERROR')) return 'danger'
  if (value.includes('BLOCK')) return 'warning'
  if (value.includes('SKIP') || value.includes('PENDING')) return 'info'
  return 'info'
}

const formatResultLabel = (result) => {
  if (!result) return '未执行'
  const value = String(result).toUpperCase()
  if (value.includes('PASS')) return '通过'
  if (value.includes('FAIL')) return '失败'
  if (value.includes('BLOCK')) return '阻塞'
  if (value.includes('SKIP')) return '跳过'
  return result
}

const normalizeCaseItem = (item) => ({
  caseId: item.CaseID,
  title: item.CaseTitle,
  steps: item.CaseSteps,
  preConditions: item.PreConditions,
  expected: item.ExpectedResult,
  comments: item.Comments,
  result: item.TestResult,
  executor: item.executor_name,
  startTime: item.StartTime || item.Start_Time || item.start_time,
  endTime: item.EndTime || item.End_Time || item.end_time,
  testTime: item.TestTime || item.test_time,
  executionId: item.ExecutionID,
  failCount: item.FailCount ?? item.fail_count ?? 0,
  blockCount: item.BlockCount ?? item.block_count ?? 0,
})

const statusSummary = computed(() => {
  const summary = {
    fail: 0,
    block: 0,
  }
  cases.value.forEach((item) => {
    summary.fail += Number(item.failCount ?? 0)
    summary.block += Number(item.blockCount ?? 0)
  })
  return summary
})

const resolveImageUrls = (url) => {
  if (!url) return []

  const candidates = new Set()

  const ensureAbsoluteUrl = (targetUrl, base) => {
    try {
      const parsedBase = new URL(base)
      const parsed = new URL(targetUrl, parsedBase)
      parsed.hostname = parsedBase.hostname
      parsed.port = parsedBase.port
      return parsed
    } catch (error) {
      return null
    }
  }

  const appendCandidate = (value) => {
    if (value) {
      candidates.add(value)
    }
  }

  const targetOrigin = (() => {
    try {
      return new URL(IMAGE_BASE_URL)
    } catch (error) {
      return null
    }
  })()

  if (targetOrigin) {
    const normalized = ensureAbsoluteUrl(url, IMAGE_BASE_URL)
    if (normalized) {
      const preferredProtocols = targetOrigin.protocol === 'https:' ? ['https:', 'http:'] : ['http:', 'https:']
      preferredProtocols.forEach((protocol) => {
        const candidate = new URL(normalized.toString())
        candidate.protocol = protocol
        appendCandidate(candidate.toString())
      })
    }
  }

  if (!candidates.size) {
    const sanitized = url.startsWith('http')
      ? url
      : `${IMAGE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
    appendCandidate(sanitized)
    if (sanitized.startsWith('https://')) {
      appendCandidate(sanitized.replace(/^https:/, 'http:'))
    } else if (sanitized.startsWith('http://')) {
      appendCandidate(sanitized.replace(/^http:/, 'https:'))
    }
  }

  return Array.from(candidates)
}

const createImageRecord = (item) => {
  const urlCandidates = resolveImageUrls(item.url || item.image_url || '')
  return {
    ...item,
    urlCandidates,
    urlIndex: 0,
    url: urlCandidates[0] || '',
  }
}

const handleImageError = (index) => {
  const record = caseImages.value[index]
  if (!record) return

  const nextIndex = record.urlIndex + 1
  if (nextIndex >= record.urlCandidates.length) return

  caseImages.value.splice(index, 1, {
    ...record,
    urlIndex: nextIndex,
    url: record.urlCandidates[nextIndex],
  })
}

const loadProjects = async () => {
  projectsLoading.value = true
  const { success, data } = await legacyDataApi.listProjects()
  if (success) {
    projects.value = Array.isArray(data)
      ? data.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean)
      : []
  }
  projectsLoading.value = false
}

const loadPlans = async (projectName) => {
  if (!projectName) return
  plansLoading.value = true
  const { success, data } = await legacyDataApi.listPlans(projectName)
  if (success) {
    plans.value = Array.isArray(data) ? data : []
  }
  plansLoading.value = false
}

const loadModels = async (planId) => {
  if (!planId) return
  modelsLoading.value = true
  const { success, data } = await legacyDataApi.listModels(planId)
  if (success) {
    models.value = Array.isArray(data) ? data : []
  }
  modelsLoading.value = false
}

const loadSheets = async (planId) => {
  if (!planId) return
  sheetsLoading.value = true
  const { success, data } = await legacyDataApi.listSheets(planId)
  if (success) {
    sheets.value = Array.isArray(data) ? data : []
  }
  sheetsLoading.value = false
}

const loadCases = async () => {
  if (!isSelectionReady.value) return
  casesLoading.value = true
  const { success, data } = await legacyDataApi.listCases(selectedSheetId.value, selectedModelId.value)
  if (success) {
    cases.value = Array.isArray(data) ? data.map(normalizeCaseItem) : []
  }
  casesLoading.value = false
}

const loadCaseImages = async (executionId) => {
  if (!executionId) {
    caseImages.value = []
    return
  }
  imagesLoading.value = true
  const { success, data } = await legacyDataApi.listImages([executionId])
  if (success) {
    const key = String(executionId)
    const rawImages = data?.[key] || []
    caseImages.value = rawImages.map((item) => createImageRecord(item))
  }
  imagesLoading.value = false
}

const resetSelections = (level = 'project') => {
  if (level === 'project') {
    selectedPlanId.value = null
    selectedModelId.value = null
    selectedSheetId.value = null
    plans.value = []
    models.value = []
    sheets.value = []
    cases.value = []
  } else if (level === 'plan') {
    selectedModelId.value = null
    selectedSheetId.value = null
    models.value = []
    sheets.value = []
    cases.value = []
  } else if (level === 'model' || level === 'sheet') {
    cases.value = []
  }
}

const onProjectChange = async (value) => {
  resetSelections('project')
  if (value) {
    await loadPlans(value)
  }
}

const onPlanChange = async (planId) => {
  resetSelections('plan')
  if (planId) {
    await Promise.all([loadModels(planId), loadSheets(planId)])
  }
}

watch([selectedModelId, selectedSheetId], async ([modelId, sheetId]) => {
  if (modelId && sheetId) {
    await loadCases()
  } else {
    cases.value = []
  }
})

const handleReset = () => {
  selectedProject.value = ''
  resetSelections('project')
}

const handleRefresh = async () => {
  if (!isSelectionReady.value) {
    ElMessage.info('请先完成筛选条件再刷新数据')
    return
  }
  refreshing.value = true
  await loadCases()
  if (detailVisible.value && activeCase.value?.executionId) {
    await loadCaseImages(activeCase.value.executionId)
  }
  refreshing.value = false
}

const openCaseDetail = async (row) => {
  activeCase.value = row
  detailVisible.value = true
  caseImages.value = []
  await loadCaseImages(row.executionId)
}

watch(detailVisible, (visible) => {
  if (!visible) {
    activeCase.value = null
    caseImages.value = []
  }
})

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.legacy-data-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}

.card-header .button-icon {
  margin-right: 4px;
}

.filter-form {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.filter-select {
  width: 100%;
}

.form-actions {
  display: flex;
  align-items: flex-end;
}

.result-card {
  border-radius: 12px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-stat-tags {
  display: flex;
  gap: 8px;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.result-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7785;
}

.placeholder-container {
  padding: 48px 0;
}

.case-table {
  width: 100%;
}

.case-result {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.result-metrics {
  display: flex;
  gap: 8px;
}

.case-title {
  font-weight: 500;
  color: #1f2d3d;
}

.case-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #8c9db5;
}

.case-sub--time {
  margin-top: 6px;
}

.case-comment {
  white-space: pre-line;
  color: #1f2d3d;
}

.case-descriptions {
  margin-bottom: 12px;
}

.case-block {
  background-color: #f6f8fb;
  border-radius: 8px;
  padding: 12px 14px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.6;
  color: #1f2d3d;
}

.case-images {
  min-height: 140px;
}

.image-loading {
  padding: 12px 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.image-grid :deep(.el-image) {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f2f5;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 12px;
}
</style>