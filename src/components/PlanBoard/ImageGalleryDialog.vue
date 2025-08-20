<template>
  <el-dialog
    v-model="modelValueProxy"
    :title="`用例截图 - ExecutionID: ${executionId || ''}`"
    width="90%"
    top="5vh"
    class="image-dialog"
    :before-close="onBeforeClose"
    :append-to-body="true"
    :close-on-click-modal="false"
    :z-index="2000"
  >
    <template #header>
      <div class="image-dialog-header">
        <div class="header-left">
          <span class="dialog-title">用例截图</span>
          <el-tag size="small" type="info" v-if="executionId">ExecutionID: {{ executionId }}</el-tag>
          <el-tag size="small" effect="plain" v-if="images.length">共 {{ images.length }} 张</el-tag>
        </div>
        <div class="header-right">
          <el-button
            v-if="images.length > 0"
            size="small"
            @click="$emit('download-all')"
            :icon="Download"
          >下载全部</el-button>
        </div>
      </div>
    </template>

    <div class="image-dialog-body">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
        <div class="loading-text">正在加载图片...</div>
      </div>

      <div v-else-if="error" class="error-container">
        <el-empty description="加载图片失败">
          <el-button
            type="primary"
            @click="$emit('retry')"
            :icon="RefreshIcon"
          >
            重新加载
          </el-button>
        </el-empty>
      </div>

      <div v-else-if="!images.length" class="empty-container">
        <el-empty description="该用例暂无相关图片" />
      </div>

      <div v-else class="images-container">
        <div class="images-grid">
          <div
            v-for="(image, index) in images"
            :key="image.id || index"
            class="image-card"
          >
            <div class="image-wrapper">
              <img
                :src="image.url"
                :alt="image.name"
                class="image-item"
                @click="$emit('preview', index)"
                @error="handleImageError"
                @load="handleImageLoad"
                loading="lazy"
              />
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
                      @click.stop="$emit('preview', index)"
                      :icon="View"
                    />
                  </el-tooltip>
                  <el-tooltip content="复制链接" placement="top">
                    <el-button
                      size="small"
                      circle
                      @click.stop="$emit('copy-link', image.url)"
                      :icon="CopyDocument"
                    />
                  </el-tooltip>
                  <el-tooltip content="下载图片" placement="top">
                    <el-button
                      size="small"
                      circle
                      @click.stop="$emit('download-single', image)"
                      :icon="Download"
                    />
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div> <!-- grid -->
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import {
  Download,
  CopyDocument,
  Refresh as RefreshIcon,
  View
} from '@element-plus/icons-vue'
import { formatImageTime, formatSize } from '@/utils/format'
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  executionId: [String, Number],
  images: {
    type: Array,
    default: () => []
  },
  loading: Boolean,
  error: Boolean
})
const emit = defineEmits([
  'update:modelValue',
  'close',
  'retry',
  'preview',
  'download-all',
  'download-single',
  'copy-link'
])

const modelValueProxy = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const onBeforeClose = () => {
  emit('close')
  emit('update:modelValue', false)
}

const handleImageLoad = (e) => {
  // 可按需打印日志
  // console.log('Image loaded:', e.target.src)
}

const handleImageError = (e) => {
  console.error('Image load failed:', e.target.src)
}
</script>

<style scoped>
.image-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
  z-index: 2000 !important;
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
  display:flex;
  align-items:center;
  justify-content:space-between;
  width:100%;
}
.header-left {
  display:flex;
  align-items:center;
  gap:12px;
}
.dialog-title {
  font-size:16px;
  font-weight:600;
  color:#303133;
}
.header-right {
  display:flex;
  gap:8px;
}

.image-dialog-body { min-height: 200px; position: relative; }

.loading-container, .error-container, .empty-container {
  padding: 40px;
  text-align: center;
}

.images-container { padding:20px; }
.images-grid {
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap:20px;
}
.image-card {
  position:relative;
  border-radius:12px;
  overflow:hidden;
  box-shadow:0 4px 12px rgba(0,0,0,0.1);
  transition: all .3s ease;
  background:#f8f9fa;
}
.image-card:hover {
  transform: translateY(-4px);
  box-shadow:0 8px 24px rgba(0,0,0,0.15);
}
.image-wrapper {
  position:relative;
  width:100%;
  height:200px;
}
.image-item {
  width:100%;
  height:100%;
  object-fit:cover;
  border-radius:12px;
  cursor:pointer;
  transition: transform .3s ease;
}
.image-card:hover .image-item {
  transform: scale(1.05);
}

.image-overlay {
  position:absolute;
  bottom:0;
  left:0;
  right:0;
  background:linear-gradient(transparent, rgba(0,0,0,0.7));
  color:white;
  padding:16px;
  transform:translateY(100%);
  transition: transform .3s ease;
}
.image-card:hover .image-overlay {
  transform:translateY(0);
}
.image-info { margin-bottom:12px; }
.image-name {
  font-size:14px;
  font-weight:600;
  margin-bottom:4px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.image-meta {
  font-size:12px;
  opacity:.9;
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}
.image-actions {
  display:flex;
  gap:8px;
}
.image-actions .el-button {
  background:rgba(255,255,255,0.2);
  border:1px solid rgba(255,255,255,0.3);
  color:white;
  backdrop-filter:blur(4px);
}
.image-actions .el-button:hover {
  background:rgba(255,255,255,0.3);
  border-color:rgba(255,255,255,0.5);
}

@media (max-width:768px) {
  .images-grid {
    grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
    gap:16px;
  }
  .image-wrapper { height:150px; }
  .image-dialog-header {
    flex-direction:column;
    align-items:flex-start;
    gap:12px;
  }
  .header-left { flex-wrap:wrap; }
}
@media (max-width:480px) {
  .images-grid { grid-template-columns:1fr; }
  .image-wrapper { height:180px; }
  .images-container { padding:16px; }
}
</style>
