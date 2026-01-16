<!-- src/pages/TestCases/TestCaseManagePage.vue -->
<template>
  <div class="test-case-manage-page">
    <div class="page-header">
      <h1 class="page-title">测试用例管理</h1>
      <div class="header-actions">
        <el-select
          v-model="departmentId"
          placeholder="选择部门"
          @change="handleDeptChange"
          style="width: 200px; margin-right: 12px;"
        >
          <el-option
            v-for="dept in departments"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          />
        </el-select>
        <el-button
          type="primary"
          @click="handleRefresh"
          class="refresh-btn"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="layout">
      <div class="group-tree">
        <CaseGroupTree
          ref="groupTreeRef"
          :department-id="departmentId"
          @group-select="handleGroupSelect"
          @case-click="handleCaseClick"
        />
      </div>

      <div class="case-table">
        <div class="table-header">
          <h3 class="table-title">用例列表</h3>
          <div class="table-actions">
            <el-dropdown
              trigger="click"
              @command="handleExportCommand"
            >
              <el-button
                type="primary"
                plain
                class="export-btn"
                :loading="exportLoading"
                :disabled="!departmentId"
              >
                <el-icon><Download /></el-icon>
                导出用例
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="all">导出全部</el-dropdown-item>
                  <el-dropdown-item
                    command="group"
                    :disabled="!filters.group_id"
                  >
                    导出当前分组
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              type="primary"
              link
              @click="openImportDialog"
              class="import-btn"
              :disabled="!departmentId"
            >
              <el-icon><UploadFilled /></el-icon>
              导入用例
            </el-button>
            <el-button
              type="primary"
              @click="handleCreate"
              class="create-btn"
            >
              <el-icon><Plus /></el-icon>
              新建用例
            </el-button>
          </div>
        </div>

        <div class="toolbar">
          <el-form
            :model="filters"
            inline
            class="search-form"
            @submit.prevent="handleSearch"
          >
            <el-form-item label="标题">
              <el-input
                v-model="filters.title"
                placeholder="请输入用例标题"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filters.status" placeholder="请选择状态" clearable>
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="优先级">
              <el-select v-model="filters.priority" placeholder="请选择优先级" clearable>
                <el-option
                  v-for="opt in priorityOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="filters.case_type" placeholder="请选择类型" clearable>
                <el-option
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input
                v-model="filters.keywords"
                placeholder="多个关键词用逗号分隔"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset">
                <el-icon><RefreshLeft /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <TestCaseTable
          :cases="caseList"
          :loading="loading"
          :compatibility-loading="compatibilityLoading"
          @edit="handleEdit"
          @copy="handleCopy"
          @delete="handleDelete"
          @history="handleHistory"
          @create="handleCreate"
          @toggle-compatibility="handleToggleCompatibility"
        />

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="fetchCases"
          />
        </div>
      </div>
    </div>

    <!-- 用例表单 -->
    <TestCaseForm
      ref="formRef"
      :department-id="departmentId"
      @success="fetchCases"
    />

    <el-dialog
      v-model="importDialogVisible"
      title="导入用例"
      width="520px"
      destroy-on-close
      @closed="resetImportForm"
    >
      <el-form
        ref="importFormRef"
        :model="importForm"
        :rules="importRules"
        label-width="96px"
        status-icon
      >
        <el-form-item label="所属部门" prop="department_id">
          <el-select v-model="importForm.department_id" disabled placeholder="请选择部门">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="导入目录" prop="group_id">
          <el-tree-select
            v-model="importForm.group_id"
            :data="importGroupOptions"
            :props="treeSelectProps"
            node-key="value"
            clearable
            check-strictly
            placeholder="不选择则导入到默认目录"
            :loading="importGroupLoading"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="用例文件" prop="files">
          <el-upload
            drag
            :auto-upload="false"
            :file-list="importFileList"
            multiple
            accept=".xls,.xlsx,.csv,.json,.zip"
            @change="handleFileChange"
            @remove="handleFileRemove"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">支持 Excel/CSV/JSON/ZIP 等格式，具体以后端解析为准</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="importSubmitting" @click="submitImport">
            确 认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 历史记录 -->
    <TestCaseHistory ref="historyRef" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  RefreshLeft,
  UploadFilled,
  Download,
  ArrowDown
} from '@element-plus/icons-vue'

