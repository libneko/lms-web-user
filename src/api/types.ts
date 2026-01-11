export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface LoginForm {
  email: string
  password: string
}

export interface ReceiveCodeflag {
  data: boolean
}

export interface CodeLogin {
  email: string
  code: string
}

export interface LoginToken {
  id: number
  username: string
  email: string
  avatar: string
  token: string
}

export interface RegisterForm {
  username: string
  password: string
  email: string
  code: string
}

export interface BookStock {
  id: number
  book_id: number
  stock: number
}

export interface Book {
  id: number
  name: string
  author: string
  category_id: string
  image: string
  description: string
  status: number
  stock: number
  isbn: string
  location: string
  publisher: string
  update_time: string
}

export interface Category {
  id: number
  name: string
  sort: number
  status: number
}

export interface BookData {
  book_id: number
  number: number
}

export interface ReceiveSearch {
  total: number
  records: Book[]
}

export interface SendSearch {
  page: number
  page_size: number
  name: string
  category_id: number
  status: number
}

// 借阅车相关接口
export interface borrowCartItem {
  id: number
  name: string
  user_id: number
  book_id: number
  number: number // 数量
  image: string
  create_time: string
  selected: boolean
}

//更新借阅车
export interface UpdateBorrowCartForm {
  book_id: number
  number: number
}

//删除借阅车书籍
export interface BorrowCartDeleteForm {
  id: number
}

export interface SendBorrowQuery {
  page: number
  pageSize: number
  status?: number | null
}
export interface SendPersonId {
  user_id: number
}

export interface ReceivePerson {
  user_id: string
  name: string
  email: string
}

export interface Product extends Book {
  quantity: number
  selected: boolean
  specifications: string[]
  stock: number
  cartId: number
}

export interface Store {
  id: number
  name: string
  selected: boolean
  indeterminate: boolean
  items: Product[]
}

export interface User {
  id: number
  username: string
  email: string
  password: string
  phone: string
  sex: number
  avatar: string
}

export interface items {
  book_id: number
  title: string
  quantity: number
}

export interface BorrowRecord {
  id: number
  number: string
  status: number
  user_id: number
  borrow_time: string
  renew_count: number
  due_date: string
  user_name: string
  return_time: string
  borrow_books: string
  borrow_detail_list: BorrowDetail[]
}

export interface BorrowDetail {
  id: number
  name: string
  borrow_record_id: number
  book_id: number
  number: number
  image: string
}
export interface GetBorrowRecords {
  total: number
  records: BorrowRecord[]
}

export interface Notice {
  id: string
  content: string
  status: number
  create_time: string
}

export interface BorrowResponse {
  id: number
  borrow_number: string
  borrow_time: string
}
