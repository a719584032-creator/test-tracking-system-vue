<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="640px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="110px"
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

      <el-form-item label="机型名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入机型名称"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="机型编码" prop="model_code">
        <el-input
          v-model="formData.model_code"
          placeholder="请输入机型编码（可选）"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="机型分类" prop="category">
        <el-input
          v-model="formData.category"
          placeholder="请输入机型分类（可选）"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="厂商" prop="vendor">
        <el-input
          v-model="formData.vendor"
          placeholder="请输入厂商信息（可选）"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="固件版本" prop="firmware_version">
        <el-input
          v-model="formData.firmware_version"
          placeholder="请输入固件版本（可选）"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="属性配置" prop="attributes_json">
        <el-input
          v-model="formData.attributes_json"
          type="textarea"
          :rows="4"
          placeholder='请输入 JSON 格式的属性配置，如 {"key":"value"}'
          maxlength="2000"
          show-word-limit
        />
        <div class="form-item-tip">留空则不提交属性配置，清空请填写 {}。</div>
      </el-form-item>

      <el-form-item label="机型描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入机型描述（可选）"
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
import { deviceModelsApi } from '@/api/deviceModels'

const props = defineProps({
  departments: {
    type: Array,
    default: () => []
  },
  loadingDepartments: {
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
  model_code: '',
  category: '',
  vendor: '',
  firmware_version: '',
  attributes_json: '',
  description: ''
})

const validateJson = (rule, value, callback) => {
  const content = value?.trim()
  if (!content) {
    callback()
    return
  }
  try {
    JSON.parse(content)
    callback()
  } catch (error) {
    callback(new Error('请输入合法的 JSON 格式'))
  }
}

const rules = {
  department_id: [
    { required: true, message: '请选择所属部门', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入机型名称', trigger: 'blur' },
    { min: 2, max: 100, message: '机型名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  model_code: [
    { max: 100, message: '机型编码长度不能超过 100 个字符', trigger: 'blur' }
  ],
  category: [
    { max: 100, message: '机型分类长度不能超过 100 个字符', trigger: 'blur' }
  ],
  vendor: [
    { max: 100, message: '厂商信息长度不能超过 100 个字符', trigger: 'blur' }
  ],
  firmware_version: [
    { max: 100, message: '固件版本长度不能超过 100 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '机型描述长度不能超过 500 个字符', trigger: 'blur' }
  ],
  attributes_json: [
    { validator: validateJson, trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => (mode.value === 'create' ? '新建设备机型' : '编辑设备机型'))
const submitText = computed(() => (mode.value === 'create' ? '创建' : '保存'))
const loadingDepartments = computed(() => props.loadingDepartments)
const departments = computed(() => props.departments || [])

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    department_id: null,
    name: '',
    model_code: '',
    category: '',
    vendor: '',
    firmware_version: '',
    attributes_json: '',
    description: ''
  })
  formRef.value?.clearValidate()
}

const openCreate = (defaults = {}) => {
  mode.value = 'create'
  resetForm()
  if (defaults.department_id) {
    formData.department_id = defaults.department_id
  }
  visible.value = true
}

const openEdit = (model) => {
  mode.value = 'edit'
  resetForm()
  if (model) {
    formData.id = model.id ?? model.device_model_id ?? null
    formData.department_id = model.department_id ?? model.departmentId ?? model.department?.id ?? null
    formData.name = model.name ?? model.model_name ?? ''
    formData.model_code = model.model_code ?? model.code ?? ''
    formData.category = model.category ?? ''
    formData.vendor = model.vendor ?? ''
    formData.firmware_version = model.firmware_version ?? model.firmwareVersion ?? ''
    if (model.attributes_json) {
      try {
        formData.attributes_json = typeof model.attributes_json === 'string'
          ? model.attributes_json
          : JSON.stringify(model.attributes_json, null, 2)
      } catch (error) {
        formData.attributes_json = ''
      }
    }
    formData.description = model.description ?? ''
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

  const optionalFields = ['model_code', 'category', 'vendor', 'firmware_version', 'description']
  optionalFields.forEach((field) => {
    const value = formData[field]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) {
        payload[field] = trimmed
      }
    }
  })

  const attributesContent = formData.attributes_json?.trim()
  if (attributesContent) {
    try {
      payload.attributes_json = JSON.parse(attributesContent)
    } catch (error) {
      throw new Error('属性配置必须是合法的 JSON 格式')
    }
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
      resp = await deviceModelsApi.create(payload)
    } else {
      const id = formData.id
      if (!id) {
        ElMessage.error('机型信息缺失，无法更新')
        return
      }
      resp = await deviceModelsApi.update(id, payload)
    }

    if (!resp?.success) {
      return
    }

    ElMessage.success(mode.value === 'create' ? '机型创建成功' : '机型更新成功')
    emit('success', {
      mode: mode.value,
      data: resp.data ?? null
    })
    handleClose()
  } catch (error) {
    if (error?.message) {
      ElMessage.error(error.message)
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

.form-item-tip {
  margin-left: 16px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  max-width: 260px;
}
</style>
