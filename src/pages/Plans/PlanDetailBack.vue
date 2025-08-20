<template>
  <div class="plan-board-page">
    <!-- 保持原有的页面结构不变 -->
    <div class="page-header">
      <h2>用例看板</h2>
      <p class="page-description">查看和管理测试用例的执行情况</p>
    </div>

    <!-- 筛选栏 -->
    <PlanFilterBar
      @view-details="handleViewDetails"
      @export-plan="handleExportPlan"
    />

    <!-- 统计卡片 -->
    <div class="stats-section" v-if="planStore.currentStats">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-title">用例总数</div>
                <div class="stat-value primary">{{ formatStatValue(planStore.currentStats.total_cases) }}</div>
              </div>
              <div class="stat-icon primary">
                <el-icon :size="24"><Document /></el-icon>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-title">通过率</div>
                <div class="stat-value success">{{ formatPercentage(planStore.currentStats.pass_rate) }}</div>
              </div>
              <div class="stat-icon success">
                <el-icon :size="24"><SuccessFilled /></el-icon>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-title">执行进度</div>
                <div class="stat-value warning">{{ formatPercentage(planStore.currentStats.progress) }}</div>
              </div>
              <div class="stat-icon warning">
                <el-icon :size="24"><Timer /></el-icon>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section" v-if="planStore.chartData.caseCounts">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>用例统计</span>
              </div>
            </template>
            <CaseCountBar :data="planStore.chartData.caseCounts" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>通过率分析</span>
              </div>
            </template>
            <PassRatePie :data="planStore.chartData.percentages" />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 时间对比图表 -->
    <div class="time-chart-section" v-if="planStore.chartData.timeCounts">
      <el-card class="chart-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>时间对比分析</span>
          </div>
        </template>
        <TimeCompareBar :data="planStore.chartData.timeCounts" />
      </el-card>
    </div>

    <!-- 用例执行详情表格 -->
    <div class="cases-section" v-if="shouldShowCases">
      <el-card class="cases-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>用例执行详情</span>
            <div class="header-actions">
              <el-button type="primary" @click="refreshCases" :loading="casesLoading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <!-- 用例表格 -->
        <el-table
          :data="casesData"
          :loading="casesLoading"
          stripe
          style="width: 100%"
          empty-text="暂无数据"
          height="600"
          :header-cell-style="{ backgroundColor: '#fafafa', color: '#606266', fontWeight: '500' }"
        >
          <el-table-column prop="序号" label="序号" width="70" align="center" fixed="left" />
          <el-table-column prop="用例标题" label="用例标题" min-width="250" show-overflow-tooltip fixed="left" />
          <el-table-column prop="测试结果" label="测试结果" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="getResultType(row.测试结果)"
                size="small"
                v-if="row.测试结果"
              >
                {{ getResultText(row.测试结果) }}
              </el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="测试耗时(S)" label="测试耗时(S)" width="120" align="center">
            <template #default="{ row }">
              <span v-if="row['测试耗时(S)'] && row['测试耗时(S)'] !== '-'">{{ row['测试耗时(S)'] }}s</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="前置条件" label="前置条件" min-width="200" show-overflow-tooltip />
          <el-table-column prop="用例步骤" label="用例步骤" min-width="300" show-overflow-tooltip />
          <el-table-column prop="预期结果" label="预期结果" min-width="200" show-overflow-tooltip />
          <el-table-column prop="开始时间" label="开始时间" width="160" align="center">
            <template #default="{ row }">
              <span class="time-text">{{ formatTime(row.开始时间) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="完成时间" label="完成时间" width="160" align="center">
            <template #default="{ row }">
              <span class="time-text">{{ formatTime(row.完成时间) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="评论" label="评论" min-width="150" show-overflow-tooltip />
          <el-table-column prop="失败次数" label="失败次数" width="100" align="center">
            <template #default="{ row }">
              <span :class="{ 'failure-count': row.失败次数 > 0 }">
                {{ row.失败次数 || 0 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.ExecutionID"
                type="primary"
                size="small"
                @click="viewImages(row)"
                :loading="row._imageLoading"
                link
              >
                <el-icon><Picture /></el-icon>
                查看图片
              </el-button>
              <span v-else class="text-muted">无图片</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCases"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 用例详情对话框 -->
    <ExecutionDetailsDialog
      v-model="showDetailsDialog"
      :sheet-id="currentSheetId"
      :model-id="currentModelId"
      @refresh="handleRefresh"
    />

    <!-- 图片查看对话框 - 修复闪烁版本 -->
  <el-dialog
    v-model="showImageDialog"
    :title="`用例截图 - ExecutionID: ${currentExecutionId}`"
    width="90%"
    top="5vh"
    class="image-dialog"
    :before-close="handleCloseImageDialog"
    :append-to-body="true"
    :close-on-click-modal="false"
    :z-index="2000"
  >
    <template #header>
      <div class="image-dialog-header">
        <div class="header-left">
          <span class="dialog-title">用例截图</span>
          <el-tag size="small" type="info" v-if="currentExecutionId">
            ExecutionID: {{ currentExecutionId }}
          </el-tag>
          <el-tag size="small" effect="plain" v-if="currentImages.length">
            共 {{ currentImages.length }} 张
          </el-tag>
        </div>
        <div class="header-right">
          <el-button
            v-if="currentImages.length > 0"
            size="small"
            @click="downloadAllImages"
            :icon="Download"
          >
            下载全部
          </el-button>
        </div>
      </div>
    </template>

    <div class="image-dialog-body">
      <!-- 加载状态 -->
      <div v-if="imageLoading" class="loading-container">
        <el-skeleton :rows="3" animated />
        <div class="loading-text">正在加载图片...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="imageError" class="error-container">
        <el-empty description="加载图片失败">
          <el-button
            type="primary"
            @click="retryLoadImages"
            :icon="RefreshIcon"
          >
            重新加载
          </el-button>
        </el-empty>
      </div>

      <!-- 无图片状态 -->
      <div v-else-if="currentImages.length === 0" class="empty-container">
        <el-empty description="该用例暂无相关图片" />
      </div>

      <!-- 图片展示 - 修复版本 -->
      <div v-else class="images-container">
        <div class="images-grid">
          <div
            v-for="(image, index) in currentImages"
            :key="image.id || index"
            class="image-card"
          >
            <div class="image-wrapper">
              <!-- 使用自定义图片预览，避免Element Plus预览组件的冲突 -->
              <img
                :src="image.url"
                :alt="image.name"
                class="image-item"
                @click="openImagePreview(index)"
                @error="handleImageError"
                @load="handleImageLoad"
                loading="lazy"
              />
              
              <!-- 图片信息覆盖层 -->
              <div class="image-overlay">
                <div class="image-info">
                  <div class="image-name" :title="image.name">
                    {{ image.name }}
                  </div>
                  <div class="image-meta">
                    <span v-if="image.time">{{ formatImageTime(image.time) }}</span>
                    <span v-if="image.size">{{ formatSize(image.size) }}</span>
                  </div>
                </div>
                <div class="image-actions">
                  <el-tooltip content="预览图片" placement="top">
                    <el-button
                      size="small"
                      circle
                      @click.stop="openImagePreview(index)"
                      :icon="View"
                    />
                  </el-tooltip>
                  <el-tooltip content="复制链接" placement="top">
                    <el-button
                      size="small"
                      circle
                      @click.stop="copyImageUrl(image.url)"
                      :icon="CopyDocument"
                    />
                  </el-tooltip>
                  <el-tooltip content="下载图片" placement="top">
                    <el-button
                      size="small"
                      circle
                      @click.stop="downloadSingleImage(image)"
                      :icon="Download"
                    />
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
  <!-- 自定义图片预览对话框 - 避免闪烁 -->
  <el-dialog
    v-model="showImagePreview"
    width="95%"
    top="2.5vh"
    class="image-preview-dialog"
    :show-close="false"
    :append-to-body="true"
    :close-on-click-modal="true"
    :z-index="3000"
    @close="closeImagePreview"
  >
    <div class="image-preview-container">
      <!-- 预览工具栏 -->
      <div class="preview-toolbar">
        <div class="toolbar-left">
          <span class="current-image-info">
            {{ currentPreviewIndex + 1 }} / {{ currentImages.length }}
          </span>
          <span class="image-title">{{ currentImages[currentPreviewIndex]?.name }}</span>
        </div>
        <div class="toolbar-right">
          <el-button-group>
            <el-tooltip content="上一张" placement="bottom">
              <el-button 
                :icon="ArrowLeft" 
                @click="prevImage" 
                :disabled="currentPreviewIndex <= 0"
                size="small"
              />
            </el-tooltip>
            <el-tooltip content="下一张" placement="bottom">
              <el-button 
                :icon="ArrowRight" 
                @click="nextImage" 
                :disabled="currentPreviewIndex >= currentImages.length - 1"
                size="small"
              />
            </el-tooltip>
            <el-tooltip content="放大" placement="bottom">
              <el-button :icon="ZoomIn" @click="zoomIn" size="small" />
            </el-tooltip>
            <el-tooltip content="缩小" placement="bottom">
              <el-button :icon="ZoomOut" @click="zoomOut" size="small" />
            </el-tooltip>
            <el-tooltip content="重置" placement="bottom">
              <el-button :icon="RefreshIcon" @click="resetZoom" size="small" />
            </el-tooltip>
            <el-tooltip content="下载" placement="bottom">
              <el-button 
                :icon="Download" 
                @click="downloadSingleImage(currentImages[currentPreviewIndex])" 
                size="small"
              />
            </el-tooltip>
            <el-tooltip content="关闭" placement="bottom">
              <el-button :icon="Close" @click="closeImagePreview" size="small" />
            </el-tooltip>
          </el-button-group>
        </div>
      </div>

      <!-- 图片预览区域 -->
      <div class="preview-content" @wheel="handleWheel">
        <div 
          class="preview-image-wrapper"
          :style="{ transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)` }"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
        >
          <img
            :src="currentImages[currentPreviewIndex]?.url"
            :alt="currentImages[currentPreviewIndex]?.name"
            class="preview-image"
            @error="handleImageError"
            draggable="false"
          />
        </div>
      </div>
    </div>
  </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  SuccessFilled,
  Timer,
  Refresh,
  Picture,
  Download,
  CopyDocument,
  Refresh as RefreshIcon,
  Loading,
  View,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Close
} from '@element-plus/icons-vue'
import PlanFilterBar from '@/components/Filters/PlanFilterBar.vue'
import CaseCountBar from '@/components/Charts/CaseCountBar.vue'
import PassRatePie from '@/components/Charts/PassRatePie.vue'
import TimeCompareBar from '@/components/Charts/TimeCompareBar.vue'
import ExecutionDetailsDialog from '@/components/Cases/ExecutionDetailsDialog.vue'
import { useFiltersStore } from '@/stores/modules/filters'
import { usePlanStore } from '@/stores/modules/plan'
import { casesApi } from '@/api/cases'
import { exportsApi } from '@/api/exports'
import { downloadFile } from '@/utils/download'
import { formatNumber, formatPercentage as formatPercent } from '@/utils/format'

const filtersStore = useFiltersStore()
const planStore = usePlanStore()

const showDetailsDialog = ref(false)
const currentSheetId = ref(null)
const currentModelId = ref(null)

// 图片查看相关状态
const showImageDialog = ref(false)
const currentImages = ref([])
const currentExecutionId = ref(null)
const imageLoading = ref(false)
const imageError = ref(false)
const imageCache = ref(new Map()) // 图片缓存

// 新增图片预览相关状态
const showImagePreview = ref(false)
const currentPreviewIndex = ref(0)
const zoomLevel = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const lastTranslateX = ref(0)
const lastTranslateY = ref(0)

// 打开图片预览
const openImagePreview = (index) => {
  currentPreviewIndex.value = index
  zoomLevel.value = 1
  translateX.value = 0
  translateY.value = 0
  showImagePreview.value = true
}

// 关闭图片预览
const closeImagePreview = () => {
  showImagePreview.value = false
  resetZoom()
}

// 上一张图片
const prevImage = () => {
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--
    resetZoom()
  }
}

// 下一张图片
const nextImage = () => {
  if (currentPreviewIndex.value < currentImages.value.length - 1) {
    currentPreviewIndex.value++
    resetZoom()
  }
}

// 放大
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 5)
}

// 缩小
const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1)
}

