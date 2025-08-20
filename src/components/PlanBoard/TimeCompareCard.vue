<template>
  <div class="time-chart-section" v-if="data">
    <el-card class="chart-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>时间对比分析</span>
        </div>
      </template>
      <TimeCompareBar :data="data" />
    </el-card>
  </div>
</template>

<script setup>
import TimeCompareBar from '@/components/Charts/TimeCompareBar.vue'

defineProps({
  data: {
    type: Object,
    default: null
  }
})
</script>

<style scoped>
.time-chart-section {
  margin-bottom: 60px;
}
.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.card-header {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
