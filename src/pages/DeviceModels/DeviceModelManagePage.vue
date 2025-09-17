<template>
  <div class="device-model-manage-page">
    <div class="filter-section">
      <div class="filter-left">
        <el-form :model="filters" inline>
          <el-form-item label="部门">
            <el-select
              v-model="filters.department_id"
              placeholder="请选择部门"
              filterable
              clearable
              :loading="optionsLoading.departments"
              @focus="fetchDepartmentOptionsIfNeeded"
              @change="handleDepartmentChange"
              @clear="handleDepartmentClear"
            >
              <el-option
                v-for="dept in departmentOptions"
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="机型名称">
            <el-input
              v-model="filters.name"
              placeholder="请输入机型名称"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="机型编码">
            <el-input
              v-model="filters.model_code"
              placeholder="请输入机型编码"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="分类">
            <el-input
              v-model="filters.category"
              placeholder="请输入机型分类"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="状态">
            <el-select
              v-model="filters.active"
              placeholder="请选择状态"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="option in activeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="filter-right">
        <el-button type="primary" @click="handleAddDeviceModel">
          <el-icon><Plus /></el-icon>
          新建设备机型
        </el-button>
      </div>
    </div>

    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="deviceModelList"
        stripe
        style="width: 100%"
        empty-text="暂无机型数据"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />

        <el-table-column prop="name" label="机型名称" min-width="160" />

        <el-table-column prop="model_code" label="机型编码" min-width="140">
          <template #default="{ row }">
            {{ row.model_code || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="department_name" label="所属部门" min-width="160">
          <template #default="{ row }">
            {{ row.department_name || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="category" label="分类" min-width="120">
          <template #default="{ row }">
            {{ row.category || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="vendor" label="厂商" min-width="140">
          <template #default="{ row }">
            {{ row.vendor || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="firmware_version" label="固件版本" min-width="150">
          <template #default="{ row }">
            {{ row.firmware_version || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              :loading="row._switching"
              size="small"
              @change="handleToggleActive(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="attributes_json" label="属性配置" min-width="220">
          <template #default="{ row }">
            <template v-if="row.attributes_json">
              <el-tooltip
                effect="dark"
                :content="getAttributeFullText(row)"
                placement="top"
              >
                <span>{{ getAttributePreview(row) }}</span>
              </el-tooltip>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="220">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.description && row.description.length > 40"
              effect="dark"
              :content="row.description"
              placement="top"
            >
              <span>{{ row.description.slice(0, 40) }}...</span>
            </el-tooltip>
            <span v-else>{{ row.description || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEditDeviceModel(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <DeviceModelFormDialog
      ref="deviceModelDialogRef"
      :departments="departmentOptions"
      :loading-departments="optionsLoading.departments"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import DeviceModelFormDialog from '@/components/DeviceModels/DeviceModelFormDialog.vue'
import { deviceModelsApi } from '@/api/deviceModels'
import { departmentService } from '@/api/departments'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const deviceModelList = ref([])

const filters = reactive({
  department_id: null,
  name: '',
  model_code: '',
  category: '',
  active: ''  // 修改默认值为空字符串，显示"全部状态"
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const departmentOptions = ref([])
const optionsLoading = reactive({
  departments: false
})

// 修改状态选项，使用字符串值
const activeOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 'true' },
  { label: '停用', value: 'false' }
]

const deviceModelDialogRef = ref()

const formatDate = (value) => (value ? formatDateTime(value) : '')

const stringifyAttributes = (attributes) => {
  if (!attributes) return ''
  if (typeof attributes === 'string') {
    return attributes.trim()
  }
  try {
    return JSON.stringify(attributes)
  } catch (error) {
    return ''
  }
}

const getAttributeFullText = (model) => stringifyAttributes(model.attributes_json)
const getAttributePreview = (model) => {
  const text = getAttributeFullText(model)
  if (!text) return '-'
  return text.length > 50 ? `${text.slice(0, 50)}...` : text
}

const fetchDeviceModelList = async () => {
  if (!filters.department_id) {
    deviceModelList.value = []
    pagination.total = 0
    return
  }

  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      order: 'desc',
      department_id: filters.department_id,
      name: filters.name?.trim() || undefined,
      model_code: filters.model_code?.trim() || undefined,
      category: filters.category?.trim() || undefined
    }

    // 修复状态筛选逻辑
    if (filters.active === 'true') {
      params.active = true
    } else if (filters.active === 'false') {
      params.active = false
    }
    // 当 filters.active === '' 时，不传 active 参数，获取所有状态

    const resp = await deviceModelsApi.list(params)
    if (resp.code === 200) {
      // 添加部门名称映射
      const items = resp.data.items.map(item => ({
        ...item,
        _switching: false, // 添加切换状态标识
        department_name: getDepartmentName(item.department_id)
      }))

      deviceModelList.value = items
      pagination.total = resp.data.total || items.length
    } else {
      deviceModelList.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取机型列表失败:', error)
    ElMessage.error('获取机型列表失败')
    deviceModelList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const getDepartmentName = (departmentId) => {
  const dept = departmentOptions.value.find(d => d.value === departmentId)
  return dept ? dept.label : ''
}

const fetchDepartmentOptions = async () => {
  optionsLoading.departments = true
  try {
    const resp = await departmentService.list({ page: 1, page_size: 1000 })
    if (resp.code === 200) {
      const items = resp.data.items || []
      departmentOptions.value = items.map((dept) => ({
        value: dept.id,
        label: dept.name
      }))
      if (!filters.department_id && departmentOptions.value.length) {
        filters.department_id = departmentOptions.value[0].value
      }
    }
  } catch (error) {
    console.error('获取部门数据失败:', error)
  } finally {
    optionsLoading.departments = false
  }
}

const fetchDepartmentOptionsIfNeeded = async () => {
  if (departmentOptions.value.length) return
  await fetchDepartmentOptions()
}

const handleDepartmentChange = () => {
  pagination.page = 1
  fetchDeviceModelList()
}

const handleDepartmentClear = () => {
  filters.department_id = null
  deviceModelList.value = []
  pagination.total = 0
}

const handleSearch = () => {
  if (!filters.department_id) {
    ElMessage.warning('请先选择所属部门')
    return
  }
  pagination.page = 1
  fetchDeviceModelList()
}

const handleReset = () => {
  const departmentId = filters.department_id
  filters.name = ''
  filters.model_code = ''
  filters.category = ''
  filters.active = ''  // 重置为空字符串
  filters.department_id = departmentId
  pagination.page = 1
  fetchDeviceModelList()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchDeviceModelList()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchDeviceModelList()
}

const handleAddDeviceModel = async () => {
  await fetchDepartmentOptionsIfNeeded()
  if (!filters.department_id) {
    ElMessage.warning('请先选择所属部门')
    return
  }
  deviceModelDialogRef.value?.openCreate({ department_id: filters.department_id })
}

const handleEditDeviceModel = async (model) => {
  await fetchDepartmentOptionsIfNeeded()

  try {
    const resp = await deviceModelsApi.get(model.id)
    if (resp.code === 200) {
      deviceModelDialogRef.value?.openEdit(resp.data)
    } else {
      ElMessage.error('获取机型详情失败')
    }
  } catch (error) {
    console.error('获取机型详情失败:', error)
    ElMessage.error('获取机型详情失败')
  }
}

const handleToggleActive = async (model) => {
  const newStatus = model.active
  const actionText = newStatus ? '启用' : '停用'

  try {
    await ElMessageBox.confirm(
      `确定要${actionText}机型 "${model.name}" 吗？`,
      `${actionText}确认`,
      {
        confirmButtonText: actionText,
        cancelButtonText: '取消',
        type: newStatus ? 'info' : 'warning'
      }
    )
  } catch {
    // 用户取消，恢复开关状态
    model.active = !newStatus
    return
  }

  // 设置加载状态
  model._switching = true

  try {
    const resp = newStatus
      ? await deviceModelsApi.enable(model.id)
      : await deviceModelsApi.disable(model.id)

    if (resp.code === 200) {
      ElMessage.success(`机型${actionText}成功`)
      // 保持当前状态，不需要重新获取列表
    } else {
      // 操作失败，恢复开关状态
      model.active = !newStatus
      ElMessage.error(`机型${actionText}失败`)
    }
  } catch (error) {
    console.error(`机型${actionText}失败:`, error)
    // 操作失败，恢复开关状态
    model.active = !newStatus
    ElMessage.error(`机型${actionText}失败`)
  } finally {
    model._switching = false
  }
}

const handleDialogSuccess = () => {
  fetchDeviceModelList()
}

onMounted(async () => {
  await fetchDepartmentOptions()
  if (filters.department_id) {
    fetchDeviceModelList()
  }
})
</script>

<style scoped>
.device-model-manage-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.filter-left {
  flex: 1;
}

.filter-right {
  margin-left: 20px;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
  margin-bottom: 8px;
}
</style>
