export const TEST_PLAN_STATUS_OPTIONS = [
  { label: '进行中', value: 'active' },
  { label: '待启动', value: 'pending' },
  { label: '挂起', value: 'on_hold' },
  { label: '已完成', value: 'completed' },
  { label: '已归档', value: 'archived' },
  { label: '已停用', value: 'inactive' }
]

export const TEST_PLAN_STATUS_TAG_MAP = {
  active: 'success',
  pending: 'info',
  on_hold: 'warning',
  completed: 'success',
  archived: 'info',
  inactive: 'danger'
}

export const EXECUTION_RESULT_OPTIONS = [
  { label: '待执行', value: 'pending' },
  { label: '通过', value: 'pass' },
  { label: '失败', value: 'fail' },
  { label: '阻塞', value: 'block' },
  { label: '跳过', value: 'skip' }
]

export const EXECUTION_RESULT_TAG_MAP = {
  pending: 'info',
  pass: 'success',
  fail: 'danger',
  block: 'warning',
  skip: ''
}

export const resolvePlanStatusLabel = (status) => {
  if (!status) return '未知状态'
  const item = TEST_PLAN_STATUS_OPTIONS.find((opt) => opt.value === status)
  return item ? item.label : status
}

export const resolveExecutionResultLabel = (result) => {
  if (!result) return '未执行'
  const item = EXECUTION_RESULT_OPTIONS.find((opt) => opt.value === result)
  return item ? item.label : result
}
