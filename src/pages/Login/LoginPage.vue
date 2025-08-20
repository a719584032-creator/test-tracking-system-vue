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
        <div class="login-footer">
          <el-button type="text" @click="goChangePassword" :disabled="loading">
            修改密码
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 修改密码对话框 -->
    <ChangePasswordDialog 
      v-model="showChangePassword"
      @success="handlePasswordChanged"
    />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/modules/auth'
import { authApi } from '@/api/auth'
import { appInfo } from '@/config'
import ChangePasswordDialog from '@/components/Auth/ChangePasswordDialog.vue'

// 使用配置中的应用标题
const appTitle = appInfo.title

const router = useRouter()
const auth = useAuthStore()
const loginForm = ref()
const loading = ref(false)
const showChangePassword = ref(false)

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
    { min: 6, message: '密码长度不能少于 8 个字符', trigger: 'blur' }
  ]
}

// 处理登录
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
      
      const { token, role, userid, username } = response.data
      
      if (token) {
        // 保存用户信息到 store
        auth.login({ 
          token, 
          username: username || form.username, 
          role, 
          userid 
        })
        
        // 记住用户名
        if (form.remember) {
          localStorage.setItem('rememberUser', form.username)
        } else {
          localStorage.removeItem('rememberUser')
        }
        
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } else {
        ElMessage.error('登录失败，服务器返回异常')
      }
    } catch (error) {
      console.error('登录错误:', error)
      
      if (error.response?.status === 401) {
        ElMessage.error('用户名或密码错误')
      } else if (error.response?.status === 400) {
        ElMessage.error('请求参数错误')
      } else if (error.response?.data?.error) {
        ElMessage.error(error.response.data.error)
      } else {
        ElMessage.error('登录失败，请检查网络连接或稍后重试')
      }
    } finally {
      loading.value = false
    }
  })
}

// 跳转到修改密码
const goChangePassword = () => {
  showChangePassword.value = true
}

// 密码修改成功回调
const handlePasswordChanged = () => {
  ElMessage.success('密码修改成功')
  showChangePassword.value = false
}

// 页面加载时恢复记住的用户名
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

.login-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
