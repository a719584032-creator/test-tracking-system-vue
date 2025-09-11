<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="600px">
    <el-form :model="form" label-width="100px">
      <el-form-item label="标题">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="前置条件">
        <el-input type="textarea" v-model="form.preconditions" />
      </el-form-item>
      <el-form-item label="步骤">
        <div class="steps">
          <div
            v-for="(step, index) in form.steps"
            :key="index"
            class="step-row"
          >
            <span class="step-no">{{ index + 1 }}</span>
            <el-input
              v-model="step.action"
              placeholder="操作"
              class="step-input"
            />
            <el-input
              v-model="step.keyword"
              placeholder="关键字"
              class="step-input"
            />
            <el-input
              v-model="step.note"
              placeholder="备注"
              class="step-input"
            />
            <el-input
              v-model="step.expected"
              placeholder="预期结果"
              class="step-input"
            />
            <el-button type="text" @click="removeStep(index)">删除</el-button>
          </div>
          <el-button type="primary" link @click="addStep">新增步骤</el-button>
        </div>
      </el-form-item>
      <el-form-item label="预期结果">
        <el-input type="textarea" v-model="form.expected_result" />
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="form.keywords" />
      </el-form-item>
      <el-form-item label="优先级">
        <el-select v-model="form.priority" placeholder="请选择">
          <el-option v-for="opt in priorityOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="用例类型">
        <el-select v-model="form.case_type" placeholder="请选择">
          <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属分组">
        <el-select v-model="form.group_id" placeholder="请选择">
          <el-option v-for="g in groupOptions" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="工作量(分钟)">
        <el-input-number v-model="form.workload_minutes" :min="0" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
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
    arr.push({ id: n.id, name: n.name })
    if (n.children && n.children.length) {
      flattenGroups(n.children, arr)
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
  form.value.steps.push({ action: '', keyword: '', note: '', expected: '' })
}
const removeStep = (index) => {
  form.value.steps.splice(index, 1)
}

const open = (m = 'create', data = null) => {
  mode.value = m
  visible.value = true
  form.value = {
    id: data?.id || null,
    title: data?.title || '',
    preconditions: data?.preconditions || '',
    steps: Array.isArray(data?.steps) ? data.steps.map(s => ({ ...s })) : [],
    expected_result: data?.expected_result || '',
    keywords: Array.isArray(data?.keywords) ? data.keywords.join(',') : (data?.keywords || ''),
    priority: data?.priority || '',
    case_type: data?.case_type || '',
    group_id: data?.group_id || null,
    workload_minutes: data?.workload_minutes || 0,
    department_id: data?.department_id || props.departmentId || null
  }
  loadGroups()
}

const parseKeywords = (val) => {
  if (!val) return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}
const handleSubmit = async () => {
  let resp
  if (mode.value === 'edit') {
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
    resp = await testCaseService.update(form.value.id, payload)
  } else if (mode.value === 'copy') {
    const payload = {
      title: form.value.title,
      group_id: form.value.group_id
    }
    resp = await testCaseService.copy(form.value.id, payload)
  } else {
    const payload = {
      department_id: form.value.department_id,
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
    resp = await testCaseService.create(payload)
  }
  if (resp.success) {
    ElMessage.success('操作成功')
    visible.value = false
    emit('success')
  }
}

defineExpose({ open })
</script>

<style scoped>
.steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.step-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.step-no {
  width: 20px;
  text-align: center;
}
.step-input {
  flex: 1;
}
</style>
