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
      <el-form-item label="所属项目">
        <el-input v-model="formData.project_name" disabled />
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
  project_name: '',
  name: '',
  status: '',
  start_date: '',
  end_date: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 100, message: '计划名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择计划状态', trigger: 'change' }
  ]
}

const mergedStatusOptions = computed(() => {
  const base = Array.isArray(props.statusOptions) ? [...props.statusOptions] : []
  if (formData.status && !base.some((item) => item.value === formData.status)) {
    base.push({ value: formData.status, label: formData.status })
  }
  return base
})

const dialogTitle = computed(() => '编辑测试计划')

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    project_name: '',
    name: '',
    status: '',
    start_date: '',
    end_date: '',
    description: ''
  })
  formRef.value?.clearValidate()
}

const open = (plan) => {
  resetForm()
  if (plan) {
    Object.assign(formData, {
      id: plan.id,
      project_name: plan.project_name || '',
      name: plan.name || '',
      status: plan.status || '',
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      description: plan.description || ''
    })
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
        end_date: formData.end_date || null
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
