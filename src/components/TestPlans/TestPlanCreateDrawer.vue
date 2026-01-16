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
                placeholder="请先选择部门"
                :disabled="!formData.department_id"
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

        <div class="dock-config-card">
          <div class="dock-config-header">
            <div>
              <div class="dock-config-title">Dock 配置文件</div>
              <div class="dock-config-desc">
                默认不填值，点击按钮展开后可编辑；“填充默认指标”会使用预设值。
            </div>
          </div>
          <div class="dock-config-actions">
            <el-button size="small" @click="dockConfigVisible = !dockConfigVisible">
              {{ dockConfigVisible ? '收起' : '配置 Dock 指标' }}
            </el-button>
            <el-button size="small" type="primary" text @click="dockNineGrid = buildDefaultDockNineGrid(true)">
              填充默认指标
            </el-button>
          </div>
          </div>
          <el-collapse-transition>
            <div v-show="dockConfigVisible">
              <el-row :gutter="20">
                <el-col v-for="item in dockNineGrid" :key="item.key" :span="12">
                  <el-form-item :label="item.label" label-width="200px" class="dock-form-item">
                    <el-input-number
                      v-model="item.value"
                      :min="0"
                      :step="10"
                      :precision="0"
                      controls-position="right"
                      size="large"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-collapse-transition>
        </div>
      </el-form>

      <el-divider>选择测试用例</el-divider>

      <div class="case-selection">
        <div class="case-selector">
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
            @check="handleGroupCheck"
          >
            <template #default="{ node }">
              <span class="tree-node-label" :title="node.label">{{ node.label }}</span>
            </template>
          </el-tree>
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
              :data="paginatedSelectedCases"
              height="360px"
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
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="兼容性测试" width="150" align="center">
                <template #default="{ row }">
                  <el-switch
                    :model-value="!!row.compatibility_testing"
                    :loading="compatibilityLoading[row.id]"
                    @change="(val) => handleCaseCompatibilityToggle(row, val)"
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

            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="selectedCasePagination.page"
                v-model:page-size="selectedCasePagination.pageSize"
                :total="selectedCaseTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @current-change="handleSelectedCasePageChange"
                @size-change="handleSelectedCasePageSizeChange"
              />
            </div>
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

const dockNineGridTemplate = [
  { key: 'HotPlug', payloadKey: 'hotplug', label: 'HotPlug', defaultValue: 100 },
  { key: 'S3-Plug in-Resume', payloadKey: 's3_plug_in_resume', label: 'S3-Plug in-Resume', defaultValue: 50 },
  { key: 'S3-Unplug-Plug in-Resume', payloadKey: 's3_unplug_plug_in_resume', label: 'S3-Unplug-Plug in-Resume', defaultValue: 50 },
  { key: 'S3-Unplug-Resume-Plug in', payloadKey: 's3_unplug_resume_plug_in', label: 'S3-Unplug-Resume-Plug in', defaultValue: 20 },
  { key: 'S4-Plug in-Resume', payloadKey: 's4_plug_in_resume', label: 'S4-Plug in-Resume', defaultValue: 50 },
  { key: 'S4-Unplug-Plug in-Resume', payloadKey: 's4_unplug_plug_in_resume', label: 'S4-Unplug-Plug in-Resume', defaultValue: 30 },
  { key: 'S4-Unplug-Resume-Plug in', payloadKey: 's4_unplug_resume_plug_in', label: 'S4-Unplug-Resume-Plug in', defaultValue: 30 },
  { key: 'S5-Plug in-Power on', payloadKey: 's5_plug_in_power_on', label: 'S5-Plug in-Power on', defaultValue: 20 },
  { key: 'S5-Unplug-Power on-Plug in', payloadKey: 's5_unplug_power_on_plug_in', label: 'S5-Unplug-Power on-Plug in', defaultValue: 20 }
]

const buildDefaultDockNineGrid = (useDefaults = false) =>
  dockNineGridTemplate.map((item) => ({ ...item, value: useDefaults ? item.defaultValue : '' }))

const visible = ref(false)
const submitting = ref(false)
const formRef = ref()
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

const dockNineGrid = ref(buildDefaultDockNineGrid())
const resetDockNineGrid = () => {
  dockNineGrid.value = buildDefaultDockNineGrid()
}
const buildDockNineGridPayload = () => {
  const payload = {}
  dockNineGrid.value.forEach((item) => {
    if (!item?.payloadKey && !item?.key) return
    const numeric = Number(item.value)
    const targetKey = item.payloadKey || item.key
    payload[targetKey] = Number.isFinite(numeric) ? numeric : item.value
  })
  return payload
}

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
const compatibilityLoading = reactive({})
const dockConfigVisible = ref(false)

