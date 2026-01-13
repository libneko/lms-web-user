<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { searchApi } from '@/api/search'
import { getCategories, getRandomBooks } from '@/api/home'
import type { Book, Category } from '@/api/types'
import { useRoute, useRouter } from 'vue-router'
import { openBook } from '@/api/meta.ts'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const selectedCategoryId = ref(0)
const isSearched = ref(false)

const bookList = ref<Book[]>([])
const categories = ref<Category[]>([])

const total = ref(0)
const currentPage = ref(Number(route.query.page || 1))
const pageSize = ref(Number(route.query.pageSize || 10))

const handleSearch = () => {
  const query: Record<string, any> = {}
  if (searchKeyword.value) query.name = searchKeyword.value
  if (selectedCategoryId.value) query.category_id = selectedCategoryId.value
  query.page = 1
  query.pageSize = pageSize.value

  router.push({
    path: '/search',
    query,
  })
}

const fetchBooks = async () => {
  const name = String(route.query.name || '')
  const categoryId = Number(route.query.category_id || 0)
  const page = Number(route.query.page || 1)
  const size = Number(route.query.pageSize || 10)

  if (!name && categoryId === 0) {
    try {
      const res = await getRandomBooks(size)
      if (res.code === 1) {
        isSearched.value = true
        bookList.value = res.data
        total.value = res.data.length
      }
    } catch (error) {
      console.error(error)
    }
    return
  }

  const res = await searchApi({
    page,
    page_size: size,
    name: name,
    category_id: categoryId,
    status: 1,
  })

  if (res.code === 1) {
    isSearched.value = true
    bookList.value = res.data.records
    total.value = res.data.total
  } else {
    bookList.value = []
    total.value = 0
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  router.push({
    path: '/search',
    query: {
      ...route.query,
      page,
      pageSize: pageSize.value,
    },
  })
}

watch(
  () => route.query,
  () => {
    currentPage.value = Number(route.query.page || 1)
    pageSize.value = Number(route.query.pageSize || 10)
    fetchBooks()
  },
  { immediate: true },
)

onMounted(async () => {
  const res = await getCategories()
  categories.value = [{ id: 0, name: '全部', sort: 0, status: 1 }, ...res.data]

  if (route.query.name) {
    searchKeyword.value = String(route.query.name)
  }
  const id = Number(route.query.categoryId)
  if (!isNaN(id) && id !== 0) {
    selectedCategoryId.value = id
  }
})
</script>

<template>
  <div class="search-view" :class="{ active: isSearched }">
    <div class="search-input" :class="{ active: isSearched }">
      <el-input
        v-model="searchKeyword"
        style="max-width: 80%; height: 55px"
        placeholder="输入书名或关键字进行搜索"
        class="input-with-select"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-select v-model="selectedCategoryId" placeholder="Select" style="width: 115px">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </template>
        <template #suffix>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
    </div>
    <div class="result-list" v-if="isSearched">
      <div v-if="bookList.length === 0" class="no-result">
        <el-empty description="没有找到相关图书" />
      </div>
      <el-row v-else class="book-lists" :gutter="20">
        <el-col
          v-for="(book, _index) in bookList"
          :key="book.id"
          :span="12"
          class="books"
          @click="openBook(book.id)"
        >
          <div class="book-item">
            <el-row>
              <el-col :span="6">
                <img :src="book?.image" alt="Book Image" style="object-fit: contain" />
              </el-col>
              <el-col :span="18" style="padding-left: 5%; padding-right: 5%">
                <el-row :span="24" class="book-title">
                  <p>{{ book?.name }}</p>
                </el-row>
                <el-row :span="24" class="book-intro">
                  <p>{{ book?.description }}</p>
                </el-row>
                <el-row :span="24" class="">
                  <p>所在位置：{{ book?.location }}</p>
                </el-row>
              </el-col>
            </el-row>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-pagination
      v-if="isSearched && total > pageSize"
      background
      layout="prev, pager, next, jumper"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      @current-change="handlePageChange"
      style="margin-top: 20px; text-align: center"
    />
  </div>
</template>

<style scoped>
.search-view {
  margin: 0 auto;
  position: relative;
  margin-top: -4.5%;
  min-height: 100vh;
  border-radius: 20px;
  transition: 0.5s;
  display: flex;
  flex-direction: column;
  background-image: url('https://neko-book.oss-cn-hangzhou.aliyuncs.com/search.jpg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
}
.search-input {
  text-align: center;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.5s;
  :deep(.el-input__wrapper) {
    transition:
      background-color 0.3s,
      box-shadow 0.3s;
  }
}

.search-input.active {
  height: 50vh;
}

.result-list {
  width: 95%;
  margin-top: 20px;
  margin-left: 2.5%;
  display: flex;
  border-radius: 40px;
  flex-wrap: wrap;
  gap: 20px;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.6);
}

html.dark .result-list {
  background: rgba(0, 0, 0, 0.5);
}

.no-result {
  width: 100%;
  padding: 60px 0;
  text-align: center;
}

.no-result :deep(.el-empty__description) {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

html.dark .no-result :deep(.el-empty__description) {
  color: #e5eaf3;
  font-weight: 600;
}

.no-result :deep(.el-empty__image svg) {
  fill: #909399;
}

html.dark .no-result :deep(.el-empty__image svg) {
  fill: #a8abb2;
}
.book-lists {
  padding: 2%;
}

.books {
  cursor: pointer;
  padding: 2%;
  transition: all 0.3s ease;
  border-radius: 8px;
}
.books:hover {
  background-color: rgba(180, 179, 179, 0.5);
  transform: translateY(-5px);
}

.books:active {
  transform: translateY(-2px);
}

.book-title {
  padding-bottom: 15px;
  font-size: 200%;
}

.book-intro {
  padding-bottom: 10px;
  font-size: 100%;
  color: rgb(68, 61, 61);
  width: 100%;
  white-space: normal;
  word-wrap: break-word;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 5;
  text-overflow: ellipsis;
  height: 7.5em;
}

html.dark .book-intro {
  color: #cfd3dc;
}

html.dark .book-title,
html.dark .book-title > p {
  color: #e5eaf3;
}

.book-price {
  width: 100%;
  border-radius: 30px;
  color: rgb(229, 94, 52);
  font-weight: bold;
  font-style: italic;
  font-size: 250%;
}

.result-list img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

:deep(.el-input__wrapper) {
  border-radius: 50px !important;
  box-shadow: none;
  overflow: hidden !important;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.5);
  transition:
    box-shadow 0.4s ease,
    transform 0.3s;
  animation: breathing 20s ease-in-out infinite;
}
:deep(.el-input__wrapper:hover) {
  transform: scale(1.01);
}
:deep(.el-select__wrapper) {
  border-radius: 50px !important;
  box-shadow: none;
  overflow: hidden !important;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.5);
  transition:
    box-shadow 0.4s ease,
    transform 0.3s;
}

.search-input {
  :deep(.el-input__inner) {
    color: #303133;
    &::placeholder {
      color: #606266;
    }
  }

  :deep(.el-select .el-input__inner) {
    color: #303133;
  }
}

html.dark .search-input {
  :deep(.el-input__wrapper) {
    background-color: rgba(30, 30, 30, 0.6);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  }

  :deep(.el-input__inner) {
    color: #e5eaf3;
    &::placeholder {
      color: #a3a6ad;
    }
  }

  :deep(.el-select .el-input__inner) {
    color: #e5eaf3;
  }

  :deep(.el-input-group__append) {
    background-color: rgba(30, 30, 30, 0.6);
    box-shadow:
      0 1px 0 0 rgba(255, 255, 255, 0.2) inset,
      0 -1px 0 0 rgba(255, 255, 255, 0.2) inset,
      -1px 0 0 0 rgba(255, 255, 255, 0.2) inset;
    color: #fff;
  }
}

:deep(.el-button) {
  border-radius: 50px !important;
  box-shadow: none;
  overflow: hidden !important;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.5);
  transition:
    box-shadow 0.4s ease,
    transform 0.3s;
}
:deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.9);
}
@keyframes breathing {
  0% {
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.9);
  }
  100% {
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
  }
}
</style>
