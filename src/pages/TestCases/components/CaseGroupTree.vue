<template>
  <el-tree
    :data="groups"
    node-key="id"
    :props="treeProps"
    highlight-current
    default-expand-all
    @node-click="handleSelect"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { testCaseService } from '@/api/testCases'

const emit = defineEmits(['select'])

const groups = ref([])
const treeProps = { label: 'name', children: 'children' }

const fetchGroups = async () => {
  const resp = await testCaseService.groups()
  if (resp.success) {
    groups.value = resp.data || []
  }
}

const handleSelect = (data) => {
  emit('select', data.id)
}

onMounted(fetchGroups)
</script>
