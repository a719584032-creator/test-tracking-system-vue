<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="所属部门" prop="department_id">
        <el-select
          v-model="formData.department_id"
          placeholder="请选择部门"
          clearable
          filterable
          :loading="loadingDepartments"
        >
          <el-option
            v-for="dept in departments"
            :key="dept.value"
            :label="dept.label"
            :value="dept.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="项目名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入项目名称"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="项目编码" prop="code">
        <el-input
          v-model="formData.code"
          placeholder="请输入项目编码（可选）"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="负责人" prop="owner_user_id">
        <el-select
          v-model="formData.owner_user_id"
          placeholder="请选择负责人（可选）"
          clearable
          filterable
          :loading="loadingOwners"
        >
          <el-option
            v-for="owner in owners"
            :key="owner.value"
            :label="owner.label"
            :value="owner.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="请选择状态（可选）"
          clearable
          filterable
        >
          <el-option
            v-for="status in mergedStatusOptions"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="项目描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入项目描述（可选）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { projectsApi } from '@/api/projects'

const props = defineProps({
  departments: {
    type: Array,
    default: () => []
  },
  owners: {
    type: Array,
    default: () => []
  },
  statusOptions: {
    type: Array,
    default: () => []
  },
  loadingDepartments: {
    type: Boolean,
    default: false
  },
  loadingOwners: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['success'])

const visible = ref(false)
const submitting = ref(false)
const mode = ref('create')
const formRef = ref()

const formData = reactive({
  id: null,
  department_id: null,
  name: '',
  code: '',
  owner_user_id: null,
  status: '',
  statusLabel: '',
  description: ''
})

const rules = {
  department_id: [
    { required: true, message: '请选择所属部门', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '项目名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { max: 50, message: '项目编码长度不能超过 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '项目描述长度不能超过 500 个字符', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => (mode.value === 'create' ? '新建项目' : '编辑项目'))
const submitText = computed(() => (mode.value === 'create' ? '创建' : '保存'))

const mergedStatusOptions = computed(() => {
  const options = Array.isArray(props.statusOptions) ? [...props.statusOptions] : []
  const value = formData.status
  if (value && !options.some((opt) => opt.value === value)) {
    options.push({ value, label: formData.statusLabel || value })
  }
  return options
})

const loadingDepartments = computed(() => props.loadingDepartments)
const loadingOwners = computed(() => props.loadingOwners)

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    department_id: null,
    name: '',
    code: '',
    owner_user_id: null,
    status: '',
    statusLabel: '',
    description: ''
  })
  formRef.value?.clearValidate()
}

const openCreate = () => {
  mode.value = 'create'
  resetForm()
  visible.value = true
}

const openEdit = (project) => {
  mode.value = 'edit'
  resetForm()
  if (project) {
    formData.id = project.id ?? project.project_id ?? null
    formData.department_id =
      project.department_id ?? project.departmentId ?? project.department?.id ?? null
    formData.name = project.name ?? project.project_name ?? ''
    formData.code = project.code ?? ''
    formData.owner_user_id =
      project.owner_user_id ?? project.ownerUserId ?? project.owner?.id ?? project.owner_user?.id ?? null
    formData.status = project.status ?? project.project_status ?? project.state ?? ''
    formData.statusLabel = project.status_label ?? project.statusLabel ?? project.status_text ?? ''
    formData.description = project.description ?? ''
  }
  visible.value = true
}

const handleClose = () => {
  visible.value = false
  nextTick(() => {
    resetForm()
  })
}

const buildPayload = () => {
  const payload = {
    department_id: formData.department_id,
    name: formData.name?.trim()
  }

  const code = formData.code?.trim()
  if (code) payload.code = code

  const description = formData.description?.trim()
  if (description) payload.description = description

  if (formData.owner_user_id) {
    payload.owner_user_id = formData.owner_user_id
  }

  const statusValue = formData.status?.trim()
  if (statusValue) {
    payload.status = statusValue
  }

  return payload
}

const handleSubmit = async () => {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return

    submitting.value = true
    const payload = buildPayload()

    let resp
    if (mode.value === 'create') {
      resp = await projectsApi.create(payload)
    } else {
      const projectId = formData.id
      if (!projectId) {
        ElMessage.error('项目信息缺失，无法更新')
        return
      }
      resp = await projectsApi.update(projectId, payload)
    }

    if (!resp?.success) {
      return
    }

    ElMessage.success(mode.value === 'create' ? '项目创建成功' : '项目更新成功')
    emit('success', {
      mode: mode.value,
      data: resp.data ?? null
    })
    handleClose()
  } catch (error) {
    if (error?.message) {
      console.error('提交项目表单失败:', error)
    }
  } finally {
    submitting.value = false
  }
}

defineExpose({
  openCreate,
  openEdit
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
