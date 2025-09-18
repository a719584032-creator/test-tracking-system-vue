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

      <el-table-column label="类型" width="100" align="center">
        <template #default="{ row }">
          {{ TEST_CASE_TYPE_LABEL_MAP[row.case_type] || '-' }}
        </template>
      </el-table-column>

      <!-- 关键字列 -->
      <el-table-column label="关键字" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="keywords-container">
            <template v-if="row.keywords && row.keywords.length > 0">
              <el-tag
                v-for="(keyword, index) in getDisplayKeywords(row.keywords)"
                :key="index"
                size="small"
                type="info"
                class="keyword-tag"
              >
                {{ keyword }}
              </el-tag>
              <el-tooltip
                v-if="row.keywords.length > 3"
                :content="getAllKeywords(row.keywords)"
                placement="top"
              >
                <el-tag size="small" type="info" class="keyword-tag more-tag">
                  +{{ row.keywords.length - 3 }}
                </el-tag>
              </el-tooltip>
            </template>
            <span v-else class="no-keywords">-</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="更新人 / 时间" min-width="180">
        <template #default="{ row }">
          <div class="user-info">
            <div class="username">{{ row.updated_by || row.created_by || '-' }}</div>
            <div class="time-info">
              <el-icon><Timer /></el-icon>
              <span class="time-text">{{ formatDateTime(row.updated_at || row.created_at) || '-' }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 操作列：紧凑布局确保4个按钮都显示 -->
      <el-table-column label="操作" fixed="right" width="150" align="center">
        <template #default="{ row }">
          <div class="actions-compact">
            <el-tooltip content="编辑" placement="top" :show-after="800">
              <el-button size="small" type="primary" text @click="$emit('edit', row)">
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>

            <el-tooltip content="复制" placement="top" :show-after="800">
              <el-button size="small" text @click="$emit('copy', row)">
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </el-tooltip>

            <el-tooltip content="历史记录" placement="top" :show-after="800">
              <el-button size="small" text @click="$emit('history', row)">
                <el-icon><Clock /></el-icon>
              </el-button>
            </el-tooltip>

            <el-tooltip content="删除" placement="top" :show-after="800">
              <el-button size="small" type="danger" text @click="$emit('delete', row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
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
import { TEST_CASE_TYPE_LABEL_MAP } from '@/constants/testCase'
import { formatDateTime } from '@/utils/format'

defineProps({
  cases: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

defineEmits(['edit', 'copy', 'history', 'delete', 'create'])

// 映射优先级样式
const getPriorityTagType = (p) => {
  if (p === 'P0') return 'danger'
  if (p === 'P1') return 'warning'
  if (p === 'P2') return 'info'
  return ''
}

// 处理关键字显示逻辑
const getDisplayKeywords = (keywords) => {
  if (!keywords || !Array.isArray(keywords)) return []

  // 将所有关键字按逗号分割并去重
  const allKeywords = []
  keywords.forEach(keywordStr => {
    if (typeof keywordStr === 'string') {
      const splitKeywords = keywordStr.split(/[,，、]/).map(k => k.trim()).filter(k => k)
      allKeywords.push(...splitKeywords)
    }
  })

  // 去重并只显示前3个
  const uniqueKeywords = [...new Set(allKeywords)]
  return uniqueKeywords.slice(0, 3)
}

// 获取所有关键字用于tooltip显示
const getAllKeywords = (keywords) => {
  if (!keywords || !Array.isArray(keywords)) return ''

  const allKeywords = []
  keywords.forEach(keywordStr => {
    if (typeof keywordStr === 'string') {
      const splitKeywords = keywordStr.split(/[,，、]/).map(k => k.trim()).filter(k => k)
      allKeywords.push(...splitKeywords)
    }
  })

  const uniqueKeywords = [...new Set(allKeywords)]
  return uniqueKeywords.join(', ')
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

.empty-state {
  padding: 24px 0;
}

/* 关键字样式 */
.keywords-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.keyword-tag {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-tag {
  cursor: pointer;
  font-weight: 500;
}

.no-keywords {
  color: #c0c4cc;
  font-style: italic;
}

/* 超紧凑的操作按钮样式 - 确保4个按钮都能显示 */
.actions-compact {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  justify-content: center;
  width: 100%;
}

.actions-compact :deep(.el-button) {
  padding: 4px 6px !important;
  min-width: 32px;
  border-radius: 4px;
  margin: 0;
  flex-shrink: 0;
}

.actions-compact :deep(.el-button .el-icon) {
  font-size: 14px;
}

.actions-compact :deep(.el-button:hover) {
  background-color: var(--el-color-primary-light-9);
}

.actions-compact :deep(.el-button.el-button--danger:hover) {
  background-color: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.actions-compact :deep(.el-button.el-button--primary:hover) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .actions-compact :deep(.el-button) {
    padding: 3px 5px !important;
    min-width: 30px;
  }
}

@media (max-width: 768px) {
  .actions-compact {
    gap: 1px;
  }

  .actions-compact :deep(.el-button) {
    padding: 2px 4px !important;
    min-width: 28px;
  }

  .keywords-container {
    gap: 2px;
  }

  .keyword-tag {
    max-width: 60px;
  }
}
</style>
