<template>
  <el-card class="stat-card" shadow="hover" @click="$emit('click')">
    <div class="stat-content">
      <div class="stat-icon" :style="{ backgroundColor: `${color}15` }">
        <el-icon :size="28" :color="color">
          <component :is="icon" />
        </el-icon>
      </div>
      <div class="stat-info">
        <div class="stat-value">{{ formatValue(value) }}</div>
        <div class="stat-title">{{ title }}</div>
        <div class="stat-change" :class="changeType" v-if="change">
          <el-icon :size="12">
            <ArrowUp v-if="changeType === 'increase'" />
            <ArrowDown v-if="changeType === 'decrease'" />
          </el-icon>
          {{ change }}
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'

defineProps({
  title: String,
  value: [Number, String],
  icon: Object,
  color: String,
  change: String,
  changeType: String
})

defineEmits(['click'])

const formatValue = (value) => {
  if (typeof value === 'number' && value >= 1000) {
    return (value / 1000).toFixed(1) + 'k'
  }
  return value
}
</script>

<style scoped>
.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 120px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.stat-change.increase {
  color: #67C23A;
}

.stat-change.decrease {
  color: #F56C6C;
}

@media (max-width: 768px) {
  .stat-content {
    flex-direction: column;
    text-align: center;
    justify-content: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .stat-value {
    font-size: 24px;
  }
}
</style>
