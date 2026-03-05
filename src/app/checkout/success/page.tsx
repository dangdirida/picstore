'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [orderInfo, setOrderInfo] = useState<{
    title: string
    price: number
    author: string
    image: string
    itemId: string
  } | null>(null)

  const orderId = params.get('orderId') || ''
  const paymentKey = params.get('paymentKey') || ''
  const amount = params.get('amount') || ''

  useEffect(() => {
    // localStorage에서 주문 정보 복원
    try {
      const pending = JSON.parse(localStorage.getItem('picstore_pending_order') || 'null')
      if (pending) {
        setOrderInfo({
          title: pending.title,
          price: pending.price,
          author: pending.author,
          image: pending.image,
          itemId: pending.itemId,
        })

        // 구매 내역을 localStorage에 저장
        const purchase = {
          id: `${pending.itemId}-${Date.now()}`,
          itemId: pending.itemId,
          title: pending.title,
          image: pending.image,
          price: pending.price,
          author: pending.author,
          method: 'tosspayments',
          orderId,
          paymentKey,
          purchasedAt: new Date().toISOString(),
        }
        const existing = JSON.parse(localStorage.getItem('picstore_purchases') || '[]')
        // 중복 방지
        if (!existing.some((p: { orderId?: string }) => p.orderId === orderId)) {
          existing.unshift(purchase)
          localStorage.setItem('picstore_purchases', JSON.stringify(existing))
        }

        // 임시 데이터 정리
        localStorage.removeItem('picstore_pending_order')
      }
    } catch { /* ignore */ }
  }, [orderId, paymentKey])

  return (
    <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="w-16 h-16 mx-auto mb-5 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-[var(--primary)]" strokeWidth={3} />
        </div>
        <h2 className="text-[20px] font-extrabold text-[var(--gray-900)] mb-2">결제가 완료되었습니다!</h2>

        {orderInfo && (
          <>
            <p className="text-[14px] text-[var(--gray-500)] mb-1">{orderInfo.title}</p>
            <p className="text-[14px] font-bold text-[var(--primary)] mb-2">{orderInfo.price.toLocaleString()}원</p>
          </>
        )}

        <div className="mt-4 p-3 bg-[var(--gray-50)] rounded-xl text-left space-y-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-[var(--gray-400)]">주문번호</span>
            <span className="text-[var(--gray-600)] font-medium truncate ml-2 max-w-[180px]">{orderId}</span>
          </div>
          {amount && (
            <div className="flex justify-between text-[12px]">
              <span className="text-[var(--gray-400)]">결제금액</span>
              <span className="text-[var(--gray-600)] font-medium">{Number(amount).toLocaleString()}원</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-2.5 bg-[var(--gray-100)] text-[var(--gray-700)] rounded-xl text-[13px] font-bold hover:bg-[var(--gray-200)] transition"
          >
            대시보드
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center">
        <div className="w-6 h-6 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
