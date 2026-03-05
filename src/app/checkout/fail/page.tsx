'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { X } from 'lucide-react'

function FailContent() {
  const params = useSearchParams()
  const router = useRouter()

  const code = params.get('code') || ''
  const message = params.get('message') || '결제 처리 중 오류가 발생했습니다.'
  const orderId = params.get('orderId') || ''

  return (
    <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="w-16 h-16 mx-auto mb-5 bg-red-50 rounded-full flex items-center justify-center">
          <X className="w-8 h-8 text-red-500" strokeWidth={3} />
        </div>
        <h2 className="text-[20px] font-extrabold text-[var(--gray-900)] mb-2">결제에 실패했습니다</h2>
        <p className="text-[14px] text-[var(--gray-500)] mb-4">{message}</p>

        {(code || orderId) && (
          <div className="p-3 bg-[var(--gray-50)] rounded-xl text-left space-y-1.5 mb-6">
            {code && (
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--gray-400)]">에러 코드</span>
                <span className="text-[var(--gray-600)] font-medium">{code}</span>
              </div>
            )}
            {orderId && (
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--gray-400)]">주문번호</span>
                <span className="text-[var(--gray-600)] font-medium truncate ml-2 max-w-[180px]">{orderId}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-2.5 bg-[var(--gray-100)] text-[var(--gray-700)] rounded-xl text-[13px] font-bold hover:bg-[var(--gray-200)] transition"
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-2.5 bg-[var(--primary)] text-white rounded-xl text-[13px] font-bold hover:bg-[var(--primary-hover)] transition"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center">
        <div className="w-6 h-6 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FailContent />
    </Suspense>
  )
}
