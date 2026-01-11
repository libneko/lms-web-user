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

// 根据图片添加购物车相关接口
export interface borrowCartItem {
  id: number
  name: string
  user_id: number
  book_id: number
  number: number // 数量
  amount: number 
  image: string
  create_time: string
  selected: boolean
}

//更新购物车
export interface UpdateCartForm {
  book_id: number
  number: number
}

//删除商品
export interface ShoppingDeleteForm {
  id: number
}

export interface SendOrder {
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
  freeShipping: boolean
  guarantee: boolean
  stock: number
  cartId: number
}

// 定义店铺类型
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
  price: number
}

export interface Order {
  id: number
  number: string
  status: number
  user_id: number
  borrow_time: string
  renew_count:number
  due_date: string
  user_name: string
  return_time: string
  borrow_books: string
  borrow_detail_list: OrderDetail[]
}

export interface OrderDetail {
  id: number
  name: string
  borrow_record_id: number
  book_id: number
  number: number
  image: string
}
export interface GetOrders {
  total: number
  records: Order[]
}

export interface Notice {
  id: string
  content: string
  status: number
  create_time: string
}

export interface PayInfo {
  order_number: string
  payMethod: number
}

// 地址管理相关类型
export interface AddressBook {
  id: number
  user_id: number
  consignee: string
  phone: string
  sex: number
  province_code: string
  province_name: string
  city_code: string
  city_name: string
  district_code: string
  district_name: string
  detail: string
  label: string
  is_default: boolean
}

export interface SubmitOrder {
  address_book_id: number
  pay_method: number
  estimated_delivery_time: string
  shipping_fee: number
  amount: number
}

export interface OrderPesponse {
  id: number
  borrow_number: string
  borrow_time:string
}

export interface temp{
  
}