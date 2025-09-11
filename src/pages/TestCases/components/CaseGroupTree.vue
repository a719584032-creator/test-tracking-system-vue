<!-- ================== src/pages/TestCases/components/CaseGroupTree.vue ================== -->
<template>
  <el-tree
    v-loading="loading"
    :data="treeData"
    node-key="id"
    :props="treeProps"
    show-checkbox
    default-expand-all
    @check="handleCheck"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { caseGroupService } from '@/api/case-groups'

const emit = defineEmits(['selected'])

const treeData = ref([])
const loading = ref(false)
const treeProps = { label: 'name', children: 'children' }

const fetchTree = async () => {
  loading.value = true
  try {
    const resp = await caseGroupService.tree()
    if (resp.success) {
      treeData.value = resp.data || []
    }
  } catch (e) {
    console.error('获取用例分组失败', e)
    ElMessage.error('获取用例分组失败')
  } finally {
    loading.value = false
  }
}

const handleCheck = (_data, { checkedKeys }) => {
  emit('selected', checkedKeys)
}

onMounted(fetchTree)
</script>

<style scoped>
</style>