// 重置缩放
const resetZoom = () => {
  zoomLevel.value = 1
  translateX.value = 0
  translateY.value = 0
}

// 鼠标滚轮缩放
const handleWheel = (event) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -1 : 1
  if (delta > 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

// 拖拽开始
const startDrag = (event) => {
  if (zoomLevel.value > 1) {
    isDragging.value = true
    dragStartX.value = event.clientX - translateX.value
    dragStartY.value = event.clientY - translateY.value
  }
}

// 拖拽中
const onDrag = (event) => {
  if (isDragging.value && zoomLevel.value > 1) {
    translateX.value = event.clientX - dragStartX.value
    translateY.value = event.clientY - dragStartY.value
  }
}

// 拖拽结束
const endDrag = () => {
  isDragging.value = false
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (!showImagePreview.value) return
  
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      prevImage()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextImage()
      break
    case 'Escape':
      event.preventDefault()
      closeImagePreview()
      break
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetZoom()
      break
  }
}

// 监听键盘事件
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 用例数据相关
const casesData = ref([])
const casesLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalCases = ref(0)
const allCasesData = ref([])

// 计算预览图片列表
const previewSrcList = computed(() => {
  return currentImages.value.map(img => img.url).filter(url => url)
})

// 计算是否应该显示用例列表
const shouldShowCases = computed(() => {
  return filtersStore.filters.projectName &&
         filtersStore.filters.planName &&
         filtersStore.filters.modelName &&
         filtersStore.filters.sheetName &&
         filtersStore.ids.sheetId &&
         filtersStore.ids.planId &&
         filtersStore.ids.modelId
})