import CaseGroupTree from './components/CaseGroupTree.vue'
import TestCaseTable from './components/TestCaseTable.vue'
import TestCaseForm from './components/TestCaseForm.vue'
import TestCaseHistory from './components/TestCaseHistory.vue'

import { testCaseService } from '@/api/testCases'
import { departmentService } from '@/api/departments'
import { caseGroupService } from '@/api/caseGroups'
import {
  TEST_CASE_STATUS_OPTIONS,
  TEST_CASE_PRIORITY_OPTIONS,
  TEST_CASE_TYPE_OPTIONS
} from '@/constants/testCase'

const router = useRouter()

// 响应式数据
const departmentId = ref(null)
const departments = ref([])
const caseList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const compatibilityLoading = ref({})
const exportLoading = ref(false)

const filters = ref({
  title: '',
  status: '',
  priority: '',
  case_type: '',
  keywords: '',
  group_id: null
})

// 选项数据
const statusOptions = TEST_CASE_STATUS_OPTIONS
const priorityOptions = TEST_CASE_PRIORITY_OPTIONS
const typeOptions = TEST_CASE_TYPE_OPTIONS

// 组件引用
const groupTreeRef = ref()
const formRef = ref()
const historyRef = ref()
const importFormRef = ref()

// 获取用例列表
const fetchCases = async () => {
  if (!departmentId.value) return
  loading.value = true
  try {
    const kw = parseKeywords(filters.value.keywords)
    const params = {
      title: filters.value.title,
      status: filters.value.status,
      priority: filters.value.priority,
      case_type: filters.value.case_type,
      keywords: kw.length ? kw : undefined,
      group_id: filters.value.group_id,
      page: page.value,
      page_size: pageSize.value
    }
    const resp = await testCaseService.list(departmentId.value, params)
    if (resp.success) {
      caseList.value = resp.data?.items || []
      total.value = resp.data?.total || 0
    }
  } finally {
    loading.value = false
  }
}

// 处理分组选择
const handleGroupSelect = (id) => {
  filters.value.group_id = id
  page.value = 1
  fetchCases()
}

// 处理用例点击（跳转到详情页）
const handleCaseClick = (caseId) => {
  router.push({ name: 'TestCaseDetail', params: { id: caseId } })
}

// 获取部门列表
const fetchDepartments = async () => {
  const resp = await departmentService.list()
  if (resp.success) {
    departments.value = resp.data?.items || []
    if (departments.value.length && !departmentId.value) {
      departmentId.value = departments.value[0].id
      fetchCases()
    }
  }
}

// 处理部门变化
const handleDeptChange = () => {
  filters.value.group_id = null
  groupTreeRef.value?.clearSelection()
  page.value = 1
  fetchCases()
}

// 用例操作
const handleCreate = () => {
  formRef.value?.open('create')
}

const setCompatibilityLoading = (id, status) => {
  const next = { ...compatibilityLoading.value }
  if (status) {
    next[id] = true
  } else {
    delete next[id]
  }
  compatibilityLoading.value = next
}

const handleToggleCompatibility = async (row, value) => {
  const previous = row.compatibility_testing
  setCompatibilityLoading(row.id, true)
  row.compatibility_testing = value
  try {
    const resp = await testCaseService.update(row.id, { compatibility_testing: value })
    if (resp.success) {
      ElMessage.success(value ? '已开启兼容性测试' : '已关闭兼容性测试')
    } else {
      row.compatibility_testing = previous
    }
  } catch {
    row.compatibility_testing = previous
  } finally {
    setCompatibilityLoading(row.id, false)
  }
}

