<template>
  <div class="case-count-bar" ref="chartRef"></div>
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
  
  // 只显示有数据的系列
  const seriesData = []
  const legendData = []
  
  if (props.data.passed && props.data.passed.some(v => v > 0)) {
    seriesData.push({
      name: '通过',
      type: 'bar',
      stack: 'total',
      data: props.data.passed || [],
      itemStyle: { color: '#67c23a' }
    })
    legendData.push('通过')
  }
  
  if (props.data.failed && props.data.failed.some(v => v > 0)) {
    seriesData.push({
      name: '失败',
      type: 'bar',
      stack: 'total',
      data: props.data.failed || [],
      itemStyle: { color: '#f56c6c' }
    })
    legendData.push('失败')
  }
  
  if (props.data.blocked && props.data.blocked.some(v => v > 0)) {
    seriesData.push({
      name: '阻塞',
      type: 'bar',
      stack: 'total',
      data: props.data.blocked || [],
      itemStyle: { color: '#e6a23c' }
    })
    legendData.push('阻塞')
  }
  
  if (props.data.notExecuted && props.data.notExecuted.some(v => v > 0)) {
    seriesData.push({
      name: '未执行',
      type: 'bar',
      stack: 'total',
      data: props.data.notExecuted || [],
      itemStyle: { color: '#909399' }
    })
    legendData.push('未执行')
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: legendData, // 使用动态生成的图例数据
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.categories || []
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: seriesData // 使用动态生成的系列数据
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
.case-count-bar {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
