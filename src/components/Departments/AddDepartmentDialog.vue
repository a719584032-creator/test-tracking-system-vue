<template>
  <el-dialog
    v-model="visible"
    title="添加部门"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="部门名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入部门名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="部门编码" prop="code">
        <el-input
          v-model="formData.code"
          placeholder="请输入部门编码（可选）"
          maxlength="20"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入部门描述（可选）"
          :rows="3"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { departmentService } from '@/api/departments'

const emit = defineEmits(['success'])

const visible = ref(false)
const submitting = ref(false)
const formRef = ref()

const formData = reactive({
  name: '',
  code: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 50, message: '部门名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { max: 20, message: '部门编码长度不能超过 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

const open = () => {
  visible.value = true
}

const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(formData, {
    name: '',
    code: '',
    description: ''
  })
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return

    submitting.value = true
    
    const payload = {
      name: formData.name,
      code: formData.code || undefined,
      description: formData.description || undefined
    }
    
    const resp = await departmentService.create(payload)
    if (!resp.success) {
      ElMessage.error(resp.message || '添加部门失败')
      return
    }
    
    ElMessage.success('部门添加成功')
    emit('success')
    handleClose()
  } catch (e) {
    console.error('添加部门失败:', e)
    ElMessage.error('添加部门失败')
  } finally {
    submitting.value = false
  }
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
