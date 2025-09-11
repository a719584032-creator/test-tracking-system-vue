<template>
  <el-table :data="cases" v-loading="loading" style="width: 100%">
    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column prop="title" label="标题" min-width="200">
      <template #default="{ row }">
        <el-link type="primary" @click="$emit('view', row)">{{ row.title }}</el-link>
      </template>
    </el-table-column>
    <el-table-column prop="priority" label="优先级" width="100" />
    <el-table-column label="操作" width="260">
      <template #default="{ row }">
        <el-button type="primary" link size="small" @click="$emit('edit', row)">编辑</el-button>
        <el-button type="primary" link size="small" @click="$emit('copy', row)">复制</el-button>
        <el-button type="primary" link size="small" @click="$emit('history', row)">历史</el-button>
        <el-button type="danger" link size="small" @click="$emit('delete', row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
defineProps({
  cases: { type: Array, default: () => [] },
  loading: Boolean
})

defineEmits(['edit', 'copy', 'delete', 'history', 'view'])
</script>
