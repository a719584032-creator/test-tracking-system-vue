<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改密码"
    width="480px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="left"
      status-icon
    >
      <el-form-item label="当前密码" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          placeholder="请输入当前密码"
          show-password
          clearable
          :disabled="loading"
          @keyup.enter="trySubmitFromEnter"
        />
      </el-form-item>
      
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          placeholder="至少 8 位，含字母与数字（推荐含大小写与符号）"
          show-password
          clearable
          :disabled="loading"
          @input="handleNewPasswordInput"
          @keyup.enter="trySubmitFromEnter"
        />
        <template #error>
          <div class="item-error">
            <span v-if="fieldErrors.newPassword">{{ fieldErrors.newPassword }}</span>
          </div>
        </template>
      </el-form-item>
      
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
          clearable
          :disabled="loading"
          @keyup.enter="trySubmitFromEnter"
        />
      </el-form-item>
    </el-form>
    
    <!-- 密码强度 / 提示区 -->
    <div class="password-meta">
      <div class="strength-row">
        <span class="strength-label">密码强度：</span>
        <div class="strength-bars">
          <div
            v-for="(seg, idx) in 3"
            :key="idx"
            class="strength-seg"
            :class="{'active': idx < strength.level, ['lv-' + strength.level]: true}"
          />
        </div>
        <span class="strength-text" :class="'lv-' + strength.level">
          {{ strength.text }}
        </span>
      </div>
      <ul class="requirements">
        <li :class="{ok: strengthChecks.lengthOK}">≥ 8 位长度</li>
        <li :class="{ok: strengthChecks.hasLetter}">至少 1 个字母</li>
          <li :class="{ok: strengthChecks.hasDigit}">至少 1 个数字</li>
        <li :class="{ok: strengthChecks.hasMixedCase}">大小写混合(推荐)</li>
        <li :class="{ok: strengthChecks.hasSymbol}">包含符号(推荐)</li>
        <li :class="{ok: strengthChecks.notSameAsOld}">不与当前密码相同</li>
      </ul>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loading">
          取消
        </el-button>
        <el-button 
          type="primary"
          :loading="loading"
          :disabled="!canSubmit || loading"
          @click="handleSubmit"
        >
          确认修改
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'

// Props
const props = defineProps({
  visible: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['update:visible', 'success'])

// Dialog state
const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false) // 防重复提交标志
const formRef = ref()

// Form model
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 单独跟踪某些字段的即时错误（更友好覆盖）
const fieldErrors = reactive({
  newPassword: ''
})

// 复杂度检测逻辑
const complexityRegex = {
  letter: /[A-Za-z]/,
  lower: /[a-z]/,
  upper: /[A-Z]/,
  digit: /\d/,
  symbol: /[^A-Za-z0-9]/,
}

const strengthChecks = reactive({
  lengthOK: false,
  hasLetter: false,
  hasDigit: false,
  hasMixedCase: false,
  hasSymbol: false,
  notSameAsOld: false
})

const evaluateStrength = (pwd, oldPwd) => {
  strengthChecks.lengthOK = pwd.length >= 8
  strengthChecks.hasLetter = complexityRegex.letter.test(pwd)
  strengthChecks.hasDigit = complexityRegex.digit.test(pwd)
  strengthChecks.hasMixedCase = complexityRegex.lower.test(pwd) && complexityRegex.upper.test(pwd)
  strengthChecks.hasSymbol = complexityRegex.symbol.test(pwd)
  strengthChecks.notSameAsOld = !!pwd && pwd !== oldPwd && oldPwd.length > 0 ? pwd !== oldPwd : true

  // Level 0: 空
  // Level 1: 基础通过（长度+字母+数字）
  // Level 2: 再加混合大小写 或 符号
  // Level 3: 同时具备：长度≥10 + 混合大小写 + 数字 + 符号
  let level = 0
  if (pwd.length === 0) level = 0
  else {
    const base = strengthChecks.lengthOK && strengthChecks.hasLetter && strengthChecks.hasDigit
    const adv = strengthChecks.hasMixedCase || strengthChecks.hasSymbol
    const strong = pwd.length >= 10 && strengthChecks.hasMixedCase && strengthChecks.hasDigit && strengthChecks.hasSymbol
    if (strong) level = 3
    else if (base && adv) level = 2
    else if (base) level = 1
    else level = 1 // 输入中但未满足全部基础 => 显示最弱
  }
  return level
}

const strength = computed(() => {
  const level = evaluateStrength(form.newPassword, form.oldPassword)
  let text = ''
  switch (level) {
    case 0: text = '空'; break
    case 1: text = '弱'; break
    case 2: text = '中'; break
    case 3: text = '强'; break
  }
  return { level, text }
})

