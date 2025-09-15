<!-- src/pages/TestCases/components/TestCaseTable.vue -->
<template>
  <div class="test-case-table">
    <el-table
      :data="cases"
      v-loading="loading"
      style="width: 100%"
      class="custom-table"
      :row-key="row => row.id"
      :header-cell-style="{ background: '#f8f9fa', color: '#606266', fontWeight: '600' }"
      stripe
    >
      <el-table-column label="标题" min-width="260" show-overflow-tooltip>
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

      <el-table-column prop="priority" label="优先级" width="92" align="center">
        <template #default="{ row }">
          <el-tag :type="getPriorityTagType(row.priority)" size="small">
            {{ row.priority || '-' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="92" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '有效' : '废弃' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="case_type" label="类型" width="100" align="center" />

      <el-table-column label="更新人 / 时间" min-width="180">
        <template #default="{ row }">
          <div class="user-info">
            <div class="username">{{ row.updated_by || row.created_by || '-' }}</div>
            <div class="time-info">
              <el-icon><Timer /></el-icon>
              <span class="time-text">{{ row.updated_at || row.created_at || '-' }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 操作列：固定在右侧，按钮紧凑、始终不换行 -->
      <el-table-column label="操作" fixed="right" min-width="280" align="center">
        <template #default="{ row }">
          <div class="actions">
            <el-button size="small" type="primary" text @click="$emit('edit', row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button size="small" text @click="$emit('copy', row)">
              <el-icon><DocumentCopy /></el-icon> 复制
            </el-button>
            <el-button size="small" text @click="$emit('history', row)">
              <el-icon><Clock /></el-icon> 历史
            </el-button>
            <el-button size="small" type="danger" text @click="$emit('delete', row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <div v-if="!loading && (!cases || cases.length === 0)" class="empty-state">
      <el-empty description="暂无用例数据" :image-size="120">
        <el-button type="primary" @click="$emit('create')">
          <el-icon><Plus /></el-icon>
          创建第一个用例
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { Document, Edit, Delete, Plus, Clock, Timer, DocumentCopy } from '@element-plus/icons-vue'
defineProps({
  cases: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

// 映射优先级样式
const getPriorityTagType = (p) => {
  if (p === 'P0') return 'danger'
  if (p === 'P1') return 'warning'
  if (p === 'P2') return 'info'
  return ''
}
</script>

<style scoped>
.custom-table :deep(.el-table__cell) {
  font-size: 13px;
}

.case-title-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1f6feb;
  text-decoration: none;
}

.title-icon {
  color: #909399;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap; /* 关键：一行展示不换行 */
}

.empty-state {
  padding: 24px 0;
}

/* 响应式：窄屏时缩紧列宽 */
@media (max-width: 768px) {
  .actions { gap: 2px; }
}
</style>
