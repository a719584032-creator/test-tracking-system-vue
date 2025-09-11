<template>
  <div class="test-case-detail-page" v-if="caseData">
    <el-card>
      <h2>{{ caseData.title }}</h2>
      <p><strong>前置条件：</strong>{{ caseData.preconditions }}</p>
      <p><strong>步骤：</strong>{{ caseData.steps }}</p>
      <p><strong>预期结果：</strong>{{ caseData.expected_result }}</p>
      <p><strong>关键词：</strong>{{ caseData.keywords }}</p>
      <p><strong>优先级：</strong>{{ caseData.priority }}</p>
      <p><strong>类型：</strong>{{ caseData.case_type }}</p>
      <p><strong>工作量：</strong>{{ caseData.workload_minutes }} 分钟</p>
    </el-card>
    <div class="actions">
      <el-button type="primary" @click="handleEdit">编辑</el-button>
      <el-button @click="handleCopy">复制</el-button>
      <el-button type="danger" @click="handleDelete">删除</el-button>
      <el-button @click="handleHistory">历史</el-button>
    </div>
    <test-case-form ref="formRef" :department-id="caseData.department_id" @success="fetchCase" />
    <test-case-history ref="historyRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { testCaseService } from '@/api/testCases'
import TestCaseForm from './components/TestCaseForm.vue'
import TestCaseHistory from './components/TestCaseHistory.vue'

const route = useRoute()
const router = useRouter()
const caseData = ref(null)

const formRef = ref()
const historyRef = ref()

const fetchCase = async () => {
  const id = route.params.id
  const resp = await testCaseService.get(id)
  if (resp.success) {
    caseData.value = resp.data
  }
}

const handleEdit = () => formRef.value?.open('edit', caseData.value)
const handleCopy = () => formRef.value?.open('copy', caseData.value)
const handleDelete = async () => {
  const resp = await testCaseService.remove(caseData.value.id)
  if (resp.success) {
    router.back()
  }
}
const handleHistory = () => {
  historyRef.value?.open(caseData.value.id)
}

onMounted(fetchCase)
</script>

<style scoped>
.test-case-detail-page {
  padding: 20px;
}
.actions {
  margin-top: 20px;
}
.actions .el-button {
  margin-right: 10px;
}
</style>
