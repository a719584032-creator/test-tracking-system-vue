<template>
  <div class="charts-section" v-if="caseCounts">
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>用例统计</span>
            </div>
          </template>
          <CaseCountBar :data="caseCounts" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>通过率分析</span>
            </div>
          </template>
          <PassRatePie :data="percentages" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import CaseCountBar from '@/components/Charts/CaseCountBar.vue'
import PassRatePie from '@/components/Charts/PassRatePie.vue'

defineProps({
  caseCounts: {
    type: Object,
    default: null
  },
  percentages: {
    type: Object,
    default: null
  }
})
</script>

<style scoped>
.charts-section {
  margin-bottom: 24px;
}
.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.chart-card :deep(.el-card__body) {
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
</style>
