<template>
  <div class="case-group-tree">
    <div class="tree-header">
      <h3 class="tree-title">用例分组</h3>
      <el-button
        type="primary"
        size="small"
        @click="onCreateGroup"
        class="create-btn"
      >
        <el-icon><Plus /></el-icon>
        新建分组
      </el-button>
    </div>

    <div class="tree-content">
      <el-tree
        ref="treeRef"
        :data="treeData"
        node-key="id"
        :props="treeProps"
        :expand-on-click-node="false"
        :highlight-current="true"
        default-expand-all
        draggable
        :allow-drag="allowDrag"
        :allow-drop="allowDrop"
        v-loading="loading"
        class="group-tree"
        @node-click="onNodeClick"
        @node-drop="onNodeDrop"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-content" :title="node.label">
              <el-icon class="node-icon">
                <FolderOpened v-if="node.expanded" />
                <Folder v-else />
              </el-icon>
              <span class="node-label">{{ node.label }}</span>
            </div>

            <!-- 操作区（悬浮显示） -->
            <div class="node-actions" v-if="data.type === 'group'">
              <el-button
                type="primary"
                size="small"
                text
                @click.stop="onCopyGroup(data)"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button
                type="primary"
                size="small"
                text
                @click.stop="onEditGroup(data)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click.stop="onDeleteGroup(data)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Plus, Edit, Delete, Folder, FolderOpened, CopyDocument } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { caseGroupService } from '@/api/caseGroups'

const props = defineProps({ departmentId: Number })
const emit = defineEmits(['group-select', 'select'])

const treeRef = ref()
const loading = ref(false)
const treeData = ref([])
const selectedGroupId = ref(null)

const treeProps = { children: 'children', label: 'name' }

// 仅保留分组结构
const processTreeData = (nodes) =>
  (nodes || []).map(n => ({
    ...n,
    type: 'group',
    children: n.children ? processTreeData(n.children) : []
  }))

const fetchGroups = async () => {
  if (!props.departmentId) return
  loading.value = true
  try {
    const resp = await caseGroupService.tree(props.departmentId)
    if (resp.success && resp.data) {
      const rootChildren = resp.data.children || []
      treeData.value = processTreeData(rootChildren)
    }
  } finally {
    loading.value = false
  }
}

const onNodeClick = (data) => {
  // 只有分组
  selectedGroupId.value = data.id
  emit('group-select', data.id)
  emit('select', data.id)
  treeRef.value?.setCurrentKey(data.id)
}

const allowDrag = (node) => node.data?.type === 'group'
const allowDrop = () => true  // 只有分组，全部允许

const onNodeDrop = async (draggingNode, dropNode, type) => {
  if (draggingNode.data?.type !== 'group') return
  const parentId = (type === 'inner')
    ? dropNode.data?.id ?? null
    : (dropNode.parent?.data?.id ?? null)

  const resp = await caseGroupService.update(draggingNode.data.id, { parent_id: parentId })
  if (resp.success) {
    await fetchGroups()
    await nextTick()
    treeRef.value?.setCurrentKey(draggingNode.data.id)
  }
}

const onCreateGroup = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入分组名称', '新增分组', {
      inputValidator: v => !!v || '名称不能为空'
    })
    const payload = {
      name: value,
      department_id: props.departmentId,
      parent_id: selectedGroupId.value ?? null
    }
    const resp = await caseGroupService.create(payload)
    if (resp.success) await fetchGroups()
  } catch {}
}

const onEditGroup = async (data) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的分组名称', '修改分组', {
      inputValue: data.name,
      inputValidator: v => !!v || '名称不能为空'
    })
    const resp = await caseGroupService.update(data.id, { name: value })
    if (resp.success) {
      await fetchGroups()
      await nextTick()
      treeRef.value?.setCurrentKey(data.id)
    }
  } catch {}
}

const onDeleteGroup = async (data) => {
  try {
    await ElMessageBox.confirm('确认删除该分组吗？', '提示', { type: 'warning' })
    const resp = await caseGroupService.delete(data.id)
    if (resp.success) {
      if (selectedGroupId.value === data.id) selectedGroupId.value = null
      await fetchGroups()
    }
  } catch {}
}

const onCopyGroup = async (data) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入复制后的分组名称', '复制分组', {
      inputValue: `${data.name} - 副本`,
      inputValidator: v => !!v || '名称不能为空'
    })
    const resp = await caseGroupService.copy(data.id, { new_name: value })
    if (resp.success) {
      await fetchGroups()
      await nextTick()
      const newGroupId = resp.data?.id ?? data.id
      selectedGroupId.value = newGroupId
      treeRef.value?.setCurrentKey(newGroupId)
      if (resp.data?.id) {
        emit('group-select', newGroupId)
        emit('select', newGroupId)
      }
    }
  } catch {}
}

const clearSelection = () => {
  selectedGroupId.value = null
  treeRef.value?.setCurrentKey(null)
}
const refresh = () => fetchGroups()

watch(() => props.departmentId, () => { fetchGroups() }, { immediate: true })

defineExpose({ clearSelection, refresh, fetchGroups: refresh })
</script>

<style scoped>
.case-group-tree { height: 100%; display: flex; flex-direction: column; }

/* 头部 */
.tree-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ebeef5;
}
.tree-title { margin: 0; color: #303133; font-size: 16px; font-weight: 600; }
.create-btn { border-radius: 6px; font-size: 12px; padding: 6px 12px; }

/* 内容区 */
.tree-content { flex: 1; overflow: auto; }
.group-tree { background: transparent; }

/* 行样式 & 高亮 */
.group-tree :deep(.el-tree-node__content) {
  height: 36px; border-radius: 6px; margin-bottom: 2px; transition: all 0.2s ease;
}
.group-tree :deep(.el-tree-node__content:hover) { background-color: #f0f9ff; }
.group-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #e6f4ff; border: 1px solid #91caff; color: #1677ff; font-weight: 500;
}

/* 每行预留右侧操作区（避免被长标题挤掉） */
.tree-node {
  position: relative;
  display: flex; align-items: center; width: 100%;
  padding-right: 108px;
}

.node-content {
  display: flex; align-items: center; gap: 8px; flex: 1;
  min-width: 0;
}
.node-icon { font-size: 16px; color: #606266; }
.group-tree :deep(.el-tree-node.is-current) .node-icon { color: #1677ff; }

.node-label {
  font-size: 14px; color: #303133; flex: 1;
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* 操作区（悬浮显示） */
.node-actions {
  position: absolute; top: 50%; right: 8px; transform: translateY(-50%);
  display: flex; gap: 4px; z-index: 2;
}
.node-actions .el-button { padding: 4px; border-radius: 4px; }
.tree-node .node-actions { opacity: 0; pointer-events: none; transition: opacity .15s ease; }
.tree-node:hover .node-actions { opacity: 1; pointer-events: auto; }

@media (max-width: 768px) {
  .tree-header { flex-direction: column; gap: 8px; align-items: stretch; }
  .create-btn { width: 100%; }
  .node-label { font-size: 13px; }
}
</style>
