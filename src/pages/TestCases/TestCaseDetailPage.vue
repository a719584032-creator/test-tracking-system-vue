<template>
  <div class="test-case-detail-page" v-if="caseData">
    <el-card>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="标题">{{ caseData.title }}</el-descriptions-item>
        <el-descriptions-item label="所属分组">{{ caseData.group?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="前置条件">{{ caseData.preconditions }}</el-descriptions-item>
        <el-descriptions-item label="关键词">{{ caseData.keywords?.join(', ') }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ priorityLabelMap[caseData.priority] || caseData.priority }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabelMap[caseData.status] || caseData.status }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ typeLabelMap[caseData.case_type] || caseData.case_type }}</el-descriptions-item>
        <el-descriptions-item label="预期结果">{{ caseData.expected_result }}</el-descriptions-item>
        <el-descriptions-item label="工作量">{{ caseData.workload_minutes }} 分钟</el-descriptions-item>
        <el-descriptions-item label="版本">{{ caseData.version }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ caseData.creator?.username }}</el-descriptions-item>
        <el-descriptions-item label="更新人">{{ caseData.updater?.username }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ caseData.created_at }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ caseData.updated_at }}</el-descriptions-item>
      </el-descriptions>

      <h3 style="margin-top:20px">步骤</h3>
      <el-table :data="caseData.steps" style="width:100%" v-if="caseData.steps && caseData.steps.length">
        <el-table-column prop="no" label="序号" width="60" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="keyword" label="关键字" />
        <el-table-column prop="note" label="备注" />
        <el-table-column prop="expected" label="预期结果" />
      </el-table>
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
import { ElMessageBox } from 'element-plus'
import { testCaseService } from '@/api/testCases'
import TestCaseForm from './components/TestCaseForm.vue'
import TestCaseHistory from './components/TestCaseHistory.vue'
import {
  TEST_CASE_PRIORITY_LABEL_MAP as priorityLabelMap,
  TEST_CASE_STATUS_LABEL_MAP as statusLabelMap,
  TEST_CASE_TYPE_LABEL_MAP as typeLabelMap
} from '@/constants/testCase'

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

try {
    await ElMessageBox.confirm('确认删除该用例吗？', '提示', { type: 'warning' })
    const resp = await testCaseService.remove(caseData.value.id)
    if (resp.success) {
      router.back()
    }
  } catch {}

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
