<template>
  <el-drawer
    v-model="visible"
    size="80%"
    :close-on-click-modal="false"
    destroy-on-close
    title="新建测试计划"
    @close="handleClose"
  >
    <div class="plan-create-drawer">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="plan-form"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属部门" prop="department_id">
              <el-select
                v-model="formData.department_id"
                placeholder="请选择部门"
                clearable
                filterable
                :loading="optionsLoading.departments"
                @change="onDepartmentChange"
              >
                <el-option
                  v-for="dept in departmentOptions"
                  :key="dept.value"
                  :label="dept.label"
                  :value="dept.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属项目" prop="project_id">
              <el-select
                v-model="formData.project_id"
                placeholder="请先选择部门"
                clearable
                filterable
                :disabled="!formData.department_id"
                :loading="optionsLoading.projects"
              >
                <el-option
                  v-for="project in projectOptions"
                  :key="project.value"
                  :label="project.label"
                  :value="project.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="计划名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入计划名称"
                maxlength="100"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择计划状态" filterable>
                <el-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="计划周期" prop="dateRange">
              <el-date-picker
                v-model="formData.dateRange"
                type="daterange"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="测试人员" prop="tester_user_ids">
              <el-select
                v-model="formData.tester_user_ids"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择测试人员"
                :disabled="!formData.department_id"
                :loading="optionsLoading.testers"
                filterable
              >
                <el-option
                  v-for="user in testerOptions"
                  :key="user.value"
                  :label="user.label"
                  :value="user.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="测试机型" prop="device_model_ids">
              <el-select
                v-model="formData.device_model_ids"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择测试机型"
                :loading="optionsLoading.deviceModels"
                filterable
              >
                <el-option
                  v-for="device in deviceOptions"
                  :key="device.value"
                  :label="device.label"
                  :value="device.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划描述">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入计划描述（可选）"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-divider>选择测试用例</el-divider>

      <div class="case-selection">
        <div class="case-selector">
          <el-tabs v-model="caseTab" stretch>
            <el-tab-pane label="按分组选择" name="groups">
              <div class="case-selector-tip">
                选中分组后将自动包含该分组下的全部用例。
              </div>
              <el-tree
                v-loading="optionsLoading.caseGroups"
                :data="caseGroupTree"
                :props="treeProps"
                node-key="id"
                show-checkbox
                :default-checked-keys="checkedGroupIds"
                highlight-current
                :expand-on-click-node="false"
                class="group-tree"
                @check-change="handleGroupCheck"
              >
                <template #default="{ node }">
                  <span class="tree-node-label" :title="node.label">{{ node.label }}</span>
                </template>
              </el-tree>
            </el-tab-pane>
            <el-tab-pane label="按用例选择" name="cases">
              <el-form :inline="true" class="case-search-form" @submit.prevent>
                <el-form-item label="所属分组">
                  <el-select
                    v-model="caseTable.group_id"
                    placeholder="全部分组"
                    clearable
                    filterable
                    :disabled="!formData.department_id"
                    style="width: 200px"
                  >
                    <el-option
                      v-for="group in flatGroupOptions"
                      :key="group.value"
                      :label="group.label"
                      :value="group.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="关键字">
                  <el-input
                    v-model="caseTable.keyword"
                    placeholder="按标题搜索"
                    clearable
                    style="width: 220px"
                    @keyup.enter="handleCaseSearch"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :disabled="!formData.department_id" @click="handleCaseSearch">
                    搜索
                  </el-button>
                  <el-button @click="resetCaseFilters">重置</el-button>
                </el-form-item>
              </el-form>

              <el-table
                ref="caseTableRef"
                :data="caseTable.list"
                v-loading="optionsLoading.caseTable"
                border
                style="width: 100%"
                height="360px"
                :row-key="row => row.id"
                @selection-change="handleTableSelectionChange"
              >
                <el-table-column type="selection" width="52" />
                <el-table-column prop="title" label="用例标题" min-width="220" show-overflow-tooltip />
                <el-table-column prop="priority" label="优先级" width="100" align="center" />
                <el-table-column prop="status" label="状态" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                      {{ row.status === 'active' ? '有效' : '废弃' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>

              <div class="pagination-wrapper">
                <el-pagination
                  v-model:current-page="caseTable.page"
                  v-model:page-size="caseTable.pageSize"
                  :total="caseTable.total"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  @current-change="handleCasePageChange"
                  @size-change="handleCasePageSizeChange"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="selected-case-panel">
          <el-card shadow="never" class="selected-card">
            <template #header>
              <div class="selected-card-header">
                <span>已选用例</span>
                <span class="selected-count">共 {{ selectedCases.length }} 条</span>
              </div>
            </template>

            <el-table
              :data="selectedCases"
              height="420px"
              empty-text="请从左侧选择用例"
              border
              :row-key="row => row.id"
            >
              <el-table-column label="用例" min-width="220">
                <template #default="{ row }">
                  <div class="case-title">{{ resolveCaseTitle(row) }}</div>
                  <div class="case-meta">
                    <span>ID：{{ row.id }}</span>
                    <span class="split">优先级：{{ row.caseInfo?.priority || '-' }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="来源" min-width="200">
                <template #default="{ row }">
                  <div class="source-tags">
                    <el-tag
                      v-for="groupName in resolveGroupNames(row)"
                      :key="groupName"
                      size="small"
                      type="info"
                    >
                      {{ groupName }}
                    </el-tag>
                    <el-tag v-if="row.manual" size="small" type="success">单独选择</el-tag>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="兼容性测试" width="150" align="center">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.compatibility"
                    active-text="做兼容"
                    inactive-text="不兼容"
                  />
                </template>
              </el-table-column>

              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button
                    type="danger"
                    text
                    size="small"
                    @click="removeCase(row.id)"
                  >
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <div class="footer-summary">已选择 {{ selectedCases.length }} 条测试用例</div>
        <div class="footer-actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            创建计划
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { departmentService } from '@/api/departments'
import { projectsApi } from '@/api/projects'
import { deviceModelsApi } from '@/api/deviceModels'
import { testPlansApi } from '@/api/testPlans'
import { testCaseService } from '@/api/testCases'
import { caseGroupService } from '@/api/caseGroups'
import { TEST_PLAN_STATUS_OPTIONS } from '@/constants/testPlan'

const emit = defineEmits(['success'])

const visible = ref(false)
const submitting = ref(false)
const formRef = ref()
const caseTableRef = ref()
const caseTab = ref('groups')

const formData = reactive({
  department_id: null,
  project_id: null,
  name: '',
  status: 'pending',
  dateRange: [],
  start_date: '',
  end_date: '',
  tester_user_ids: [],
  device_model_ids: [],
  description: ''
})

const rules = {
  department_id: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
  project_id: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 100, message: '计划名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择计划状态', trigger: 'change' }],
  dateRange: [{ type: 'array', required: true, message: '请选择计划周期', trigger: 'change' }],
  tester_user_ids: [{ type: 'array', required: true, message: '请选择测试人员', trigger: 'change' }],
  device_model_ids: [{ type: 'array', required: true, message: '请选择测试机型', trigger: 'change' }]
}

const statusOptions = TEST_PLAN_STATUS_OPTIONS

const departmentOptions = ref([])
const projectOptions = ref([])
const testerOptions = ref([])
const deviceOptions = ref([])

const optionsLoading = reactive({
  departments: false,
  projects: false,
  testers: false,
  deviceModels: false,
  caseGroups: false,
  caseTable: false
})

const caseGroupTree = ref([])
const checkedGroupIds = ref([])
const groupNameMap = reactive(new Map())
const groupCaseMap = reactive(new Map())

const selectedCasesMap = reactive(new Map())
const manualSelection = ref(new Set())
const syncingSelection = ref(false)

const caseTable = reactive({
  list: [],
  page: 1,
  pageSize: 10,
  total: 0,
  keyword: '',
  group_id: null
})

const treeProps = {
  children: 'children',
  label: 'label'
}

const selectedCases = computed(() => Array.from(selectedCasesMap.values()))

const flatGroupOptions = computed(() => {
  const result = []
  const walk = (nodes = []) => {
    nodes.forEach((node) => {
      if (!node || !node.id) return
      result.push({ value: Number(node.id), label: node.label || node.name || `分组#${node.id}` })
      if (Array.isArray(node.children) && node.children.length) {
        walk(node.children)
      }
    })
  }
  walk(caseGroupTree.value)
  return result
})

const resolveCaseTitle = (entry) => entry.caseInfo?.title || entry.caseInfo?.name || `用例 #${entry.id}`

const resolveGroupNames = (entry) => {
  const names = []
  if (entry?.groupIds) {
    entry.groupIds.forEach((groupId) => {
      const name = groupNameMap.get(groupId) || `分组#${groupId}`
      names.push(name)
    })
  }
  return names
}

const resetState = () => {
  formData.department_id = null
  formData.project_id = null
  formData.name = ''
  formData.status = 'pending'
  formData.dateRange = []
  formData.start_date = ''
  formData.end_date = ''
  formData.tester_user_ids = []
  formData.device_model_ids = []
  formData.description = ''

  projectOptions.value = []
  testerOptions.value = []
  caseGroupTree.value = []
  checkedGroupIds.value = []
  groupNameMap.clear()
  groupCaseMap.clear()
  selectedCasesMap.clear()
  manualSelection.value = new Set()
  caseTab.value = 'groups'

  caseTable.list = []
  caseTable.page = 1
  caseTable.pageSize = 10
  caseTable.total = 0
  caseTable.keyword = ''
  caseTable.group_id = null
  syncingSelection.value = false
}

const syncDateRange = (value) => {
  if (Array.isArray(value) && value.length === 2) {
    formData.start_date = value[0] || ''
    formData.end_date = value[1] || ''
  } else {
    formData.start_date = ''
    formData.end_date = ''
  }
}

const fetchDepartments = async () => {
  if (departmentOptions.value.length || optionsLoading.departments) return
  optionsLoading.departments = true
  try {
    const resp = await departmentService.list({ page: 1, page_size: 1000 })
    if (resp.success) {
      const items = resp.data?.items || resp.data?.list || []
      departmentOptions.value = items.map((item) => ({
        value: Number(item.id),
        label: item.name || item.label || `部门#${item.id}`
      }))
    }
  } finally {
    optionsLoading.departments = false
  }
}

const fetchDeviceModels = async () => {
  if (deviceOptions.value.length || optionsLoading.deviceModels) return
  optionsLoading.deviceModels = true
  try {
    const resp = await deviceModelsApi.list({ page: 1, page_size: 1000 })
    if (resp.success) {
      const items = resp.data?.items || resp.data?.list || []
      deviceOptions.value = items.map((item) => ({
        value: Number(item.id),
        label: item.name || item.model_name || item.code || `机型#${item.id}`
      }))
    }
  } finally {
    optionsLoading.deviceModels = false
  }
}

const fetchProjectsByDepartment = async (departmentId) => {
  projectOptions.value = []
  if (!departmentId) return
  optionsLoading.projects = true
  try {
    const params = { page: 1, page_size: 1000, department_id: departmentId }
    const resp = await projectsApi.list(params)
    if (resp.success) {
      const items = resp.data?.items || resp.data?.list || []
      projectOptions.value = items.map((item) => ({
        value: Number(item.id),
        label: item.name || `项目#${item.id}`
      }))
    }
  } finally {
    optionsLoading.projects = false
  }
}

const fetchTesters = async (departmentId) => {
  testerOptions.value = []
  if (!departmentId) return
  optionsLoading.testers = true
  try {
    const resp = await departmentService.listMembers(departmentId, { page: 1, page_size: 1000 })
    if (resp.success) {
      const items = resp.data?.items || resp.data?.list || []
      testerOptions.value = items
        .map((member) => {
          const userId = Number(member.user_id || member.userId || member.id || member.user?.id)
          if (!userId) return null
          const user = member.user || {}
          const label = member.username || member.name || user.username || user.name || `用户#${userId}`
          return { value: userId, label }
        })
        .filter(Boolean)
    }
  } finally {
    optionsLoading.testers = false
  }
}

const processGroupTree = (nodes = []) =>
  nodes.map((node) => ({
    id: Number(node.id),
    label: node.name || node.label || `分组#${node.id}`,
    children: processGroupTree(node.children || [])
  }))

const rebuildGroupMap = (nodes = []) => {
  groupNameMap.clear()
  const walk = (list) => {
    list.forEach((item) => {
      groupNameMap.set(item.id, item.label)
      if (Array.isArray(item.children) && item.children.length) {
        walk(item.children)
      }
    })
  }
  walk(nodes)
}

const fetchCaseGroups = async (departmentId) => {
  caseGroupTree.value = []
  checkedGroupIds.value = []
  groupCaseMap.clear()
  if (!departmentId) return
  optionsLoading.caseGroups = true
  try {
    const resp = await caseGroupService.tree(departmentId)
    if (resp.success && resp.data) {
      const children = resp.data?.children || resp.data || []
      const processed = Array.isArray(children) ? processGroupTree(children) : []
      caseGroupTree.value = processed
      rebuildGroupMap(processed)
    }
  } finally {
    optionsLoading.caseGroups = false
  }
}

const addCaseToSelection = (caseItem, { manual = false, groupId } = {}) => {
  if (!caseItem || caseItem.id === undefined || caseItem.id === null) return
  const id = Number(caseItem.id)
  let entry = selectedCasesMap.get(id)
  if (!entry) {
    entry = {
      id,
      caseInfo: { ...caseItem },
      groupIds: new Set(),
      manual: false,
      compatibility: true
    }
    selectedCasesMap.set(id, entry)
  } else {
    entry.caseInfo = { ...entry.caseInfo, ...caseItem }
  }
  if (manual) entry.manual = true
  if (groupId) entry.groupIds.add(Number(groupId))
}

const removeGroupFromCase = (caseId, groupId) => {
  const entry = selectedCasesMap.get(caseId)
  if (!entry) return
  entry.groupIds.delete(Number(groupId))
  if (!entry.manual && entry.groupIds.size === 0) {
    selectedCasesMap.delete(caseId)
  }
}

const addGroupCases = async (groupId) => {
  const id = Number(groupId)
  if (!formData.department_id || !id) return
  let groupEntry = groupCaseMap.get(id)
  if (!groupEntry) {
    const resp = await testCaseService.list(formData.department_id, {
      group_id: id,
      page: 1,
      page_size: 1000
    })
    if (!resp.success) return
    const items = resp.data?.items || resp.data?.list || []
    groupEntry = {
      caseIds: new Set(),
      cases: new Map()
    }
    items.forEach((item) => {
      const caseId = Number(item.id)
      if (!caseId) return
      groupEntry.caseIds.add(caseId)
      groupEntry.cases.set(caseId, item)
      addCaseToSelection(item, { groupId: id })
    })
    groupCaseMap.set(id, groupEntry)
  } else {
    groupEntry.caseIds.forEach((caseId) => {
      const caseInfo = groupEntry.cases.get(caseId)
      if (caseInfo) {
        addCaseToSelection(caseInfo, { groupId: id })
      }
    })
  }
}

const removeGroupCases = (groupId) => {
  const id = Number(groupId)
  const groupEntry = groupCaseMap.get(id)
  if (!groupEntry) return
  groupEntry.caseIds.forEach((caseId) => {
    removeGroupFromCase(caseId, id)
  })
}

const handleGroupCheck = async (_data, { checkedKeys }) => {
  const keys = Array.isArray(checkedKeys) ? checkedKeys.map((key) => Number(key)) : []
  const oldSet = new Set(checkedGroupIds.value.map((key) => Number(key)))
  const newSet = new Set(keys)
  const added = [...newSet].filter((key) => !oldSet.has(key))
  const removed = [...oldSet].filter((key) => !newSet.has(key))
  checkedGroupIds.value = [...newSet]
  for (const key of added) {
    await addGroupCases(key)
  }
  removed.forEach((key) => removeGroupCases(key))
}

const removeManualSelection = (caseId) => {
  const id = Number(caseId)
  const entry = selectedCasesMap.get(id)
  if (!entry) return
  entry.manual = false
  if (entry.groupIds.size === 0) {
    selectedCasesMap.delete(id)
  }
}

const handleTableSelectionChange = (rows) => {
  if (syncingSelection.value) return
  const selectedIds = new Set()
  rows.forEach((row) => {
    const id = Number(row.id)
    if (!id) return
    selectedIds.add(id)
    addCaseToSelection(row, { manual: true })
  })
  manualSelection.value.forEach((id) => {
    if (!selectedIds.has(id)) {
      removeManualSelection(id)
    }
  })
  manualSelection.value = selectedIds
}

const syncTableSelection = () => {
  nextTick(() => {
    if (!caseTableRef.value) return
    syncingSelection.value = true
    caseTableRef.value.clearSelection()
    nextTick(() => {
      const selectedIds = manualSelection.value
      caseTable.list.forEach((row) => {
        const id = Number(row.id)
        if (selectedIds.has(id)) {
          caseTableRef.value.toggleRowSelection(row, true)
        }
      })
      nextTick(() => {
        syncingSelection.value = false
      })
    })
  })
}

const fetchCaseTable = async () => {
  caseTable.list = []
  caseTable.total = 0
  if (!formData.department_id) return
  optionsLoading.caseTable = true
  try {
    const params = {
      page: caseTable.page,
      page_size: caseTable.pageSize
    }
    if (caseTable.keyword) params.title = caseTable.keyword
    if (caseTable.group_id) params.group_id = caseTable.group_id
    const resp = await testCaseService.list(formData.department_id, params)
    if (resp.success) {
      const items = resp.data?.items || resp.data?.list || []
      caseTable.list = items
      caseTable.total = Number(resp.data?.total || items.length || 0)
      syncTableSelection()
    }
  } finally {
    optionsLoading.caseTable = false
  }
}

const handleCaseSearch = () => {
  caseTable.page = 1
  fetchCaseTable()
}

const resetCaseFilters = () => {
  caseTable.keyword = ''
  caseTable.group_id = null
  caseTable.page = 1
  fetchCaseTable()
}

const handleCasePageChange = (page) => {
  caseTable.page = page
  fetchCaseTable()
}

const handleCasePageSizeChange = (size) => {
  caseTable.pageSize = size
  caseTable.page = 1
  fetchCaseTable()
}

const onDepartmentChange = async (departmentId) => {
  const deptId = Number(departmentId) || null
  formData.department_id = deptId
  formData.project_id = null
  formData.tester_user_ids = []
  checkedGroupIds.value = []
  groupCaseMap.clear()
  selectedCasesMap.clear()
  manualSelection.value = new Set()
  caseTable.page = 1
  caseTable.keyword = ''
  caseTable.group_id = null

  await Promise.all([
    fetchProjectsByDepartment(deptId),
    fetchTesters(deptId),
    fetchCaseGroups(deptId)
  ])
  await fetchCaseTable()
  syncTableSelection()
}

const removeCase = (caseId) => {
  const id = Number(caseId)
  const entry = selectedCasesMap.get(id)
  if (!entry) return
  if (entry.groupIds.size > 0) {
    ElMessage.warning('该用例来源于分组，请先取消对应分组的勾选')
    return
  }
  selectedCasesMap.delete(id)
  if (manualSelection.value.has(id)) {
    manualSelection.value.delete(id)
    manualSelection.value = new Set(manualSelection.value)
    syncTableSelection()
  }
}

const handleSubmit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    if (!selectedCases.value.length) {
      ElMessage.warning('请至少选择一个测试用例')
      return
    }
    submitting.value = true
    try {
      const caseIds = Array.from(selectedCasesMap.keys())
      const singleExecIds = selectedCases.value
        .filter((entry) => !entry.compatibility)
        .map((entry) => entry.id)
      const payload = {
        project_id: formData.project_id,
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date,
        case_ids: caseIds,
        case_group_ids: checkedGroupIds.value,
        single_execution_case_ids: singleExecIds,
        device_model_ids: formData.device_model_ids,
        tester_user_ids: formData.tester_user_ids
      }
      const resp = await testPlansApi.create(payload)
      if (resp.success) {
        ElMessage.success(resp.message || '测试计划创建成功')
        emit('success', resp.data)
        visible.value = false
      }
    } finally {
      submitting.value = false
    }
  })
}

