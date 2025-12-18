<template>
  <el-dialog
    v-model="visible"
    width="1100px"
    :close-on-click-modal="false"
    :title="dialogTitle"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="所属部门">
        <el-input v-model="formData.department_name" disabled placeholder="-" />
      </el-form-item>

      <el-form-item label="所属项目">
        <el-input v-model="formData.project_name" disabled placeholder="-" />
      </el-form-item>

      <el-form-item label="计划名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入计划名称"
          maxlength="100"
          clearable
        />
      </el-form-item>

      <el-form-item label="计划状态" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="请选择计划状态"
          filterable
          clearable
        >
          <el-option
            v-for="option in mergedStatusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="开始日期">
        <el-date-picker
          v-model="formData.start_date"
          type="date"
          placeholder="选择开始日期"
          value-format="YYYY-MM-DD"
          clearable
        />
      </el-form-item>

      <el-form-item label="结束日期">
        <el-date-picker
          v-model="formData.end_date"
          type="date"
          placeholder="选择结束日期"
          value-format="YYYY-MM-DD"
          clearable
        />
      </el-form-item>

      <el-form-item label="测试人员" prop="tester_user_ids">
        <el-select
          v-model="formData.tester_user_ids"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择测试人员"
          :disabled="formData.department_id === null"
          :loading="optionsLoading.testers"
          filterable
        >
          <el-option
            v-for="user in testerOptions"
            :key="user.value"
            :label="user.label"
            :value="user.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="测试机型" prop="device_model_ids">
        <el-select
          v-model="formData.device_model_ids"
          multiple
          placeholder="请选择测试机型"
          :loading="optionsLoading.deviceModels"
          filterable
          @remove-tag="handleDeviceTagRemove"
        >
          <el-option
            v-for="device in deviceOptions"
            :key="device.value"
            :label="device.label"
            :value="device.value"
            :disabled="isLockedDevice(device.value)"
          />
        </el-select>
      </el-form-item>

      <div class="dock-config-card">
        <div class="dock-config-header">
          <div>
            <div class="dock-config-title">Dock 配置文件</div>
            <div class="dock-config-desc">
              默认不填值，点击按钮展开后可编辑；“填充默认指标”会使用预设值。
            </div>
          </div>
          <div class="dock-config-actions">
            <el-button size="small" @click="dockConfigVisible = !dockConfigVisible">
              {{ dockConfigVisible ? '收起' : '配置 Dock 指标' }}
            </el-button>
            <el-button size="small" type="primary" text @click="dockNineGrid = buildDefaultDockNineGrid(true)">
              填充默认指标
            </el-button>
          </div>
        </div>
        <el-collapse-transition>
          <div v-show="dockConfigVisible">
            <el-row :gutter="20">
              <el-col v-for="item in dockNineGrid" :key="item.key" :span="12">
                <el-form-item :label="item.label" label-width="200px" class="dock-form-item">
                  <el-input-number
                    v-model="item.value"
                    :min="0"
                    :step="10"
                    :precision="0"
                    controls-position="right"
                    size="large"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-collapse-transition>
      </div>

      <el-form-item label="计划描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入计划描述（可选）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { testPlansApi } from '@/api/testPlans'
import { departmentService } from '@/api/departments'
import { deviceModelsApi } from '@/api/deviceModels'

const dockNineGridTemplate = [
  { key: 'HotPlug', payloadKey: 'hotplug', label: 'HotPlug', defaultValue: 100 },
  { key: 'S3-Plug in-Resume', payloadKey: 's3_plug_in_resume', label: 'S3-Plug in-Resume', defaultValue: 50 },
  { key: 'S3-Unplug-Plug in-Resume', payloadKey: 's3_unplug_plug_in_resume', label: 'S3-Unplug-Plug in-Resume', defaultValue: 50 },
  { key: 'S3-Unplug-Resume-Plug in', payloadKey: 's3_unplug_resume_plug_in', label: 'S3-Unplug-Resume-Plug in', defaultValue: 20 },
  { key: 'S4-Plug in-Resume', payloadKey: 's4_plug_in_resume', label: 'S4-Plug in-Resume', defaultValue: 50 },
  { key: 'S4-Unplug-Plug in-Resume', payloadKey: 's4_unplug_plug_in_resume', label: 'S4-Unplug-Plug in-Resume', defaultValue: 30 },
  { key: 'S4-Unplug-Resume-Plug in', payloadKey: 's4_unplug_resume_plug_in', label: 'S4-Unplug-Resume-Plug in', defaultValue: 30 },
  { key: 'S5-Plug in-Power on', payloadKey: 's5_plug_in_power_on', label: 'S5-Plug in-Power on', defaultValue: 20 },
  { key: 'S5-Unplug-Power on-Plug in', payloadKey: 's5_unplug_power_on_plug_in', label: 'S5-Unplug-Power on-Plug in', defaultValue: 20 }
]

