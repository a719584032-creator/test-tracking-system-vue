// src/constants/user.js
export const USER_ROLES = [
  { label: '系统管理员', value: 'sys_admin' },
  { label: '系统成员', value: 'sys_viewer' }
]

export const USER_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '启用', value: 'true' },
  { label: '禁用', value: 'false' }
]

export const ROLE_LABEL_MAP = {
  sys_admin: '系统管理员',
  sys_viewer: '系统观察员',
  // 兼容历史数据
  // admin: '系统管理员',
  // dept_admin: '部门管理员',
  // project_admin: '项目管理员',
  // user: '普通用户'
}
