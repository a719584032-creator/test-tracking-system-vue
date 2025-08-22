// src/constants/user.js
export const USER_ROLES = [
  { label: '系统管理员', value: 'admin' },
  { label: '部门管理员', value: 'dept_admin' },
  { label: '项目管理员', value: 'project_admin' },
  { label: '普通用户', value: 'user' }
]

export const USER_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '启用', value: 'true' },
  { label: '禁用', value: 'false' }
]

export const ROLE_LABEL_MAP = {
  admin: '系统管理员',
  dept_admin: '系统管理员',
  project_admin: '系统管理员',
  user: '普通用户',
}