const buildDefaultDockNineGrid = (useDefaults = false) =>
  dockNineGridTemplate.map((item) => ({ ...item, value: useDefaults ? item.defaultValue : '' }))

const props = defineProps({
  statusOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['success'])

const visible = ref(false)
const submitting = ref(false)
const formRef = ref()

const formData = reactive({
  id: null,
  department_id: null,
  project_id: null,
  department_name: '-',
  project_name: '-',
  name: '',
  status: '',
  start_date: '',
  end_date: '',
  description: '',
  tester_user_ids: [],
  device_model_ids: []
})

const dockNineGrid = ref(buildDefaultDockNineGrid())
const dockConfigVisible = ref(false)
const resetDockNineGrid = () => {
  dockNineGrid.value = buildDefaultDockNineGrid()
}
const buildDockNineGridPayload = () => {
  const payload = {}
  dockNineGrid.value.forEach((item) => {
    if (!item?.payloadKey && !item?.key) return
    const numeric = Number(item.value)
    const targetKey = item.payloadKey || item.key
    payload[targetKey] = Number.isFinite(numeric) ? numeric : item.value
  })
  return payload
}
const applyDockNineGridFromPlan = (plan) => {
  resetDockNineGrid()
  const raw = plan?.dock_nine_gird || plan?.dock_nine_grid
  if (!raw) return
  let parsed = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = raw
    }
  }
  if (Array.isArray(parsed)) {
    const mapped = {}
    parsed.forEach((item) => {
      const key = item?.key || item?.name || item?.label
      if (!key) return
      mapped[key] = item.value ?? item.score ?? item.amount
    })
    parsed = mapped
  }
  if (parsed && typeof parsed === 'object') {
    dockNineGrid.value = dockNineGridTemplate.map((item) => {
      const rawValue = parsed[item.payloadKey] ?? parsed[item.key]
      const numeric = Number(rawValue)
      return {
        ...item,
        value: Number.isFinite(numeric) ? numeric : rawValue ?? item.defaultValue
      }
    })
  }
}

const rules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 100, message: '计划名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择计划状态', trigger: 'change' }
  ],
  tester_user_ids: [
    { type: 'array', required: true, message: '请选择测试人员', trigger: 'change' }
  ],
  device_model_ids: []
}

const mergedStatusOptions = computed(() => {
  const base = Array.isArray(props.statusOptions) ? [...props.statusOptions] : []
  if (formData.status && !base.some((item) => item.value === formData.status)) {
    base.push({ value: formData.status, label: formData.status })
  }
  return base
})

const testerOptions = ref([])
const deviceOptions = ref([])
const lockedDeviceModelIds = ref(new Set())

const optionsLoading = reactive({
  testers: false,
  deviceModels: false
})

const dialogTitle = computed(() => '编辑测试计划')

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    department_id: null,
    project_id: null,
    department_name: '-',
    project_name: '-',
    name: '',
    status: '',
    start_date: '',
    end_date: '',
    description: '',
    tester_user_ids: [],
    device_model_ids: []
  })
  testerOptions.value = []
  deviceOptions.value = []
  lockedDeviceModelIds.value = new Set()
  resetDockNineGrid()
  dockConfigVisible.value = false
  formRef.value?.clearValidate()
}

const buildTesterOption = (tester) => {
  if (!tester) return null
  const rawId =
    tester.user_id ||
    tester.userId ||
    tester.tester_id ||
    tester.tester?.id ||
    tester.id
  if (rawId === undefined || rawId === null || rawId === '') return null
  const userId = Number(rawId)
  if (Number.isNaN(userId)) return null
  const label =
    tester.tester?.username ||
    tester.username ||
    tester.name ||
    tester.tester_name ||
    `用户#${userId}`
  return { value: userId, label }
}