const handleEdit = (row) => {
  formRef.value?.open('edit', row)
}

const handleCopy = (row) => {
  formRef.value?.open('copy', row)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该用例吗？', '提示', { type: 'warning' })
    const resp = await testCaseService.remove(row.id)
    if (resp.success) {
      fetchCases()
    }
  } catch {}
}

const handleHistory = (row) => {
  historyRef.value?.open(row.id)
}

const resolveExportFilename = (headers, fallbackName) => {
  const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition']
  if (!disposition) return fallbackName
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }
  const asciiMatch = disposition.match(/filename="?([^\";]+)"?/i)
  if (asciiMatch?.[1]) return asciiMatch[1]
  return fallbackName
}

const buildExportParams = (includeGroup) => {
  const kw = parseKeywords(filters.value.keywords)
  const params = {
    title: filters.value.title,
    status: filters.value.status,
    priority: filters.value.priority,
    case_type: filters.value.case_type,
    keywords: kw.length ? kw : undefined
  }
  if (includeGroup) {
    params.group_id = filters.value.group_id
  }
  return params
}

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const handleExport = async (includeGroup) => {
  if (!departmentId.value) {
    ElMessage.error('请先选择部门')
    return
  }
  if (includeGroup && !filters.value.group_id) {
    ElMessage.warning('请先选择分组')
    return
  }
  exportLoading.value = true
  try {
    const params = buildExportParams(includeGroup)
    const response = await testCaseService.exportCases(departmentId.value, params)
    if (response?.success === false) {
      ElMessage.error(response.message || '导出失败')
      return
    }
    const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data || ''])
    if (blob.type && blob.type.includes('application/json')) {
      const text = await blob.text()
      try {
        const parsed = JSON.parse(text)
        ElMessage.error(parsed?.message || '导出失败')
      } catch {
        ElMessage.error('导出失败')
      }
      return
    }
    const fallbackName = `test_cases_department_${departmentId.value}.csv`
    const filename = resolveExportFilename(response?.headers, fallbackName)
    triggerDownload(blob, filename)
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

const handleExportCommand = (command) => {
  if (command === 'group') {
    handleExport(true)
  } else {
    handleExport(false)
  }
}

// 导入相关
const importDialogVisible = ref(false)
const importGroupOptions = ref([])
const importGroupLoading = ref(false)
const importFileList = ref([])
const importSubmitting = ref(false)
const treeSelectProps = { value: 'value', label: 'label', children: 'children' }

const importForm = reactive({
  department_id: null,
  group_id: null,
  files: []
})

const importRules = {
  department_id: [{ required: true, message: '请选择部门', trigger: 'change' }],
  files: [{ required: true, message: '请上传用例文件', trigger: 'change' }]
}

const transformGroupOptions = (nodes = []) =>
  nodes.map(node => ({
    value: node.id,
    label: node.name,
    children: node.children ? transformGroupOptions(node.children) : []
  }))

const loadImportGroups = async () => {
  if (!departmentId.value) {
    importGroupOptions.value = []
    return
  }
  importGroupLoading.value = true
  try {
    const resp = await caseGroupService.tree(departmentId.value)
    if (resp.success) {
      const children = resp.data?.children || []
      importGroupOptions.value = transformGroupOptions(children)
    }
  } finally {
    importGroupLoading.value = false
  }
}

const openImportDialog = async () => {
  if (!departmentId.value) {
    ElMessage.error('请先选择部门')
    return
  }
  Object.assign(importForm, {
    department_id: departmentId.value,
    group_id: filters.value.group_id || null,
    files: []
  })
  importFileList.value = []
  importDialogVisible.value = true
  await loadImportGroups()
  await nextTick()
  importFormRef.value?.clearValidate?.()
}

