import request from '@/utils/request'
import type { ApiResponse, GetBorrowRecords, SendBorrowQuery } from './types'

export const getBorrowRecords = (data: SendBorrowQuery): Promise<ApiResponse<GetBorrowRecords>> => {
  const params = new URLSearchParams()
  params.append('page', data.page.toString())
  params.append('pageSize', data.pageSize.toString())
  if (data.status !== undefined && data.status !== null) {
    params.append('status', data.status.toString())
  }
  return request.get(`/user/borrow/history?${params.toString()}`)
}

export const completeBorrowApi = (borrow_id: string): Promise<ApiResponse<object>> => {
  return request.put(`/user/borrow/complete/${borrow_id}`)
}

export const renewBorrowApi = (borrow_id: number): Promise<ApiResponse<object>> => {
  return request.put(`/user/borrow/renew/${borrow_id}`)
}
