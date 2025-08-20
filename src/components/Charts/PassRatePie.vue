<template>
  <div class="pass-rate-pie" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const chartRef = ref(null)
let chartInstance = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表数据
const updateChart = () => {
  if (!chartInstance || !props.data) return
  
  const pieData = [
    { value: props.data.passed || 0, name: '通过', itemStyle: { color: '#67c23a' } },
    { value: props.data.failed || 0, name: '失败', itemStyle: { color: '#f56c6c' } },
    { value: props.data.blocked || 0, name: '阻塞', itemStyle: { color: '#e6a23c' } },
    { value: props.data.notExecuted || 0, name: '未执行', itemStyle: { color: '#909399' } }
  ].filter(item => item.value > 0)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const total = pieData.reduce((sum, item) => sum + item.value, 0)
        const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0
        return `${params.name}<br/>${params.marker}数量: ${params.value}<br/>占比: ${percentage}%`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      data: pieData.map(item => item.name)
    },
    series: [
      {
        name: '用例状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['65%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: pieData
      }
    ]
  }
  
  chartInstance.setOption(option, true)
}

// 监听数据变化
watch(() => props.data, updateChart, { deep: true })

// 窗口大小变化时重新调整图表
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.pass-rate-pie {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
