<!-- src/pages/TestCases/components/TestCaseTable.vue -->
<template>
  <div class="test-case-table">
    <el-table
      :data="cases"
      v-loading="loading"
      style="width: 100%"
      class="custom-table"
      :header-cell-style="{ background: '#f8f9fa', color: '#606266', fontWeight: '600' }"
      stripe
    >
      <el-table-column label="标题" min-width="250">
        <template #default="{ row }">
          <router-link
            class="case-title-link"
            :to="{ name: 'TestCaseDetail', params: { id: row.id } }"
          >
            <el-icon class="title-icon"><Document /></el-icon>
            {{ row.title }}
          </router-link>
        </template>
      </el-table-column>

      <el-table-column prop="priority" label="优先级" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="getPriorityTagType(row.priority)"
            size="small"
            class="priority-tag"
          >
            {{ priorityLabelMap[row.priority] || row.priority }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="getStatusTagType(row.status)"
            size="small"
            class="status-tag"
          >
            {{ statusLabelMap[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="case_type" label="类型" width="120" align="center">
        <template #default="{ row }">
          <el-tag
            type="success"
            size="small"
            class="type-tag"
          >
            {{ typeLabelMap[row.case_type] || row.case_type }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="创建人" width="120" align="center">
        <template #default="{ row }">
          <div class="user-info">
            <el-avatar :size="24" class="user-avatar">
              {{ (row.creator?.username || 'U')[0].toUpperCase() }}
            </el-avatar>
            <span class="username">{{ row.creator?.username || '-' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="created_at" label="创建时间" width="180" align="center">
        <template #default="{ row }">
          <div class="time-info">
            <el-icon class="time-icon"><Clock /></el-icon>
            {{ formatTime(row.created_at) }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="260" align="center" fixed="right">
        <template #default="{ row }">
          <div class="actions">
            <el-button
              size="small"
              type="primary"
              @click="$emit('edit', row)"
              class="action-btn"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              size="small"
              @click="$emit('copy', row)"
              class="action-btn"
            >
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
            <el-button
              size="small"
              @click="$emit('history', row)"
              class="action-btn"
            >
              <el-icon><Clock /></el-icon>
              历史
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="$emit('delete', row)"
              class="action-btn"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <div v-if="!loading && (!cases || cases.length === 0)" class="empty-state">
      <el-empty
        description="暂无用例数据"
        :image-size="120"
      >
        <el-button type="primary" @click="$emit('create')">
          <el-icon><Plus /></el-icon>
          创建第一个用例
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import {
  Document,
  Edit,
  CopyDocument,
  Clock,
  Delete,
  Plus
} from '@element-plus/icons-vue'
import {
  TEST_CASE_PRIORITY_LABEL_MAP as priorityLabelMap,
  TEST_CASE_STATUS_LABEL_MAP as statusLabelMap,
  TEST_CASE_TYPE_LABEL_MAP as typeLabelMap
} from '@/constants/testCase'

defineProps({
  cases: Array,
  loading: Boolean
})

defineEmits(['edit', 'copy', 'delete', 'history', 'create'])

// 工具函数
const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleDateString('zh-CN')
}

const getPriorityTagType = (priority) => {
  const map = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }
  return map[priority] || 'info'
}

const getStatusTagType = (status) => {
  const map = {
    'active': 'success',
    'inactive': 'info',
    'deprecated': 'warning'
  }
  return map[status] || 'info'
}
</script>

<style scoped>
.test-case-table {
  flex: 1;
  overflow: hidden;
}

.custom-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.case-title-link {
  display: flex;
  align-items: center;
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.case-title-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.title-icon {
  margin-right: 8px;
  font-size: 16px;
}

.priority-tag, .status-tag, .type-tag {
  font-weight: 500;
  border-radius: 12px;
  padding: 4px 8px;
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
  font-size: 13px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
}

.time-icon {
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  min-width: 60px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

/* 表格行悬停效果 */
.custom-table :deep(.el-table__row:hover) {
  background-color: #f8f9fa !important;
}

/* 表格边框优化 */
.custom-table :deep(.el-table__border-left-patch) {
  background: #f8f9fa;
}

.custom-table :deep(.el-table__fixed-right) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .actions {
    flex-direction: column;
    gap: 2px;
  }

  .action-btn {
    width: 100%;
    min-width: auto;
  }

  .user-info {
    flex-direction: column;
    gap: 4px;
  }

  .username {
    font-size: 12px;
  }
}
</style>
