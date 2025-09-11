<template>
  <el-table :data="cases" v-loading="loading" style="width: 100%">
    <el-table-column label="标题" min-width="200">
      <template #default="{ row }">
        <router-link
          class="case-title"
          :to="{ name: 'TestCaseDetail', params: { id: row.id } }"
        >
          {{ row.title }}
        </router-link>
      </template>
    </el-table-column>
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
    <el-table-column label="操作" width="240">
      <template #default="{ row }">
        <div class="actions">
          <el-button size="small" type="primary" @click="$emit('edit', row)">编辑</el-button>
          <el-button size="small" @click="$emit('copy', row)">复制</el-button>
          <el-button size="small" type="danger" @click="$emit('delete', row)">删除</el-button>
          <el-button size="small" @click="$emit('history', row)">历史</el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
defineProps({
  cases: { type: Array, default: () => [] },
  loading: Boolean
})

defineEmits(['edit', 'copy', 'delete', 'history'])
</script>

<style scoped>
.case-title {
  color: #409eff;
}
.actions {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}
</style>
