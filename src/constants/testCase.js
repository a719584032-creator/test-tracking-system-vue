// src/constants/testCase.js

// 用例优先级选项
export const TEST_CASE_PRIORITY_OPTIONS = [
  { label: 'P0', value: 'P0' },
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
  { label: 'P3', value: 'P3' }
]

export const TEST_CASE_PRIORITY_LABEL_MAP = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3'
}

// 用例类型选项
export const TEST_CASE_TYPE_OPTIONS = [
  { label: '功能', value: 'functional' },
  { label: '性能', value: 'performance' },
  { label: '接口', value: 'api' }
]

export const TEST_CASE_TYPE_LABEL_MAP = {
  functional: '功能',
  performance: '性能',
  api: '接口'
}

// 用例状态选项
export const TEST_CASE_STATUS_OPTIONS = [
  { label: '有效', value: 'active' },
  { label: '废弃', value: 'deprecated' }
]

export const TEST_CASE_STATUS_LABEL_MAP = {
  active: '有效',
  deprecated: '废弃'
}

