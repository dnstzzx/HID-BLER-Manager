<script setup lang="ts">
import { toNumber } from '@vue/shared';
import { defineProps, computed, reactive } from 'vue'
import type { Device } from '../../device'

const form = reactive({
    vid: '6666',
    pid: '6666'
})

const hexfilter = (s:string) =>{
    const reg = /[A-Fa-f0-9]/g
    return Array.from(s.matchAll(reg)).join('').toUpperCase()
}

const props = defineProps<{
    device: Device
}>()

</script>

<template>
    <div class="panel">
        <h1 class="title">未连接设备</h1>

        <el-form class="" style="align-items: center;" :model="form">

            <el-form-item label="VID">
                <el-input v-model="form.vid" maxlength="4" :formatter="hexfilter"/>
            </el-form-item>
            <el-form-item label="PID">
                <el-input v-model="form.pid" maxlength="4" :formatter="hexfilter"/>
            </el-form-item>
            <div class="center-box" style="margin-top: 30px;">
                <el-button type="primary" plain @click="props.device.connect(parseInt('0x'+form.vid), parseInt('0x'+form.pid));" style="padding: 0 20px;">连接</el-button>
            </div>
        </el-form>

    </div>
    
</template>

<style scoped>
.title{
    font-size: x-large;
    text-align: center;
    margin-bottom: 30px;
}
.panel{
    transform: translateY(-50px); 
}


</style>