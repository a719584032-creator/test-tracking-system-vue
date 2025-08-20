<template>
  <div class="dashboard">
    <!-- 统计卡片区域 -->
    <el-row :gutter="24" class="stats-row">
      <el-col :span="6" :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon plans-icon">
              <el-icon size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">测试计划数</div>
              <div class="stat-value">{{ stats.plans }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6" :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon cases-icon">
              <el-icon size="24"><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">执行用例数</div>
              <div class="stat-value">{{ stats.cases }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6" :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon rate-icon">
              <el-icon size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">通过率</div>
              <div class="stat-value">{{ stats.passRate }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6" :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon users-icon">
              <el-icon size="24"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">活跃用户数</div>
              <div class="stat-value">{{ stats.users }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表和表格区域 -->
    <el-row :gutter="24" class="content-row">
      <el-col :span="14" :xs="24" :sm="14">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">用例执行统计</span>
              <el-button type="text" size="small">查看详情</el-button>
            </div>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="10" :xs="24" :sm="10">
        <el-card class="table-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近计划</span>
              <el-button type="text" size="small">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentPlans" style="width: 100%" class="recent-table">
            <el-table-column prop="name" label="计划名称" min-width="80">
              <template #default="{ row }">
                <div class="plan-name">{{ row.name }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="project" label="所属项目" min-width="70">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ row.project }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="创建时间" min-width="90">
              <template #default="{ row }">
                <div class="create-date">{{ row.date }}</div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { Document, List, TrendCharts, User } from '@element-plus/icons-vue'

const stats = ref({
  plans: 12,
  cases: 350,
  passRate: 87,
  users: 15
})

const recentPlans = ref([
  { name: '计划A', project: '项目X', date: '2025-08-01' },
  { name: '计划B', project: '项目Y', date: '2025-08-05' },
  { name: '计划C', project: '项目Z', date: '2025-08-09' }
])

const chartRef = ref(null)

onMounted(() => {
  const chart = echarts.init(chartRef.value)
  
  // 定义不同状态的颜色
  const statusColors = {
    '通过': '#67c23a',    // 绿色 - 成功
    '失败': '#f56c6c',    // 红色 - 失败
    '阻塞': '#e6a23c',    // 橙色 - 警告
    '未执行': '#909399'   // 灰色 - 未执行
  }
  
  const chartData = [
    { name: '通过', value: 250, color: statusColors['通过'] },
    { name: '失败', value: 50, color: statusColors['失败'] },
    { name: '阻塞', value: 20, color: statusColors['阻塞'] },
    { name: '未执行', value: 30, color: statusColors['未执行'] }
  ]
  
  chart.setOption({
    title: { 
      show: false 
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#409eff',
      textStyle: {
        color: '#fff'
      },
      formatter: function(params) {
        const data = params[0]
        const percentage = ((data.value / 350) * 100).toFixed(1)
        return `
          <div style="padding: 8px;">
            <div style="margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${data.color}; border-radius: 50%; margin-right: 6px;"></span>
              ${data.name}
            </div>
            <div style="font-size: 14px; font-weight: bold;">
              数量: ${data.value}
            </div>
            <div style="font-size: 12px; color: #ccc;">
              占比: ${percentage}%
            </div>
          </div>
        `
      }
    },
    legend: {
      show: true,
      bottom: '5%',
      left: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        color: '#606266',
        fontSize: 12
      },
      data: chartData.map(item => ({
        name: item.name,
        icon: 'circle'
      }))
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '20%',
      top: '5%',
      containLabel: true
    },
    xAxis: { 
      data: chartData.map(item => item.name),
      axisLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#606266',
        fontSize: 12
      }
    },
    yAxis: {
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#606266',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#f0f2f5',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        type: 'bar',
        data: chartData.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: item.color },
              { offset: 1, color: item.color + '80' } // 添加透明度
            ]),
            borderRadius: [4, 4, 0, 0] // 顶部圆角
          }
        })),
        barWidth: '50%',
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            shadowOffsetY: 2
          }
        },
        // 添加数据标签
        label: {
          show: true,
          position: 'top',
          color: '#606266',
          fontSize: 12,
          fontWeight: 'bold'
        }
      }
    ]
  })

  // 响应式
  window.addEventListener('resize', () => {
    chart.resize()
  })
})
</script>

<style scoped>
.dashboard {
  min-height: 100%;
}

/* 统计卡片行 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
}

.plans-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.cases-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.rate-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.users-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

/* 内容区域 */
.content-row {
  margin-bottom: 24px;
}

.chart-card,
.table-card {
  border-radius: 12px;
  border: none;
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 300px;
  width: 100%;
}

/* 表格样式 */
.recent-table {
  --el-table-border-color: #f0f2f5;
}

.plan-name {
  font-weight: 500;
  color: #303133;
}

.create-date {
  color: #909399;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-row {
    margin-bottom: 16px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .chart-card,
  .table-card {
    height: auto;
    margin-bottom: 16px;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>
