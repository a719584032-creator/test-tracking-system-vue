<template>
  <el-dialog
    v-model="visible"
    width="520px"
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
  department_name: '-',
  project_name: '-',
  name: '',
  status: '',
  start_date: '',
  end_date: '',
  description: '',
  tester_user_ids: []
})

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
  ]
}

const mergedStatusOptions = computed(() => {
  const base = Array.isArray(props.statusOptions) ? [...props.statusOptions] : []
  if (formData.status && !base.some((item) => item.value === formData.status)) {
    base.push({ value: formData.status, label: formData.status })
  }
  return base
})

const testerOptions = ref([])

const optionsLoading = reactive({
  testers: false
})

const dialogTitle = computed(() => '编辑测试计划')

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    department_id: null,
    department_name: '-',
    project_name: '-',
    name: '',
    status: '',
    start_date: '',
    end_date: '',
    description: '',
    tester_user_ids: []
  })
  testerOptions.value = []
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
    const testers = Array.isArray(plan.testers) ? plan.testers : []
    const initialTesterOptions = testers
      .map((tester) => buildTesterOption(tester))
      .filter(Boolean)
    const testerIds = initialTesterOptions.map((item) => item.value)
    Object.assign(formData, {
      id: plan.id,
      department_id: departmentId,
      department_name: departmentName,
      project_name: projectName,
      name: plan.name || '',
      status: plan.status || '',
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      description: plan.description || '',
      tester_user_ids: testerIds
    })
    mergeTesterOptions(initialTesterOptions)
    if (departmentId !== null) {
      fetchTesterOptions(departmentId)
    }
  }
  visible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const handleSubmit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        tester_user_ids: formData.tester_user_ids
      }
      const response = await testPlansApi.update(formData.id, payload)
      if (response?.success) {
        ElMessage.success(response.message || '测试计划已更新')
        emit('success', response.data)
        visible.value = false
      }
    } finally {
      submitting.value = false
    }
  })
}

const handleClose = () => {
  visible.value = false
}

defineExpose({
  open
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
