<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <div class="login-header">
        <img src="@/assets/logo.png" alt="Logo" class="logo" />
        <h2>{{ appTitle }}</h2>
      </div>

      <el-form :model="form" :rules="rules" ref="loginForm" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名" 
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            :disabled="loading"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.remember" :disabled="loading">记住我</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            class="full-btn" 
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/modules/auth'
import { authApi } from '@/api/auth'
import { appInfo } from '@/config'

const appTitle = appInfo.title

const router = useRouter()
const auth = useAuthStore()
const loginForm = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于 8 个字符', trigger: 'blur' }
  ]
}

const handleLogin = () => {
  if (loading.value) return

  loginForm.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const response = await authApi.login({
        username: form.username,
          password: form.password
      })

      console.log('开始登录')
      console.log('完整响应:', response)

      const apiResponse = response.data
      console.log('响应码:', apiResponse.code)
      console.log('响应数据:', apiResponse.data)
      console.log('响应消息:', apiResponse.message)

      if (apiResponse.code === 200 && apiResponse.data) {
        const { token, user } = apiResponse.data
        if (token && user) {
          const { id: userid, username, role } = user
          auth.login({
            token,
            username: username || form.username,
            role,
            userid
          })

          if (form.remember) {
            localStorage.setItem('rememberUser', form.username)
          } else {
            localStorage.removeItem('rememberUser')
          }

          ElMessage.success('登录成功')
          router.push('/dashboard')
        } else {
          console.error('Token 或用户信息缺失:', { token, user })
          ElMessage.error('登录失败，服务器返回数据不完整')
        }
      } else {
        console.error('登录失败，响应异常:', apiResponse)
        ElMessage.error(apiResponse.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.code === 401) {
          ElMessage.error(errorData.message || '用户名或密码错误')
        } else if (errorData.code === 400) {
          ElMessage.error(errorData.message || '请求参数错误')
        } else {
          ElMessage.error(errorData.message || '登录失败')
        }
      } else if (error.response?.status === 401) {
        ElMessage.error('用户名或密码错误')
      } else if (error.response?.status === 400) {
        ElMessage.error('请求参数错误')
      } else if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        ElMessage.error('网络连接失败，请检查网络设置')
      } else if (error.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请稍后重试')
      } else {
        ElMessage.error('登录失败，请检查网络连接或稍后重试')
      }
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  const rememberedUser = localStorage.getItem('rememberUser')
  if (rememberedUser) {
    form.username = rememberedUser
    form.remember = true
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(to bottom right, #409eff, #66b1ff);
}

.login-card {
  width: 400px;
  padding: 20px;
  border-radius: 10px;
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  width: 60px;
  height: 60px;
  margin-bottom: 10px;
}

.full-btn {
  width: 100%;
}
</style>