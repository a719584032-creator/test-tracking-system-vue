<!-- src/pages/TestCases/components/TestCaseForm.vue -->
<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    class="custom-dialog"
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="120px"
      class="case-form"
    >
      <div class="form-section">
        <h4 class="section-title">基本信息</h4>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入用例标题"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option
                  v-for="opt in priorityOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用例类型" prop="case_type">
              <el-select v-model="form.case_type" placeholder="请选择类型" style="width: 100%">
                <el-option
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分组" prop="group_id">
              <el-select v-model="form.group_id" placeholder="请选择分组" style="width: 100%">
                <el-option
                  v-for="g in groupOptions"
                  :key="g.id"
                  :label="g.name"
                  :value="g.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作量(分钟)" prop="workload_minutes">
              <el-input-number
                v-model="form.workload_minutes"
                :min="0"
                :max="9999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section">
        <h4 class="section-title">详细信息</h4>
        <el-form-item label="前置条件">
          <el-input
            type="textarea"
            v-model="form.preconditions"
            placeholder="请输入前置条件"
            :rows="3"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="form.keywords"
            placeholder="多个关键词用逗号分隔"
            maxlength="200"
          />
        </el-form-item>
        <el-form-item label="预期结果">
          <el-input
            type="textarea"
            v-model="form.expected_result"
            placeholder="请输入预期结果"
            :rows="3"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-header">
          <h4 class="section-title">测试步骤</h4>
          <el-button type="primary" size="small" @click="addStep" class="add-step-btn">
            <el-icon><Plus /></el-icon>
            新增步骤
          </el-button>
        </div>

        <div class="steps-container">
          <div
            v-for="(step, index) in form.steps"
            :key="index"
            class="step-item"
          >
            <div class="step-header">
              <span class="step-number">步骤 {{ index + 1 }}</span>
              <el-button
                type="danger"
                size="small"
                text
                @click="removeStep(index)"
                class="remove-btn"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-input
                  v-model="step.action"
                  placeholder="操作描述"
                  maxlength="200"
                />
              </el-col>
              <el-col :span="6">
                <el-input
                  v-model="step.keyword"
                  placeholder="关键字"
                  maxlength="50"
                />
              </el-col>
              <el-col :span="6">
                <el-input
                  v-model="step.note"
                  placeholder="备注"
                  maxlength="100"
                />
              </el-col>
              <el-col :span="24" style="margin-top: 8px">
                <el-input
                  v-model="step.expected"
                  placeholder="预期结果"
                  maxlength="200"
                />
              </el-col>
            </el-row>
          </div>

          <div v-if="form.steps.length === 0" class="empty-steps">
            <el-empty
              description="暂无测试步骤"
              :image-size="80"
            >
              <el-button type="primary" @click="addStep">
                <el-icon><Plus /></el-icon>
                添加第一个步骤
              </el-button>
            </el-empty>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" size="large">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
          size="large"
        >
          {{ submitting ? '保存中...' : '确定' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { testCaseService } from '@/api/testCases'
import { caseGroupService } from '@/api/caseGroups'
import {
  TEST_CASE_PRIORITY_OPTIONS,
  TEST_CASE_TYPE_OPTIONS
} from '@/constants/testCase'

const props = defineProps({
  departmentId: Number
})

const visible = ref(false)
const mode = ref('create')
const submitting = ref(false)
const formRef = ref()

const form = ref({
  id: null,
  title: '',
  preconditions: '',
  steps: [],
  expected_result: '',
  keywords: '',
  priority: '',
  case_type: '',
  group_id: null,
  workload_minutes: 0,
  department_id: null
})

const rules = {
  title: [
    { required: true, message: '请输入用例标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  case_type: [
    { required: true, message: '请选择用例类型', trigger: 'change' }
  ],
  group_id: [
    { required: true, message: '请选择所属分组', trigger: 'change' }
  ]
}

const priorityOptions = TEST_CASE_PRIORITY_OPTIONS
const typeOptions = TEST_CASE_TYPE_OPTIONS
const groupOptions = ref([])

const emit = defineEmits(['success'])

const dialogTitle = computed(() => {
  if (mode.value === 'edit') return '编辑用例'
  if (mode.value === 'copy') return '复制用例'
  return '新建用例'
})

const flattenGroups = (nodes, arr = []) => {
  nodes.forEach(n => {
    if (n.type !== 'case') { // 只添加分组，不添加用例
      arr.push({ id: n.id, name: n.name })
      if (n.children && n.children.length) {
        flattenGroups(n.children, arr)
      }
    }
  })
  return arr
}

const loadGroups = async () => {
  if (!form.value.department_id) {
    groupOptions.value = []
    return
  }
  const resp = await caseGroupService.tree(form.value.department_id)
  if (resp.success) {
    groupOptions.value = flattenGroups(resp.data?.children || [])
  }
}

const addStep = () => {
  form.value.steps.push({
    action: '',
    keyword: '',
    note: '',
    expected: ''
  })
}

const removeStep = (index) => {
  form.value.steps.splice(index, 1)
}

const open = async (m = 'create', data = null) => {
  mode.value = m

  let detail = data
  if (data?.id) {
    const resp = await testCaseService.get(data.id)
    if (resp.success) {
      detail = resp.data
    }
  }

  form.value = {
    id: detail?.id || null,
    title: detail?.title || '',
    preconditions: detail?.preconditions || '',
    steps: Array.isArray(detail?.steps) ? detail.steps.map(s => ({ ...s })) : [],
    expected_result: detail?.expected_result || '',
    keywords: Array.isArray(detail?.keywords) ? detail.keywords.join(',') : (detail?.keywords || ''),
    priority: detail?.priority || '',
    case_type: detail?.case_type || '',
    group_id: detail?.group_id || null,
    workload_minutes: detail?.workload_minutes || 0,
    department_id: detail?.department_id || props.departmentId || null
  }

  visible.value = true
  loadGroups()
}

const parseKeywords = (val) => {
  if (!val) return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true

    let resp
    const payload = {
      title: form.value.title,
      preconditions: form.value.preconditions,
      steps: form.value.steps.map((s, idx) => ({
        no: idx + 1,
        action: s.action,
        keyword: s.keyword,
        note: s.note,
        expected: s.expected
      })),
      expected_result: form.value.expected_result,
      keywords: parseKeywords(form.value.keywords),
      priority: form.value.priority,
      case_type: form.value.case_type,
      group_id: form.value.group_id,
      workload_minutes: form.value.workload_minutes
    }

    if (mode.value === 'edit') {
      resp = await testCaseService.update(form.value.id, payload)
    } else {
      payload.department_id = form.value.department_id
      resp = await testCaseService.create(payload)
    }

    if (resp.success) {
      ElMessage.success(`${mode.value === 'edit' ? '更新' : '创建'}成功`)
      visible.value = false
      emit('success')
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.custom-dialog {
  border-radius: 12px;
}

.custom-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
}

.custom-dialog :deep(.el-dialog__title) {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.custom-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #fff;
  font-size: 20px;
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.case-form {
  margin: 0;
}

.form-section {
  margin-bottom: 32px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #409eff;
  margin-right: 8px;
  border-radius: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-step-btn {
  border-radius: 6px;
  font-weight: 500;
}

.steps-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
}

.step-item {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.step-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.step-item:last-child {
  margin-bottom: 0;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.step-number {
  color: #409eff;
  font-weight: 600;
  font-size: 14px;
}

.remove-btn {
  color: #f56c6c;
  padding: 4px 8px;
}

.remove-btn:hover {
  background-color: rgba(245, 108, 108, 0.1);
}

.empty-steps {
  text-align: center;
  padding: 40px 20px;
}

.dialog-footer {
  text-align: center;
  padding: 16px 0;
}

.dialog-footer .el-button {
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 500;
  margin: 0 8px;
}

/* 表单项样式优化 */
.case-form :deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
}

.case-form :deep(.el-input__inner) {
  border-radius: 6px;
}

.case-form :deep(.el-textarea__inner) {
  border-radius: 6px;
}

.case-form :deep(.el-select) {
  width: 100%;
}

.case-form :deep(.el-input-number) {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .custom-dialog {
    width: 95% !important;
    margin: 5vh auto;
  }

  .custom-dialog :deep(.el-dialog__body) {
    padding: 16px;
    max-height: 80vh;
  }

  .form-section {
    padding: 16px;
    margin-bottom: 20px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .step-item {
    padding: 12px;
  }

  .step-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>