const handleFileChange = (uploadFile, uploadFiles) => {
  importForm.files = uploadFiles ? uploadFiles.map(item => item.raw).filter(Boolean) : []
  importFileList.value = uploadFiles ? [...uploadFiles] : []
  importFormRef.value?.validateField?.('files')
}

const handleFileRemove = (uploadFile, uploadFiles) => {
  importForm.files = uploadFiles ? uploadFiles.map(item => item.raw).filter(Boolean) : []
  importFileList.value = uploadFiles ? [...uploadFiles] : []
  importFormRef.value?.validateField?.('files')
}

const resolveImportMessage = (resp) => {
  if (resp.data && typeof resp.data === 'object') {
    const {
      message,
      success_count: successCount,
      failure_count: failureCount,
      failed_count: failedCount,
      total_count: totalCount
    } = resp.data
    if (message) return message
    const pieces = []
    if (totalCount !== undefined) pieces.push(`共 ${totalCount} 条`)
    if (successCount !== undefined) pieces.push(`成功 ${successCount} 条`)
    const failureValue = failureCount ?? failedCount
    if (failureValue !== undefined) pieces.push(`失败 ${failureValue} 条`)
    if (pieces.length) return `导入完成（${pieces.join('，')}）`
  }
  return resp.message || '导入成功'
}

const submitImport = () => {
  if (!importFormRef.value) return
  importFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (!importForm.files || importForm.files.length === 0) {
      ElMessage.error('请上传用例文件')
      return
    }
    importSubmitting.value = true
    try {
      const resp = await testCaseService.batchImportFromFile({
        department_id: importForm.department_id,
        group_id: importForm.group_id,
        files: importForm.files
      })
      if (resp.success) {
        ElMessage.success(resolveImportMessage(resp))
        importDialogVisible.value = false
        fetchCases()
        groupTreeRef.value?.refresh()
      }
    } finally {
      importSubmitting.value = false
    }
  })
}

const resetImportForm = () => {
  importFileList.value = []
  Object.assign(importForm, {
    department_id: departmentId.value || null,
    group_id: filters.value.group_id || null,
    files: []
  })
  importFormRef.value = null
}

// 搜索和重置
const handleSearch = () => {
  page.value = 1
  fetchCases()
}

const handleReset = () => {
  Object.assign(filters.value, {
    title: '',
    status: '',
    priority: '',
    case_type: '',
    keywords: '',
    group_id: null
  })
  page.value = 1
  groupTreeRef.value?.clearSelection()
  fetchCases()
}

const handleSizeChange = () => {
  page.value = 1
  fetchCases()
}

const handleRefresh = () => {
  fetchCases()
  groupTreeRef.value?.refresh()
}

// 工具函数
const parseKeywords = (val) => {
  if (!val) return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

onMounted(() => {
  fetchDepartments()
})

watch(departmentId, (val) => {
  importForm.department_id = val || null
  if (!val) {
    importGroupOptions.value = []
  } else if (importDialogVisible.value) {
    loadImportGroups()
  }
})
</script>

<style scoped>
.test-case-manage-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
}

.refresh-btn {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
}

.layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.group-tree {
  width: 300px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.case-table {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.table-title {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.import-btn {
  padding: 0 12px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.import-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.create-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.upload-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.toolbar {
  margin-bottom: 20px;
}

.search-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.search-form .el-form-item {
  margin-bottom: 16px;
  margin-right: 20px;
}

.search-form .el-form-item__label {
  color: #606266;
  font-weight: 500;
}

.search-form .el-input {
  width: 180px;
}

.search-form .el-select {
  width: 150px;
}

.search-form .el-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .layout {
    flex-direction: column;
    height: auto;
  }

  .group-tree {
    width: 100%;
    height: 400px;
  }

  .case-table {
    height: auto;
    position: static;
    top: auto;
  }
}

@media (max-width: 768px) {
  .test-case-manage-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .search-form {
    padding: 16px;
  }

  .search-form .el-form-item {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .search-form .el-input,
  .search-form .el-select {
    width: 100%;
  }
}
</style>
