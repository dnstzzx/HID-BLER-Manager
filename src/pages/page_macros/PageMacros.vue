<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Device } from '../../device';
import { ElMessageBox } from 'element-plus'
import { Macro_Action_Type, Macro_Output_Model, type Mouse_Macro } from './macro_types';
import Mouse_Macro_Panel from './Mouse_Macro_Panel.vue';


const props = defineProps<{
    device: Device
}>()

const macros = reactive<{mouse: Mouse_Macro[]}>({mouse: []})
const removed_macros = reactive(new Set<Mouse_Macro>())
const new_macros = reactive(new Set<Mouse_Macro>())

onMounted(async ()=>{
    let resp = await props.device.get_macros()
    if(!resp.success){
        ElMessageBox.alert(resp.reason, "获取鼠标宏列表失败")
    }else{
        let d = resp.data
        macros.mouse = d.mouse
    }
})

const add_macro = ()=>{
    let new_macro:Mouse_Macro = {
        name: 'mouse macro ' + (()=>{
            let i = 0
            while(macros.mouse.some(m=>{return m.name == 'mouse macro ' + i})) {i++}
            return i
        })(),
        version: 0,
        trigger_buttons_mask: 0,
        cancel_input_report: false,
        output_model: Macro_Output_Model.MACRO_MODEL_MOUSE,
        action_type: Macro_Action_Type.MACRO_ACTION_TYPE_ONCE,
        action_delay: 0,
        report_duration: 0,
        mouse_output_report: '00'.repeat(8)
    }
    new_macros.add(new_macro)
    macros.mouse.push(new_macro)
}

</script>

<template>
    <div class="center-box fill-parent">
        <div class="panel">
            <template v-for="m of macros.mouse">
                <Mouse_Macro_Panel v-if="!removed_macros.has(m)" :macro="m" :device="device" :new_created="new_macros.has(m)"
                    @delete="removed_macros.add(m)">
                </Mouse_Macro_Panel>
            </template>
        </div>
        <ElButton @click="add_macro" class="add-macro-btn" type="primary" circle><el-icon size="22px"><svg t="1670319667677" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1368" width="200" height="200"><path d="M576 64H448v384H64v128h384v384h128V576h384V448H576z"  p-id="1369"></path></svg></el-icon></ElButton>
    </div>

</template>

<style scoped>
.panel{
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
}

.btn{
    width: 9em;
    padding: 20px;
    margin: 20px;
}

.add-macro-btn{
    position: fixed;
    bottom: 40px;
    right: 60px;
    width: 45px;
    height: 45px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);


}
</style>