
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
import { ref, watch, onMounted } from 'vue'
import { caseGroupService } from '@/api/caseGroups'

const emit = defineEmits(['select'])
const props = defineProps({
  departmentId: Number
})

const groups = ref([])
const treeProps = { label: 'name', children: 'children' }

const fetchGroups = async () => {
  if (!props.departmentId) {
    groups.value = []
    return
  }
  const resp = await caseGroupService.tree(props.departmentId)
  if (resp.success) {
    groups.value = resp.data || []
  }
}

const handleSelect = (data) => {
  emit('select', data.id)
}

onMounted(fetchGroups)
watch(() => props.departmentId, fetchGroups)
</script>
