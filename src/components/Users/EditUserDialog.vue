<!-- ================== src/components/Users/EditUserDialog.vue ================== -->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑用户"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
      @submit.prevent
    >
      <el-form-item label="用户名">
        <el-input v-model="userInfo.username" disabled />
      </el-form-item>
      
      <el-form-item label="创建时间">
        <el-input :value="formatDateTime(userInfo.created_at)" disabled />
      </el-form-item>
      
      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="formData.email"
          placeholder="请输入邮箱地址"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="电话" prop="phone">
        <el-input
          v-model="formData.phone"
          placeholder="请输入电话号码"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="角色" prop="role">
        <el-select
          v-model="formData.role"
          placeholder="请选择角色"
          style="width: 100%"
        >
          <el-option
            v-for="role in USER_ROLES"
            :key="role.value"
            :label="role.label"
            :value="role.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { USER_ROLES } from '@/constants/user'
import { userService } from '@/api/users'
import { formatDateTime } from '@/utils/format'

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref()

const userInfo = ref({})
const formData = reactive({
  email: '',
  phone: '',
  role: 'sys_viewer'
})

const rules = {
  email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: ['blur', 'change']
    }
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: ['blur', 'change']
    }
  ],
  role: [
    {
      required: true,
      message: '请选择角色',
      trigger: 'change'
    }
  ]
}

// 监听对话框显示状态，重置表单
watch(dialogVisible, (visible) => {
  if (!visible) {
    resetForm()
  }
})

const open = (user) => {
  userInfo.value = { ...user }
  formData.email = user.email || ''
  formData.phone = user.phone || ''
  formData.role = user.role || 'sys_viewer'
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    email: '',
    phone: '',
    role: 'sys_viewer'
  })
  userInfo.value = {}
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const payload = {
      email: formData.email || null,
      phone: formData.phone || null,
      role: formData.role
    }
    
    const result = await userService.update(userInfo.value.id, payload)
    
    if (result.success) {
      ElMessage.success('用户信息更新成功')
      emit('success')
      handleClose()
    }
  } catch (error) {
    console.error('更新用户失败:', error)
  } finally {
    loading.value = false
  }
}

defineExpose({
  open
})
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>
