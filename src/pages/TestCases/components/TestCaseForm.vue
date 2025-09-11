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
        <el-input type="textarea" v-model="form.steps" />
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

const visible = ref(false)
const mode = ref('create')

const form = ref({
  id: null,
  title: '',
  preconditions: '',
  steps: '',
  expected_result: '',
  keywords: '',
  priority: '',
  case_type: '',
  group_id: null,
  workload_minutes: 0
})

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]
const typeOptions = [
  { label: '功能', value: 'functional' },
  { label: '性能', value: 'performance' }
]
const groupOptions = ref([])

const emit = defineEmits(['success'])

const dialogTitle = computed(() => {
  if (mode.value === 'edit') return '编辑用例'
  if (mode.value === 'copy') return '复制用例'
  return '新建用例'
})

const loadGroups = async () => {
  const resp = await testCaseService.groups()
  if (resp.success) {
    groupOptions.value = resp.data || []
  }
}

const open = (m = 'create', data = null) => {
  mode.value = m
  visible.value = true
  form.value = {
    id: data?.id || null,
    title: data?.title || '',
    preconditions: data?.preconditions || '',
    steps: data?.steps || '',
    expected_result: data?.expected_result || '',
    keywords: data?.keywords || '',
    priority: data?.priority || '',
    case_type: data?.case_type || '',
    group_id: data?.group_id || null,
    workload_minutes: data?.workload_minutes || 0
  }
  loadGroups()
}

const handleSubmit = async () => {
  let resp
  const payload = { ...form.value }
  if (mode.value === 'edit') {
    resp = await testCaseService.update(form.value.id, payload)
  } else if (mode.value === 'copy') {
    resp = await testCaseService.copy(form.value.id, payload)
  } else {
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
