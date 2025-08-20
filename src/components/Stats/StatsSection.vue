<template>
  <div class="stats-section">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in statsData" :key="stat.key">
        <StatCard
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
          :change="stat.change"
          :change-type="stat.changeType"
          @click="handleStatClick(stat)"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatCard from './StatCard.vue'
import { 
  Document, 
  CheckCircle, 
  Clock, 
  Warning 
} from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0
    })
  }
})

const emit = defineEmits(['stat-click'])

const statsData = computed(() => [
  {
    key: 'total',
    title: '总计划数',
    value: props.data.total || 0,
    icon: Document,
    color: '#409EFF',
    change: '+12%',
    changeType: 'increase'
  },
  {
    key: 'completed',
    title: '已完成',
    value: props.data.completed || 0,
    icon: CheckCircle,
    color: '#67C23A',
    change: '+8%',
    changeType: 'increase'
  },
  {
    key: 'inProgress',
    title: '进行中',
    value: props.data.inProgress || 0,
    icon: Clock,
    color: '#E6A23C',
    change: '-3%',
    changeType: 'decrease'
  },
  {
    key: 'overdue',
    title: '已逾期',
    value: props.data.overdue || 0,
    icon: Warning,
    color: '#F56C6C',
    change: '+5%',
    changeType: 'increase'
  }
])

const handleStatClick = (stat) => {
  emit('stat-click', stat)
}
</script>

<style scoped>
.stats-section {
  margin-bottom: 24px;
}
</style>
