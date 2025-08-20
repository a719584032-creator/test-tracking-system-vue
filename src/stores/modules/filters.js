import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useFiltersStore = defineStore('filters', () => {
  // 筛选条件
  const filters = reactive({
    projectName: '',
    planName: '',
    modelName: '',
    sheetName: ''
  })

  // 内部ID映射
  const ids = reactive({
    planId: null,
    modelId: null,
    sheetId: null
  })

  // 选项数据
  const options = reactive({
    projects: [],
    plans: [],
    models: [],
    sheets: []
  })

  // 加载状态
  const loading = reactive({
    projects: false,
    plans: false,
    models: false,
    sheets: false
  })

  // 重置筛选条件
  const resetFilters = () => {
    filters.projectName = ''
    filters.planName = ''
    filters.modelName = ''
    filters.sheetName = ''
    
    ids.planId = null
    ids.modelId = null
    ids.sheetId = null
    
    options.projects = []
    options.plans = []
    options.models = []
    options.sheets = []
  }

  // 设置项目选项
  const setProjectOptions = (projects) => {
    options.projects = projects
  }

  // 设置计划选项
  const setPlanOptions = (plans) => {
    options.plans = plans
  }

  // 设置机型选项
  const setModelOptions = (models) => {
    options.models = models
  }

  // 设置用例表选项
  const setSheetOptions = (sheets) => {
    options.sheets = sheets
  }

  return {
    filters,
    ids,
    options,
    loading,
    resetFilters,
    setProjectOptions,
    setPlanOptions,
    setModelOptions,
    setSheetOptions
  }
})
