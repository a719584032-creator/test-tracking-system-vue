<template>
  <el-dialog
    v-model="modelValueProxy"
    width="95%"
    top="2.5vh"
    class="image-preview-dialog"
    :show-close="false"
    :append-to-body="true"
    :close-on-click-modal="true"
    :z-index="3000"
    @close="handleClose"
  >
    <div class="image-preview-container">
      <div class="preview-toolbar">
        <div class="toolbar-left">
          <span class="current-image-info">
            {{ index + 1 }} / {{ images.length }}
          </span>
          <span class="image-title">{{ images[index]?.name }}</span>
        </div>
        <div class="toolbar-right">
          <el-button-group>
            <el-tooltip content="上一张" placement="bottom">
              <el-button
                :icon="ArrowLeft"
                @click="$emit('prev')"
                :disabled="index <= 0"
                size="small"
              />
            </el-tooltip>
            <el-tooltip content="下一张" placement="bottom">
              <el-button
                :icon="ArrowRight"
                @click="$emit('next')"
                :disabled="index >= images.length - 1"
                size="small"
              />
            </el-tooltip>
            <el-tooltip content="放大" placement="bottom">
              <el-button :icon="ZoomIn" @click="$emit('zoom-in')" size="small" />
            </el-tooltip>
            <el-tooltip content="缩小" placement="bottom">
              <el-button :icon="ZoomOut" @click="$emit('zoom-out')" size="small" />
            </el-tooltip>
            <el-tooltip content="重置" placement="bottom">
              <el-button :icon="RefreshIcon" @click="$emit('reset')" size="small" />
            </el-tooltip>
            <el-tooltip content="下载当前" placement="bottom">
              <el-button :icon="Download" @click="$emit('download')" size="small" />
            </el-tooltip>
            <el-tooltip content="关闭" placement="bottom">
              <el-button :icon="Close" @click="handleClose" size="small" />
            </el-tooltip>
          </el-button-group>
        </div>
      </div>

      <div
        class="preview-content"
        @wheel="$emit('wheel', $event)"
        @mousedown="$emit('start-drag', $event)"
        @mousemove="$emit('on-drag', $event)"
        @mouseup="$emit('end-drag')"
        @mouseleave="$emit('end-drag')"
      >
        <div
          class="preview-image-wrapper"
          :style="{ transform: `scale(${zoom}) translate(${translateX}px, ${translateY}px)` }"
        >
          <img
            :src="images[index]?.url"
            :alt="images[index]?.name"
            class="preview-image"
            draggable="false"
            @error="handleImageError"
          />
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import {
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Refresh as RefreshIcon,
  Download,
  Close
} from '@element-plus/icons-vue'
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  images: {
    type: Array,
    default: () => []
  },
  index: {
    type: Number,
    default: 0
  },
  zoom: {
    type: Number,
    default: 1
  },
  translateX: {
    type: Number,
    default: 0
  },
  translateY: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'update:modelValue',
  'close',
  'prev',
  'next',
  'zoom-in',
  'zoom-out',
  'reset',
  'download',
  'wheel',
  'start-drag',
  'on-drag',
  'end-drag'
])

const modelValueProxy = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const handleClose = () => {
  emit('close')
  emit('update:modelValue', false)
}

const handleImageError = (e) => {
  console.error('预览图片加载失败:', e.target.src)
}
</script>

<style scoped>
.image-preview-dialog :deep(.el-dialog) {
  background: rgba(0,0,0,0.95);
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
  display:flex;
  flex-direction:column;
  background: rgba(0,0,0,0.95);
}
.preview-toolbar {
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:16px 20px;
  background: rgba(0,0,0,0.8);
  border-bottom:1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
}
.toolbar-left {
  display:flex;
  align-items:center;
  gap:16px;
  color:white;
}
.current-image-info {
  font-size:14px;
  color:#e6e6e6;
  background:rgba(255,255,255,0.1);
  padding:4px 8px;
  border-radius:4px;
}
.image-title {
  font-size:16px;
  font-weight:500;
  max-width:300px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:white;
}
.toolbar-right .el-button {
  background:rgba(255,255,255,0.1);
  border:1px solid rgba(255,255,255,0.2);
  color:white;
}
.toolbar-right .el-button:hover {
  background:rgba(255,255,255,0.2);
  border-color:rgba(255,255,255,0.3);
}
.toolbar-right .el-button:disabled {
  background:rgba(255,255,255,0.05);
  border-color:rgba(255,255,255,0.1);
  color:rgba(255,255,255,0.3);
}
.preview-content {
  flex:1;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  cursor:grab;
  position:relative;
}
.preview-content:active { cursor:grabbing; }
.preview-image-wrapper {
  display:flex;
  align-items:center;
  justify-content:center;
  transition: transform .2s ease;
  transform-origin:center center;
}
.preview-image {
  max-width:100%;
  max-height:100%;
  object-fit:contain;
  user-select:none;
  pointer-events:none;
}
@media (max-width:768px) {
  .preview-toolbar {
    padding:12px 16px;
    flex-direction:column;
    gap:12px;
    align-items:stretch;
  }
  .toolbar-left {
    justify-content:center;
    flex-wrap:wrap;
  }
  .toolbar-right {
    display:flex;
    justify-content:center;
  }
  .image-title {
    max-width:200px;
  }
  .toolbar-right .el-button-group {
    flex-wrap:wrap;
    gap:4px;
  }
}
@media (max-width:480px) {
  .image-preview-dialog { width:100% !important; top:0 !important; --el-dialog-margin-top:0; }
  .image-preview-dialog :deep(.el-dialog) {
    height:100vh;
    margin:0;
    border-radius:0;
  }
  .image-preview-dialog :deep(.el-dialog__body) {
    height: calc(100vh - 80px);
  }
  .toolbar-right .el-button { padding:8px; }
}
</style>