const mergeTesterOptions = (options = []) => {
  const map = new Map()
  const existing = Array.isArray(testerOptions.value) ? testerOptions.value : []
  existing.forEach((item) => {
    if (!item || item.value === undefined || item.value === null) return
    const value = Number(item.value)
    if (Number.isNaN(value)) return
    map.set(value, item.label || `用户#${value}`)
  })
  options.forEach((item) => {
    if (!item || item.value === undefined || item.value === null) return
    const value = Number(item.value)
    if (Number.isNaN(value)) return
    if (!map.has(value)) {
      map.set(value, item.label || `用户#${value}`)
    }
  })
  testerOptions.value = Array.from(map.entries()).map(([value, label]) => ({
    value,
    label
  }))
}

const buildDeviceOption = (device) => {
  if (!device) return null
  const rawId =
    device.device_model_id ||
    device.id ||
    device.device_model?.id
  if (rawId === undefined || rawId === null || rawId === '') return null
  const value = Number(rawId)
  if (Number.isNaN(value)) return null
  const label =
    device.device_model?.name ||
    device.name ||
    device.device_model_name ||
    device.model_name ||
    device.code ||
    `机型#${value}`
  return { value, label }
}

const mergeDeviceOptions = (options = []) => {
  const map = new Map()
  const existing = Array.isArray(deviceOptions.value) ? deviceOptions.value : []
  existing.forEach((item) => {
    if (!item || item.value === undefined || item.value === null) return
    const value = Number(item.value)
    if (Number.isNaN(value)) return
    map.set(value, item.label || `机型#${value}`)
  })
  options.forEach((item) => {
    if (!item || item.value === undefined || item.value === null) return
    const value = Number(item.value)
    if (Number.isNaN(value)) return
    if (!map.has(value)) {
      map.set(value, item.label || `机型#${value}`)
    }
  })
  deviceOptions.value = Array.from(map.entries()).map(([value, label]) => ({
    value,
    label
  }))
}

const fetchTesterOptions = async (departmentId) => {
  if (departmentId === null || departmentId === undefined) return
  optionsLoading.testers = true
  try {
    const response = await departmentService.listMembers(departmentId, { page: 1, page_size: 1000 })
    if (!response?.success) return
    const items = response.data?.items || response.data?.list || []
    const options = items
      .map((member) => {
        if (!member) return null
        const rawId =
          member.user_id ||
          member.userId ||
          member.id ||
          member.user?.id
        if (rawId === undefined || rawId === null || rawId === '') return null
        const userId = Number(rawId)
        if (Number.isNaN(userId)) return null
        const user = member.user || {}
        const label =
          member.username ||
          member.name ||
          user.username ||
          user.name ||
          `用户#${userId}`
        return { value: userId, label }
      })
      .filter(Boolean)
    mergeTesterOptions(options)
  } catch (error) {
    console.error('获取测试人员失败:', error)
  } finally {
    optionsLoading.testers = false
  }
}

const fetchDeviceOptions = async (departmentId) => {
  if (departmentId === null || departmentId === undefined) return
  optionsLoading.deviceModels = true
  try {
    const params = { page: 1, page_size: 1000, department_id: departmentId }
    const response = await deviceModelsApi.list(params)
    if (!response?.success) return
    const items = response.data?.items || response.data?.list || []
    const options = items
      .map((item) => {
        const id = Number(item.id)
        if (!id) return null
        const label = item.name || item.model_name || item.code || `机型#${id}`
        return { value: id, label }
      })
      .filter(Boolean)
    mergeDeviceOptions(options)
  } catch (error) {
    console.error('获取机型列表失败:', error)
  } finally {
    optionsLoading.deviceModels = false
  }
}

const isLockedDevice = (value) => lockedDeviceModelIds.value.has(Number(value))

const ensureLockedDevices = () => {
  const set = new Set(
    (Array.isArray(formData.device_model_ids) ? formData.device_model_ids : []).map((id) =>
      Number(id)
    )
  )
  lockedDeviceModelIds.value.forEach((id) => set.add(Number(id)))
  formData.device_model_ids = Array.from(set)
}

const handleDeviceTagRemove = (value) => {
  const id = Number(value)
  if (isLockedDevice(id)) {
    ensureLockedDevices()
    ElMessage.warning('已关联的机型不可删除')
  }
}