// 自定义校验器：新密码
const validateNewPassword = (rule, value, callback) => {
  fieldErrors.newPassword = ''
  // 基础要求
  if (!value) {
    fieldErrors.newPassword = '请输入新密码'
    return callback(new Error(fieldErrors.newPassword))
  }
  if (value.length < 8) {
    fieldErrors.newPassword = '密码长度至少 8 位'
    return callback(new Error(fieldErrors.newPassword))
  }
  if (!complexityRegex.letter.test(value) || !complexityRegex.digit.test(value)) {
    fieldErrors.newPassword = '需同时包含字母与数字'
    return callback(new Error(fieldErrors.newPassword))
  }
  if (value === form.oldPassword) {
    fieldErrors.newPassword = '新密码不能与当前密码相同'
    return callback(new Error(fieldErrors.newPassword))
  }
  // 可选：限制最大长度
  if (value.length > 30) {
    fieldErrors.newPassword = '密码过长（最大 30 位）'
    return callback(new Error(fieldErrors.newPassword))
  }
  callback()
}

// 确认密码校验
const validateConfirm = (rule, value, callback) => {
  if (!value) {
    return callback(new Error('请确认新密码'))
  }
  if (value !== form.newPassword) {
    return callback(new Error('两次输入的密码不一致'))
  }
  callback()
}

// 旧密码校验
const validateOld = (rule, value, callback) => {
  if (!value) {
    return callback(new Error('请输入当前密码'))
  }
  if (value.length > 128) {
    return callback(new Error('当前密码长度异常'))
  }
  callback()
}

const rules = {
  oldPassword: [
    { validator: validateOld, trigger: ['blur', 'change'] }
  ],
  newPassword: [
    { validator: validateNewPassword, trigger: ['blur', 'change'] }
  ],
  confirmPassword: [
    { validator: validateConfirm, trigger: ['blur', 'change'] }
  ]
}

// 监听 visible
watch(() => props.visible, v => {
  dialogVisible.value = v
  if (v) resetForm()
}, { immediate: true })

watch(dialogVisible, v => emit('update:visible', v))

const resetForm = () => {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  fieldErrors.newPassword = ''
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleClose = () => {
  if (loading.value) return
  dialogVisible.value = false
  resetForm()
}

// 防止用户敲回车直接提交而未完成校验
const trySubmitFromEnter = () => {
  if (canSubmit.value && !loading.value) {
    handleSubmit()
  }
}

const canSubmit = computed(() => {
  // 基础：字段非空 + 新密码基本校验 + 两次一致
  return Boolean(
    form.oldPassword &&
    form.newPassword &&
    form.confirmPassword &&
    form.newPassword === form.confirmPassword &&
    strengthChecks.lengthOK &&
    strengthChecks.hasLetter &&
    strengthChecks.hasDigit &&
    form.newPassword !== form.oldPassword
  )
})

const validateForm = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch (e) {
    // e 包含 fields
    return false
  }
}

const handleNewPasswordInput = () => {
  // 实时重新校验 confirmPassword 防止提示延迟
  if (form.confirmPassword) {
    formRef.value?.validateField('confirmPassword', () => {})
  }
}

const handleSubmit = async () => {
  if (submitting.value || loading.value) return
  submitting.value = true
  const valid = await validateForm()
  if (!valid) {
    submitting.value = false
    return
  }
  loading.value = true
  try {
    await authApi.changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword
    })
    ElMessage.success('密码修改成功，将自动关闭')
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    // 解析后端错误
    const status = error?.response?.status
    const dataMsg = error?.response?.data?.message
    if (status === 400) {
      // 可能：旧密码错误 / 历史密码重复
      if (dataMsg?.includes('历史') || dataMsg?.includes('重复')) {
        ElMessage.error(dataMsg || '新密码与历史密码重复')
      } else {
        ElMessage.error(dataMsg || '当前密码错误')
      }
    } else if (status === 409) {
      ElMessage.error(dataMsg || '新密码与最近使用的密码重复')
    } else if (status === 422) {
      ElMessage.error(dataMsg || '新密码格式不符合要求')
    } else {
      ElMessage.error(dataMsg || '修改密码失败，请稍后重试')
    }
  } finally {
    loading.value = false
    submitting.value = false
  }
}
</script>

<style scoped>
.password-meta {
  margin: 4px 0 12px;
  background: #f6fafd;
  border: 1px solid #e5f2ff;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
}
.strength-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
  flex-wrap: wrap;
}
.strength-label {
  font-weight: 500;
  color: #333;
}
.strength-bars {
  display: flex;
  gap: 4px;
  height: 6px;
}
.strength-seg {
  width: 34px;
  background: #dcdfe6;
  border-radius: 2px;
  transition: background .3s;
}
.strength-seg.active.lv-1 { background: #f56c6c; }
.strength-seg.active.lv-2 { background: #e6a23c; }
.strength-seg.active.lv-3 { background: #67c23a; }
.strength-text {
  font-weight: 600;
}
.strength-text.lv-1 { color: #f56c6c; }
.strength-text.lv-2 { color: #e6a23c; }
.strength-text.lv-3 { color: #67c23a; }
.requirements {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.requirements li {
  position: relative;
  padding-left: 14px;
  color: #999;
  line-height: 1.2;
}
.requirements li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #bbb;
}
.requirements li.ok {
  color: #409eff;
}
.requirements li.ok::before {
  color: #409eff;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.item-error {
  line-height: 16px;
  padding-top: 2px;
}
</style>