// 监听筛选条件变化
watch(
  () => [
    filtersStore.filters.projectName,
    filtersStore.filters.planName,
    filtersStore.filters.modelName,
    filtersStore.filters.sheetName,
    filtersStore.ids.sheetId,
    filtersStore.ids.planId,
    filtersStore.ids.modelId
  ],
  ([projectName, planName, modelName, sheetName, sheetId, planId, modelId]) => {
    console.log('🔍 [BOARD] Filter conditions changed:', {
      projectName, planName, modelName, sheetName, sheetId, planId, modelId
    })

    if (projectName && planName && modelName && sheetName && sheetId && planId && modelId) {
      console.log('✅ [BOARD] All conditions met, loading cases...')
      loadCases()
    } else {
      console.log('⏳ [BOARD] Conditions not met, clearing cases')
      casesData.value = []
      allCasesData.value = []
      totalCases.value = 0
      currentPage.value = 1
    }
  },
  { immediate: true }
)

// 时间格式化函数
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  try {
    const date = new Date(dateTime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.warn('日期格式化失败:', dateTime)
    return dateTime
  }
}

// 格式化图片时间
const formatImageTime = (time) => {
  if (!time) return ''
  try {
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return time
  }
}

// 格式化文件大小
const formatSize = (size) => {
  if (!size && size !== 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let s = size
  let i = 0
  while (s >= 1024 && i < units.length - 1) {
    s /= 1024
    i++
  }
  return `${s.toFixed(s >= 10 ? 0 : 1)} ${units[i]}`
}

// 加载用例数据
const loadCases = async () => {
  if (!filtersStore.ids.sheetId || !filtersStore.ids.planId) {
    console.warn('⚠️ [BOARD] Missing sheetId or planId')
    return
  }

  casesLoading.value = true
  try {
    console.log('🔍 [BOARD] Loading cases for:', {
      sheetId: filtersStore.ids.sheetId,
      planId: filtersStore.ids.planId
    })

    const response = await casesApi.getCasesStatus(
      filtersStore.ids.sheetId,
      filtersStore.ids.modelId
    )

    console.log('📋 [BOARD] Cases response:', response)

    if (response.data && Array.isArray(response.data)) {
      const casesWithIndex = response.data.map((item, index) => ({
        ...item,
        序号: index + 1,
        用例标题: item.CaseTitle || '-',
        测试结果: item.TestResult || '-',
        '测试耗时(S)': item.TestTime ? `${item.TestTime}` : '-',
        前置条件: item.PreConditions || '-',
        用例步骤: item.CaseSteps || '-',
        预期结果: item.ExpectedResult || '-',
        开始时间: item.StartTime ? formatDateTime(item.StartTime) : '-',
        完成时间: item.EndTime ? formatDateTime(item.EndTime) : '-',
        评论: item.Comment || '-',
        失败次数: item.FailCount || 0,
        _imageLoading: false
      }))

      allCasesData.value = casesWithIndex
      totalCases.value = casesWithIndex.length
      currentPage.value = 1
      updatePageData()

      console.log('✅ [BOARD] Processed cases data:', casesWithIndex.slice(0, 2))
      ElMessage.success(`加载了 ${casesWithIndex.length} 条用例数据`)
    } else {
      console.warn('⚠️ [BOARD] Unexpected cases data structure:', response.data)
      allCasesData.value = []
      totalCases.value = 0
      updatePageData()
      ElMessage.warning('用例数据格式异常')
    }
  } catch (error) {
    console.error('❌ [BOARD] 加载用例数据失败:', error)
    ElMessage.error('加载用例数据失败')
    allCasesData.value = []
    totalCases.value = 0
    updatePageData()
  } finally {
    casesLoading.value = false
  }
}

// 更新当前页数据
const updatePageData = () => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  casesData.value = allCasesData.value.slice(start, end)
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  updatePageData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  updatePageData()
}

