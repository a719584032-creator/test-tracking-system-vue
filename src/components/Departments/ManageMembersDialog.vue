<template>
  <el-dialog
    v-model="visible"
    :title="`添加成员 - ${currentDepartment?.name || ''}`"
    width="1000px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-form :model="filters" inline @submit.prevent>
        <el-form-item label="用户名">
          <el-input
            v-model="filters.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
            style="width:180px"
          />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="filters.email"
            placeholder="请输入邮箱"
            clearable
            @keyup.enter="handleSearch"
            style="width:200px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="filters.phone"
            placeholder="请输入手机号"
            clearable
            @keyup.enter="handleSearch"
            style="width:180px"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="selectedRole" placeholder="选择角色" style="width:160px">
            <el-option
              v-for="r in DEPARTMENT_ROLES"
              :key="r.value"
              :label="r.label"
              :value="r.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loadingCandidates" @click="handleSearch">搜索</el-button>
        </el-form-item>
        <el-form-item>
          <el-button :disabled="loadingCandidates" @click="resetFilters">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button
            type="success"
            :disabled="selectedUsers.length === 0 || addingBatch"
            :loading="addingBatch"
            @click="handleBatchAdd"
          >
            添加已选 ({{ selectedUsers.length }})
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button :disabled="loadingCandidates" @click="refreshCandidates">刷新候选</el-button>
        </el-form-item>
      </el-form>
      <div class="helper-text">
        显示的为尚未加入该部门的用户。可通过用户名 / 邮箱 / 手机号筛选。勾选后批量添加。
        <span v-if="approxTotal !== null" class="approx-total">约可添加总数：{{ approxTotal }}</span>
      </div>
    </div>

    <!-- 候选用户表 -->
    <el-table
      v-loading="loadingCandidates"
      :data="candidateList"
      stripe
      style="width: 100%"
      max-height="520px"
      @selection-change="onSelectionChange"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column prop="id" label="ID" width="90" sortable />
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column prop="email" label="邮箱" min-width="200">
        <template #default="{ row }">
          {{ row.email || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" min-width="140">
        <template #default="{ row }">
          {{ row.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="candidatePagination.total > 0">
      <el-pagination
        v-model:current-page="candidatePagination.page"
        v-model:page-size="candidatePagination.pageSize"
        :total="candidatePagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleCandidatePageSizeChange"
        @current-change="handleCandidatePageChange"
      />
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button :disabled="addingBatch" @click="handleClose">关闭</el-button>
        <el-button
          type="success"
          :disabled="selectedUsers.length === 0 || addingBatch"
          :loading="addingBatch"
          @click="handleBatchAdd"
        >
          添加已选 ({{ selectedUsers.length }})
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { departmentService } from '@/api/departments'
import { userService } from '@/api/users'
import { formatDateTime } from '@/utils/format'

// 角色常量（按需调整或移除）
const DEPARTMENT_ROLES = [
  { label: '普通成员', value: 'member' },
  { label: '部门管理员', value: 'admin' }
]

// 对话框状态
const visible = ref(false)
const currentDepartment = ref(null)

// 部门成员 ID 集合
const departmentMemberIds = ref(new Set()) // Set<userId>

// 候选用户列表与分页
const candidateList = ref([])
const candidatePagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0 // 这里 total 表示“当前过滤结果中未加入成员的估算总数”
})

// 估算总数（approximate）
const approxTotal = ref(null)

// 筛选表单
const filters = reactive({
  username: '',
  email: '',
  phone: ''
})

// 角色（批量添加使用同一角色）
const selectedRole = ref(DEPARTMENT_ROLES[0]?.value || '')

// 加载状态
const loadingMembers = ref(false)        // 获取已加入成员
const loadingCandidates = ref(false)     // 拉取候选（用户）
const addingBatch = ref(false)           // 批量添加中

// 已勾选用户
const selectedUsers = ref([])

// 打开
const open = async (department) => {
  currentDepartment.value = department
  visible.value = true
  resetPagination()
  selectedUsers.value = []
  await loadDepartmentMembers()
  await fetchCandidateUsers()
}

const handleClose = () => {
  resetState()
}

function resetState() {
  visible.value = false
  currentDepartment.value = null
  departmentMemberIds.value = new Set()
  candidateList.value = []
  resetFilters()
  resetPagination()
  selectedUsers.value = []
  approxTotal.value = null
}

function resetPagination() {
  candidatePagination.page = 1
  candidatePagination.pageSize = 20
  candidatePagination.total = 0
}

function resetFilters() {
  filters.username = ''
  filters.email = ''
  filters.phone = ''
}

/**
 * 获取部门已加入成员（仅需 ID）
 */
async function loadDepartmentMembers() {
  if (!currentDepartment.value) return
  loadingMembers.value = true
  try {
    // 根据后端分页策略，这里循环取所有成员或假设 page_size 足够大
    // 简单实现：一次取 1 页（如果成员可能很多，可追加循环）
    const params = { page: 1, page_size: 1000 }
    const resp = await departmentService.listMembers(currentDepartment.value.id, params)
    if (resp?.success) {
      const items = resp.data?.items || []
      departmentMemberIds.value = new Set(items.map(i => i.id ?? i.user_id))
    } else {
      departmentMemberIds.value = new Set()
    }
  } catch (err) {
    console.error('加载部门成员失败', err)
    departmentMemberIds.value = new Set()
  } finally {
    loadingMembers.value = false
  }
}

/**
 * 构建用户列表查询参数
 */
function buildUserListParams() {
  const p = {
    page: candidatePagination.page,
    page_size: candidatePagination.pageSize
  }
  if (filters.username) p.username = filters.username
  if (filters.email) p.email = filters.email
  if (filters.phone) p.phone = filters.phone
  return p
}

/**
 * 拉取候选用户（过滤掉已在部门的）
 * 包含“如果当前页数据全被过滤则尝试翻页”逻辑
 */
async function fetchCandidateUsers(tryDepth = 0) {
  if (!currentDepartment.value) return
  loadingCandidates.value = true
  try {
    const params = buildUserListParams()
    const resp = await userService.getList(params)
    if (!resp?.success) {
      candidateList.value = []
      candidatePagination.total = 0
      approxTotal.value = 0
      return
    }
    const raw = resp.data?.items || []
    // 过滤掉已在部门的
    const filtered = raw.filter(u => !departmentMemberIds.value.has(u.id ?? u.user_id))
    // 如果这一页全被过滤掉，并且还有可能存在更多可用数据，尝试下一页
    if (filtered.length === 0 && raw.length > 0 && tryDepth < 5) {
      candidatePagination.page += 1
      await fetchCandidateUsers(tryDepth + 1)
      return
    }
    candidateList.value = filtered.map(normUser)

    // 估算总数（不精确）：后端总用户数 - 已在成员数（未考虑筛选条件差异）
    const totalUsers = resp.data?.total ?? 0
    approxTotal.value = totalUsers - departmentMemberIds.value.size
    if (approxTotal.value < 0) approxTotal.value = 0

    // 分页 total：用 approxTotal（更贴合“可用”）
    candidatePagination.total = approxTotal.value

    // 如果当前页数据为空且 page>1（可能超过最后一页），回退一页再试
    if (candidateList.value.length === 0 && candidatePagination.page > 1 && tryDepth < 5) {
      candidatePagination.page -= 1
      await fetchCandidateUsers(tryDepth + 1)
    }
    // 自动清理已在成员中但仍留在勾选的用户（比如刚被添加后刷新）
    pruneSelections()
  } catch (err) {
    console.error('获取候选用户失败', err)
    if (tryDepth === 0) {
      ElMessage.error('获取候选用户失败')
    }
    candidateList.value = []
  } finally {
    loadingCandidates.value = false
  }
}

function normUser(u) {
  return {
    id: u.id ?? u.user_id,
    username: u.username,
    email: u.email,
    phone: u.phone,
    created_at: u.created_at
  }
}

/**
 * 执行搜索（回到第一页）
 */
function handleSearch() {
  candidatePagination.page = 1
  fetchCandidateUsers()
}

function refreshCandidates() {
  fetchCandidateUsers()
}

/**
 * 勾选变化
 */
function onSelectionChange(rows) {
  selectedUsers.value = rows
}

/**
 * 移除失效勾选（已经变成部门成员或不在当前候选列表）
 */
function pruneSelections() {
  const currentIds = new Set(candidateList.value.map(i => i.id))
  selectedUsers.value = selectedUsers.value.filter(r => currentIds.has(r.id))
}

/**
 * 分页事件
 */
function handleCandidatePageChange(p) {
  candidatePagination.page = p
  fetchCandidateUsers()
}
function handleCandidatePageSizeChange(s) {
  candidatePagination.pageSize = s
  candidatePagination.page = 1
  fetchCandidateUsers()
}

/**
 * 批量添加
 * 若无批量接口：逐条调用
 */
async function handleBatchAdd() {
  if (selectedUsers.value.length === 0) return
  if (!currentDepartment.value) {
    ElMessage.error('部门信息缺失')
    return
  }
  addingBatch.value = true
  try {
    const users = [...selectedUsers.value]
    const results = await sequentialAddMembers(users, selectedRole.value)
    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount
    if (successCount > 0) {
      ElMessage.success(`添加成功 ${successCount} 人${failCount ? '，失败 ' + failCount + ' 人' : ''}`)
    } else {
      ElMessage.error('成员添加全部失败')
    }
    // 刷新成员集合与候选
    await loadDepartmentMembers()
    // 清空勾选
    selectedUsers.value = []
    await fetchCandidateUsers()
  } catch (err) {
    console.error('批量添加失败', err)
    ElMessage.error('批量添加失败')
  } finally {
    addingBatch.value = false
  }
}

/**
 * 顺序添加（可改为 Promise.allSettled，顺序便于失败时控制节奏）
 */
async function sequentialAddMembers(users, role) {
  const results = []
  for (const u of users) {
    try {
      const payload = {
        user_id: u.id,
        role,
        upsert: true
      }
      const resp = await departmentService.addMember(currentDepartment.value.id, payload)
      results.push({ id: u.id, success: !!resp?.success, message: resp?.message })
    } catch (e) {
      results.push({ id: u.id, success: false, message: e?.message })
    }
  }
  return results
}

defineExpose({ open })
</script>

<style scoped>
.filter-bar {
  margin-bottom: 16px;
  padding: 14px 16px 8px;
  background: #f5f7fa;
  border-radius: 6px;
}
.helper-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.approx-total {
  color: #333;
  font-weight: 500;
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
:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
  margin-bottom: 8px;
}
</style>