<template>
  <el-drawer v-model="visible" title="历史记录" size="40%">
    <el-timeline>
      <el-timeline-item
        v-for="item in records"
        :key="item.id"
        :timestamp="item.operated_at"
      >
        {{ item.change_summary }}
      </el-timeline-item>
    </el-timeline>
  </el-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { testCaseService } from '@/api/testCases'

const visible = ref(false)
const records = ref([])

const open = async (id) => {
  visible.value = true
  const resp = await testCaseService.history(id)
  if (resp.success) {
    records.value = resp.data?.items || []
  } else {
    records.value = []
  }
}

defineExpose({ open })
</script>
