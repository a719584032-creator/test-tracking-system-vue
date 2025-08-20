<template>
  <div class="plan-board-page">
    <div class="page-header">
      <h2>用例看板</h2>
      <p class="page-description">查看和管理测试用例的执行情况</p>
    </div>

    <PlanFilterBar
      @view-details="handleViewDetails"
      @export-plan="handleExportPlan"
    />

    <StatsCards :stats="planStore.currentStats" />

    <CaseChartsGroup
      v-if="planStore.chartData.caseCounts"
      :case-counts="planStore.chartData.caseCounts"
      :percentages="planStore.chartData.percentages"
    />

    <TimeCompareCard
      v-if="planStore.chartData.timeCounts"
      :data="planStore.chartData.timeCounts"
    />

    <CasesTable
      v-if="conditionsReady"
      :cases="cases"
      :loading="casesLoading"
      :total="totalCases"
      :page="page"
      :pageSize="pageSize"
      @view-images="handleViewImages"
      @refresh="refreshCases"
      @page-change="changePage"
    />

    <ExecutionDetailsDialog
      v-model="showDetailsDialog"
      :sheet-id="currentSheetId"
      :model-id="currentModelId"
      @refresh="refreshCases"
    />

    <ImageGalleryDialog
      v-model="showImageDialog"
      :execution-id="currentExecutionId"
      :images="currentImages"
      :loading="imageLoading"
      :error="imageError"
      @close="closeImages"
      @retry="retryImages"
      @preview="openPreview"
      @download-all="downloadAllImages"
      @download-single="downloadSingleImage"
      @copy-link="copyImageUrl"
    />

    <ImagePreviewDialog
      v-model="showImagePreview"
      :images="currentImages"
      :index="previewIndex"
      :zoom="zoomLevel"
      :translate-x="translateX"
      :translate-y="translateY"
      @close="closePreview"
      @prev="prevImage"
      @next="nextImage"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset="resetZoom"
      @wheel="handleWheel"
      @start-drag="startDrag"
      @on-drag="onDrag"
      @end-drag="endDrag"
      @download="downloadCurrentPreview"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PlanFilterBar from '@/components/Filters/PlanFilterBar.vue'
import StatsCards from '@/components/PlanBoard/StatsCards.vue'
import CaseChartsGroup from '@/components/PlanBoard/CaseChartsGroup.vue'
import TimeCompareCard from '@/components/PlanBoard/TimeCompareCard.vue'
import CasesTable from '@/components/PlanBoard/CasesTable.vue'
import ImageGalleryDialog from '@/components/PlanBoard/ImageGalleryDialog.vue'
import ImagePreviewDialog from '@/components/PlanBoard/ImagePreviewDialog.vue'
import ExecutionDetailsDialog from '@/components/Cases/ExecutionDetailsDialog.vue'
import { usePlanStore } from '@/stores/modules/plan'
import { useCasesBoardData } from '@/composables/useCasesBoardData'
import { useCaseImages } from '@/composables/useCaseImages'
import { useImagePreview } from '@/composables/useImagePreview'
import { exportsApi } from '@/api/exports'
import { downloadFile } from '@/utils/download'
import { ElMessageBox, ElMessage } from 'element-plus'

const planStore = usePlanStore()

// 用例数据
const {
  cases,
  loading: casesLoading,
  page,
  pageSize,
  total: totalCases,
  conditionsReady,
  changePage,
  refresh: refreshCases
} = useCasesBoardData()

// 图片
const {
  showDialog: showImageDialog,
  currentImages,
  currentExecutionId,
  imageLoading,
  imageError,
  openImages,
  retry: retryImages,
  close: closeImages,
  downloadSingle: downloadSingleImage,
  downloadAll: downloadAllImages
} = useCaseImages()

// 预览
const {
  showPreview: showImagePreview,
  index: previewIndex,
  zoom: zoomLevel,
  translateX,
  translateY,
  open: openPreview,
  close: closePreview,
  prev: prevImage,
  next: nextImage,
  zoomIn,
  zoomOut,
  reset: resetZoom,
  wheel: handleWheel,
  startDrag,
  onDrag,
  endDrag
} = useImagePreview(currentImages)

// 查看图片
const handleViewImages = (row) => openImages(row)

// 下载当前预览
const downloadCurrentPreview = () => {
  const img = currentImages.value[previewIndex.value]
  if (img) downloadSingleImage(img)
}

// 复制图片链接
const copyImageUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('图片链接已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 详情弹窗
const showDetailsDialog = ref(false)
const currentSheetId = ref(null)
const currentModelId = ref(null)
const handleViewDetails = (event) => {
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
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )
    ElMessage.info('正在准备导出文件...')
    const res = await exportsApi.exportPlan(event.planId)
    downloadFile(res.data, `${event.planName}_测试结果.zip`)
    ElMessage.success('导出成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('导出失败，请稍后重试')
    }
  }
}

onMounted(() => {
  console.log('🚀 [BOARD] PlanBoardPage mounted (Refactored)')
})
</script>

<style scoped>
.plan-board-page {
  padding:20px;
  background-color:#f5f7fa;
  min-height: calc(100vh - 60px);
}
.page-header {
  margin-bottom:24px;
  background:white;
  padding:24px;
  border-radius:8px;
  box-shadow:0 2px 4px rgba(0,0,0,0.1);
}
.page-header h2 {
  margin:0 0 8px 0;
  color:#303133;
  font-size:24px;
  font-weight:600;
}
.page-description {
  margin:0;
  color:#909399;
  font-size:14px;
}
@media (max-width:768px) {
  .plan-board-page { padding:16px; }
  .page-header { padding:20px; margin-bottom:20px; }
  .page-header h2 { font-size:20px; }
}
</style>
