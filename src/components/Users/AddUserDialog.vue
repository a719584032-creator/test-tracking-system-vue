<!-- src/components/Users/AddUserDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="添加用户"
    width="420px"
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      status-icon
    >
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model.trim="form.username"
          placeholder="请输入用户名"
          maxlength="30"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          placeholder="6-32位密码"
          type="password"
          show-password
          maxlength="32"
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirm">
        <el-input
          v-model="form.confirm"
          placeholder="再次输入密码"
          type="password"
          show-password
          maxlength="32"
        />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="form.isAdmin">管理员角色</el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close" :disabled="submitting">取 消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useUsersStore } from '@/stores/modules/users'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emits = defineEmits(['update:modelValue', 'success'])

const store = useUsersStore()
const visible = ref(props.modelValue)
watch(() => props.modelValue, v => { visible.value = v })
watch(visible, v => emits('update:modelValue', v))

const formRef = ref()
const form = reactive({
  username: '',
  password: '',
  confirm: '',
  isAdmin: false
})

const submitting = ref(false)

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '长度 3-30', trigger: 'blur' },
    {
      validator(_, val, cb) {
        if (!/^[a-zA-Z0-9_\-]+$/.test(val)) {
          cb(new Error('仅字母数字下划线或 -'))
        } else cb()
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator(_, val, cb) {
        if (val && (val.length < 6 || val.length > 32))
          cb(new Error('长度 6-32'))
        else cb()
      },
      trigger: 'blur'
    }
  ],
  confirm: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator(_, val, cb) {
        if (val !== form.password) cb(new Error('两次输入不一致'))
        else cb()
      },
      trigger: 'blur'
    }
  ]
}

function resetForm() {
  form.username = ''
  form.password = ''
  form.confirm = ''
  form.isAdmin = false
  nextTick(() => formRef.value?.clearValidate())
}

function close() {
  visible.value = false
}
function onClosed() {
  resetForm()
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    const payload = {
      username: form.username,
      password: form.password
    }
    if (form.isAdmin) payload.role = 'admin'
    await store.addUser(payload)
    ElMessage.success('用户添加成功')
    emits('success')
    close()
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
