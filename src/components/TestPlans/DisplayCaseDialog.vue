<template>
  <el-dialog
    v-model="visible"
    title="创建 DisplayCase"
    width="1000px"
    top="5vh"
    :close-on-click-modal="false"
    class="custom-display-dialog"
    @close="handleClose"
  >
    <div class="display-case-container">
      <div class="form-section">
        <el-form
          :model="formData"
          label-width="auto"
          size="small"
          class="display-case-form"
        >
          <div class="section-title">
            <span class="bar"></span>系统设置 (System Config)
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="System Port">
                <el-select v-model="formData.system_port" placeholder="选择端口">
                  <el-option v-for="o in systemPortOptions" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="LCD State">
                <el-select v-model="formData.lcd_state" placeholder="LCD状态">
                  <el-option v-for="o in lcdOptions" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Monitor Qty">
                <el-select v-model="formData.monitor_qty" placeholder="数量">
                  <el-option v-for="o in monitorQtyOptions" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="section-title mt-2">
            <span class="bar"></span>显示器配置 (Monitor Config)
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="TBT Monitor">
                <el-select v-model="formData.tbt_monitor" placeholder="Resolution" clearable filterable>
                  <el-option v-for="o in monitorOptions" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="TYPE-C">
                <el-select v-model="formData.type_c_monitor" placeholder="Resolution" clearable filterable>
                  <el-option v-for="o in monitorOptions" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="DP1/DP5/DP L">
                <el-select v-model="formData.dp1_monitor" placeholder="Resolution" clearable filterable>
                  <el-option v-for="o in monitorOptions" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="DP2/DP6/DP R">
                <el-select v-model="formData.dp2_monitor" placeholder="Resolution" clearable filterable>
                  <el-option v-for="o in monitorOptions" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="HDMI1">
                <el-select v-model="formData.hdmi1_monitor" placeholder="Resolution" clearable filterable>
                  <el-option v-for="o in monitorOptions" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="HDMI2">
                <el-select v-model="formData.hdmi2_monitor" placeholder="Resolution" clearable filterable>
                  <el-option v-for="o in monitorOptions" :key="o" :label="o" :value="o" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div class="action-bar">
          <el-button type="primary" :icon="Plus" @click="handleAddSelection">
            添加至列表
          </el-button>
        </div>
      </div>

      <el-table
        :data="selections"
        height="350"
        border
        stripe
        size="small"
        class="custom-table"
        empty-text="暂无显示器组合，请在上方添加"
      >
        <el-table-column fixed="left" width="40" align="center">
          <template #default="{ row }">
            <el-tooltip content="移除此行" placement="top" :enterable="false">
              <el-button
                link
                type="danger"
                class="icon-btn-danger"
                :icon="Delete"
                @click="handleRemoveSelection(row)"
              />
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column prop="system_port" label="System Port" min-width="100" show-overflow-tooltip />
        <el-table-column prop="lcd_state" label="LCD" width="70" align="center" />
        <el-table-column prop="monitor_qty" label="Qty" width="60" align="center" />
        <el-table-column prop="tbt_monitor" label="TBT Monitor" min-width="140" show-overflow-tooltip />
        <el-table-column prop="type_c_monitor" label="TYPE-C" min-width="140" show-overflow-tooltip />
        <el-table-column prop="dp1_monitor" label="DP1/DP5/DP L" min-width="140" show-overflow-tooltip />
        <el-table-column prop="dp2_monitor" label="DP2/DP6/DP R" min-width="140" show-overflow-tooltip />
        <el-table-column prop="hdmi1_monitor" label="HDMI1" min-width="130" show-overflow-tooltip />
        <el-table-column prop="hdmi2_monitor" label="HDMI2" min-width="130" show-overflow-tooltip />
      </el-table>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <span class="left-tip">已添加 {{ selections.length }} 组配置</span>
          <el-checkbox v-model="exportToLocal">同时生成本地用例</el-checkbox>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleGenerate">
            生成用例
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { testPlansApi } from '@/api/testPlans'
import { downloadFile } from '@/utils/download'
import * as XLSX from 'xlsx'
import { Delete, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  planId: { type: Number, required: true }
})
const emit = defineEmits(['success'])

