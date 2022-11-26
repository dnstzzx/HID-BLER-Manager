<template>
    <div class="header">
        <div class="logo_div"><span class="logo_span">HID BLER Manager</span></div>
    </div>

</template>

<style scoped>
.header{
    width: 100%;
    height: 100%;
    background-color: white;
    display: flex;
    flex-direction: row;
    padding: 0;
    margin: 0;
    box-shadow: var(--el-box-shadow-light);
}

.logo_div{
    padding: 20px;
    background-color: #409EFF;
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 16px;
    font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB','Microsoft YaHei', '微软雅黑', Arial, sans-serif;
    
}

.logo_span{
    font-size: large;
    
    color: white;
}

</style>