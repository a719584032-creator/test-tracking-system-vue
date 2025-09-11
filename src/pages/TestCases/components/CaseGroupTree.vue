
<template>
  <div class="case-group-tree">
    <div class="group-actions">
      <el-button size="small" @click="handleAdd">新增</el-button>
      <el-button size="small" :disabled="!currentId" @click="handleRename">修改</el-button>
      <el-button size="small" :disabled="!currentId" @click="handleCopy">复制</el-button>
      <el-button size="small" type="danger" :disabled="!currentId" @click="handleDelete">删除</el-button>
    </div>
    <el-tree
      ref="treeRef"
      :data="groups"
      node-key="id"
      :props="treeProps"
      highlight-current
      default-expand-all
      draggable
      :allow-drop="allowDrop"
      @node-click="handleSelect"
      @node-drop="handleDrop"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { caseGroupService } from '@/api/caseGroups'

const emit = defineEmits(['select'])
const props = defineProps({
  departmentId: Number
})

const groups = ref([])
const treeRef = ref()
const currentId = ref(null)
const treeProps = { label: 'name', children: 'children' }

const fetchGroups = async () => {
  if (!props.departmentId) {
    groups.value = []
    return
  }
  const resp = await caseGroupService.tree(props.departmentId)
  if (resp.success) {
    // 后端返回的树包含根节点，这里仅展示其 children
    groups.value = resp.data?.children || []
  }
}

const handleSelect = (data) => {
  currentId.value = data.id
  emit('select', data.id)
}

const clearSelection = () => {
  currentId.value = null
  treeRef.value?.setCurrentKey(null)
}

const handleAdd = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入分组名称', '新增分组', {
      inputValidator: v => !!v || '名称不能为空'
    })
    const payload = {
      name: value,
      department_id: props.departmentId,
      parent_id: currentId.value
    }
    const resp = await caseGroupService.create(payload)
    if (resp.success) {
      await fetchGroups()
    }
  } catch {}
}

const handleRename = async () => {
  if (!currentId.value) return
  const node = treeRef.value.getCurrentNode()
  try {
    const { value } = await ElMessageBox.prompt('请输入新的分组名称', '修改分组', {
      inputValue: node.name,
      inputValidator: v => !!v || '名称不能为空'
    })
    const resp = await caseGroupService.update(currentId.value, { name: value })
    if (resp.success) {
      await fetchGroups()
    }
  } catch {}
}

const handleDelete = async () => {
  if (!currentId.value) return
  try {
    await ElMessageBox.confirm('确认删除该分组吗？', '提示', { type: 'warning' })
    const resp = await caseGroupService.delete(currentId.value)
    if (resp.success) {
      await fetchGroups()
      clearSelection()
    }
  } catch {}
}

const handleCopy = async () => {
  if (!currentId.value) return
  const node = treeRef.value.getCurrentNode()
  try {
    const { value } = await ElMessageBox.prompt('请输入新分组名称', '复制分组', {
      inputValidator: v => !!v || '名称不能为空'
    })
    const parentNode = treeRef.value.getNode(currentId.value)?.parent
    const payload = {
      name: value,
      parent_id: parentNode ? parentNode.data.id : null
    }
    const resp = await caseGroupService.copy(currentId.value, payload)
    if (resp.success) {
      await fetchGroups()
    }
  } catch {}
}

const allowDrop = () => true

const handleDrop = async (draggingNode, dropNode, type) => {
  const parentId = type === 'inner' ? dropNode.data.id : dropNode.parent?.data?.id || null
  const resp = await caseGroupService.update(draggingNode.data.id, { parent_id: parentId })
  if (resp.success) {
    await fetchGroups()
  }
}

onMounted(fetchGroups)
watch(() => props.departmentId, () => {
  clearSelection()
  fetchGroups()
})

defineExpose({ clearSelection })
</script>

<style scoped>
.el-tree-node.is-current > .el-tree-node__content {
  background-color: #409eff;
  color: #fff;
}
.group-actions {
  margin-bottom: 10px;
  display: flex;
  gap: 4px;
}
</style>
