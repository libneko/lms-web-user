<script setup lang="ts">
defineEmits(['menu-click'])
</script>

<template>
  <el-menu router="true" class="nav-menu">
    <!-- 首页菜单 -->
    <div class="title">
      <span>图书馆</span>
    </div>
    <div class="menu_item">
      <el-menu-item index="/">
        <el-icon><Promotion /></el-icon> 首页
      </el-menu-item>
      <el-menu-item index="/search">
        <el-icon><Search /></el-icon> 搜索
      </el-menu-item>
      <el-menu-item index="/borrow-cart">
        <el-icon><ShoppingCart /></el-icon> 借阅车
      </el-menu-item>
      <el-menu-item index="/order">
        <el-icon><Document /></el-icon> 图书管理
      </el-menu-item>
    </div>
  </el-menu>
</template>

<style scoped>
.title {
  font-size: 40px;
  font-family: 楷体;
  line-height: 60px;
  font-weight: bolder;
  width: 100%;
  text-align: center;
}

.menu_item {
  display: flex;
  flex-direction: column;
}

.nav-menu {
  border-right: none;
  background-color: transparent;
}

a {
  color: rgb(230, 218, 218);
  text-decoration: none;
}
</style>
