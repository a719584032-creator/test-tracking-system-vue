<template>
  <el-dialog
    v-model="visible"
    title="记录执行结果"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="关联用例">
        <el-input :value="executionSummary.caseTitle" disabled />
      </el-form-item>

      <el-form-item label="执行机型" v-if="executionSummary.deviceLabel">
        <el-input :value="executionSummary.deviceLabel" disabled />
      </el-form-item>

      <el-form-item label="执行结果" prop="result">
        <el-select v-model="formData.result" placeholder="请选择执行结果">
          <el-option
            v-for="option in resultOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="耗时 (毫秒)">
        <el-input-number
          v-model="formData.duration_ms"
          :min="0"
          :max="36000000"
          :step="100"
          placeholder="请输入耗时"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="缺陷关联">
        <el-input
          v-model="formData.bug_ref"
          placeholder="请输入缺陷编号（可选）"
          maxlength="100"
          clearable
        />
      </el-form-item>

      <el-form-item label="失败原因">
        <el-input
          v-model="formData.failure_reason"
          type="textarea"
          :rows="3"
          placeholder="如失败或阻塞，请填写原因"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="其他补充说明"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存结果
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { testPlansApi } from '@/api/testPlans'
import { EXECUTION_RESULT_OPTIONS, resolveExecutionResultLabel } from '@/constants/testPlan'

const props = defineProps({
  planId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['success'])

const visible = ref(false)
const submitting = ref(false)
const formRef = ref()
const currentExecution = ref(null)

const formData = reactive({
  plan_case_id: null,
  device_model_id: null,
  plan_device_model_id: null,
  result: '',
  remark: '',
  failure_reason: '',
  bug_ref: '',
  duration_ms: null
})

const rules = {
  result: [
    { required: true, message: '请选择执行结果', trigger: 'change' }
  ]
}

const executionSummary = computed(() => {
  if (!currentExecution.value) {
    return {
      caseTitle: '',
      deviceLabel: ''
    }
  }
  const caseTitle = currentExecution.value.case_title || `用例 #${currentExecution.value.case_id}`
  const deviceLabel = currentExecution.value.device_model_name || currentExecution.value.device_model_code
  if (currentExecution.value.device_model_id) {
    return { caseTitle, deviceLabel: deviceLabel || `机型 #${currentExecution.value.device_model_id}` }
  }
  return { caseTitle, deviceLabel: '' }
})

const resultOptions = EXECUTION_RESULT_OPTIONS

const open = (execution) => {
  currentExecution.value = execution || null
  Object.assign(formData, {
    plan_case_id: execution?.plan_case_id ?? null,
    device_model_id: execution?.device_model_id ?? null,
    plan_device_model_id: execution?.plan_device_model_id ?? null,
    result: execution?.result && execution.result !== 'pending' ? execution.result : '',
    remark: execution?.remark || '',
    failure_reason: execution?.failure_reason || '',
    bug_ref: execution?.bug_ref || '',
    duration_ms: execution?.duration_ms ?? null
  })
  visible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const handleSubmit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        plan_case_id: formData.plan_case_id,
        device_model_id: formData.device_model_id,
        plan_device_model_id: formData.plan_device_model_id,
        result: formData.result,
        remark: formData.remark || undefined,
        failure_reason: formData.failure_reason || undefined,
        bug_ref: formData.bug_ref || undefined,
        duration_ms: formData.duration_ms ?? undefined
      }
      const response = await testPlansApi.recordResult(props.planId, payload)
      if (response?.success) {
        const resultData = response.data || {
          ...payload,
          executed_at: new Date().toISOString()
        }
        ElMessage.success(response.message || `已记录结果：${resolveExecutionResultLabel(formData.result)}`)
        emit('success', resultData)
        visible.value = false
      }
    } finally {
      submitting.value = false
    }
  })
}

const handleClose = () => {
  visible.value = false
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
