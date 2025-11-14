<template>
  <el-dialog
    v-model="visible"
    title="编辑成员角色"
    width="420px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="90px"
      @submit.prevent
    >
      <el-form-item label="用户名">
        <el-input :value="memberInfo.username || '-'" disabled />
      </el-form-item>

      <el-form-item label="成员ID">
        <el-input :value="memberInfo.department_member_id || '-'" disabled />
      </el-form-item>

      <el-form-item label="邮箱">
        <el-input :value="memberInfo.email || '-'" disabled />
      </el-form-item>

      <el-form-item label="当前角色">
        <el-tag :type="getRoleTagType(memberInfo.department_role || memberInfo.role)">
          {{ getRoleLabel(memberInfo.department_role || memberInfo.role) }}
        </el-tag>
      </el-form-item>

      <el-form-item label="部门角色" prop="role">
        <el-select
          v-model="formData.role"
          placeholder="请选择角色"
          style="width: 100%"
        >
          <el-option
            v-for="role in DEPARTMENT_ROLES"
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
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { departmentService } from '@/api/departments'
import { DEPARTMENT_ROLES, DEPARTMENT_ROLE_LABEL_MAP } from '@/constants/department'

const emit = defineEmits(['success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref()
const memberInfo = ref({})

const ROLE_VALUE_SET = new Set(DEPARTMENT_ROLES.map(r => r.value))

const formData = reactive({
  role: ''
})

const rules = {
  role: [
    {
      required: true,
      message: '请选择角色',
      trigger: 'change'
    }
  ]
}

watch(visible, (show) => {
  if (!show) {
    resetForm()
  }
})

const open = (member) => {
  memberInfo.value = { ...member }
  const incomingRole = member.department_role
  formData.role = ROLE_VALUE_SET.has(incomingRole) ? incomingRole : ''
  visible.value = true
}

const handleClose = () => {
  visible.value = false
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  memberInfo.value = {}
}

const getRoleLabel = (role) => {
  if (!role) {
    return memberInfo.value?.department_role_label || '-'
  }
  return memberInfo.value?.department_role_label || DEPARTMENT_ROLE_LABEL_MAP[role] || role
}

const getRoleTagType = (role) => {
  const map = {
    dept_admin: 'warning',
    dept_project_admin: 'info',
    dept_member: 'success'
  }
  return map[role] || 'info'
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const departmentMemberId = memberInfo.value?.department_member_id
  if (!departmentMemberId) {
    ElMessage.error('部门成员ID缺失')
    return
  }

  try {
    await formRef.value.validate()
    loading.value = true
    const payload = { role: formData.role }
    const resp = await departmentService.updateMemberRole(departmentMemberId, payload)
    if (resp.success) {
      ElMessage.success(resp.message || '角色修改成功')
      emit('success')
      handleClose()
    }
  } catch (error) {
    console.error('修改成员角色失败:', error)
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
