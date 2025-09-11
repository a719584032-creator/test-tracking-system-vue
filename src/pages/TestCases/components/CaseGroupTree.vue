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
        @node-expand="onNodeExpand"
        @node-drop="onNodeDrop"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-content" :title="node.label">
              <el-icon class="node-icon">
                <FolderOpened v-if="data.type==='group' && node.expanded" />
                <Folder v-else-if="data.type==='group'" />
                <Document v-else />
              </el-icon>

              <span class="node-label">{{ node.label }}</span>

              <el-tag
                v-if="data.type === 'group' && data.caseCount > 0"
                type="info"
                size="small"
                class="case-count"
              >
                {{ data.caseCount }}
              </el-tag>
            </div>

            <!-- 右侧固定操作区：绝对定位，始终可点 -->
            <div class="node-actions" v-if="data.type === 'group'">
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
import { Plus, Edit, Delete, Folder, FolderOpened, Document } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { caseGroupService } from '@/api/caseGroups'
import { testCaseService } from '@/api/testCases'

const props = defineProps({ departmentId: Number })
const emit = defineEmits(['group-select', 'select', 'case-click'])

const treeRef = ref()
const loading = ref(false)
const treeData = ref([])
const selectedGroupId = ref(null)

const treeProps = { children: 'children', label: 'name' }

const fetchGroups = async () => {
  if (!props.departmentId) return
  loading.value = true
  try {
    const resp = await caseGroupService.tree(props.departmentId)
    if (resp.success && resp.data) {
      const rootChildren = resp.data.children || []

      // 只处理第一层
      treeData.value = processTreeData(rootChildren)

      // ⭐ 加载第一层分组的用例
      await Promise.all(
        treeData.value.map(node => updateGroupCases(node.id))
      )

      await nextTick(() => {
        // 默认展开第一层
        treeData.value.forEach(node => {
          treeRef.value.setExpandedKeys([node.id], true)
        })
      })
    }
  } finally {
    loading.value = false
  }
}


// 递归加载当前分组及子分组的用例
const loadGroupCasesRecursively = async (node) => {
  if (node.type === 'group') {
    await updateGroupCases(node.id)   // 给当前分组挂用例
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        await loadGroupCasesRecursively(child)
      }
    }
  }
}


const processTreeData = (nodes) =>
  nodes.map(n => ({
    ...n,
    type: 'group',
    caseCount: 0,
    children: n.children ? processTreeData(n.children) : []
  }))

const fetchGroupCases = async (groupId) => {
  try {
    const resp = await testCaseService.list(props.departmentId, {
      group_id: groupId,
      page: 1,
      page_size: 1000
    })
    if (resp.success && resp.data?.items) {
      return resp.data.items.map(c => ({
        id: `case_${c.id}`,
        name: c.title,
        type: 'case',
        caseData: c,
        children: []
      }))
    }
  } catch (e) { console.error('获取分组用例失败:', e) }
  return []
}

const updateGroupCases = async (groupId) => {
  const cases = await fetchGroupCases(groupId)
  const updateNode = (nodes) => {
    for (const node of nodes) {
      if (node.id === groupId && node.type === 'group') {
        node.children = (node.children || []).filter(ch => ch.type !== 'case')
        node.children.push(...cases)
        node.caseCount = cases.length
        return true
      }
      if (node.children && updateNode(node.children)) return true
    }
    return false
  }
  updateNode(treeData.value)
}

const onNodeClick = async (data, node) => {
  if (data.type === 'group') {
    selectedGroupId.value = data.id
    emit('group-select', data.id)
    emit('select', data.id)
    treeRef.value?.setCurrentKey(data.id)
    if (!node.expanded) node.expanded = true
    await updateGroupCases(data.id)
  } else {
    emit('case-click', data.caseData.id)
  }
}

const onNodeExpand = async (data) => {
  if (data.type === 'group') await updateGroupCases(data.id)
}

const allowDrag = (node) => node.data?.type === 'group'
const allowDrop = (draggingNode, dropNode, type) => {
  if (dropNode.data?.type === 'case' && type === 'inner') return false
  return true
}

const onNodeDrop = async (draggingNode, dropNode, type) => {
  if (draggingNode.data?.type !== 'group') return
  const parentId = (type === 'inner')
    ? (dropNode.data?.type === 'group' ? dropNode.data.id : dropNode.parent?.data?.id ?? null)
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

.tree-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ebeef5;
}
.tree-title { margin: 0; color: #303133; font-size: 16px; font-weight: 600; }
.create-btn { border-radius: 6px; font-size: 12px; padding: 6px 12px; }

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

/* 关键修复：为每一行预留右侧操作区，避免被长标题/深层缩进挤掉 */
.tree-node {
  position: relative;           /* 让 actions 绝对定位的参照物 */
  display: flex; align-items: center; width: 100%;
  padding-right: 76px;          /* 预留按钮位，保证按钮永远在可点击区域 */
}

/* 内容区允许省略号真正生效，并不挤占 actions */
.node-content {
  display: flex; align-items: center; gap: 8px; flex: 1;
  min-width: 0;                 /* 关键：让子元素能收缩并出现省略号 */
}

.node-icon { font-size: 16px; color: #606266; }
.group-tree :deep(.el-tree-node.is-current) .node-icon { color: #1677ff; }

.node-label {
  font-size: 14px; color: #303133; flex: 1;
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.case-count {
  font-size: 11px; padding: 2px 6px; border-radius: 8px;
  background: #f0f0f0; color: #666; border: none; flex-shrink: 0;
}

/* 操作区固定在最右侧，层级提高，始终可点 */
.node-actions {
  position: absolute; top: 50%; right: 8px; transform: translateY(-50%);
  display: flex; gap: 4px; z-index: 2;
}

.node-actions .el-button { padding: 4px; border-radius: 4px; }

/* 可选：若想仅悬浮显示，把下面两行打开即可（默认始终可见以保证可点性）*/
.tree-node .node-actions { opacity: 0; pointer-events: none; transition: opacity .15s ease; }
.tree-node:hover .node-actions { opacity: 1; pointer-events: auto; }


@media (max-width: 768px) {
  .tree-header { flex-direction: column; gap: 8px; align-items: stretch; }
  .create-btn { width: 100%; }
  .node-label { font-size: 13px; }
  .case-count { font-size: 10px; }
}
</style>
