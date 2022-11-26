<script lang="ts">

import Menu from './components/Menu.vue'
import Header from './components/Header.vue'
import PageCurrent from './pages/page_current/PageCurrent.vue'
import { Device } from './device'

export default{
    components:{
        Menu,
        PageCurrent
    },
    data(){
        return {
            device: new Device(),
            pages: [
                {id: 0, name: "当前状态", enabled: true},
                {id: 1, name: "鼠键宏", enabled: true}
            ],
            currentPage: 0
        }
    }
}



</script>

<template>
    <el-container>
        <el-header style="padding: 0; margin-bottom: 10px;">
            <Header></Header>

        </el-header>
        <el-container>
        <el-aside width="160px">
            <Menu class="lside" :pages="pages" v-model:current-page="currentPage"></Menu>
        </el-aside>
        <el-main class="main-panel">
            <PageCurrent v-if="currentPage==0" :device="device"></PageCurrent>
        </el-main>
        </el-container>
    </el-container>
</template>

<style scoped>

.lside{
    height: calc(100% - 10px);
}

.main-panel{
    padding: 20px 30px 30px 30px;
    width: 100%;
    height: 100%;
}


</style>