// 刷新用例数据
const refreshCases = () => {
  currentPage.value = 1
  loadCases()
}

// 查看图片 - 修复版本
const viewImages = async (row) => {
  if (!row.ExecutionID) {
    ElMessage.warning('该用例没有执行记录')
    return
  }

  const executionId = row.ExecutionID
  console.log('🖼️ [BOARD] Loading images for ExecutionID:', executionId)

  // 检查缓存
  if (imageCache.value.has(executionId)) {
    const cachedImages = imageCache.value.get(executionId)
    currentImages.value = cachedImages
    currentExecutionId.value = executionId
    showImageDialog.value = true
    console.log('📦 [BOARD] Using cached images:', cachedImages.length)
    return
  }

  // 设置加载状态
  row._imageLoading = true
  imageLoading.value = true
  imageError.value = false
  currentExecutionId.value = executionId
  currentImages.value = []

  // 先显示对话框
  showImageDialog.value = true

  try {
    const response = await casesApi.getImages(row.ExecutionID)

    console.log('📸 [BOARD] Images API response:', response)

    if (response.data && response.data.images) {
      const executionImages = response.data.images[executionId.toString()]

      if (executionImages && Array.isArray(executionImages) && executionImages.length > 0) {
        // 标准化图片数据
        const normalizedImages = executionImages.map((img, index) => ({
          id: img.stored_file_name || img.original_file_name || `img_${index}`,
          name: img.original_file_name || `图片_${index + 1}`,
          url: img.url,
          time: img.time,
          size: img.file_size,
          executionId: img.execution_id || executionId
        })).filter(img => img.url) // 过滤掉没有URL的图片

        console.log('✅ [BOARD] Normalized images:', normalizedImages)

        if (normalizedImages.length > 0) {
          currentImages.value = normalizedImages
          imageCache.value.set(executionId, normalizedImages)
          ElMessage.success(`找到 ${normalizedImages.length} 张图片`)
        } else {
          ElMessage.info('该用例暂无有效图片')
          imageError.value = false
        }
      } else {
        console.log('ℹ️ [BOARD] No images found for ExecutionID:', executionId)
        ElMessage.info('该用例暂无相关图片')
        imageError.value = false
      }
    } else {
      console.warn('⚠️ [BOARD] Invalid response structure:', response)
      ElMessage.warning('图片数据格式异常')
      imageError.value = true
    }
  } catch (error) {
    console.error('❌ [BOARD] 获取图片失败:', error)
    ElMessage.error(`获取图片失败: ${error.message || '请稍后重试'}`)
    imageError.value = true
  } finally {
    row._imageLoading = false
    imageLoading.value = false
  }
}