const visible = ref(false)
const submitting = ref(false)
const selections = ref([])
const nextRowId = ref(1)
const exportToLocal = ref(true)

// Options definitions...
const systemPortOptions = ['TBT Port', 'USB-C Port']
const lcdOptions = ['On', 'Off']
const monitorQtyOptions = ['1', '2', '3', '4']
const monitorOptions = [
  '7680*4320*60', '7680*4320*30', '5120*2160*60', '5120*2160*30',
  '3840*2160*240', '3440*1440*100', '3840*2160*144', '3840*2160*120',
  '3840*2160*60', '3840*2160*59', '3840*2160*30', '3840*2160*29',
  '2560*1440*60', '2560*1440*59', '1920*1200*60', '1920*1200*59',
  '1920*1080*60', '1920*1080*59', '1024*768*60', '1024*768*59',
  '1024*768*30', '1024*768*29'
]

const formData = reactive({
  system_port: systemPortOptions[0],
  lcd_state: lcdOptions[0],
  monitor_qty: monitorQtyOptions[0],
  tbt_monitor: '',
  type_c_monitor: '',
  dp1_monitor: '',
  dp2_monitor: '',
  hdmi1_monitor: '',
  hdmi2_monitor: ''
})

const normalizeValue = (value) => value ? String(value).trim() : ''

const resetForm = () => {
  formData.system_port = systemPortOptions[0]
  formData.lcd_state = lcdOptions[0]
  formData.monitor_qty = monitorQtyOptions[0]
  formData.tbt_monitor = ''
  formData.type_c_monitor = ''
  formData.dp1_monitor = ''
  formData.dp2_monitor = ''
  formData.hdmi1_monitor = ''
  formData.hdmi2_monitor = ''
}

const buildSelection = () => ({
  id: nextRowId.value++,
  system_port: normalizeValue(formData.system_port),
  lcd_state: normalizeValue(formData.lcd_state),
  monitor_qty: normalizeValue(formData.monitor_qty),
  tbt_monitor: normalizeValue(formData.tbt_monitor),
  type_c_monitor: normalizeValue(formData.type_c_monitor),
  dp1_monitor: normalizeValue(formData.dp1_monitor),
  dp2_monitor: normalizeValue(formData.dp2_monitor),
  hdmi1_monitor: normalizeValue(formData.hdmi1_monitor),
  hdmi2_monitor: normalizeValue(formData.hdmi2_monitor)
})

const hasMonitorSelection = (selection) =>
  Boolean(selection.tbt_monitor || selection.type_c_monitor || selection.dp1_monitor ||
          selection.dp2_monitor || selection.hdmi1_monitor || selection.hdmi2_monitor)

const handleAddSelection = () => {
  const selection = buildSelection()
  if (!selection.system_port || !selection.lcd_state || !selection.monitor_qty) {
    ElMessage.warning('请检查系统设置是否完整。')
    return
  }
  if (!hasMonitorSelection(selection)) {
    ElMessage.info('请至少选择一个显示器分辨率。')
    return
  }
  // 新增的数据插到最前面，方便用户确认
  selections.value.unshift(selection)
  // 不重置系统设置，只重置分辨率，方便连续添加
  formData.tbt_monitor = ''
  formData.type_c_monitor = ''
  formData.dp1_monitor = ''
  formData.dp2_monitor = ''
  formData.hdmi1_monitor = ''
  formData.hdmi2_monitor = ''
}

const handleRemoveSelection = (row) => {
  const index = selections.value.findIndex((item) => item.id === row.id)
  if (index !== -1) selections.value.splice(index, 1)
}

const displayCaseTitlePrefix = 'DisPlayMartixCase'
const displayCasePrefixes = ['DisPlayMartixCase', 'DisPlayMatrixCase', 'DisPlayCase']
const stepOneAction =
  'Please check attached table, try each connection scenario(one/two/three monitor), set the resolition to max in spec, and set display mode to extend. Them do action for each scenario, below action for 5 cycles each. (Attachment is an example)\n' +
  'LID close S3,start menu S3,start menu S4,Restart,hot plug,display off(1min),Cold boot'