const optionsLoading = reactive({
  departments: false,
  projects: false,
  testers: false,
  deviceModels: false,
  caseGroups: false
})

const caseGroupTree = ref([])
const checkedGroupIds = ref([])
const groupNameMap = reactive(new Map())
const groupCaseMap = reactive(new Map())
const groupParentMap = reactive(new Map())

const selectedCasesMap = reactive(new Map())
const selectedCasePagination = reactive({
  page: 1,
  pageSize: 10
})

const treeProps = {
  children: 'children',
  label: 'label'
}

const selectedCases = computed(() => Array.from(selectedCasesMap.values()))
const selectedCaseTotal = computed(() => selectedCases.value.length)
const paginatedSelectedCases = computed(() => {
  const start = (selectedCasePagination.page - 1) * selectedCasePagination.pageSize
  return selectedCases.value.slice(start, start + selectedCasePagination.pageSize)
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
  resetDockNineGrid()
  dockConfigVisible.value = false

  projectOptions.value = []
  testerOptions.value = []
  deviceOptions.value = []
  caseGroupTree.value = []
  checkedGroupIds.value = []
  groupNameMap.clear()
  groupCaseMap.clear()
  groupParentMap.clear()
  selectedCasesMap.clear()
  selectedCasePagination.page = 1
  selectedCasePagination.pageSize = 10
  Object.keys(compatibilityLoading).forEach((key) => {
    delete compatibilityLoading[key]
  })
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

const fetchDeviceModelsByDepartment = async (departmentId) => {
  deviceOptions.value = []
  if (!departmentId) return
  optionsLoading.deviceModels = true
  try {
    const params = { page: 1, page_size: 1000, department_id: departmentId }
    const resp = await deviceModelsApi.list(params)
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
  groupParentMap.clear()
  const walk = (list, parentId = null) => {
    list.forEach((item) => {
      groupNameMap.set(item.id, item.label)
      groupParentMap.set(item.id, parentId)
      if (Array.isArray(item.children) && item.children.length) {
        walk(item.children, item.id)
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

const addCaseToSelection = (caseItem, { groupId } = {}) => {
  if (!caseItem || caseItem.id === undefined || caseItem.id === null) return
  const id = Number(caseItem.id)
  let entry = selectedCasesMap.get(id)
  if (!entry) {
    entry = {
      id,
      caseInfo: { ...caseItem },
      groupIds: new Set(),
      compatibility_testing: caseItem.compatibility_testing ?? true
    }
    selectedCasesMap.set(id, entry)
  } else {
    entry.caseInfo = { ...entry.caseInfo, ...caseItem }
    if (caseItem.compatibility_testing !== undefined) {
      entry.compatibility_testing = caseItem.compatibility_testing
    }
  }
  if (groupId) entry.groupIds.add(Number(groupId))
}

const removeGroupFromCase = (caseId, groupId) => {
  const entry = selectedCasesMap.get(caseId)
  if (!entry) return
  entry.groupIds.delete(Number(groupId))
  if (entry.groupIds.size === 0) {
    selectedCasesMap.delete(caseId)
  }
}

const fetchGroupCases = async (groupId) => {
  const id = Number(groupId)
  if (!formData.department_id || !id) return []
  const pageSize = 1000
  const items = []
  let page = 1
  let total = 0
  while (true) {
    const resp = await testCaseService.list(formData.department_id, {
      group_id: id,
      page,
      page_size: pageSize
    })
    if (!resp.success) return null
    const list = resp.data?.items || resp.data?.list || []
    items.push(...list)
    total = Number(resp.data?.total || total)
    if (total && page * pageSize >= total) break
    if (!list.length || list.length < pageSize) break
    page += 1
  }
  return items
}

const addGroupCases = async (groupId) => {
  const id = Number(groupId)
  if (!formData.department_id || !id) return
  let groupEntry = groupCaseMap.get(id)
  if (!groupEntry) {
    const items = await fetchGroupCases(id)
    if (!items) return
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

const resolveEffectiveGroupKeys = (keys = []) => {
  if (!groupParentMap.size) return keys
  const checkedSet = new Set(keys.map((key) => Number(key)))
  const result = []
  checkedSet.forEach((id) => {
    let parentId = groupParentMap.get(id)
    let hasAncestor = false
    while (parentId !== null && parentId !== undefined) {
      if (checkedSet.has(parentId)) {
        hasAncestor = true
        break
      }
      parentId = groupParentMap.get(parentId)
    }
    if (!hasAncestor) result.push(id)
  })
  return result
}

const handleGroupCheck = async (_data, { checkedKeys }) => {
  const keys = Array.isArray(checkedKeys) ? checkedKeys.map((key) => Number(key)) : []
  const effectiveKeys = resolveEffectiveGroupKeys(keys)
  const oldSet = new Set(checkedGroupIds.value.map((key) => Number(key)))
  const newSet = new Set(effectiveKeys)
  const added = [...newSet].filter((key) => !oldSet.has(key))
  const removed = [...oldSet].filter((key) => !newSet.has(key))
  checkedGroupIds.value = [...newSet]
  for (const key of added) {
    await addGroupCases(key)
  }
  removed.forEach((key) => removeGroupCases(key))
}

const handleSelectedCasePageChange = (page) => {
  selectedCasePagination.page = page
}

const handleSelectedCasePageSizeChange = (size) => {
  selectedCasePagination.pageSize = size
  selectedCasePagination.page = 1
}

const onDepartmentChange = async (departmentId) => {
  const deptId = Number(departmentId) || null
  formData.department_id = deptId
  formData.project_id = null
  formData.tester_user_ids = []
  formData.device_model_ids = []
  checkedGroupIds.value = []
  groupCaseMap.clear()
  selectedCasesMap.clear()
  deviceOptions.value = []
  selectedCasePagination.page = 1

  await Promise.all([
    fetchProjectsByDepartment(deptId),
    fetchTesters(deptId),
    fetchCaseGroups(deptId),
    fetchDeviceModelsByDepartment(deptId)
  ])
}

const removeCase = (caseId) => {
  const id = Number(caseId)
  const entry = selectedCasesMap.get(id)
  if (!entry) return
  selectedCasesMap.delete(id)
  delete compatibilityLoading[id]
}

const setCompatibilityLoading = (id, value) => {
  if (!id) return
  if (value) {
    compatibilityLoading[id] = true
  } else {
    delete compatibilityLoading[id]
  }
}

const handleCaseCompatibilityToggle = async (row, value) => {
  const id = Number(row.id)
  if (!id) return
  const entry = selectedCasesMap.get(id)
  const previous = entry?.compatibility_testing
  if (entry) entry.compatibility_testing = value
  setCompatibilityLoading(id, true)
  try {
    const resp = await testCaseService.update(id, { compatibility_testing: value })
    if (resp.success) {
      if (entry) {
        entry.caseInfo = { ...entry.caseInfo, compatibility_testing: value }
      }
      ElMessage.success(value ? '已开启兼容性测试' : '已关闭兼容性测试')
    } else if (entry) {
      entry.compatibility_testing = previous
    }
  } catch {
    if (entry) entry.compatibility_testing = previous
  } finally {
    setCompatibilityLoading(id, false)
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
      const payload = {
        project_id: formData.project_id,
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date,
        case_ids: caseIds,
        device_model_ids: formData.device_model_ids,
        tester_user_ids: formData.tester_user_ids,
        dock_nine_gird: buildDockNineGridPayload()
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
  await fetchDepartments()
  if (departmentId) {
    await onDepartmentChange(departmentId)
    if (projectId) {
      const targetId = Number(projectId)
      const exists = projectOptions.value.some((item) => item.value === targetId)
      if (exists) {
        formData.project_id = targetId
      }
    }
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

watch(
  () => selectedCaseTotal.value,
  () => {
    const total = selectedCaseTotal.value
    if (!total) {
      selectedCasePagination.page = 1
      return
    }
    const maxPage = Math.max(1, Math.ceil(total / selectedCasePagination.pageSize))
    if (selectedCasePagination.page > maxPage) {
      selectedCasePagination.page = maxPage
    }
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

.dock-config-card {
  margin-top: 12px;
  padding: 18px 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #f7f8fa;
}

.dock-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.dock-config-title {
  font-weight: 700;
  font-size: 16px;
}

.dock-config-desc {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.dock-config-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dock-form-item :deep(.el-form-item__label) {
  white-space: nowrap;
  font-size: 14px;
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
