<script setup lang="ts">
import type { Device } from '../../device';
import NotConneted from './NotConnected.vue'
import DashBoard from './DashBoard.vue';

const props = defineProps<{
    device: Device
}>()


</script>

<template>

<div class="center-box fill-parent">
    <NotConneted v-if="!device.connected" :device="device"></NotConneted>
    <DashBoard v-if="device.connected" :device="device"></DashBoard>
</div>


</template>

<style>
    
</style>