<script setup lang="ts">
import type { Device } from '../../device';
const props = defineProps<{
    device: Device
}>()

</script>

<template>
    <div class="center-box fill-parent">
        <div class="panel">
            <el-button type="primary" class="btn" @click="device.restart(false)">重启设备</el-button>
            <el-button type="primary" class="btn" plain @click="device.restart(true)">进入下载模式</el-button>
        </div>
    </div>

</template>

<style scoped>
.panel{
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(-30px);
}

.btn{
    width: 9em;
    padding: 20px;
    margin: 20px;
}
</style>