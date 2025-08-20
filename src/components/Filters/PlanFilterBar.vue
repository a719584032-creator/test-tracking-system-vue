<template>
  <div class="plan-filter-bar">
    <el-card shadow="never" class="filter-card">
      <!-- 筛选条件行 -->
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">项目</label>
          <el-select
            v-model="filtersStore.filters.projectName"
            placeholder="请选择项目"
            clearable
            filterable
            @change="handleProjectChange"
            @focus="loadProjects"
            :loading="filtersStore.loading.projects"
          >
            <el-option
              v-for="project in filtersStore.options.projects"
              :key="project"
              :label="project"
              :value="project"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label class="filter-label">测试计划</label>
          <el-select
            v-model="filtersStore.filters.planName"
            placeholder="请选择测试计划"
            clearable
            filterable
            @change="handlePlanChange"
            :loading="filtersStore.loading.plans"
            :disabled="!filtersStore.filters.projectName"
          >
            <el-option
              v-for="plan in filtersStore.options.plans"
              :key="plan.id"
              :label="plan.name"
              :value="plan.name"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label class="filter-label">测试机型</label>
          <el-select
            v-model="filtersStore.filters.modelName"
            placeholder="请选择测试机型"
            clearable
            filterable
            @change="handleModelChange"
            :loading="filtersStore.loading.models"
            :disabled="!filtersStore.filters.planName"
          >
            <el-option
              v-for="model in filtersStore.options.models"
              :key="model.id"
              :label="model.name"
              :value="model.name"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label class="filter-label">模块名称</label>
          <el-select
            v-model="filtersStore.filters.sheetName"
            placeholder="请选择模块"
            clearable
            filterable
            @change="handleSheetChange"
            :loading="filtersStore.loading.sheets"
            :disabled="!filtersStore.filters.modelName"
          >
            <el-option
              v-for="sheet in filtersStore.options.sheets"
              :key="sheet.id"
              :label="sheet.name"
              :value="sheet.name"
            />
          </el-select>
        </div>
      </div>

      <!-- 信息显示行 -->
      <div class="info-row" v-if="planStore.testInfo.tester">
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">测试人员:</span>
            <span class="info-value">{{ planStore.testInfo.tester }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">预估时间:</span>
            <span class="info-value">{{ planStore.testInfo.workloadingTime }} 分钟</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <el-button 
            type="primary" 
            @click="handleViewDetails"
            :disabled="!canViewDetails"
          >
            查看详情
          </el-button>
          <el-button 
            type="success" 
            @click="handleExportPlan"
            :disabled="!filtersStore.filters.planName"
          >
            用例导出
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useFiltersStore } from '@/stores/modules/filters'
import { usePlanStore } from '@/stores/modules/plan'
import { useAuthStore } from '@/stores/modules/auth'
import { projectsApi } from '@/api/projects'
import { plansApi } from '@/api/plans'
import { modelsApi } from '@/api/models'
import { sheetsApi } from '@/api/sheets'
import { statisticsApi } from '@/api/statistics'

const emit = defineEmits(['view-details', 'export-plan'])

const filtersStore = useFiltersStore()
const planStore = usePlanStore()
const authStore = useAuthStore()

// 计算属性
const canViewDetails = computed(() => {
  return filtersStore.filters.sheetName && 
         filtersStore.ids.sheetId && 
         filtersStore.ids.modelId
})

// 加载项目列表
const loadProjects = async () => {
  if (filtersStore.options.projects.length > 0) return
  
  // 检查用户认证状态
  if (!authStore.isLoggedIn || !authStore.userid) {
    console.error('🔍 [FILTER] User not authenticated or userid missing:', {
      isLoggedIn: authStore.isLoggedIn,
      userid: authStore.userid,
      username: authStore.username
    })
    ElMessage.error('请先登录')
    return
  }
  
  console.log('🔍 [FILTER] Loading projects for user:', authStore.userid)
  
  filtersStore.loading.projects = true
  try {
    const response = await projectsApi.getProjectNames(authStore.userid)
    console.log('🔍 [FILTER] Projects response:', response)
    filtersStore.setProjectOptions(response.data.project_names || [])
  } catch (error) {
    console.error('加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败')
  } finally {
    filtersStore.loading.projects = false
  }
}

// 项目选择变化
const handleProjectChange = async (projectName) => {
  // 清空下级选项
  filtersStore.filters.planName = ''
  filtersStore.filters.modelName = ''
  filtersStore.filters.sheetName = ''
  filtersStore.setPlanOptions([])
  filtersStore.setModelOptions([])
  filtersStore.setSheetOptions([])
  
  // 清空计划数据
  planStore.clearStats()
  
  if (!projectName) return

  console.log('🔍 [FILTER] Loading plans for project:', projectName)

  // 加载计划列表
  filtersStore.loading.plans = true
  try {
  const response = await plansApi.getPlanNames(authStore.userid, projectName)
  console.log('🔍 [FILTER] Plans response:', response)
  
  const plans = response.data.plan_names.map(([id, name]) => ({ id, name }))
  console.log('📋 [FILTER] Processed plans:', plans)
  
  filtersStore.setPlanOptions(plans)
} catch (error) {
  console.error('加载计划列表失败:', error)
  ElMessage.error('加载计划列表失败')
} finally {
  filtersStore.loading.plans = false
}
}

