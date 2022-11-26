<script lang="ts">
export interface Page_Info {
    id: number,
    name: string,
    enabled: boolean
}
</script>

<script setup lang="ts">


import { defineProps, computed } from 'vue'

const props = defineProps<{
    pages: Page_Info[],
    currentPage: number
}>()

defineEmits(['update:currentPage'])

</script>

<template>

    <el-menu class="menu" default-active="0" @select="(index:number) => $emit('update:currentPage', index)">
        <el-menu-item class="menu-item" v-for="page in pages" :index="page.id" :disabled="!page.enabled" :class="{'selected-item': currentPage == page.id}">
            <span class="title-span">{{ page.name }}</span>
        </el-menu-item>
    </el-menu>




</template>

<style scoped>
.title-span{
    text-align: center;
    width: 100%;
    padding-right: 10px;
}

.selected-item{
    border-right: 3px solid var(--el-menu-active-color);
    transform: translateX(1px);
    color: var(--el-menu-active-color);
}


</style>
