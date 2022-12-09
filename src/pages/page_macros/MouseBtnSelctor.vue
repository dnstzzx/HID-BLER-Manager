<script setup lang="ts">

class Mouse_Button{
    readonly id
    static readonly BTN_NAMES = ['左键', '右键', '中键', '键4', '键5', '键6', '键7', '键8']
    constructor(id:number){
        this.id = id
    }
    
    static from_mask(mask: number){
        let btns = []
        mask &= 0xFF
        let bit = 0
        while(mask != 0){
            if(mask & 1)    btns.push(new Mouse_Button(bit))
            bit ++
            mask = mask >> 1
        }
        return btns
    }
    static to_mask(btns: Mouse_Button[]){
        let mask = 0
        btns.forEach(btn => {
            mask &= btn.id
        })
        return mask
    }
    get name(){
        return Mouse_Button.BTN_NAMES[this.id]
    }
}

const props = defineProps<{
    modelValue: number
}>()
const emit = defineEmits(['update:modelValue'])

const add_btn_mode = ref(false)
const rest_btns = computed(()=>{
    return [...Array(8).keys()].filter(i=>{return (props.modelValue & (1 << i)) == 0}).map((i)=>{return new Mouse_Button(i)})
})
const trigger_btns = computed(()=>{
    return Mouse_Button.from_mask(props.modelValue)
})
const remove_trigger_btn = (btn:Mouse_Button)=>{
    emit('update:modelValue', props.modelValue & ~(1 << btn.id))
}

</script>

<template>
    <el-tag v-for="btn of trigger_btns" :key="btn" closable class="trigger-tag" :disable-transitions="true"
                        @close="remove_trigger_btn(btn)">{{btn.name}}</el-tag>
    <el-select v-if="add_btn_mode"  size="small" style="width: 80px;"  
                                    @change="(btn: Mouse_Button)=>{
                                        emit('update:modelValue', props.modelValue | (1 << btn.id));
                                        add_btn_mode=false
                                    }">
        <el-option v-for="btn of rest_btns"
                    :key="btn.id"
                    :label="btn.name"
                    :value="btn"/>
    </el-select>
    <el-button v-else class="button-new-tag ml-1" size="small" @click="(add_btn_mode = true)"> + </el-button>
</template>

<style scoped>
.trigger-tag{
    margin-right: 10px;
    margin: 5px 10px;
}
</style>