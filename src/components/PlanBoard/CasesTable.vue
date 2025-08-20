<template>
  <el-card class="cases-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>用例执行详情</span>
        <div class="header-actions">
          <el-button type="primary" @click="$emit('refresh')" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </template>

    <el-table
      :data="cases"
      :loading="loading"
      stripe
      style="width: 100%"
      empty-text="暂无数据"
      height="600"
      :header-cell-style="tableHeaderStyle"
    >
      <el-table-column prop="序号" label="序号" width="70" align="center" fixed="left" />
      <el-table-column prop="用例标题" label="用例标题" min-width="250" show-overflow-tooltip fixed="left" />
      <el-table-column prop="测试结果" label="测试结果" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="getResultType(row.测试结果)"
            size="small"
            v-if="row.测试结果"
          >
            {{ getResultText(row.测试结果) }}
          </el-tag>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="测试耗时(S)" label="测试耗时(S)" width="120" align="center">
        <template #default="{ row }">
          <span v-if="row['测试耗时(S)'] && row['测试耗时(S)'] !== '-'">{{ row['测试耗时(S)'] }}s</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="前置条件" label="前置条件" min-width="200" show-overflow-tooltip />
      <el-table-column prop="用例步骤" label="用例步骤" min-width="300" show-overflow-tooltip />
      <el-table-column prop="预期结果" label="预期结果" min-width="200" show-overflow-tooltip />
      <el-table-column prop="开始时间" label="开始时间" width="160" align="center">
        <template #default="{ row }">
          <span class="time-text">{{ row.开始时间 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="完成时间" label="完成时间" width="160" align="center">
        <template #default="{ row }">
          <span class="time-text">{{ row.完成时间 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="评论" label="评论" min-width="150" show-overflow-tooltip />
      <el-table-column prop="失败次数" label="失败次数" width="100" align="center">
        <template #default="{ row }">
          <span :class="{ 'failure-count': row.失败次数 > 0 }">
            {{ row.失败次数 || 0 }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.ExecutionID"
            type="primary"
            size="small"
            @click="$emit('view-images', row)"
            :loading="row._imageLoading"
            link
          >
            <el-icon><Picture /></el-icon>
            查看图片
          </el-button>
          <span v-else class="text-muted">无图片</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="localPage"
        v-model:page-size="localPageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="val => emitPage(val, 1)"
        @current-change="val => emitPage(localPageSize, val)"
      />
    </div>
  </el-card>
</template>

<script setup>
import { Picture, Refresh } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'

const props = defineProps({
  cases: Array,
  loading: Boolean,
  total: Number,
  page: Number,
  pageSize: Number
})

const emit = defineEmits(['view-images', 'refresh', 'page-change'])

const tableHeaderStyle = {
  backgroundColor: '#fafafa',
  color: '#606266',
  fontWeight: '500'
}

const localPage = ref(props.page || 1)
const localPageSize = ref(props.pageSize || 20)

watch(() => props.page, v => { localPage.value = v })
watch(() => props.pageSize, v => { localPageSize.value = v })

const emitPage = (size, page) => {
  emit('page-change', { pageSize: size, page })
}

const getResultType = (result) => {
  const resultMap = {
    'Pass': 'success',
    'Fail': 'danger',
    'Skip': 'warning',
    'Block': 'info',
    '通过': 'success',
    '失败': 'danger',
    '跳过': 'warning',
    '阻塞': 'info'
  }
  return resultMap[result] || 'info'
}

const getResultText = (result) => {
  const resultMap = {
    'Pass': '通过',
    'Fail': '失败',
    'Skip': '跳过',
    'Block': '阻塞'
  }
  return resultMap[result] || result
}
</script>

<style scoped>
.cases-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  margin-top: 30px;
  margin-bottom: 30px;
}
.card-header {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-actions {
  display: flex;
  gap: 12px;
}
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
.text-muted {
  color: #909399;
}
.time-text {
  font-size: 12px;
  color: #606266;
}
.failure-count {
  color: #f56c6c;
  font-weight: 600;
}
</style>
