<template>
  <div class="time-compare-bar" ref="chartRef"></div>
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
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function(params) {
        let result = `${params[0].name}<br/>`
        params.forEach(param => {
          if (param.seriesType === 'bar') {
            result += `${param.marker}${param.seriesName}: ${param.value} 个<br/>`
          } else {
            result += `${param.marker}${param.seriesName}: ${param.value} 分钟<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['用例数量', '执行时间'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: props.data.dates || [],
        axisPointer: {
          type: 'shadow'
        },
        axisLabel: {
          interval: 0,
          rotate: props.data.dates?.length > 7 ? 45 : 0
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '用例数量',
        position: 'left',
        axisLabel: {
          formatter: '{value} 个'
        },
        minInterval: 1
      },
      {
        type: 'value',
        name: '执行时间',
        position: 'right',
        axisLabel: {
          formatter: '{value} 分钟'
        }
      }
    ],
    series: [
      {
        name: '用例数量',
        type: 'bar',
        yAxisIndex: 0,
        data: props.data.caseCounts || [],
        itemStyle: {
          color: '#409eff'
        },
        barWidth: '60%'
      },
      {
        name: '执行时间',
        type: 'line',
        yAxisIndex: 1,
        data: props.data.executionTimes || [],
        itemStyle: {
          color: '#67c23a'
        },
        lineStyle: {
          width: 3
        },
        symbol: 'circle',
        symbolSize: 6
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
.time-compare-bar {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
