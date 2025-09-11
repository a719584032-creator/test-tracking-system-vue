<template>
  <el-table :data="cases" v-loading="loading" style="width: 100%">
    <el-table-column prop="title" label="标题" min-width="200" />
    <el-table-column prop="priority" label="优先级" width="100" />
    <el-table-column prop="status" label="状态" width="100" />
    <el-table-column prop="case_type" label="类型" width="120" />
    <el-table-column label="分组" min-width="120">
      <template #default="{ row }">
        {{ row.group?.name || '-' }}
      </template>
    </el-table-column>
    <el-table-column label="创建人" width="120">
      <template #default="{ row }">
        {{ row.creator?.username || '-' }}
      </template>
    </el-table-column>
    <el-table-column prop="created_at" label="创建时间" width="180" />
    <el-table-column label="操作" width="260">
      <template #default="{ row }">
        <el-button size="small" @click="$emit('view', row)">查看</el-button>
        <el-button size="small" type="primary" @click="$emit('edit', row)">编辑</el-button>
        <el-button size="small" @click="$emit('copy', row)">复制</el-button>
        <el-button size="small" type="danger" @click="$emit('delete', row)">删除</el-button>
        <el-button size="small" @click="$emit('history', row)">历史</el-button>
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

<style scoped>
</style>
