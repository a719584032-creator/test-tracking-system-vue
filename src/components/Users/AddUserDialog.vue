<!-- ================== src/components/Users/AddUserDialog.vue ================== -->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="添加用户"
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
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="formData.username"
          placeholder="请输入用户名"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="请输入密码"
          show-password
          clearable
        />
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

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref()

const formData = reactive({
  username: '',
  password: '',
  email: '',
  phone: '',
  role: 'sys_viewer' // 默认创建系统观察员
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度在 8 到 20 个字符', trigger: 'blur' }
  ],
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

const open = () => {
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
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'sys_viewer'
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const payload = {
      username: formData.username,
      password: formData.password,
      email: formData.email || null,
      phone: formData.phone || null,
      role: formData.role
    }
    
    const result = await userService.create(payload)
    
    if (result.code === 200) {
      ElMessage.success(result.message || '用户创建成功')
      emit('success')
      handleClose()
    } else {
      ElMessage.error(result.message || '创建失败')
    }
  } catch (error) {
    console.error('创建用户失败:', error)
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
