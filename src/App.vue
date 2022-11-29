<script lang="ts">

import Menu from './components/Menu.vue'
import Header from './components/Header.vue'
import PageCurrent from './pages/page_current/PageCurrent.vue'
import PageRestart from './pages/page_restart/PageRestart.vue'
import { Device } from './device'
import { g } from './global'

export default{
    components:{
        Menu,
        PageCurrent,
        PageRestart
    },
    data(){
        return {
            device: new Device(),
            pages: [
                {id: 0, name: "当前状态", enabled: true},
                {id: 1, name: "指纹解锁", enabled: false},
                {id: 2, name: "宏", enabled: false},
                {id: 3, name: "重启设备", enabled: false}
                
            ],
            currentPage: 0,
            show_loading: g.show_loading
        }
    },
    mounted(){
        this.device.on_disconnected_listeners.push(()=>{
            for(let i of this.pages){
                i.enabled = false
            }
            this.pages[0].enabled = true
            this.currentPage = 0
            return false
        })
        this.device.on_connected_listeners.push(()=>{
            for(let i of this.pages){
                i.enabled = true
            }
            return false
        })
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
        <el-main class="main-panel" v-loading="show_loading">
            <PageCurrent v-if="currentPage==0" :device="device"></PageCurrent>
            <PageRestart v-if="currentPage==3" :device="device"></PageRestart>
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