const open = (plan) => {
  resetForm()
  if (plan) {
    const rawDepartmentId = Number(
      plan.department_id ||
        plan.departmentId ||
        plan.project?.department_id ||
        plan.project?.departmentId ||
        plan.project?.department?.id ||
        plan.department?.id
    )
    const departmentId = Number.isNaN(rawDepartmentId) ? null : rawDepartmentId
    const departmentName =
      plan.department_name ||
      plan.departmentName ||
      plan.department?.name ||
      plan.project?.department?.name ||
      '-'
    const projectName = plan.project_name || plan.projectName || plan.project?.name || '-'
    const projectId = Number(plan.project_id || plan.projectId || plan.project?.id) || null
    const testers = Array.isArray(plan.testers) ? plan.testers : []
    const initialTesterOptions = testers
      .map((tester) => buildTesterOption(tester))
      .filter(Boolean)
    const testerIds = initialTesterOptions.map((item) => item.value)
    const devices = Array.isArray(plan.device_models) ? plan.device_models : []
    const initialDeviceOptions = devices
      .map((device) => buildDeviceOption(device))
      .filter(Boolean)
    const deviceIdsFromPlan = Array.isArray(plan.device_model_ids)
      ? plan.device_model_ids
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : []
    const deviceIds = Array.from(
      new Set([...initialDeviceOptions.map((item) => item.value), ...deviceIdsFromPlan])
    )
    const supplementalOptions = deviceIds
      .filter((id) => !initialDeviceOptions.some((item) => item.value === id))
      .map((id) => ({ value: id, label: `机型#${id}` }))
    const allInitialDeviceOptions = [...initialDeviceOptions, ...supplementalOptions]

    Object.assign(formData, {
      id: plan.id,
      department_id: departmentId,
      project_id: projectId,
      department_name: departmentName,
      project_name: projectName,
      name: plan.name || '',
      status: plan.status || '',
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      description: plan.description || '',
      tester_user_ids: testerIds,
      device_model_ids: deviceIds
    })
    lockedDeviceModelIds.value = new Set(deviceIds)
    mergeTesterOptions(initialTesterOptions)
    mergeDeviceOptions(allInitialDeviceOptions)
    applyDockNineGridFromPlan(plan)
    dockConfigVisible.value = Boolean(plan?.dock_nine_gird || plan?.dock_nine_grid)
    if (departmentId !== null) {
      fetchTesterOptions(departmentId)
      fetchDeviceOptions(departmentId)
    }
  }
  visible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const validateForm = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    ElMessage.warning('请完善必填项后再保存')
    return false
  }
}

const handleSubmit = async () => {
  if (import.meta?.env?.DEV) {
    console.log('[TestPlanEditDialog] save clicked', {
      id: formData.id,
      submitting: submitting.value
    })
  }
  if (submitting.value) return
  if (!formData.id) {
    ElMessage.error('缺少计划ID，无法提交更新')
    return
  }
  const isValid = formRef.value ? await validateForm() : true
  if (!isValid) return
  submitting.value = true
  try {
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      department_id: formData.department_id,
      tester_user_ids: formData.tester_user_ids,
      project_id: formData.project_id,
      device_model_ids: Array.from(
        new Set([
          ...Array.from(lockedDeviceModelIds.value),
          ...(Array.isArray(formData.device_model_ids) ? formData.device_model_ids : [])
        ])
      )
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id)),
      dock_nine_gird: buildDockNineGridPayload()
    }
    if (import.meta?.env?.DEV) {
      console.log('[TestPlanEditDialog] submitting payload', payload)
    }
    const response = await testPlansApi.update(formData.id, payload)
    if (response?.success) {
      ElMessage.success(response.message || '测试计划已更新')
      emit('success', response.data)
      visible.value = false
    } else if (response?.message) {
      ElMessage.error(response.message)
    }
  } catch (error) {
    console.error('更新测试计划失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  visible.value = false
}

defineExpose({
  open
})
</script>

<style scoped>
.dock-config-card {
  padding: 18px 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #f7f8fa;
  margin-bottom: 12px;
}

.dock-config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 12px;
}

.dock-config-title {
  font-weight: 700;
  font-size: 16px;
}

.dock-config-desc {
  margin-bottom: 8px;
  color: #909399;
  font-size: 13px;
}

.dock-form-item :deep(.el-form-item__label) {
  white-space: nowrap;
  font-size: 14px;
}

.dock-config-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
