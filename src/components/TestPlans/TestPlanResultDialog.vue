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

      <el-form-item label="开始时间" prop="execution_start_time">
        <el-date-picker
          v-model="formData.execution_start_time"
          type="datetime"
          placeholder="请选择执行开始时间"
          :disabled-date="disableFutureDate"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="结束时间" prop="execution_end_time">
        <el-date-picker
          v-model="formData.execution_end_time"
          type="datetime"
          placeholder="请选择执行结束时间"
          :disabled-date="disableFutureDate"
          style="width: 100%"
        />
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

      <el-form-item label="执行附件">
        <el-upload
          class="attachment-uploader"
          action=""
          :auto-upload="false"
          multiple
          :file-list="attachmentList"
          :on-change="handleAttachmentChange"
          :on-remove="handleAttachmentRemove"
          :limit="10"
          :on-exceed="handleAttachmentExceed"
        >
          <el-button type="primary">选择文件</el-button>
          <template #tip>
            <div class="el-upload__tip">支持上传多个附件，单个文件大小建议不超过 20MB</div>
          </template>
        </el-upload>
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
import { encryptTimestamp } from '@/utils/timestampEncryption'

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
  duration_ms: null,
  execution_start_time: null,
  execution_end_time: null
})

const rules = {
  result: [
    { required: true, message: '请选择执行结果', trigger: 'change' }
  ],
  execution_start_time: [
    { required: true, message: '请选择执行开始时间', trigger: 'change' },
    { validator: validateTimeOrder, trigger: 'change' }
  ],
  execution_end_time: [
    { required: true, message: '请选择执行结束时间', trigger: 'change' },
    { validator: validateTimeOrder, trigger: 'change' }
  ]
}

const attachmentList = ref([])

function validateTimeOrder(rule, value, callback) {
  const start = formData.execution_start_time
  const end = formData.execution_end_time
  if (!start || !end) {
    callback()
    return
  }
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    callback(new Error('请选择有效的时间'))
    return
  }
  if (endMs < startMs) {
    callback(new Error('结束时间不能早于开始时间'))
    return
  }
  callback()
}

const disableFutureDate = (date) => {
  return date.getTime() > Date.now()
}

const normalizeExistingAttachment = (attachment) => ({
  uid: `existing-${attachment.id ?? attachment.file_path ?? attachment.file_name}-${Math.random().toString(36).slice(2, 8)}`,
  name: attachment.file_name,
  status: 'success',
  isExisting: true,
  stored_file_name: attachment.stored_file_name,
  file_path: attachment.file_path,
  size: attachment.size,
  uploaded_by: attachment.uploaded_by,
  url: attachment.url || attachment.file_url || attachment.file_path
})

const handleAttachmentChange = (uploadFile, uploadFiles) => {
  attachmentList.value = uploadFiles
}

const handleAttachmentRemove = (uploadFile, uploadFiles) => {
  attachmentList.value = uploadFiles
}

const handleAttachmentExceed = () => {
  ElMessage.warning('最多只能上传 10 个附件，请先删除部分文件')
}

const resetAttachments = (execution) => {
  const attachments = Array.isArray(execution?.attachments) ? execution.attachments : []
  attachmentList.value = attachments.map((item) => normalizeExistingAttachment(item))
}

const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('附件读取失败'))
    reader.readAsDataURL(file)
  })
}

const prepareAttachmentsPayload = async () => {
  const results = []
  for (const item of attachmentList.value) {
    if (item.isExisting) {
      results.push({
        file_name: item.name,
        stored_file_name: item.stored_file_name,
        file_path: item.file_path,
        size: item.size,
        uploaded_by: item.uploaded_by
      })
      continue
    }
    if (!item.raw) continue
    const content = await readFileAsDataUrl(item.raw)
    results.push({
      file_name: item.name,
      content,
      size: item.size ?? item.raw.size
    })
  }
  return results
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
    duration_ms: execution?.duration_ms ?? null,
    execution_start_time: execution?.execution_start_time ? new Date(execution.execution_start_time) : null,
    execution_end_time: execution?.execution_end_time ? new Date(execution.execution_end_time) : null
  })
  resetAttachments(execution)
  visible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const handleSubmit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (!formData.execution_start_time || !formData.execution_end_time) {
        ElMessage.error('请填写完整的开始和结束时间')
        return
      }
      const startDate = new Date(formData.execution_start_time)
      const endDate = new Date(formData.execution_end_time)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        ElMessage.error('请选择有效的执行时间')
        return
      }
      if (endDate.getTime() < startDate.getTime()) {
        ElMessage.error('结束时间不能早于开始时间')
        return
      }
      const [encryptedStart, encryptedEnd] = await Promise.all([
        encryptTimestamp(startDate),
        encryptTimestamp(endDate)
      ])
      const attachmentsPayload = await prepareAttachmentsPayload()
      const payload = {
        plan_case_id: formData.plan_case_id,
        device_model_id: formData.device_model_id,
        plan_device_model_id: formData.plan_device_model_id,
        result: formData.result,
        remark: formData.remark || undefined,
        failure_reason: formData.failure_reason || undefined,
        bug_ref: formData.bug_ref || undefined,
        duration_ms: formData.duration_ms ?? undefined,
        execution_start_time: encryptedStart,
        execution_end_time: encryptedEnd,
        attachments: attachmentsPayload
      }
      const response = await testPlansApi.recordResult(props.planId, payload)
      if (response?.success) {
        const sanitizedAttachments = attachmentsPayload.map((item) => {
          if (item.content) {
            return {
              file_name: item.file_name,
              size: item.size
            }
          }
          return { ...item }
        })
        const fallbackResult = {
          ...payload,
          execution_start_time: startDate.toISOString(),
          execution_end_time: endDate.toISOString(),
          executed_at: new Date().toISOString(),
          attachments: sanitizedAttachments
        }
        const resultData = response.data || fallbackResult
        ElMessage.success(response.message || `已记录结果：${resolveExecutionResultLabel(formData.result)}`)
        emit('success', resultData)
        visible.value = false
      }
    } catch (error) {
      console.error(error)
      const message = error?.message || '记录执行结果失败'
      ElMessage.error(message)
    } finally {
      submitting.value = false
    }
  })
}

const handleClose = () => {
  visible.value = false
  attachmentList.value = []
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

.attachment-uploader {
  width: 100%;
}
</style>
