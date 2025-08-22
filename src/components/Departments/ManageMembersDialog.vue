<template>
  <el-dialog
    v-model="visible"
    :title="`成员管理 - ${currentDepartment?.name || ''}`"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 添加成员区域 -->
    <div class="add-member-section">
      <el-form :model="addMemberForm" inline @submit.prevent>
        <el-form-item label="选择用户">
          <el-select
            v-model="addMemberForm.user_id"
            placeholder="输入关键字搜索用户"
            filterable
            remote
            reserve-keyword
            :remote-method="handleRemoteQuery"
            :loading="userSearchLoading"
            style="width: 260px"
            :disabled="candidateDisabled"
            @visible-change="onUserSelectVisible"
            clearable
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="formatUserOption(user)"
              :value="user.id"
            />
            <template #empty>
              <div class="empty-tip">
                <span v-if="userSearchLoading">加载中...</span>
                <span v-else>无可添加的用户</span>
              </div>
            </template>
          </el-select>
        </el-form-item>

          <el-form-item label="角色">
            <el-select
              v-model="addMemberForm.role"
              placeholder="请选择角色"
              style="width: 150px"
            >
              <el-option
                v-for="role in DEPARTMENT_ROLES"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </el-form-item>

        <el-form-item>
          <el-checkbox v-model="addMemberForm.upsert">存在则更新</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="addingMember"
            :disabled="!addMemberForm.user_id"
            @click="handleAddMember"
          >
            添加成员
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-button :disabled="userSearchLoading" @click="reloadCandidates">
            刷新候选
          </el-button>
        </el-form-item>
      </el-form>
      <div class="helper-text">
        提示：下拉列表只显示尚未加入本部门的用户。输入关键字可筛选（用户名 / 邮箱 / 手机）。
      </div>
    </div>

    <!-- 成员列表 -->
    <div class="member-list-section">
      <el-table
        v-loading="loading"
        :data="memberList"
        stripe
        style="width: 100%"
        max-height="420px"
      >
        <el-table-column prop="user_id" label="用户ID" width="90" />
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="部门角色" min-width="150">
          <template #default="{ row }">
            <el-select
              v-model="row._newRole"
              size="small"
              :loading="row.roleLoading"
              style="width: 130px"
              @change="handleRoleChange(row)"
            >
              <el-option
                v-for="role in DEPARTMENT_ROLES"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="joined_at" label="加入时间" min-width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.joined_at || row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              :loading="row.removing"
              @click="handleRemoveMember(row)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="memberPagination.total > 0">
        <el-pagination
          v-model:current-page="memberPagination.page"
          v-model:page-size="memberPagination.pageSize"
          :total="memberPagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleMemberPageSizeChange"
          @current-change="handleMemberPageChange"
        />
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { departmentService } from '@/api/departments'
import { userService } from '@/api/users'
import { formatDateTime } from '@/utils/format'

/**
 * 若项目已有 constants/department.js 中的 DEPARTMENT_ROLES，请改为 import：
 * import { DEPARTMENT_ROLES } from '@/constants/department'
 * 并删除下面的常量定义。
 */
const DEPARTMENT_ROLES = [
  // 请替换为后端真实角色值；演示使用 member / admin
  { label: '普通成员', value: 'member' },
  { label: '部门管理员', value: 'admin' }
]

// 可添加成员候选禁用逻辑标记
const candidateDisabled = ref(false)

// 弹窗与当前部门
const visible = ref(false)
const currentDepartment = ref(null)

// 成员列表
const loading = ref(false)
const memberList = ref([])
const memberPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 缓存部门成员 user_id 集合用于过滤
const departmentMemberUserIds = ref(new Set())

// 添加成员表单
const addMemberForm = reactive({
  user_id: '',
  role: DEPARTMENT_ROLES[0]?.value || '',
  upsert: true
})
const addingMember = ref(false)

// 候选用户（远程搜索）
const userOptions = ref([])
const userSearchLoading = ref(false)
let searchDebounceTimer = null
let currentSearchRequestId = 0
let lastQuery = ''  // 保存最近一次查询

// 打开弹窗
const open = async (department) => {
  currentDepartment.value = department
  visible.value = true
  candidateDisabled.value = false
  await fetchMemberList()              // 先拿当前成员
  await loadCandidateUsers('')         // 初次加载空查询候选
}

const handleClose = () => {
  resetState()
}

function resetState() {
  visible.value = false
  currentDepartment.value = null
  memberList.value = []
  userOptions.value = []
  departmentMemberUserIds.value = new Set()
  Object.assign(addMemberForm, {
    user_id: '',
    role: DEPARTMENT_ROLES[0]?.value || '',
    upsert: true
  })
  Object.assign(memberPagination, { page: 1, pageSize: 20, total: 0 })
  lastQuery = ''
}

/**
 * 获取成员列表
 */
