<!-- src/pages/Users/UserManagePage.vue -->
<template>
  <div class="user-manage-page">
    <div class="toolbar">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item>
          <el-input
            v-model.trim="queryForm.keyword"
            placeholder="搜索用户名"
            clearable
            @keyup.enter="onSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="queryForm.role"
            placeholder="角色"
            clearable
            style="width: 120px"
          >
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="queryForm.enabled"
            placeholder="状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" value="true" />
            <el-option label="禁用" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar-actions">
        <el-button
          type="success"
          @click="showAdd = true"
          :disabled="!isAdmin"
        >
          <el-icon><Plus /></el-icon> 添加用户
        </el-button>
      </div>
    </div>

    <el-table
      :data="store.list"
      v-loading="store.loading"
      border
      size="small"
      style="width: 100%"
      :row-class-name="rowClass"
    >
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column label="角色" width="110">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
            {{ roleLabel(row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            :disabled="!isAdmin || row.username === 'admin'"
            size="small"
            inline-prompt
            active-text="启"
            inactive-text="禁"
            @change="val => onToggle(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="170">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-space wrap>
            <el-button
              size="small"
              type="primary"
              link
              @click="onResetPwd(row)"
              :disabled="!isAdmin"
            >重置密码</el-button>
            <el-button
              size="small"
              type="danger"
              link
              @click="onDelete(row)"
              :disabled="!isAdmin || row.username === 'admin'"
            >删除</el-button>
          </el-space>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="store.total"
        :current-page="store.query.page"
        :page-size="store.query.pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>

    <AddUserDialog
      v-model="showAdd"
      @success="onAddSuccess"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUsersStore } from '@/stores/modules/users'
import { useAuthStore } from '@/stores/modules/auth' // 假设已存在
import AddUserDialog from '@/components/Users/AddUserDialog.vue'
import { ROLE_LABEL_MAP } from '@/constants/user'
import { useUsersTable } from '@/composables/useUsersTable'
import { Search, Plus } from '@element-plus/icons-vue'

const store = useUsersStore()
useUsersTable()

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.role === 'admin')

const queryForm = reactive({
  keyword: '',
  role: '',
  enabled: ''
})

function onSearch() {
  store.fetchList({ ...queryForm, page: 1 })
}

function onReset() {
  queryForm.keyword = ''
  queryForm.role = ''
  queryForm.enabled = ''
  onSearch()
}

function onPageChange(p) {
  store.fetchList({ page: p })
}
function onSizeChange(size) {
  store.fetchList({ pageSize: size, page: 1 })
}

function roleLabel(role) {
  return ROLE_LABEL_MAP[role] || role
}

function formatTime(t) {
  if (!t) return '-'
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function onToggle(row, val) {
  try {
    await store.switchStatus(row.id, val)
    ElMessage.success(val ? '已启用' : '已禁用')
  } catch (e) {
    ElMessage.error(e.message || '状态切换失败')
  }
}

async function onDelete(row) {
  await ElMessageBox.confirm(`确认删除用户「${row.username}」？`, '提示', {
    type: 'warning'
  })
  try {
    await store.removeUser(row.id)
    ElMessage.success('删除成功')
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

async function onResetPwd(row) {
  await ElMessageBox.confirm(`确认重置用户「${row.username}」密码？`, '提示', {
    type: 'warning'
  })
  try {
    const resp = await store.resetPwd(row.id)
    ElMessage.success(resp.message || '密码已重置')
  } catch (e) {
    ElMessage.error(e.message || '重置失败')
  }
}

const showAdd = ref(false)
function onAddSuccess() {
  // 已在 dialog 内刷新，这里可选行处理
}

function rowClass({ row }) {
  if (!row.enabled) return 'is-disabled'
  return ''
}
</script>

<style scoped>
.user-manage-page {
  padding: 12px 12px 32px;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.query-form {
  flex: 1;
  min-width: 640px;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pager {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
:deep(.el-table .is-disabled td) {
  background: #fafafa;
  color: #999;
}
</style>
