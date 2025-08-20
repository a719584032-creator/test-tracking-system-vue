<template>
  <el-dialog
    v-model="visible"
    title="修改密码"
    width="400px"
    :before-close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="原密码" prop="oldPassword">
        <el-input 
          v-model="form.oldPassword" 
          type="password" 
          placeholder="请输入原密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input 
          v-model="form.newPassword" 
          type="password" 
          placeholder="请输入新密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input 
          v-model="form.confirmPassword" 
          type="password" 
          placeholder="请再次输入新密码"
          show-password
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose" :disabled="loading">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ loading ? '修改中...' : '确定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref()
const loading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = reactive({
  username: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 提交修改
const handleSubmit = () => {
  if (loading.value) return
  
  formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const response = await authApi.changePassword({
        username: form.username,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      })
      
      if (response.data.result) {
        emit('success')
        handleClose()
      } else {
        ElMessage.error('密码修改失败')
      }
    } catch (error) {
      console.error('修改密码错误:', error)
      
      if (error.response?.status === 400) {
        ElMessage.error('请求参数错误')
      } else if (error.response?.data?.error) {
        ElMessage.error(error.response.data.error)
      } else {
        ElMessage.error('密码修改失败，请稍后重试')
      }
    } finally {
      loading.value = false
    }
  })
}

// 关闭对话框
const handleClose = () => {
  if (loading.value) return
  
  visible.value = false
  // 重置表单
  setTimeout(() => {
    formRef.value?.resetFields()
    Object.assign(form, {
      username: '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }, 200)
}

// 监听对话框打开，自动聚焦
watch(visible, (newVal) => {
  if (newVal) {
    // 可以在这里设置默认用户名等
  }
})
</script>