const handleClose = () => {
  visible.value = false
}

const open = async ({ departmentId, projectId } = {}) => {
  resetState()
  visible.value = true
  await nextTick()
  formRef.value?.clearValidate()
  await Promise.all([fetchDepartments(), fetchDeviceModels()])
  if (departmentId) {
    await onDepartmentChange(departmentId)
    if (projectId) {
      const targetId = Number(projectId)
      const exists = projectOptions.value.some((item) => item.value === targetId)
      if (exists) {
        formData.project_id = targetId
      }
    }
  } else {
    await fetchCaseTable()
  }
}

const close = () => {
  visible.value = false
}

watch(
  () => formData.dateRange,
  (value) => {
    syncDateRange(value)
  }
)

defineExpose({ open, close })
</script>

<style scoped>
.plan-create-drawer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-form {
  background: #ffffff;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #ebeef5;
}

.case-selection {
  display: flex;
  gap: 16px;
}

.case-selector,
.selected-case-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.case-selector {
  max-width: 420px;
}

.case-selector-tip {
  margin-bottom: 12px;
  color: #909399;
  font-size: 13px;
}

.group-tree {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 8px 12px;
  max-height: 420px;
  overflow: auto;
}

.tree-node-label {
  display: inline-block;
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.case-search-form {
  margin-bottom: 12px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.selected-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.selected-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.selected-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.selected-count {
  color: #909399;
  font-size: 13px;
}

.case-title {
  font-weight: 600;
  color: #303133;
}

.case-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 12px;
}

.case-meta .split {
  margin-left: 12px;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.drawer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-top: 1px solid #ebeef5;
}

.footer-summary {
  color: #606266;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 1200px) {
  .case-selection {
    flex-direction: column;
  }

  .case-selector {
    max-width: none;
  }
}
</style>
