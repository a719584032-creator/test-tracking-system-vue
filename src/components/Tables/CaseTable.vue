<template>
  <el-card shadow="never">
    <el-table :data="data" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="caseTitle" label="用例标题" min-width="260" />
      <el-table-column prop="tester" label="测试人员" width="120" />
      <el-table-column prop="modelName" label="机型" width="140" />
      <el-table-column prop="phase" label="阶段" width="120" />
      <el-table-column prop="moduleName" label="模块" width="160" />
      <el-table-column prop="sheetName" label="Sheet" width="160" />
      <el-table-column prop="planName" label="测试计划" width="200" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="$emit('view', row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pager">
      <el-pagination
        background
        layout="total, prev, pager, next, sizes"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @update:current-page="$emit('update:page', $event)"
        @update:page-size="$emit('update:pageSize', $event)"
      />
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  data: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  loading: { type: Boolean, default: false }
})

defineEmits(['update:page', 'update:pageSize', 'view'])
</script>

<style scoped>
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
