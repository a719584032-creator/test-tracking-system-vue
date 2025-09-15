<!-- src/pages/TestCases/components/TestCaseHistory.vue -->
<template>
  <el-drawer
    v-model="visible"
    title="用例历史记录"
    size="50%"
    class="history-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <h3 class="drawer-title">
          <el-icon><Clock /></el-icon>
          用例历史记录
        </h3>
        <el-tag type="info" size="small">{{ records.length }} 条记录</el-tag>
      </div>
    </template>

    <div class="history-content" v-loading="loading">
      <div v-if="records.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无历史记录" :image-size="120" />
      </div>

      <el-timeline v-else class="history-timeline">
        <el-timeline-item
          v-for="(item, index) in records"
          :key="item.id"
          :timestamp="formatTime(item.operated_at)"
          placement="top"
          :type="getTimelineType(item.change_type)"
          :size="index === 0 ? 'large' : 'normal'"
          :hollow="index !== 0"
        >
          <div class="timeline-card">
            <div class="card-header">
              <div class="action-info">
                <el-tag
                  :type="getActionTagType(item.change_type)"
                  size="small"
                  class="action-tag"
                >
                  {{ getActionLabel(item.change_type) }}
                </el-tag>
                <span class="version">v{{ item.version || '1.0' }}</span>
              </div>
              <div class="user-info">
                <el-avatar :size="24" class="user-avatar">
                  {{ (item.operator?.username || 'U')[0].toUpperCase() }}
                </el-avatar>
                <span class="username">{{ item.operator?.username || '未知用户' }}</span>
              </div>
            </div>

            <div class="card-content">
              <p class="summary">{{ item.change_summary }}</p>
              <div v-if="hasChangedFields(item)" class="changes-block">
                <h5 class="changes-title">变更字段：</h5>
                <div class="changes-list">
                  <div
                    v-for="(detail, field) in item.changed_fields"
                    :key="field"
                    class="change-item"
                  >
                    <el-tag size="small" class="change-tag">
                      {{ getFieldLabel(field) }}
                    </el-tag>
                    <template v-if="detail && (detail.new !== undefined || detail.old !== undefined)">
                      <span class="change-values">
                        <span class="old-value">{{ formatValue(detail.old) }}</span>
                        <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                        <span class="new-value">{{ formatValue(detail.new) }}</span>
                      </span>
                    </template>
                    <span v-else class="change-note">已修改</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { Clock, ArrowRight } from '@element-plus/icons-vue'
import { testCaseService } from '@/api/testCases'

const visible = ref(false)
const loading = ref(false)
const records = ref([])
const caseId = ref(null)

const fieldLabelMap = {
  title: '标题',
  priority: '优先级',
  status: '状态',
  case_type: '用例类型',
  preconditions: '前置条件',
  expected_result: '预期结果',
  keywords: '关键词',
  steps: '测试步骤',
  group_id: '所属分组',
  workload_minutes: '工作量'
}

const actionLabelMap = {
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  COPY: '复制',
  RESTORE: '恢复'
}

const fetchHistory = async () => {
  if (!caseId.value) return

  loading.value = true
  try {
    const resp = await testCaseService.history(caseId.value)
    if (resp.success) {
      records.value = resp.data?.items || []
    }
  } finally {
    loading.value = false
  }
}

const open = (id) => {
  caseId.value = id
  visible.value = true
  fetchHistory()
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const getTimelineType = (action) => {
  const map = {
    CREATE: 'success',
    UPDATE: 'primary',
    DELETE: 'danger',
    COPY: 'warning',
    RESTORE: 'info'
  }
  return map[action] || 'primary'
}

const getActionTagType = (action) => {
  const map = {
    CREATE: 'success',
    UPDATE: '',
    DELETE: 'danger',
    COPY: 'warning',
    RESTORE: 'info'
  }
  return map[action] || ''
}

const getActionLabel = (action) => {
  return actionLabelMap[action] || action
}

const getFieldLabel = (field) => {
  return fieldLabelMap[field] || field
}

const hasChangedFields = (item) => {
  return item.changed_fields && Object.keys(item.changed_fields).length > 0
}

const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  return String(value)
}

defineExpose({ open })
</script>

<style scoped>
.history-drawer :deep(.el-drawer__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.drawer-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.history-content {
  padding: 24px;
  height: calc(100vh - 120px);
  overflow-y: auto;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

.history-timeline {
  padding: 0;
}

.timeline-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.timeline-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.action-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-tag {
  font-weight: 600;
  border-radius: 12px;
  padding: 4px 12px;
}

.version {
  color: #909399;
  font-size: 12px;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.username {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.card-content {
  margin-bottom: 16px;
}

.card-content:last-child {
  margin-bottom: 0;
}

.summary {
  margin: 0 0 12px 0;
  color: #606266;
}

.changes-block {
  margin-top: 8px;
}

.changes-title {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.changes-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.change-tag {
  margin: 0;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.change-values {
  display: flex;
  align-items: center;
  gap: 4px;
}

.old-value {
  color: #909399;
  text-decoration: line-through;
}

.new-value {
  color: #303133;
  font-weight: 500;
}

.arrow-icon {
  font-size: 12px;
  color: #909399;
}

.change-note {
  color: #909399;
  font-size: 12px;
}

/* 时间轴样式优化 */
.history-timeline :deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
  font-weight: 500;
}

.history-timeline :deep(.el-timeline-item__node) {
  border-width: 2px;
}

.history-timeline :deep(.el-timeline-item__node--large) {
  width: 16px;
  height: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-drawer {
    width: 100% !important;
  }

  .history-content {
    padding: 16px;
  }

  .timeline-card {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .change-values {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .arrow-icon {
    transform: rotate(90deg);
  }
}
</style>
