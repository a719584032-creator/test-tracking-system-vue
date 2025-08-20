<template>
  <el-dialog
    v-model="visible"
    title="图片预览"
    width="80%"
    top="5vh"
    :append-to-body="true"
    :close-on-click-modal="true"
    class="image-preview-dialog"
  >
    <div class="preview-container" v-if="images.length > 0">
      <!-- 图片展示区域 -->
      <div class="image-display">
        <img
          :src="images[currentIndex]?.url"
          :alt="images[currentIndex]?.name"
          class="preview-image"
          @load="handleImageLoad"
          @error="handleImageError"
        />
      </div>

      <!-- 图片信息 -->
      <div class="image-info">
        <div class="info-left">
          <span class="image-name">{{ images[currentIndex]?.name }}</span>
          <span class="image-index">{{ currentIndex + 1 }} / {{ images.length }}</span>
        </div>
        <div class="info-right">
          <el-button-group>
            <el-tooltip content="上一张" placement="top">
              <el-button 
                :disabled="currentIndex <= 0" 
                @click="prevImage"
                :icon="ArrowLeft"
              />
            </el-tooltip>
            <el-tooltip content="下一张" placement="top">
              <el-button 
                :disabled="currentIndex >= images.length - 1" 
                @click="nextImage"
                :icon="ArrowRight"
              />
            </el-tooltip>
            <el-tooltip content="下载" placement="top">
              <el-button @click="downloadImage" :icon="Download" />
            </el-tooltip>
          </el-button-group>
        </div>
      </div>

      <!-- 缩略图导航 -->
      <div class="thumbnail-nav" v-if="images.length > 1">
        <div
          v-for="(image, index) in images"
          :key="image.id || index"
          :class="['thumbnail-item', { active: index === currentIndex }]"
          @click="setCurrentIndex(index)"
        >
          <img :src="image.url" :alt="image.name" class="thumbnail-image" />
        </div>
      </div>
    </div>

    <div v-else class="empty-preview">
      <el-empty description="暂无图片" />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Download } from '@element-plus/icons-vue'
import { downloadSingleImage } from '@/utils/imageUtils'

const props = defineProps({
  modelValue: Boolean,
  images: { type: Array, default: () => [] },
  currentIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue', 'update:currentIndex'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentIndex = computed({
  get: () => props.currentIndex,
  set: (val) => emit('update:currentIndex', val)
})

// 图片导航
const prevImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value = currentIndex.value - 1
  }
}

const nextImage = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value = currentIndex.value + 1
  }
}

const setCurrentIndex = (index) => {
  currentIndex.value = index
}

// 下载图片
const downloadImage = () => {
  const currentImage = props.images[currentIndex.value]
  if (currentImage) {
    downloadSingleImage(currentImage)
  }
}

// 图片加载事件
const handleImageLoad = () => {
  console.log('图片加载成功')
}

const handleImageError = () => {
  ElMessage.error('图片加载失败')
}

// 键盘导航
const handleKeydown = (event) => {
  if (!visible.value) return
  
  switch (event.key) {
    case 'ArrowLeft':
      prevImage()
      break
    case 'ArrowRight':
      nextImage()
      break
    case 'Escape':
      visible.value = false
      break
  }
}

// 监听键盘事件
watch(visible, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.image-preview-dialog {
  --el-dialog-padding-primary: 20px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-display {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.info-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-weight: 500;
  color: #303133;
}

.image-index {
  font-size: 12px;
  color: #909399;
}

.thumbnail-nav {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow-x: auto;
}

.thumbnail-item {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.thumbnail-item:hover {
  border-color: #409eff;
}

.thumbnail-item.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-info {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .thumbnail-nav {
    justify-content: center;
  }
  
  .thumbnail-item {
    width: 50px;
    height: 50px;
  }
}
</style>