// 计划选择变化
const handlePlanChange = async (planName) => {
  // 清空下级选项
  filtersStore.filters.modelName = ''
  filtersStore.filters.sheetName = ''
  filtersStore.setModelOptions([])
  filtersStore.setSheetOptions([])
  
  if (!planName) {
    planStore.clearStats()
    filtersStore.ids.planId = null
    return
  }

  // 获取计划ID
  const selectedPlan = filtersStore.options.plans.find(plan => plan.name === planName)
  if (!selectedPlan) return
  
  filtersStore.ids.planId = selectedPlan.id

  console.log('🔍 [FILTER] Loading data for plan:', { id: selectedPlan.id, name: planName })

  try {
    // 并行加载机型列表和统计数据
    const [modelResponse, statsResponse] = await Promise.all([
      modelsApi.getModelNames(selectedPlan.id),
      plansApi.getPlanStatistics(selectedPlan.id)
    ])

    console.log('🔍 [FILTER] Model response:', modelResponse)
    console.log('🔍 [FILTER] Stats response:', statsResponse)

    // 设置机型选项
    const models = modelResponse.data.model_names.map(([id, name]) => ({ id, name }))
    filtersStore.setModelOptions(models)
    
    // 设置统计数据
    planStore.setStats(statsResponse.data.result)

  } catch (error) {
    console.error('加载计划相关数据失败:', error)
    ElMessage.error('加载计划相关数据失败')
  }
}

// 机型选择变化
const handleModelChange = async (modelName) => {
  filtersStore.filters.sheetName = ''
  filtersStore.setSheetOptions([])
  
  if (!modelName) {
    filtersStore.ids.modelId = null
    return
  }

  // 获取机型ID
  const selectedModel = filtersStore.options.models.find(model => model.name === modelName)
  if (!selectedModel) return
  
  filtersStore.ids.modelId = selectedModel.id

  console.log('🔍 [FILTER] Loading sheets for plan:', filtersStore.ids.planId)

  // 加载用例表列表
  filtersStore.loading.sheets = true
  try {
    const response = await sheetsApi.getSheetNames(filtersStore.ids.planId)
    console.log('🔍 [FILTER] Sheets response:', response)
    const sheets = response.data.sheet_names_with_ids.map(([id, name]) => ({ id, name }))
    filtersStore.setSheetOptions(sheets)
  } catch (error) {
    console.error('加载模块列表失败:', error)
    ElMessage.error('加载模块列表失败')
  } finally {
    filtersStore.loading.sheets = false
  }
}

// 用例表选择变化
const handleSheetChange = async (sheetName) => {
  if (!sheetName) {
    filtersStore.ids.sheetId = null
    return
  }

  // 获取用例表ID
  const selectedSheet = filtersStore.options.sheets.find(sheet => sheet.name === sheetName)
  if (!selectedSheet) return
  
  filtersStore.ids.sheetId = selectedSheet.id

  console.log('🔍 [FILTER] Loading detailed stats for:', {
    planId: filtersStore.ids.planId,
    modelId: filtersStore.ids.modelId,
    sheetId: filtersStore.ids.sheetId
  })

  // 加载详细统计数据
  try {
    const params = {
      planId: filtersStore.ids.planId,
      modelId: filtersStore.ids.modelId,
      sheetId: filtersStore.ids.sheetId
    }
    
    const response = await statisticsApi.getProgressAndPassRate(params)
    console.log('🔍 [FILTER] Detailed stats response:', response)
    planStore.setStats(response.data.result)

  } catch (error) {
    console.error('加载用例详细数据失败:', error)
    ElMessage.error('加载用例详细数据失败')
  }
}

// 查看详情
const handleViewDetails = () => {
  if (!canViewDetails.value) {
    ElMessage.warning('请先选择完整的筛选条件')
    return
  }
  
  emit('view-details', {
    filters: { ...filtersStore.filters },
    ids: { ...filtersStore.ids }
  })
}

// 导出计划
const handleExportPlan = () => {
  if (!filtersStore.ids.planId) {
    ElMessage.warning('请先选择测试计划')
    return
  }
  
  emit('export-plan', {
    planId: filtersStore.ids.planId,
    planName: filtersStore.filters.planName
  })
}
</script>


<style scoped>
.plan-filter-bar {
  margin-bottom: 20px;
}

.filter-card {
  border-radius: 8px;
}

.filter-row {
  display: flex;
  gap: 20px;
  align-items: end;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
  font-weight: 500;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.info-section {
  display: flex;
  gap: 32px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: #606266;
}

.info-value {
  color: #409eff;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    min-width: auto;
  }
  
  .info-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .info-section {
    justify-content: center;
  }
  
  .action-buttons {
    justify-content: center;
  }
}
</style>
