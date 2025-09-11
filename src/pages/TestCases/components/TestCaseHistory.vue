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
          :timestamp="formatTime(item.created_at)"
          placement="top"
          :type="getTimelineType(item.action)"
          :size="index === 0 ? 'large' : 'normal'"
          :hollow="index !== 0"
        >
          <div class="timeline-card">
            <div class="card-header">
              <div class="action-info">
                <el-tag
                  :type="getActionTagType(item.action)"
                  size="small"
                  class="action-tag"
                >
                  {{ getActionLabel(item.action) }}
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

            <div class="card-content" v-if="item.changes && item.changes.length">
              <h5 class="changes-title">变更内容：</h5>
              <div class="changes-list">
                <div
                  v-for="change in item.changes"
                  :key="change.field"
                  class="change-item"
                >
                  <div class="field-name">{{ getFieldLabel(change.field) }}</div>
                  <div class="change-values">
                    <div class="old-value" v-if="change.old_value">
                      <span class="label">原值：</span>
                      <span class="value">{{ formatValue(change.old_value) }}</span>
                    </div>
                    <el-icon class="arrow-icon" v-if="change.old_value && change.new_value">
                      <ArrowRight />
                    </el-icon>
                    <div class="new-value" v-if="change.new_value">
                      <span class="label">新值：</span>
                      <span class="value">{{ formatValue(change.new_value) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-content" v-if="item.comment">
              <h5 class="comment-title">备注：</h5>
              <p class="comment-text">{{ item.comment }}</p>
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
  create: '创建',
  update: '更新',
  delete: '删除',
  copy: '复制',
  restore: '恢复'
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
    create: 'success',
    update: 'primary',
    delete: 'danger',
    copy: 'warning',
    restore: 'info'
  }
  return map[action] || 'primary'
}

const getActionTagType = (action) => {
  const map = {
    create: 'success',
    update: '',
    delete: 'danger',
    copy: 'warning',
    restore: 'info'
  }
  return map[action] || ''
}

const getActionLabel = (action) => {
  return actionLabelMap[action] || action
}

const getFieldLabel = (field) => {
  return fieldLabelMap[field] || field
}

const formatValue = (value) => {
  if (value === null || value === undefined) return '空'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? '是' : '否'
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

.changes-title, .comment-title {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.change-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid #409eff;
}

.field-name {
  color: #409eff;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
}

.change-values {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.old-value, .new-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.old-value .label {
  color: #f56c6c;
  font-weight: 500;
}

.new-value .label {
  color: #67c23a;
  font-weight: 500;
}

.old-value .value {
  background: #fef0f0;
  color: #f56c6c;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #fbc4c4;
}

.new-value .value {
  background: #f0f9ff;
  color: #67c23a;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #b3d8ff;
}

.arrow-icon {
  color: #909399;
  font-size: 14px;
}

.comment-text {
  margin: 0;
  color: #606266;
  line-height: 1.6;
  background: #f0f9ff;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
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