const expectedResultText =
  '1. No error message\n2. No blinking\n3. No garbage\n4. Monitor display normal\n5. Display mode can keep\n6.Resolution and refresh rate can keep'

const fetchAllPlanCases = async () => {
  if (!props.planId) return []
  const pageSize = 100
  let page = 1
  let total = 0
  let allCases = []
  while (true) {
    const response = await testPlansApi.getCases(props.planId, {
      page,
      page_size: pageSize
    })
    if (!response?.success) return []
    const payload = response.data || {}
    const items = Array.isArray(payload.items) ? payload.items : []
    total = Number(payload.total) || 0
    allCases = allCases.concat(items)
    if (allCases.length >= total || items.length === 0) break
    page += 1
  }
  return allCases
}

const resolveNextIndex = async () => {
  const planCases = await fetchAllPlanCases()
  let maxIndex = 0
  planCases.forEach((caseItem) => {
    const title = normalizeValue(caseItem.title || caseItem.case_title)
    if (!title) return
    displayCasePrefixes.forEach((prefix) => {
      if (!title.startsWith(prefix)) return
      const suffix = title.slice(prefix.length)
      if (/^\d+$/.test(suffix)) {
        maxIndex = Math.max(maxIndex, Number(suffix))
      }
    })
  })
  return maxIndex + 1
}
const buildActionText = (selection) =>
  JSON.stringify({
    system_port: selection.system_port,
    lcd_off_on: selection.lcd_state,
    monitor_qty: selection.monitor_qty,
    tbt_monitor: selection.tbt_monitor,
    type_c_monitor: selection.type_c_monitor,
    dp1_monitor: selection.dp1_monitor,
    dp2_monitor: selection.dp2_monitor,
    hdmi1_monitor: selection.hdmi1_monitor,
    hdmi2_monitor: selection.hdmi2_monitor
  })

const templateFilename = '飞雁测试用例模板.xlsx'

const buildStepsText = (steps = []) => {
  if (!Array.isArray(steps)) return ''
  return steps
    .filter((step) => step && step.action)
    .map((step, index) => `${step.no ?? index + 1}. ${step.action}`)
    .join('\n')
}

const findHeaderMap = (rows) => {
  const maxScan = Math.min(rows.length, 20)
  for (let rowIndex = 0; rowIndex < maxScan; rowIndex += 1) {
    const row = rows[rowIndex] || []
    const normalized = row.map((cell) => String(cell || '').trim())
    const findIndex = (keywords) =>
      normalized.findIndex((text) => text && keywords.some((key) => text.includes(key)))
    const dirIndex = findIndex(['类别目录第一层级'])
    const keywordIndex = findIndex(['关键字'])
    const titleIndex = findIndex(['用例名称'])
    const stepsIndex = findIndex(['测试步骤'])
    const expectedIndex = findIndex(['测试标准'])
    if (
      titleIndex !== -1 &&
      stepsIndex !== -1 &&
      expectedIndex !== -1 &&
      dirIndex !== -1 &&
      keywordIndex !== -1
    ) {
      return {
        rowIndex,
        maxCol: Math.max(
          normalized.length - 1,
          dirIndex,
          keywordIndex,
          titleIndex,
          stepsIndex,
          expectedIndex
        ),
        columns: {
          dirIndex,
          keywordIndex,
          titleIndex,
          stepsIndex,
          expectedIndex
        }
      }
    }
  }
  return null
}

const fetchTemplateWorkbook = async () => {
  const templateUrl = `${import.meta.env.BASE_URL}${encodeURI(templateFilename)}`
  const response = await fetch(templateUrl)
  if (!response.ok) {
    throw new Error('模板文件加载失败')
  }
  const arrayBuffer = await response.arrayBuffer()
  return XLSX.read(arrayBuffer, { type: 'array' })
}