// 重试加载图片
const retryLoadImages = () => {
  if (currentExecutionId.value) {
    // 清除缓存
    imageCache.value.delete(currentExecutionId.value)
    // 重新加载
    viewImages({ ExecutionID: currentExecutionId.value })
  }
}

// 处理图片加载成功
const handleImageLoad = (event) => {
  console.log('🖼️ Image loaded successfully:', event.target.src)
}

// 处理图片加载失败
const handleImageError = (event) => {
  console.error('❌ Image load failed:', event.target.src)
}

// 复制图片链接
const copyImageUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('图片链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

// 下载单张图片
const downloadSingleImage = (image) => {
  try {
    const link = document.createElement('a')
    link.href = image.url
    link.download = image.name || 'image'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success(`开始下载: ${image.name}`)
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 下载全部图片
const downloadAllImages = async () => {
  if (currentImages.value.length === 0) {
    ElMessage.info('暂无图片可下载')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要下载全部 ${currentImages.value.length} 张图片吗？`,
      '确认下载',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    ElMessage.info(`开始下载 ${currentImages.value.length} 张图片...`)

    for (let i = 0; i < currentImages.value.length; i++) {
      const image = currentImages.value[i]
      downloadSingleImage(image)
      // 添加延迟避免浏览器阻止多个下载
      if (i < currentImages.value.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量下载失败:', error)
      ElMessage.error('批量下载失败')
    }
  }
}

// 关闭图片对话框
const handleCloseImageDialog = () => {
  showImageDialog.value = false
  currentImages.value = []
  currentExecutionId.value = null
  imageLoading.value = false
  imageError.value = false
}

// 获取执行结果类型
const getResultType = (result) => {
  const resultMap = {
    'Pass': 'success',
    'Fail': 'danger',
    'Skip': 'warning',
    'Block': 'info',
    '通过': 'success',
    '失败': 'danger',
    '跳过': 'warning',
    '阻塞': 'info'
  }
  return resultMap[result] || 'info'
}

// 获取执行结果文本
const getResultText = (result) => {
  const resultMap = {
    'Pass': '通过',
    'Fail': '失败',
    'Skip': '跳过',
    'Block': '阻塞'
  }
  return resultMap[result] || result
}

// 格式化时间
const formatTime = (time) => {
  if (!time || time === '-') return '-'
  try {
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return time
  }
}

// 格式化统计值
const formatStatValue = (value) => {
  return formatNumber(value || 0)
}

// 格式化百分比
const formatPercentage = (value) => {
  if (typeof value === 'string' && value.includes('%')) {
    return value
  }
  return formatPercent(value || 0)
}

// 查看详情
const handleViewDetails = (event) => {
  console.log('查看详情:', event)
  currentSheetId.value = event.ids.sheetId
  currentModelId.value = event.ids.modelId
  showDetailsDialog.value = true
}

// 导出计划
const handleExportPlan = async (event) => {
  try {
    await ElMessageBox.confirm(
      `确定要导出测试计划 "${event.planName}" 吗？`,
      '确认导出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    ElMessage.info('正在准备导出文件...')

    const response = await exportsApi.exportPlan(event.planId)
    downloadFile(response.data, `${event.planName}_测试结果.zip`)
    ElMessage.success('导出成功')

  } catch (error) {
    if (error !== 'cancel') {
      console.error('导出失败:', error)
      ElMessage.error('导出失败，请稍后重试')
    }
  }
}

// 刷新数据
const handleRefresh = () => {
  console.log('刷新数据')
  refreshCases()
}

onMounted(() => {
  console.log('🚀 [BOARD] PlanBoardPage mounted')
})
</script>

<style scoped>
.plan-board-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 24px;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-section {
  margin-bottom: 70px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.stat-value.primary { color: #409eff; }
.stat-value.success { color: #67c23a; }
.stat-value.warning { color: #e6a23c; }

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.primary {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.2));
  color: #409eff;
}
.stat-icon.success {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1), rgba(103, 194, 58, 0.2));
  color: #67c23a;
}
.stat-icon.warning {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.1), rgba(230, 162, 60, 0.2));
  color: #e6a23c;
}

.charts-section {
  margin-bottom: 24px;
}

.time-chart-section {
  margin-bottom: 60px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-card .el-card__body {
  height: calc(100% - 57px);
  padding: 20px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 用例表格样式 */
.cases-section {
  margin-top: 30px;
  margin-bottom: 30px;
}

.cases-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.text-muted {
  color: #909399;
}

.time-text {
  font-size: 12px;
  color: #606266;
}

.failure-count {
  color: #f56c6c;
  font-weight: 600;
}

/* 图片对话框样式 - 优化版本 */
.image-dialog {
  --el-dialog-margin-top: 5vh;
}

.image-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.image-dialog :deep(.el-dialog__header) {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  margin: 0;
}

.image-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: #ffffff;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.image-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 8px;
}

.image-dialog-body {
  min-height: 200px;
  position: relative;
}

/* 加载状态 */
.loading-container {
  padding: 40px;
  text-align: center;
}

.loading-text {
  margin-top: 16px;
  color: #909399;
  font-size: 14px;
}

/* 错误状态 */
.error-container {
  padding: 40px;
  text-align: center;
}

/* 空状态 */
.empty-container {
  padding: 40px;
  text-align: center;
}

/* 图片容器 */
.images-container {
  padding: 20px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.image-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
}

.image-item {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.image-item :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-card:hover .image-item :deep(img) {
  transform: scale(1.05);
}

/* 图片占位符 */
.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
  background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
              linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.image-placeholder .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

/* 图片错误状态 */
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #f56c6c;
  font-size: 14px;
  background: #fef0f0;
}

.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

/* 图片信息覆盖层 */
.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 16px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.image-card:hover .image-overlay {
  transform: translateY(0);
}

.image-info {
  margin-bottom: 12px;
}

.image-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-meta {
  font-size: 12px;
  opacity: 0.9;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.image-actions {
  display: flex;
  gap: 8px;
}

.image-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(4px);
}

.image-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: 4px;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 500;
}

:deep(.el-table td) {
  padding: 12px 0;
}

:deep(.el-tag) {
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plan-board-page {
    padding: 16px;
  }

  .page-header {
    padding: 20px;
    margin-bottom: 20px;
  }

  .page-header h2 {
    font-size: 20px;
  }

  .stat-card {
    padding: 20px;
    margin-bottom: 16px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .chart-card {
    height: 350px;
    margin-bottom: 16px;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .time-chart-section {
    margin-bottom: 20px;
  }

  .cases-section {
    margin-top: 20px;
  }

  /* 移动端图片网格 */
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .image-wrapper {
    height: 150px;
  }

  .image-dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-left {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .stat-info {
    order: 2;
  }

  .stat-icon {
    order: 1;
  }

  .images-grid {
    grid-template-columns: 1fr;
  }

  .image-wrapper {
    height: 180px;
  }

  .images-container {
    padding: 16px;
  }
}

/* 图片预览样式优化 */
:deep(.el-image-viewer__wrapper) {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
}

:deep(.el-image-viewer__btn) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
}

:deep(.el-image-viewer__btn:hover) {
  background: rgba(255, 255, 255, 0.2);
}

/* 加载动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-container .el-skeleton {
  animation: pulse 1.5s ease-in-out infinite;
}

/* 修复图片对话框的 z-index 问题 */
.image-dialog {
  --el-dialog-margin-top: 5vh;
}

.image-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
  z-index: 2000 !important;
}

/* 图片项样式 - 移除 Element Plus 预览 */
.image-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
  border-radius: 12px;
}

.image-card:hover .image-item {
  transform: scale(1.05);
}

/* 自定义图片预览对话框样式 */
.image-preview-dialog {
  --el-dialog-margin-top: 2.5vh;
}

.image-preview-dialog :deep(.el-dialog) {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 8px;
  overflow: hidden;
  z-index: 3000 !important;
}

.image-preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: calc(95vh - 60px);
  overflow: hidden;
}

.image-preview-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.95);
}

/* 预览工具栏 */
.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.current-image-info {
  font-size: 14px;
  color: #e6e6e6;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.image-title {
  font-size: 16px;
  font-weight: 500;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-right .el-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.toolbar-right .el-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.toolbar-right .el-button:disabled {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
}

/* 预览内容区域 */
.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: grab;
  position: relative;
}

.preview-content:active {
  cursor: grabbing;
}

.preview-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  transform-origin: center center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

/* 防止页面闪烁的全局样式修复 */
:deep(.el-overlay) {
  z-index: 2000 !important;
}

:deep(.el-dialog__wrapper) {
  z-index: 2000 !important;
}

/* 确保图片预览在最顶层 */
.image-preview-dialog :deep(.el-overlay) {
  z-index: 3000 !important;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.image-preview-dialog :deep(.el-dialog__wrapper) {
  z-index: 3000 !important;
}

/* 移除可能导致闪烁的动画 */
:deep(.el-dialog) {
  animation: none !important;
}

:deep(.el-overlay) {
  animation: none !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .preview-toolbar {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .toolbar-left {
    justify-content: center;
    flex-wrap: wrap;
  }

  .toolbar-right {
    display: flex;
    justify-content: center;
  }

  .image-title {
    max-width: 200px;
  }

  .toolbar-right .el-button-group {
    flex-wrap: wrap;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .image-preview-dialog {
    width: 100% !important;
    top: 0 !important;
    --el-dialog-margin-top: 0;
  }

  .image-preview-dialog :deep(.el-dialog) {
    height: 100vh;
    margin: 0;
    border-radius: 0;
  }

  .image-preview-dialog :deep(.el-dialog__body) {
    height: calc(100vh - 80px);
  }

  .toolbar-right .el-button {
    padding: 8px;
  }
}
</style>
