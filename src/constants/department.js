// src/constants/department.js

// 部门状态选项
export const DEPARTMENT_STATUS_OPTIONS = [
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'inactive' }
]

// 部门状态标签映射
export const DEPARTMENT_STATUS_LABEL_MAP = {
  active: '正常',
  inactive: '禁用'
}

// 部门内角色选项（注意：这是部门内的角色，不是系统用户角色）
export const DEPARTMENT_ROLES = [
  { label: '普通成员', value: 'dept_member' },
  { label: '项目管理员', value: 'dept_project_admin' },
  { label: '部门管理员', value: 'dept_admin' }
]

// 部门角色标签映射
export const DEPARTMENT_ROLE_LABEL_MAP = {
  member: '普通成员',
  project_admin: '项目管理员',
  admin: '部门管理员'
}

// 成员状态选项（预留）
export const MEMBER_STATUS_OPTIONS = [
  { label: '正常', value: true },
  { label: '禁用', value: false }
]