async function fetchMemberList() {
  if (!currentDepartment.value) return
  try {
    loading.value = true
    const params = {
      page: memberPagination.page,
      page_size: memberPagination.pageSize,
      order_by: 'joined_at desc'
    }
    const resp = await departmentService.listMembers(currentDepartment.value.id, params)
    if (!resp.success) {
      ElMessage.error(resp.message || '获取成员列表失败')
      return
    }
    const items = resp.data?.items || []
    memberList.value = items.map(m => ({
      // 假设接口返回：
      // id: membership id
      // user_id, username, email, role, joined_at
      ...m,
      _newRole: m.role,
      roleLoading: false,
      removing: false
    }))
    memberPagination.total = resp.data?.total || 0
    // 构建 user_id 集合
    departmentMemberUserIds.value = new Set(memberList.value.map(m => m.user_id))
  } catch (err) {
    console.error('获取成员列表失败:', err)
    ElMessage.error('获取成员列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 构建用户搜索参数（根据后端实际字段修改）
 */
function buildUserQueryParams(query) {
  // 下面示例：后端用户列表可用 username / email / phone / keyword 其中之一
  // 优先使用 keyword（若后端支持）
  const p = {
    page: 1,
    page_size: 50
  }
  // 如果后端是用 keyword：
  if (query) {
    p.keyword = query
  }
  // 如果后端只能用 username，可改为：
  // if (query) p.username = query
  return p
}

/**
 * 真正执行用户候选加载（不做防抖）
 */
async function loadCandidateUsers(query) {
  if (!currentDepartment.value) return
  const requestId = ++currentSearchRequestId
  userSearchLoading.value = true
  try {
    // 获取用户列表
    const userParams = buildUserQueryParams(query)
    const [usersResp] = await Promise.all([
      userService.getList(userParams)
    ])
    if (requestId !== currentSearchRequestId) {
      // 过期响应
      return
    }
    if (!usersResp.success) {
      userOptions.value = []
      return
    }
    const rawUsers = usersResp.data?.items || []
    // 过滤掉已在部门的
    const filtered = rawUsers.filter(u => !departmentMemberUserIds.value.has(u.id))
    userOptions.value = filtered
  } catch (err) {
    if (requestId === currentSearchRequestId) {
      console.error('加载候选用户失败:', err)
      userOptions.value = []
    }
  } finally {
    if (requestId === currentSearchRequestId) {
      userSearchLoading.value = false
    }
  }
}

/**
 * 远程搜索入口（带防抖）
 */
function handleRemoteQuery(query) {
  lastQuery = query
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    // 允许空查询（加载第一页）
    loadCandidateUsers(query.trim())
  }, 300)
}

/**
 * 下拉展开时若为空并且还没加载过，则加载一次默认候选
 */
function onUserSelectVisible(shown) {
  if (shown && userOptions.value.length === 0 && !userSearchLoading.value) {
    handleRemoteQuery(lastQuery || '')
  }
}

function reloadCandidates() {
  handleRemoteQuery(lastQuery || '')
}

function formatUserOption(u) {
  return `${u.username || ''}${u.email ? ' (' + u.email + ')' : ''}`
}

/**
 * 添加成员
 */
async function handleAddMember() {
  if (!addMemberForm.user_id) {
    ElMessage.warning('请选择用户')
    return
  }
  if (!currentDepartment.value) {
    ElMessage.error('部门信息缺失')
    return
  }
  try {
    addingMember.value = true
    const payload = {
      user_id: addMemberForm.user_id,
      role: addMemberForm.role,
      upsert: addMemberForm.upsert
    }
    const resp = await departmentService.addMember(currentDepartment.value.id, payload)
    if (!resp.success) {
      ElMessage.error(resp.message || '添加成员失败')
      return
    }
    ElMessage.success('成员添加成功')
    // 重置选择
    addMemberForm.user_id = ''
    // 刷新成员列表 与 候选
    await fetchMemberList()
    reloadCandidates()
  } catch (err) {
    console.error('添加成员失败:', err)
    ElMessage.error('添加成员失败')
  } finally {
    addingMember.value = false
  }
}

/**
 * 修改成员角色
 */
async function handleRoleChange(member) {
  if (member._newRole === member.role) return
  const old = member.role
  member.roleLoading = true
  try {
    const resp = await departmentService.updateMemberRole(member.id, { role: member._newRole })
    if (!resp.success) {
      ElMessage.error(resp.message || '修改角色失败')
      member._newRole = old
      return
    }
    member.role = member._newRole
    ElMessage.success('角色修改成功')
  } catch (err) {
    console.error('修改角色失败:', err)
    ElMessage.error('修改角色失败')
    member._newRole = old
  } finally {
    member.roleLoading = false
  }
}

/**
 * 移除成员
 */
async function handleRemoveMember(member) {
  try {
    await ElMessageBox.confirm(
      `确定要将用户 "${member.username}" 从部门中移除吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
          cancelButtonText: '取消',
        type: 'warning'
      }
    )
    member.removing = true
    const resp = await departmentService.removeMember(member.id)
    if (!resp.success) {
      ElMessage.error(resp.message || '移除成员失败')
      return
    }
    ElMessage.success('成员移除成功')
    await fetchMemberList()
    reloadCandidates()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('移除成员失败:', err)
      ElMessage.error('移除成员失败')
    }
  } finally {
    member.removing = false
  }
}

/**
 * 成员分页
 */
function handleMemberPageChange(p) {
  memberPagination.page = p
  fetchMemberList().then(() => reloadCandidates())
}

function handleMemberPageSizeChange(s) {
  memberPagination.pageSize = s
  memberPagination.page = 1
  fetchMemberList().then(() => reloadCandidates())
}

defineExpose({ open })
</script>

<style scoped>
.add-member-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}
.helper-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
.member-list-section {
  margin-top: 8px;
}
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.empty-tip {
  padding: 12px 0;
  color: #999;
  font-size: 13px;
  text-align: center;
}
:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
  margin-bottom: 8px;
}
</style>