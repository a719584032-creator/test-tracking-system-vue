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
      <!-- 部门 -->
      <el-form-item label="所属部门" prop="department_id">
        <el-select
          v-model="formData.department_id"
          placeholder="请选择部门"
          clearable
          filterable
          :loading="loadingDepartmentsComputed"
        >
          <el-option
            v-for="dept in departmentsComputed"
            :key="dept.value"
            :label="dept.label"
            :value="dept.value"
          />
        </el-select>
        <div v-if="!departmentsComputed.length" class="form-item-tip">
          未传入部门选项，已自动使用默认部门 ID：{{ DEFAULT_DEPT_ID }}
        </div>
      </el-form-item>

      <!-- 名称 / 型号 / 类别 / 厂商 / 固件 -->
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

      <!-- 属性配置（JSON） -->
      <el-form-item label="属性配置" prop="attributes_json">
        <el-input
          v-model="formData.attributes_json"
          type="textarea"
          :rows="4"
          placeholder='请输入 JSON，如 {"key":"value"}；留空=不提交；清空请填 {}'
          maxlength="2000"
          show-word-limit
        />
        <div class="form-item-tip">留空不提交该字段；如需清空后端配置，请填写 <code>{}</code>。</div>
      </el-form-item>

      <!-- 描述 -->
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

/** —— 常量 —— */
const DEFAULT_DEPT_ID = 13 // 未传部门选项时的默认部门 ID

/** —— Props —— */
const props = defineProps({
  departments: { type: Array, default: () => [] },            // [{ value,label }]
  loadingDepartments: { type: Boolean, default: false }
})

/** —— Emits —— */
const emit = defineEmits(['success'])

/** —— State —— */
const visible = ref(false)
const submitting = ref(false)
const mode = ref('create') // 'create' | 'edit'
const formRef = ref()

const formData = reactive({
  id: null,
  department_id: null,
  name: '',
  model_code: '',
  category: '',
  vendor: '',
  firmware_version: '',
  // 注意：这里是文本框内容（string），提交时再 JSON.parse
  attributes_json: '',
  description: ''
})

/** —— 校验 —— */
const validateJson = (_rule, value, callback) => {
  const content = value?.trim()
  if (!content) return callback()
  try {
    JSON.parse(content)
    callback()
  } catch {
    callback(new Error('请输入合法的 JSON 格式'))
  }
}

const rules = {
  department_id: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
  name: [
    { required: true, message: '请输入机型名称', trigger: 'blur' },
    { min: 2, max: 100, message: '机型名称长度在 2 ~ 100 个字符', trigger: 'blur' }
  ],
  model_code: [{ max: 100, message: '机型编码不能超过 100 个字符', trigger: 'blur' }],
  category: [{ max: 100, message: '机型分类不能超过 100 个字符', trigger: 'blur' }],
  vendor: [{ max: 100, message: '厂商信息不能超过 100 个字符', trigger: 'blur' }],
  firmware_version: [{ max: 100, message: '固件版本不能超过 100 个字符', trigger: 'blur' }],
  description: [{ max: 500, message: '描述不能超过 500 个字符', trigger: 'blur' }],
  attributes_json: [{ validator: validateJson, trigger: 'blur' }]
}

/** —— 计算属性 —— */
const dialogTitle = computed(() => (mode.value === 'create' ? '新建设备机型' : '编辑设备机型'))
const submitText = computed(() => (mode.value === 'create' ? '创建' : '保存'))
const loadingDepartmentsComputed = computed(() => props.loadingDepartments)
const departmentsComputed = computed(() => props.departments || [])

/** —— 工具 —— */
const prettyStringify = (obj) => {
  try { return JSON.stringify(obj, null, 2) } catch { return '' }
}

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    department_id: departmentsComputed.value[0]?.value ?? DEFAULT_DEPT_ID,
    name: '',
    model_code: '',
    category: '',
    vendor: '',
    firmware_version: '',
    attributes_json: '',
    description: ''
  })
  formRef.value?.clearValidate?.()
}

/** —— 对外方法：新建 —— */
const openCreate = (defaults = {}) => {
  mode.value = 'create'
  resetForm()
  // 如果父组件传入默认部门，则覆盖
  if (defaults.department_id) {
    formData.department_id = defaults.department_id
  }
  visible.value = true
}

/** —— 对外方法：编辑 —— */
const openEdit = (model) => {
  mode.value = 'edit'
  resetForm()
  if (model) {
    // 严格对齐接口字段
    formData.id = model.id ?? null
    formData.department_id = model.department_id ?? DEFAULT_DEPT_ID
    formData.name = model.name ?? ''
    formData.model_code = model.model_code ?? ''
    formData.category = model.category ?? ''
    formData.vendor = model.vendor ?? ''
    formData.firmware_version = model.firmware_version ?? ''
    formData.description = model.description ?? ''
    // attributes_json 统一用 pretty 回显
    if (model.attributes_json) {
      formData.attributes_json = typeof model.attributes_json === 'string'
        ? model.attributes_json
        : prettyStringify(model.attributes_json)
    }
  }
  visible.value = true
}

/** —— 关闭 —— */
const handleClose = () => {
  visible.value = false
  nextTick(() => resetForm())
}

/** —— 构造提交参数 —— */
const buildPayload = () => {
  const payload = {
    department_id: formData.department_id,
    name: formData.name?.trim()
  }

  // 可选字符串字段：仅在非空时提交，避免覆盖
  ;['model_code', 'category', 'vendor', 'firmware_version', 'description'].forEach((k) => {
    const v = (formData[k] ?? '').trim()
    if (v) payload[k] = v
  })

  // 属性配置：留空=不提交；"{}" = 清空
  const raw = formData.attributes_json?.trim()
  if (raw) {
    try {
      payload.attributes_json = JSON.parse(raw)
    } catch {
      throw new Error('属性配置必须是合法的 JSON 格式')
    }
  }

  return payload
}

/** —— 提交 —— */
const handleSubmit = async () => {
  try {
    const ok = await formRef.value?.validate()
    if (!ok) return

    submitting.value = true
    const payload = buildPayload()

    let resp
    if (mode.value === 'create') {
      resp = await deviceModelsApi.create(payload)
    } else {
      if (!formData.id) {
        ElMessage.error('机型信息缺失，无法更新')
        return
      }
      resp = await deviceModelsApi.update(formData.id, payload)
    }

    if (!resp?.success) {
      throw new Error(resp?.message || '操作失败')
    }

    ElMessage.success(mode.value === 'create' ? '机型创建成功' : '机型更新成功')
    emit('success', { mode: mode.value, data: resp.data ?? null })
    handleClose()
  } catch (e) {
    if (e?.message) ElMessage.error(e.message)
  } finally {
    submitting.value = false
  }
}

/** —— 暴露方法 —— */
defineExpose({ openCreate, openEdit })
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
  max-width: 320px;
}
</style>