const resolveNextInsertRow = (rows, headerRowIndex) => {
  if (!rows.length) return headerRowIndex + 1
  let lastIndex = rows.length - 1
  while (lastIndex > headerRowIndex) {
    const row = rows[lastIndex] || []
    const hasValue = row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    if (hasValue) break
    lastIndex -= 1
  }
  return Math.max(lastIndex + 1, headerRowIndex + 1)
}

const generateLocalTemplate = async (cases) => {
  const workbook = await fetchTemplateWorkbook()
  const sheetName = workbook.SheetNames?.[0]
  if (!sheetName) throw new Error('模板表格为空')
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })
  const headerMap = findHeaderMap(rows)
  if (!headerMap) {
    throw new Error('未找到模板表头，请检查模板格式')
  }
  const { rowIndex, maxCol, columns } = headerMap
  const insertRow = resolveNextInsertRow(rows, rowIndex)
  const outputRows = cases.map((caseItem) => {
    const row = new Array(maxCol + 1).fill('')
    row[columns.dirIndex] = 'DisPlayCase'
    row[columns.keywordIndex] = 'display'
    row[columns.titleIndex] = caseItem.title || ''
    row[columns.stepsIndex] = buildStepsText(caseItem.steps)
    row[columns.expectedIndex] = caseItem.expected_result || ''
    return row
  })
  XLSX.utils.sheet_add_aoa(sheet, outputRows, { origin: { r: insertRow, c: 0 } })
  const outBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const timestamp = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  const timeLabel = `${pad(timestamp.getHours())}${pad(timestamp.getMinutes())}${pad(timestamp.getSeconds())}`
  const filename = `displaycase_${timeLabel}.xlsx`
  const blob = new Blob([outBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  downloadFile(blob, filename)
}

const handleGenerate = async () => {
  if (!props.planId) return ElMessage.info('请先选择计划')
  if (!selections.value.length) return ElMessage.info('列表为空')

  submitting.value = true
  try {
    const startIndex = await resolveNextIndex()
    const cases = selections.value.map((selection, offset) => ({
      title: `${displayCaseTitlePrefix}${startIndex + offset}`,
      steps: [
        { no: 1, action: stepOneAction, expected: '' },
        { no: 2, action: buildActionText(selection), expected: '' }
      ],
      expected_result: expectedResultText,
      priority: 'P1',
      group_path: 'root/DisPlayCase',
      compatibility_testing: false
    }))
    if (exportToLocal.value) {
      try {
        await generateLocalTemplate(cases)
      } catch (error) {
        console.error(error)
        ElMessage.warning(error?.message || '本地模板生成失败')
      }
    }
    const response = await testPlansApi.createDisplayMatrixCases(props.planId, cases)
    if (response?.success) {
      ElMessage.success('生成成功')
      visible.value = false
      selections.value = []
      resetForm()
      emit('success')
    }
  } catch (error) {
    ElMessage.error('生成失败')
  } finally {
    submitting.value = false
  }
}

const open = () => {
  resetForm()
  selections.value = []
  exportToLocal.value = true
  visible.value = true
}
const handleClose = () => {
  visible.value = false
}

defineExpose({ open })
</script>

<style scoped>
.display-case-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  background-color: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.section-title .bar {
  display: inline-block;
  width: 3px;
  height: 12px;
  background-color: var(--el-color-primary);
  margin-right: 8px;
  border-radius: 2px;
}

.mt-2 {
  margin-top: 8px;
}

/* 压缩 Form Item 的下间距 */
.display-case-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color);
}

/* 表格样式微调 */
.custom-table :deep(.el-table__header th) {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-regular);
  font-weight: 600;
  padding: 6px 0; /* 压缩表头高度 */
}

.custom-table :deep(.el-table__cell) {
  padding: 4px 0; /* 压缩行高 */
}

.icon-btn-danger {
  font-size: 14px;
  color: var(--el-color-info);
  transition: all 0.2s;
}

.icon-btn-danger:hover {
  color: var(--el-color-danger);
  background-color: var(--el-color-danger-light-9);
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.left-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
