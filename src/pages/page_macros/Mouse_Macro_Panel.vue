<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { handle_error_resp, type Device } from '../../device';
import { type Mouse_Macro, Mouse_Report } from './macro_types';
import MouseBtnSelctor from './MouseBtnSelctor.vue';

const props = defineProps<{
    device: Device
    macro: Mouse_Macro
}>()

let origin_name = ""
const emits = defineEmits(['delete'])
const name_edit_mode = ref(false);
const limit_byte = (s:string)=>{
    const enc = new TextEncoder()
    let changed = false
    while(enc.encode(s).length > 15){
        s = s.substring(0, s.length - 1)
        changed = true
    }
    if(changed) ElMessage({message: '长度超出限制', type: 'warning', center: true})
    return s
}
onMounted(()=>{
    origin_name = props.macro.name
})

/*
const out_mouse = new Proxy(new Mouse_Report(props.macro.mouse_output_report) , {
    set(target, p, newValue, receiver) {
        console.log(target.wheel)
        console.log(target.hex)
        props.macro.mouse_output_report = target.hex
    
        return Reflect.set(target, p, newValue, receiver)
    }
})*/ 

const out_mouse = ref(new Mouse_Report(props.macro.mouse_output_report))
const update_out = ()=>{
    props.macro.mouse_output_report = out_mouse.value.hex
}

const show_percent = (n:number)=>{
    n = (Math.round(n * 10000) / 100)
    return n == 0 ? 0: n < 0 ? n.toString() : '+' + n.toString()
}

const del_macro = async ()=>{
    let resp = await props.device.remove_macro(props.macro.name)
    if(handle_error_resp(resp)){
        emits('delete')
    }
}

const set_macro = async ()=>{
    if(props.macro.name != origin_name){    // 修改过宏名，我们需要先把旧宏删掉再保存新的
        let resp = await props.device.remove_macro(origin_name)
        if(!handle_error_resp(resp, "删除旧宏失败"))    return
        origin_name = props.macro.name
    }
    let resp = await props.device.set_macro({
        type: 'mouse',
        mouse: props.macro
    })
    handle_error_resp(resp)
}
</script>

<template>
    <el-form :model="props.macro" @submit.prevent>
    <el-card class="box-card">
        <template #header>
            <div class="card-header">
                <el-icon><i-ep-mouse size="larger"/></el-icon>
                <span style="margin-left: 10px;" v-if="!name_edit_mode">{{props.macro.name}}</span>
                <el-button type="primary" link class="edit-btn" v-if="!name_edit_mode" @click="name_edit_mode=true"><i-ep-edit/></el-button>
                <el-input v-if="name_edit_mode" ref="InputRef" v-model="props.macro.name" autofocus="true"
                    :formatter="limit_byte"  @keyup.enter="(name_edit_mode=false)" @blur="(name_edit_mode=false)"/>
                <span style="flex: 1;"></span>
                <el-button type="danger" link @click="del_macro()"><el-icon><i-ep-delete/></el-icon></el-button>
                <el-button type="primary" @click="set_macro">保存</el-button>
            </div>
        </template>
        <el-descriptions :column="1" >
            <el-descriptions-item label="触发类型" label-class-name="item-lable">鼠标宏</el-descriptions-item>

            <el-descriptions-item label="触发方式" label-class-name="item-lable">同时按下
                <MouseBtnSelctor v-model="props.macro.trigger_buttons_mask"></MouseBtnSelctor>
            </el-descriptions-item>

            <el-descriptions-item label="取消原输入" label-class-name="item-lable">
                <el-switch v-model="props.macro.cancel_input_report" inline-prompt active-text="是" inactive-text="否"/>
            </el-descriptions-item>

            <el-descriptions-item label="动作类型" label-class-name="item-lable">
                <el-select v-model="props.macro.action_type" placeholder="请选择" size="small">
                    <el-option :value="0" label="按下后触发一次"/>
                    <el-option :value="1" label="按下期间连续触发"/>
                    <el-option :value="2" label="两次按下之间连续触发"/>
                </el-select> 
            </el-descriptions-item>

            <el-descriptions-item label="触发延迟" label-class-name="item-lable">
                <el-input-number v-model="props.macro.action_delay" :min="0" :step-strictly="true" :step="1" :precision="1" size="small" style="margin-right: 5px;"/> ms
            </el-descriptions-item>

            <el-descriptions-item v-if="(props.macro.action_type!=0)" label="触发周期" label-class-name="item-lable">
                <el-input-number v-model="props.macro.report_duration" :min="1" :step-strictly="true" :step="1" :precision="1" size="small" style="margin-right: 5px;"/> ms
                &emsp;&emsp;({{(1000/props.macro.report_duration)}}Hz)
            </el-descriptions-item>

            <el-descriptions-item label="输出类型" label-class-name="item-lable">鼠标</el-descriptions-item>
            <el-descriptions-item label="输出按键" label-class-name="item-lable">
                <MouseBtnSelctor v-model="out_mouse.btns"></MouseBtnSelctor>
            </el-descriptions-item>
        </el-descriptions>

        <div class="slider-demo-block">
            <span style="width: 100px;">输出 X</span>
            <el-slider v-model="out_mouse.x" :min="-1" :max="1" :step="0.0001" @change="(v:number)=>{out_mouse.x=v;update_out()}"/>
            <span class="percent-show">{{show_percent(out_mouse.x)}}%</span>
        </div>

        <div class="slider-demo-block">
            <span style="width: 100px;">输出 Y</span>
            <el-slider v-model="out_mouse.y" :min="-1" :max="1" :step="0.0001" @change="(v:number)=>{out_mouse.y=v;update_out()}"/>
            <span class="percent-show">{{show_percent(out_mouse.y)}}%</span>
        </div>

        <div class="slider-demo-block">
            <span style="width: 100px;">输出滚轮</span>
            <el-slider v-model="out_mouse.wheel" :min="-1" :max="1" :step="0.0001" @change="(v:number)=>{out_mouse.wheel=v;update_out()}"/>
            <span class="percent-show">{{show_percent(out_mouse.wheel)}}%</span>
        </div>

    </el-card>
    </el-form>
</template>
  
<style scoped>
.card-header {
display: flex;
justify-content: start;
align-items: center;
font-weight: bolder;
font-size: large;
}

.box-card {
margin: 10px 30px 20px 30px;
width: 480px;
}

.edit-btn{
    margin-left: 10px;
}
.item-label{
    font-weight: bold;
}

.slider-demo-block {
    margin-bottom: 15px;
    display: flex;
    justify-content: start;
    align-items: center;
}
.slider-demo-block .el-slider {
    margin-top: 0;
    margin-left: 10px;

}
.percent-show{
    width: 20px;
    margin: 0 30px;
}

</style>