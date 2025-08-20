<template>
  <el-dialog
    v-model="visible"
    title="执行详情"
    width="80%"
    top="5vh"
    :before-close="handleClose"
  >
    <div class="execution-details">
      <el-descriptions border :column="2">
        <el-descriptions-item label="工作表ID">{{ sheetId }}</el-descriptions-item>
        <el-descriptions-item label="模型ID">{{ modelId }}</el-descriptions-item>
      </el-descriptions>
      
      <div class="details-actions" style="margin-top: 20px;">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  sheetId: [String, Number],
  modelId: [String, Number]
})

const emit = defineEmits(['update:modelValue', 'refresh'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleClose = () => {
  visible.value = false
}

const handleRefresh = () => {
  emit('refresh')
  handleClose()
}
</script>

<style scoped>
.execution-details {
  padding: 20px 0;
}

.details-actions {
  text-align: center;
}
</style>
