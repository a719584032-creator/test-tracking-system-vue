<template>
  <div class="stat-card">
    <div class="stat-content">
      <div class="stat-info">
        <div class="stat-title">{{ title }}</div>
        <div class="stat-value" :class="type">{{ value }}</div>
      </div>
      <div class="stat-icon" :class="type">
        <el-icon :size="24">
          <component :is="iconComp" />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Document,
  SuccessFilled,
  Timer
} from '@element-plus/icons-vue'

const props = defineProps({
  title: String,
  value: [String, Number],
  icon: String,
  type: {
    type: String,
    default: 'primary'
  }
})

const iconMap = {
  Document,
  SuccessFilled,
  Timer
}

const iconComp = iconMap[props.icon] || Document
</script>

<style scoped>
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  transition: all .3s ease;
  height: 100%;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}
.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
  font-weight: 500;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}
.stat-value.primary { color: #409eff; }
.stat-value.success { color: #67c23a; }
.stat-value.warning { color: #e6a23c; }

.stat-icon {
  width:56px;
  height:56px;
  border-radius: 50%;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
}
.stat-icon.primary {
  background: linear-gradient(135deg, rgba(64,158,255,.1), rgba(64,158,255,.2));
  color:#409eff;
}
.stat-icon.success {
  background: linear-gradient(135deg, rgba(103,194,58,.1), rgba(103,194,58,.2));
  color:#67c23a;
}
.stat-icon.warning {
  background: linear-gradient(135deg, rgba(230,162,60,.1), rgba(230,162,60,.2));
  color:#e6a23c;
}
</style>
