<template>
  <div class="test-case-table">
    <div class="filter-bar">
      <el-input
        v-model="localFilters.keyword"
        placeholder="搜索关键字"
        style="width: 200px"
        @keyup.enter="applyFilters"
      />
      <el-select v-model="localFilters.status" placeholder="状态" style="width: 140px" clearable>
        <el-option label="全部" value="" />
        <el-option label="通过" value="passed" />
        <el-option label="失败" value="failed" />
      </el-select>
      <el-button type="primary" @click="applyFilters">搜索</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <div class="selected-info">
      当前部门: {{ testCasesStore.selectedDepartmentId }}<br />
      当前分组: {{ testCasesStore.selectedGroupId }}
    </div>

    <!-- 用例表格（示例） -->
    <el-table :data="[]" style="width: 100%">
      <el-table-column label="用例名称" />
    </el-table>

    <el-pagination
      class="pagination"
      background
      layout="prev, pager, next"
      v-model:current-page="testCasesStore.pagination.page"
      v-model:page-size="testCasesStore.pagination.pageSize"
      :total="testCasesStore.pagination.total"
    />
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useTestCasesStore } from '@/stores/modules/testCases'

const testCasesStore = useTestCasesStore()
const localFilters = reactive({ ...testCasesStore.filters })

const applyFilters = () => {
  testCasesStore.setFilters(localFilters)
}

const reset = () => {
  Object.assign(localFilters, { keyword: '', creator: '', status: '' })
  testCasesStore.resetState()
}
</script>

<style scoped>
.test-case-table {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.selected-info {
  margin-bottom: 16px;
  color: #666;
}
.pagination {
  margin-top: 16px;
  text-align: center;
}
</style>
