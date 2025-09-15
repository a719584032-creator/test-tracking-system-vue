<!--src/pages/TestCases/TestCaseDetailPage.vue-->

<template>
  <div class="test-case-detail-page" v-if="caseData">
    <!-- 添加面包屑导航 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>
          <el-button
            type="text"
            @click="handleBack"
            class="back-btn"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </el-breadcrumb-item>
        <el-breadcrumb-item>测试用例管理</el-breadcrumb-item>
        <el-breadcrumb-item>用例详情</el-breadcrumb-item>
      </el-breadcrumb>
      <h2 class="page-title">{{ caseData.title }}</h2>
    </div>

    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">基本信息</span>
          <div class="header-actions">
            <el-tag
              :type="getStatusTagType(caseData.status)"
              size="large"
            >
              {{ statusLabelMap[caseData.status] || caseData.status }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border class="detail-descriptions">
        <el-descriptions-item label="标题" :span="2">
          <span class="case-title">{{ caseData.title }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="所属分组">
          <el-tag v-if="caseData.group?.path" type="info" size="small">
            {{ trimRoot(caseData.group.path) }}
          </el-tag>
          <span v-else class="text-placeholder">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag
            :type="getPriorityTagType(caseData.priority)"
            size="small"
          >
            {{ priorityLabelMap[caseData.priority] || caseData.priority }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag type="success" size="small">
            {{ typeLabelMap[caseData.case_type] || caseData.case_type }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="工作量">
          <span class="workload">{{ caseData.workload_minutes }} 分钟</span>
        </el-descriptions-item>
        <el-descriptions-item label="版本">
          <el-tag size="small">{{ caseData.version || 'v1.0' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          <span class="user-info">{{ caseData.creator?.username || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="更新人">
          <span class="user-info">{{ caseData.updater?.username || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          <span class="time-info">{{ formatTime(caseData.created_at) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="前置条件" :span="2">
          <div class="content-text">
            {{ caseData.preconditions || '无' }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="关键词" :span="2">
          <div class="keywords">
            <el-tag
              v-for="keyword in caseData.keywords"
              :key="keyword"
              size="small"
              class="keyword-tag"
            >
              {{ keyword }}
            </el-tag>
            <span v-if="!caseData.keywords?.length" class="text-placeholder">无</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="预期结果" :span="2">
          <div class="content-text expected-result">
            {{ caseData.expected_result || '无' }}
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 测试步骤 -->
    <el-card class="steps-card" v-if="caseData.steps && caseData.steps.length">
      <template #header>
        <span class="card-title">测试步骤</span>
      </template>
      <el-table
        :data="caseData.steps"
        style="width:100%"
        class="steps-table"
        :show-header="true"
      >
        <el-table-column prop="no" label="序号" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.no }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" min-width="200">
          <template #default="{ row }">
            <div class="step-content">{{ row.action || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="keyword" label="关键字" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.keyword" size="small">{{ row.keyword }}</el-tag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="150">
          <template #default="{ row }">
            <div class="step-content">{{ row.note || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="expected" label="预期结果" min-width="200">
          <template #default="{ row }">
            <div class="step-content expected">{{ row.expected || '-' }}</div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 操作按钮 -->
    <div class="actions">
      <el-button type="primary" @click="handleEdit">
        <el-icon><Edit /></el-icon>
        编辑
      </el-button>
      <el-button @click="handleCopy">
        <el-icon><CopyDocument /></el-icon>
        复制
      </el-button>
      <el-button @click="handleHistory">
        <el-icon><Clock /></el-icon>
        历史
      </el-button>
      <el-button type="danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
    </div>

    <test-case-form ref="formRef" :department-id="caseData.department_id" @success="fetchCase" />
    <test-case-history ref="historyRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, CopyDocument, Clock, Delete } from '@element-plus/icons-vue'
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
    historyRef.value?.open(id)
  }
}

const handleBack = () => {
  router.back()
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

// 工具函数
const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const trimRoot = (path) => {
  if (!path) return ''
  return path.replace(/^root\//, '')
}

const getStatusTagType = (status) => {
  const map = {
    'active': 'success',
    'inactive': 'info',
    'deprecated': 'warning'
  }
  return map[status] || 'info'
}

const getPriorityTagType = (priority) => {
  const map = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }
  return map[priority] || 'info'
}

onMounted(fetchCase)
</script>

<style scoped>
.test-case-detail-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.back-btn {
  color: #409eff;
  font-size: 14px;
  padding: 0;
}

.back-btn:hover {
  color: #66b1ff;
}

.page-title {
  margin: 12px 0 0 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.detail-card, .steps-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.detail-descriptions {
  background: #fff;
}

.case-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.text-placeholder {
  color: #909399;
  font-style: italic;
}

.user-info, .time-info {
  color: #606266;
}

.workload {
  color: #e6a23c;
  font-weight: 500;
}

.content-text {
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
}

.expected-result {
  background: #f0f9ff;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  margin: 0;
}

.steps-table {
  border-radius: 8px;
  overflow: hidden;
}

.step-content {
  line-height: 1.5;
  color: #606266;
}

.step-content.expected {
  background: #f0f9ff;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.actions .el-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-case-detail-page {
    padding: 16px;
  }

  .detail-descriptions {
    :deep(.el-descriptions__body .el-descriptions__table) {
      .el-descriptions__cell {
        padding: 8px;
      }
    }
  }

  .actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
