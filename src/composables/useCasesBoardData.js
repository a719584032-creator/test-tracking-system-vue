import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { casesApi } from '@/api/cases'
import { formatDateTime } from '@/utils/format'
import { useFiltersStore } from '@/stores/modules/filters'

export function useCasesBoardData() {
  const filtersStore = useFiltersStore()

  const allCases = ref([])
  const cases = ref([])
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)

  const conditionsReady = computed(() => {
    const f = filtersStore.filters
    const ids = filtersStore.ids
    return f.projectName && f.planName && f.modelName && f.sheetName &&
           ids.sheetId && ids.planId && ids.modelId
  })

  const updatePage = () => {
    const start = (page.value - 1) * pageSize.value
    const end = start + pageSize.value
    cases.value = allCases.value.slice(start, end)
  }

  const loadCases = async () => {
    if (!conditionsReady.value) {
      allCases.value = []
      total.value = 0
      cases.value = []
      return
    }
    loading.value = true
    try {
      const res = await casesApi.getCasesStatus(
        filtersStore.ids.sheetId,
        filtersStore.ids.modelId
      )
      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map((item, idx) => ({
          ...item,
          序号: idx + 1,
          用例标题: item.CaseTitle || '-',
          测试结果: item.TestResult || '-',
          '测试耗时(S)': item.TestTime ? `${item.TestTime}` : '-',
          前置条件: item.PreConditions || '-',
          用例步骤: item.CaseSteps || '-',
          预期结果: item.ExpectedResult || '-',
          开始时间: item.StartTime ? formatDateTime(item.StartTime) : '-',
          完成时间: item.EndTime ? formatDateTime(item.EndTime) : '-',
          评论: item.Comment || '-',
          失败次数: item.FailCount || 0,
          _imageLoading: false
        }))
        allCases.value = mapped
        total.value = mapped.length
        page.value = 1
        updatePage()
        ElMessage.success(`加载了 ${mapped.length} 条用例数据`)
      } else {
        allCases.value = []
        total.value = 0
        updatePage()
        ElMessage.warning('用例数据格式异常')
      }
    } catch (e) {
      console.error('加载用例失败:', e)
      ElMessage.error('加载用例数据失败')
      allCases.value = []
      total.value = 0
      updatePage()
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [
      filtersStore.filters.projectName,
      filtersStore.filters.planName,
      filtersStore.filters.modelName,
      filtersStore.filters.sheetName,
      filtersStore.ids.sheetId,
      filtersStore.ids.planId,
      filtersStore.ids.modelId
    ],
    () => {
      if (conditionsReady.value) {
        loadCases()
      } else {
        allCases.value = []
        total.value = 0
        cases.value = []
        page.value = 1
      }
    },
    { immediate: true }
  )

  const changePage = ({ page: newPage, pageSize: newSize }) => {
    if (newSize !== pageSize.value) {
      pageSize.value = newSize
      page.value = 1
    } else {
      page.value = newPage
    }
    updatePage()
  }

  const refresh = () => {
    page.value = 1
    loadCases()
  }

  return {
    cases,
    loading,
    page,
    pageSize,
    total,
    conditionsReady,
    loadCases,
    changePage,
    refresh
  }
}
