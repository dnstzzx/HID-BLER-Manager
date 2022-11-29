<script lang="ts">

import { g } from '@/global'
import type { PropType } from 'vue'
import type { Device, Device_Info } from '../../device'

let auto_reflesh_interval_id: undefined|number = undefined
export default{
    data(){
        return{
            info: {
                battery_level: 0,
                slots:[
                    {id: 0, mode: 0},
                    {id: 1, mode: 0}
                ]
            } as Device_Info,
            mode_display_names: ['未连接', '直通模式', '鼠标翻译模式', '键盘翻译模式'],
            ch_nums: ["一", "二", "三", "四", "五", "六", "七", "八", "九"]
        }
    },props:{
        device: {
            type: Object as PropType<Device>,
            required: true
        }
    },async mounted(){
        g.show_loading.value = true
        await this.reflesh()
        g.show_loading.value = false
        this.set_auto_reflesh(true)
    },methods:{
        async reflesh(){
            let info = await this.device.get_device_info()
            if(info != undefined){
                this.info = info
            }
            return info
        },set_auto_reflesh(on:boolean){
            if(on && auto_reflesh_interval_id == undefined){
                auto_reflesh_interval_id = setInterval(async ()=>{
                    if(await this.reflesh() == undefined){
                        this.set_auto_reflesh(false)
                    }
                }, 3000)
            }else if(!on && auto_reflesh_interval_id != undefined){
                clearInterval(auto_reflesh_interval_id)
                auto_reflesh_interval_id = undefined
            }
        }
    }
}


</script>

<template>

<el-card class="box-card">
<template #header>
    <div class="card-header centered">
        <h3 style="text-align: center;">USB HID BLER</h3>
    </div>
</template>
<div class="card-item">设备名称：USB HID BLER</div>
<div class="card-item">当前电量：{{info.battery_level}} %</div>
<div class="card-item" v-for="slot in info.slots">&ensp;接口{{ch_nums[slot.id]}}&ensp;：{{mode_display_names[slot.mode]}}</div>

</el-card>


</template>

<style scoped>
.box-card{
    width: 500px;
    transform: translateY(-50px);
}

.card-item{
    padding: 5px 20px;
}


</style>