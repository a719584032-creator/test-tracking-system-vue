<template>
  <div class="project-manage-page">
    <div class="filter-section">
      <div class="filter-left">
        <el-form :model="filters" inline>
          <el-form-item label="部门">
            <el-select
              v-model="filters.department_id"
              placeholder="全部部门"
              clearable
              filterable
              :loading="optionsLoading.departments"
              @focus="fetchDepartmentOptionsIfNeeded"
            >
              <el-option
                v-for="dept in departmentOptions"
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="项目名称">
            <el-input
              v-model="filters.name"
              placeholder="请输入项目名称"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="项目编码">
            <el-input
              v-model="filters.code"
              placeholder="请输入项目编码"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="状态">
            <el-select
              v-model="filters.status"
              placeholder="全部状态"
              clearable
              filterable
            >
              <el-option
                v-for="status in statusOptions"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="filter-right">
        <el-button type="primary" @click="handleAddProject">
          <el-icon><Plus /></el-icon>
          新建项目
        </el-button>
      </div>
    </div>

    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="projectList"
        stripe
        style="width: 100%"
        empty-text="暂无项目数据"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />

        <el-table-column prop="name" label="项目名称" min-width="160" />

        <el-table-column prop="code" label="项目编码" min-width="140">
          <template #default="{ row }">
            {{ row.code || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="所属部门" min-width="160">
          <template #default="{ row }">
            {{ getDepartmentName(row) }}
          </template>
        </el-table-column>

        <el-table-column label="负责人" min-width="140">
          <template #default="{ row }">
            {{ getOwnerName(row) }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row)" disable-transitions>
              {{ getStatusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="描述" min-width="220">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.description && row.description.length > 40"
              effect="dark"
              :content="row.description"
              placement="top"
            >
              <span>{{ row.description.slice(0, 40) }}...</span>
            </el-tooltip>
            <span v-else>{{ row.description || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" min-width="170">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEditProject(row)">
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              plain
              @click="handleDeleteProject(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <ProjectFormDialog
      ref="projectDialogRef"
      :departments="departmentOptions"
      :owners="ownerOptions"
      :status-options="statusOptions"
      :loading-departments="optionsLoading.departments"
      :loading-owners="optionsLoading.owners"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ProjectFormDialog from '@/components/Projects/ProjectFormDialog.vue'
import { projectsApi } from '@/api/projects'
import { departmentService } from '@/api/departments'
import { userService } from '@/api/users'
import { formatDateTime } from '@/utils/format'
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_STATUS_TAG_MAP,
  resolveProjectStatusLabel
} from '@/constants/project'

const loading = ref(false)
const projectList = ref([])

const filters = reactive({
  department_id: null,
  name: '',
  code: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const departmentOptions = ref([])
const ownerOptions = ref([])
const extraStatusOptions = ref([])

const optionsLoading = reactive({
  departments: false,
  owners: false
})

const projectDialogRef = ref()

const statusOptions = computed(() => {
  const base = [...PROJECT_STATUS_OPTIONS]
  const existing = new Set(base.map((item) => item.value))
  const extras = Array.isArray(extraStatusOptions.value)
    ? extraStatusOptions.value.filter((item) => item?.value && !existing.has(item.value))
    : []
  return [...base, ...extras]
})

const formatDate = (value) => (value ? formatDateTime(value) : '')

const hasStatusOption = (value) => {
  if (!value) return true
  return (
    PROJECT_STATUS_OPTIONS.some((item) => item.value === value) ||
    (Array.isArray(extraStatusOptions.value) &&
      extraStatusOptions.value.some((item) => item.value === value))
  )
}

const ensureStatusOption = (value, label) => {
  if (!value || hasStatusOption(value)) return
  const option = { value, label: label || value }
  const next = Array.isArray(extraStatusOptions.value)
    ? [...extraStatusOptions.value, option]
    : [option]
  extraStatusOptions.value = next
}

const getProjectStatusValue = (project) =>
  project?.status ?? project?.project_status ?? project?.state ?? project?.statusValue ?? ''

const getStatusLabel = (project) =>
  resolveProjectStatusLabel(
    getProjectStatusValue(project),
    project?.status_label ?? project?.statusLabel ?? project?.status_text ?? ''
  )

const getStatusTagType = (project) => {
  const status = getProjectStatusValue(project)
  return PROJECT_STATUS_TAG_MAP[status] || 'info'
}

const getDepartmentName = (project) => {
  const name =
    project?.department_name ??
    project?.departmentName ??
    project?.department?.name ??
    project?.department?.title ??
    project?.department?.display_name
  return name || '-'
}

const getOwnerName = (project) => {
  const name =
    project?.owner_name ??
    project?.ownerName ??
    project?.owner_username ??
    project?.owner_full_name ??
    project?.owner?.username ??
    project?.owner?.name ??
    project?.owner_user?.username ??
    project?.owner_user?.name
  return name || '-'
}

const getProjectId = (project) => project?.id ?? project?.project_id ?? null

const ensureStatusOptionFromProject = (project) => {
  const status = getProjectStatusValue(project)
  if (!status) return
  const label = getStatusLabel(project)
  ensureStatusOption(status, label)
}

const normalizeProjectListResponse = (data) => {
  if (Array.isArray(data)) {
    return { items: data, total: data.length }
  }
  if (!data || typeof data !== 'object') {
    return { items: [], total: 0 }
  }
  if (Array.isArray(data.items)) {
    return {
      items: data.items,
      total: Number.isFinite(data.total) ? data.total : data.items.length
    }
  }
  if (Array.isArray(data.list)) {
    return {
      items: data.list,
      total: Number.isFinite(data.total) ? data.total : data.list.length
    }
  }
  if (Array.isArray(data.projects)) {
    return {
      items: data.projects,
      total: Number.isFinite(data.total) ? data.total : data.projects.length
    }
  }
  return {
    items: [],
    total: Number.isFinite(data.total) ? data.total : 0
  }
}

const fetchProjectList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      order: 'desc'
    }

    if (filters.department_id) params.department_id = filters.department_id
    if (filters.name?.trim()) params.name = filters.name.trim()
    if (filters.code?.trim()) params.code = filters.code.trim()
    if (filters.status) params.status = filters.status

    const resp = await projectsApi.list(params)
    if (!resp?.success) {
      projectList.value = []
      pagination.total = 0
      return
    }

    const normalized = normalizeProjectListResponse(resp.data)
    projectList.value = normalized.items || []
    pagination.total = Number.isFinite(normalized.total)
      ? normalized.total
      : (normalized.items || []).length

    updateStatusOptionsFromItems(normalized.items || [])
  } catch (error) {
    console.error('获取项目列表失败:', error)
    ElMessage.error('获取项目列表失败')
  } finally {
    loading.value = false
  }
}

const updateStatusOptionsFromItems = (items) => {
  if (!Array.isArray(items)) return
  const additions = []
  items.forEach((item) => {
    const status = getProjectStatusValue(item)
    if (!status || hasStatusOption(status)) return
    additions.push({ value: status, label: getStatusLabel(item) })
  })
  if (!additions.length) return
  const merged = Array.isArray(extraStatusOptions.value) ? [...extraStatusOptions.value] : []
  const existing = new Set(merged.map((item) => item.value))
  additions.forEach((item) => {
    if (!existing.has(item.value)) {
      merged.push(item)
      existing.add(item.value)
    }
  })
  extraStatusOptions.value = merged
}

const fetchDepartmentOptions = async () => {
  optionsLoading.departments = true
  try {
    const resp = await departmentService.list({ page: 1, page_size: 1000 })
    if (!resp?.success) return
    const items = resp.data?.items || resp.data?.list || []
    if (!Array.isArray(items)) {
      departmentOptions.value = []
      return
    }

    const uniqueMap = new Map()
    items.forEach((dept) => {
      const value = dept.id ?? dept.department_id ?? dept.dept_id ?? dept.departmentId ?? null
      if (value === null || value === undefined) return
      const label =
        dept.name ??
        dept.department_name ??
        dept.title ??
        dept.display_name ??
        `部门 #${dept.id ?? dept.department_id ?? ''}`
      uniqueMap.set(value, { value, label })
    })
    departmentOptions.value = Array.from(uniqueMap.values())
  } catch (error) {
    console.error('获取部门数据失败:', error)
  } finally {
    optionsLoading.departments = false
  }
}

const fetchDepartmentOptionsIfNeeded = async () => {
  if (departmentOptions.value.length) return
  await fetchDepartmentOptions()
}

const fetchOwnerOptions = async () => {
  optionsLoading.owners = true
  try {
    const resp = await userService.getList({ page: 1, page_size: 1000 })
    if (!resp?.success) return
    const items = resp.data?.items || resp.data?.list || []
    if (!Array.isArray(items)) {
      ownerOptions.value = []
      return
    }

    const uniqueMap = new Map()
    items.forEach((user) => {
      const value = user.id ?? user.user_id ?? user.userId ?? null
      if (!value && value !== 0) return
      const label =
        user.username ||
        user.name ||
        user.full_name ||
        user.email ||
        `用户#${user.id ?? user.user_id ?? ''}`
      uniqueMap.set(value, { value, label })
    })
    ownerOptions.value = Array.from(uniqueMap.values())
  } catch (error) {
    console.error('获取用户数据失败:', error)
  } finally {
    optionsLoading.owners = false
  }
}

const fetchOwnerOptionsIfNeeded = async () => {
  if (ownerOptions.value.length) return
  await fetchOwnerOptions()
}

const ensureReferenceData = async () => {
  await Promise.all([fetchDepartmentOptionsIfNeeded(), fetchOwnerOptionsIfNeeded()])
}

const handleSearch = () => {
  pagination.page = 1
  fetchProjectList()
}

const handleReset = () => {
  Object.assign(filters, {
    department_id: null,
    name: '',
    code: '',
    status: ''
  })
  pagination.page = 1
  fetchProjectList()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchProjectList()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchProjectList()
}

const handleAddProject = async () => {
  await ensureReferenceData()
  projectDialogRef.value?.openCreate()
}

const handleEditProject = async (project) => {
  await ensureReferenceData()
  ensureStatusOptionFromProject(project)
  projectDialogRef.value?.openEdit(project)
}

const handleDeleteProject = async (project) => {
  const projectId = getProjectId(project)
  if (!projectId) {
    ElMessage.error('无法识别要删除的项目')
    return
  }

  const projectName = project?.name ?? project?.project_name ?? `ID ${projectId}`

  try {
    await ElMessageBox.confirm(
      `确定要删除项目 “${projectName}” 吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除项目操作被中断:', error)
    }
    return
  }

  try {
    const resp = await projectsApi.remove(projectId)
    if (!resp?.success) return

    ElMessage.success('项目删除成功')
    if (projectList.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1
    }
    await fetchProjectList()
  } catch (error) {
    console.error('删除项目失败:', error)
    ElMessage.error('删除项目失败')
  }
}

const handleDialogSuccess = (payload) => {
  if (payload?.data) {
    ensureStatusOptionFromProject(payload.data)
  }
  fetchProjectList()
}

onMounted(() => {
  fetchDepartmentOptionsIfNeeded()
  fetchProjectList()
})
</script>

<style scoped>
.project-manage-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.filter-left {
  flex: 1;
}

.filter-right {
  margin-left: 20px;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 16px;
  margin-bottom: 8px;
}
</style>
