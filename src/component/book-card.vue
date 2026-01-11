<script setup lang="ts">
import type { Book } from '@/api/types'
import { getBookUrl } from '@/api/meta'

defineProps<{
  book: Book
}>()
</script>

<template>
  <a :href="getBookUrl(book.id)" target="_blank" class="book-link">
    <el-card class="book-card" shadow="hover">
      <el-image :src="book.image" class="book-img" fit="contain" />
      <template #footer>
        <div class="book-name">{{ book.name }}</div>
        <div class="book-name">所在位置：{{ book.location }}</div>
      </template>
    </el-card>
  </a>
</template>

<style scoped>
.book-card {
  width: 100%;
  height: 320px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-overlay);
}
.book-img {
  width: 100%;
  height: 90%;
}

.book-name {
  font-size: 14px;
}

.book-link {
  text-decoration: none;
  color: inherit;
}

@media (max-width: 768px) {
  .book-card {
    height: 240px;
  }
  .book-name {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
