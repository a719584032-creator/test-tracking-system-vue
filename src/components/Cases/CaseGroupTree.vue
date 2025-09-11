<template>
  <div class="case-group-tree">
    <el-tree
      :data="treeData"
      node-key="id"
      :highlight-current="true"
      :default-expanded-keys="expandedKeys"
      @node-click="handleNodeClick"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useTestCasesStore } from '@/stores/modules/testCases'

const testCasesStore = useTestCasesStore()

// mock tree data, normally fetched from API
const treeData = ref([
  {
    id: 1,
    label: '部门A',
    children: [
      { id: 11, label: '分组1', departmentId: 1 },
      { id: 12, label: '分组2', departmentId: 1 }
    ]
  },
  {
    id: 2,
    label: '部门B',
    children: [
      { id: 21, label: '分组3', departmentId: 2 }
    ]
  }
])

const expandedKeys = ref([1, 2])

const handleNodeClick = (node) => {
  const departmentId = node.departmentId || node.id
  const groupId = node.children ? null : node.id
  testCasesStore.changeGroup({ departmentId, groupId })
}

// keep tree selection in sync with store
watch(
  () => testCasesStore.selectedGroupId,
  (id) => {
    if (id) {
      expandedKeys.value = [testCasesStore.selectedDepartmentId]
    }
  }
)
</script>

<style scoped>
.case-group-tree {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
