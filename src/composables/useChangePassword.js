import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'

export function useChangePassword() {
  const loading = ref(false)
  const visible = ref(false)

  const changePassword = async (passwordData) => {
    try {
      loading.value = true
      
      await authApi.changePassword(passwordData)
      
      ElMessage.success('密码修改成功')
      visible.value = false
      
      return true
    } catch (error) {
      console.error('修改密码失败:', error)
      
      if (error.response?.status === 400) {
        ElMessage.error('当前密码错误')
      } else if (error.response?.status === 422) {
        ElMessage.error('新密码格式不符合要求')
      } else {
        ElMessage.error('修改密码失败，请稍后重试')
      }
      
      return false
    } finally {
      loading.value = false
    }
  }

  const showDialog = () => {
    visible.value = true
  }

  const hideDialog = () => {
    visible.value = false
  }

  return {
    loading,
    visible,
    changePassword,
    showDialog,
    hideDialog
  }
}
