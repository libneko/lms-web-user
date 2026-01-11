import request from '@/utils/request'
import type { ApiResponse, SendSearch, ReceiveSearch } from './types'

export const searchApi = (data: SendSearch): Promise<ApiResponse<ReceiveSearch>> => {
  const params = new URLSearchParams()
  params.append('page', data.page.toString())
  params.append('pageSize', data.page_size.toString())
  if (data.name) {
    params.append('name', data.name)
  }
  if (data.category_id) {
    params.append('categoryId', data.category_id.toString())
  }
  if (data.status) {
    params.append('status', data.status.toString())
  }
  return request.get(`/user/book/page?${params.toString()}`)
}
