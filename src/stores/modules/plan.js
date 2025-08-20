import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

/**
 * 计划统计 Store
 * 统一字段命名（内部 camelCase），对后端多版本 / 不同命名做兼容。
 * 百分比类字段统一存 0~1 小数，展示时用 formatPercentage。
 */
export const usePlanStore = defineStore('plan', () => {
  // 生成空统计对象
  const createEmptyStats = () => ({
    caseCount: 0,
    passRate: 0,              // 0~1
    executionProgress: 0,     // 0~1
    blockCount: 0,
    blockRate: 0,             // 0~1
    failCount: 0,
    failRate: 0,              // 0~1
    caseTimeCount: 0,
    workloadingTime: 0,
    testers: [],
    projectPhase: null
  })

  // 当前计划统计数据（保持引用不置 null，避免组件销毁）
  const currentStats = ref(createEmptyStats())

  // 简易测试信息（仍保留给现有组件使用）
  const testInfo = reactive({
    tester: '',
    workloadingTime: 0
  })

  // 图表数据（保持旧字段，后续可再统一）
  const chartData = reactive({
    caseCounts: null,
    percentages: null,
    timeCounts: null
  })

  function parsePercent(raw) {
    if (raw === null || raw === undefined) return 0
    if (typeof raw === 'number') {
      return raw > 1 ? raw / 100 : raw
    }
    const num = parseFloat(String(raw).replace('%', '').trim())
    if (isNaN(num)) return 0
    return num > 1 ? num / 100 : num
  }

  function normalizeStats(raw = {}) {
    return {
      caseCount: Number(raw.case_count ?? raw.total_cases ?? raw.caseCount ?? 0),
      passRate: parsePercent(raw.pass_rate ?? raw.passRate),
      executionProgress: parsePercent(raw.execution_progress ?? raw.progress ?? raw.executionProgress),
      blockCount: Number(raw.block_count ?? raw.blockCount ?? 0),
      blockRate: parsePercent(raw.block_rate ?? raw.blockRate),
      failCount: Number(raw.fail_count ?? raw.failCount ?? 0),
      failRate: parsePercent(raw.fail_rate ?? raw.failRate),
      caseTimeCount: Number(raw.case_time_count ?? raw.caseTimeCount ?? 0),
      workloadingTime: Number(raw.workloading_time ?? raw.workloadingTime ?? 0),
      testers: Array.isArray(raw.tester)
        ? raw.tester
        : (raw.tester ? String(raw.tester).split(/[,\s]+/).filter(Boolean) : []),
      projectPhase: raw.project_phase ?? raw.projectPhase ?? null
    }
  }

  const setStats = (stats) => {
    if (!stats) {
      clearStats()
      return
    }
    const norm = normalizeStats(stats)
    Object.assign(currentStats.value, norm)

    testInfo.tester = norm.testers.join(', ')
    testInfo.workloadingTime = norm.workloadingTime

    // 兼容原图表数据字段
    chartData.caseCounts = stats.case_counts ?? stats.caseCounts ?? null
    chartData.percentages = stats.percentages ?? chartData.percentages ?? null
    chartData.timeCounts = stats.time_counts ?? stats.timeCounts ?? null
  }

  const clearStats = () => {
    Object.assign(currentStats.value, createEmptyStats())
    testInfo.tester = ''
    testInfo.workloadingTime = 0
    chartData.caseCounts = null
    chartData.percentages = null
    chartData.timeCounts = null
  }

  return {
    currentStats,
    testInfo,
    chartData,
    setStats,
    clearStats
  }
})