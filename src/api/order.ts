import request from '@/utils/request'
import type { ApiResponse, GetOrders, PayInfo, SendOrder } from './types'

export const getOrder = (data: SendOrder): Promise<ApiResponse<GetOrders>> => {
  const params = new URLSearchParams()
  params.append('page', data.page.toString())
  params.append('pageSize', data.pageSize.toString())
  if (data.status !== undefined && data.status !== null) {
    params.append('status', data.status.toString())
  }
  return request.get(`/user/order/historyOrders?${params.toString()}`)
}

export const CompleteOrderApi = (order_id: string): Promise<ApiResponse<object>> => {
  return request.put(`/user/order/complete/${order_id}`)
}

export const payOrderApi = (pay: PayInfo): Promise<ApiResponse<object>> => {
  return request.put(`/user/order/payment`, pay)
}
export const DeleteOrderApi = (order_id: string): Promise<ApiResponse<object>> => {
  return request.put(`/user/order/cancel/${order_id}`)
}

export const ReminderOrderApi = (order_id: number): Promise<ApiResponse<object>> => {
  return request.get(`/user/order/reminder/${order_id}`)
}
