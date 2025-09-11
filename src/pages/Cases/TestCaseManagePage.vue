<template>
  <div class="test-case-manage-page">
    <div class="group-tree-wrapper">
      <CaseGroupTree />
    </div>
    <div class="table-wrapper">
      <TestCaseTable />
    </div>
  </div>
</template>

<script setup>
import CaseGroupTree from '@/components/Cases/CaseGroupTree.vue'
import TestCaseTable from '@/components/Cases/TestCaseTable.vue'
import { useTestCasesStore } from '@/stores/modules/testCases'
import { onBeforeUnmount } from 'vue'

const testCasesStore = useTestCasesStore()

// reset store when leaving page to avoid stale state
onBeforeUnmount(() => {
  testCasesStore.resetState()
})
</script>

<style scoped>
.test-case-manage-page {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}
.group-tree-wrapper {
  width: 240px;
}
.table-wrapper {
  flex: 1;
}
</style>
