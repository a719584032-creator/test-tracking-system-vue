// ================== src/constants/project.js ==================

// 默认的项目状态选项（可根据后端扩展）
export const PROJECT_STATUS_OPTIONS = [
  { label: '进行中', value: 'active' },
  { label: '未开始', value: 'pending' },
  { label: '暂停中', value: 'on_hold' },
  { label: '已完成', value: 'completed' },
  { label: '已归档', value: 'archived' },
  { label: '已停用', value: 'inactive' }
]

// 状态与显示文案映射
export const PROJECT_STATUS_LABEL_MAP = {
  active: '进行中',
  pending: '未开始',
  on_hold: '暂停中',
  completed: '已完成',
  archived: '已归档',
  inactive: '已停用',
  draft: '草稿'
}

// 状态与标签颜色映射（Element Plus Tag 类型）
export const PROJECT_STATUS_TAG_MAP = {
  active: 'success',
  completed: 'success',
  pending: 'warning',
  on_hold: 'warning',
  archived: 'info',
  draft: 'info',
  inactive: 'danger'
}

// 获取状态显示文案，带兜底逻辑
export const resolveProjectStatusLabel = (status, fallbackLabel) => {
  if (!status && !fallbackLabel) return '-'
  if (!status) return fallbackLabel
  return PROJECT_STATUS_LABEL_MAP[status] || fallbackLabel || status || '-'
}
