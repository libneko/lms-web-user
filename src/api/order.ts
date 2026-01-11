import request from '@/utils/request'
import type { ApiResponse, GetOrders, PayInfo, SendOrder } from './types'

export const getOrder = (data: SendOrder): Promise<ApiResponse<GetOrders>> => {
  const params = new URLSearchParams()
  params.append('page', data.page.toString())
  params.append('pageSize', data.pageSize.toString())
  if (data.status !== undefined && data.status !== null) {
    params.append('status', data.status.toString())
  }
  return request.get(`/user/borrow/history?${params.toString()}`)
}

export const CompleteOrderApi = (order_id: string): Promise<ApiResponse<object>> => {
  return request.put(`/user/borrow/complete/${order_id}`)
}



export const ReminderOrderApi = (order_id: number): Promise<ApiResponse<object>> => {
  return request.put(`/user/borrow/renew/${order_id}`)
}
