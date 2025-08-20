<template>
  <div class="stats-section" v-if="stats">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8">
        <StatCard
          title="用例总数"
          :value="formatNumber(stats.caseCount)"
          icon="Document"
          type="primary"
        />
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <StatCard
          title="通过率"
          :value="formatPercentage(stats.passRate)"
          icon="SuccessFilled"
          type="success"
        />
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <StatCard
          title="执行进度"
          :value="formatPercentage(stats.executionProgress)"
          icon="Timer"
          type="warning"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import StatCard from './_internal/StatCard.vue'
import { formatNumber, formatPercentage } from '@/utils/format'

defineProps({
  stats: {
    type: Object,
    default: null
  }
})
</script>

<style scoped>
.stats-section {
  margin-bottom: 70px;
}
</style>