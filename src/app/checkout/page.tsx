'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Crown, Shield, CreditCard, Lock, Check, X } from 'lucide-react'
import Link from 'next/link'

type PayMethod = 'card' | 'kakao' | 'toss'

function CheckoutContent() {
  const params = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const itemId = params.get('id') || ''
  const title = params.get('title') || 'Untitled'
  const image = params.get('image') || ''
  const price = Number(params.get('price') || 0)
  const author = params.get('author') || ''

  const [authChecked, setAuthChecked] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [method, setMethod] = useState<PayMethod>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [cardOwner, setCardOwner] = useState('')
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)
        return
      }
      setUserEmail(user.email || '')
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      if (profile?.name) {
        setUserName(profile.name)
        setCardOwner(profile.name)
      }
      setAuthChecked(true)
    }
    init()
  }, [])

  const formatCardNumber = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 16)
    return nums.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatExpiry = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 4)
    if (nums.length > 2) return `${nums.slice(0, 2)}/${nums.slice(2)}`
    return nums
  }

  const canPay =
    method === 'card'
      ? cardNumber.replace(/\s/g, '').length === 16 &&
        cardExpiry.length === 5 &&
        cardCvc.length >= 3 &&
        cardOwner.trim().length > 0
      : true

  const handlePay = async () => {
    if (!canPay) return
    setProcessing(true)

    // 1~2초 결제 처리 시뮬레이션
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))

    // localStorage에 구매 내역 저장
    const purchase = {
      id: `${itemId}-${Date.now()}`,
      itemId,
      title,
      image,
      price,
      author,
      method,
      purchasedAt: new Date().toISOString(),
    }
    try {
      const existing = JSON.parse(localStorage.getItem('picstore_purchases') || '[]')
      existing.unshift(purchase)
      localStorage.setItem('picstore_purchases', JSON.stringify(existing))
    } catch { /* ignore */ }

    setProcessing(false)
    setCompleted(true)
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center">
        <div className="w-6 h-6 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-[var(--gray-400)] hover:text-[var(--gray-600)] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-[22px] font-extrabold text-[var(--gray-900)]">결제하기</h1>
          <div className="ml-auto flex items-center gap-1.5 text-[12px] text-[var(--gray-400)]">
            <Lock className="w-3.5 h-3.5" />
            <span>SSL 보안 결제</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* 왼쪽: 결제 폼 */}
          <div className="md:col-span-3 space-y-5">
            {/* 구매자 정보 */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <h2 className="text-[15px] font-bold text-[var(--gray-900)] mb-4">구매자 정보</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--gray-500)] mb-1">이름</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[var(--gray-200)] rounded-xl text-[14px] font-medium text-[var(--gray-900)] bg-[var(--gray-50)] focus:outline-none focus:border-[var(--primary)] focus:bg-white transition"
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--gray-500)] mb-1">이메일</label>
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    className="w-full px-4 py-2.5 border border-[var(--gray-200)] rounded-xl text-[14px] font-medium text-[var(--gray-400)] bg-[var(--gray-50)] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* 결제 수단 */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <h2 className="text-[15px] font-bold text-[var(--gray-900)] mb-4">결제 수단</h2>

              {/* 탭 */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <button
                  onClick={() => setMethod('card')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    method === 'card'
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                      : 'border-[var(--gray-200)] hover:border-[var(--gray-300)]'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 ${method === 'card' ? 'text-[var(--primary)]' : 'text-[var(--gray-400)]'}`} />
                  <span className={`text-[12px] font-bold ${method === 'card' ? 'text-[var(--primary)]' : 'text-[var(--gray-600)]'}`}>
                    카드 결제
                  </span>
                </button>
                <button
                  onClick={() => setMethod('kakao')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    method === 'kakao'
                      ? 'border-[#FEE500] bg-[#FEE500]/10'
                      : 'border-[var(--gray-200)] hover:border-[var(--gray-300)]'
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                      <path fill={method === 'kakao' ? '#3C1E1E' : '#999'} d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.8 5.22 4.5 6.6-.2.72-.72 2.6-.82 3 0 0-.02.15.07.2.1.06.2.01.2.01.27-.04 3.12-2.06 3.62-2.41.78.11 1.59.17 2.43.17 5.52 0 10-3.58 10-7.97S17.52 3 12 3z"/>
                    </svg>
                  </div>
                  <span className={`text-[12px] font-bold ${method === 'kakao' ? 'text-[#3C1E1E]' : 'text-[var(--gray-600)]'}`}>
                    카카오페이
                  </span>
                </button>
                <button
                  onClick={() => setMethod('toss')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    method === 'toss'
                      ? 'border-[#0064FF] bg-[#0064FF]/5'
                      : 'border-[var(--gray-200)] hover:border-[var(--gray-300)]'
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <circle cx="12" cy="12" r="10" fill={method === 'toss' ? '#0064FF' : '#999'} />
                      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">T</text>
                    </svg>
                  </div>
                  <span className={`text-[12px] font-bold ${method === 'toss' ? 'text-[#0064FF]' : 'text-[var(--gray-600)]'}`}>
                    토스페이
                  </span>
                </button>
              </div>

              {/* 카드 결제 폼 */}
              {method === 'card' && (
                <div className="space-y-3 pt-4 border-t border-[var(--gray-100)]">
                  <div>
                    <label className="block text-[12px] font-semibold text-[var(--gray-500)] mb-1">카드 번호</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        className="w-full px-4 py-3 pl-11 border border-[var(--gray-200)] rounded-xl text-[14px] font-medium text-[var(--gray-900)] focus:outline-none focus:border-[var(--primary)] transition tracking-wider"
                        maxLength={19}
                      />
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--gray-400)]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[var(--gray-500)] mb-1">유효기간</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl text-[14px] font-medium text-[var(--gray-900)] focus:outline-none focus:border-[var(--primary)] transition tracking-wider text-center"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[var(--gray-500)] mb-1">CVC</label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="***"
                        className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl text-[14px] font-medium text-[var(--gray-900)] focus:outline-none focus:border-[var(--primary)] transition tracking-wider text-center"
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[var(--gray-500)] mb-1">소유자명</label>
                      <input
                        type="text"
                        value={cardOwner}
                        onChange={(e) => setCardOwner(e.target.value)}
                        placeholder="홍길동"
                        className="w-full px-4 py-3 border border-[var(--gray-200)] rounded-xl text-[14px] font-medium text-[var(--gray-900)] focus:outline-none focus:border-[var(--primary)] transition text-center"
                        maxLength={20}
                      />
                    </div>
                  </div>
                  {/* 카드사 로고들 */}
                  <div className="flex items-center gap-3 pt-3">
                    <span className="text-[11px] text-[var(--gray-400)]">지원 카드</span>
                    <div className="flex items-center gap-2">
                      {['VISA', 'Master', 'BC', 'KB', 'Samsung', 'Hyundai'].map((c) => (
                        <span key={c} className="text-[10px] font-bold text-[var(--gray-300)] bg-[var(--gray-50)] px-2 py-0.5 rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 카카오페이 */}
              {method === 'kakao' && (
                <div className="pt-4 border-t border-[var(--gray-100)]">
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-16 h-16 bg-[#FEE500] rounded-2xl flex items-center justify-center shadow-[0_2px_12px_rgba(254,229,0,0.4)]">
                      <svg viewBox="0 0 24 24" className="w-9 h-9">
                        <path fill="#3C1E1E" d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.8 5.22 4.5 6.6-.2.72-.72 2.6-.82 3 0 0-.02.15.07.2.1.06.2.01.2.01.27-.04 3.12-2.06 3.62-2.41.78.11 1.59.17 2.43.17 5.52 0 10-3.58 10-7.97S17.52 3 12 3z"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-[var(--gray-900)]">카카오페이로 결제</p>
                      <p className="text-[12px] text-[var(--gray-400)] mt-1">결제하기 버튼을 누르면 카카오페이 앱이 실행됩니다</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 토스페이 */}
              {method === 'toss' && (
                <div className="pt-4 border-t border-[var(--gray-100)]">
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-16 h-16 bg-[#0064FF] rounded-2xl flex items-center justify-center shadow-[0_2px_12px_rgba(0,100,255,0.3)]">
                      <span className="text-white text-[24px] font-black">T</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-[var(--gray-900)]">토스로 결제</p>
                      <p className="text-[12px] text-[var(--gray-400)] mt-1">결제하기 버튼을 누르면 토스 앱이 실행됩니다</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 보안 안내 */}
            <div className="flex items-center gap-4 text-[12px] text-[var(--gray-400)]">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>256-bit SSL 암호화</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>개인정보 보호</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>PCI DSS 인증</span>
              </div>
            </div>
          </div>

          {/* 오른쪽: 주문 요약 */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sticky top-6">
              <h2 className="text-[15px] font-bold text-[var(--gray-900)] mb-4">주문 요약</h2>

              {/* 작품 정보 */}
              <div className="flex gap-3 mb-5">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--gray-100)] shrink-0">
                  {image && <img src={image} alt={title} className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Crown className="w-3.5 h-3.5" fill="#FFD700" stroke="#FFD700" strokeWidth={1.5} />
                    <span className="text-[11px] font-bold text-[#DAA520]">Premium</span>
                  </div>
                  <p className="text-[13px] font-bold text-[var(--gray-900)] line-clamp-2 leading-snug">{title}</p>
                  <p className="text-[12px] text-[var(--gray-400)] mt-1">{author}</p>
                </div>
              </div>

              {/* 가격 정보 */}
              <div className="border-t border-[var(--gray-100)] pt-4 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--gray-500)]">작품 가격</span>
                  <span className="font-bold text-[var(--gray-900)]">{price.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--gray-500)]">할인</span>
                  <span className="font-bold text-[var(--primary)]">0원</span>
                </div>
              </div>

              <div className="border-t border-[var(--gray-100)] mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-bold text-[var(--gray-900)]">총 결제 금액</span>
                  <span className="text-[20px] font-extrabold text-[var(--primary)]">{price.toLocaleString()}원</span>
                </div>
              </div>

              {/* 결제 버튼 */}
              <button
                onClick={handlePay}
                disabled={!canPay || processing}
                className="w-full mt-5 py-3.5 bg-[var(--primary)] text-white rounded-xl text-[14px] font-bold hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all duration-200 shadow-[0_2px_8px_rgba(3,195,137,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    결제 처리 중...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {price.toLocaleString()}원 결제하기
                  </>
                )}
              </button>

              <p className="mt-3 text-[11px] text-[var(--gray-400)] text-center leading-relaxed">
                결제 시 서비스 이용약관 및 환불 정책에 동의합니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 완료 모달 */}
      {completed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-[scaleIn_0.3s_ease-out]">
            <button
              onClick={() => router.push('/')}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--gray-100)] transition"
            >
              <X className="w-4 h-4 text-[var(--gray-400)]" />
            </button>

            <div className="w-16 h-16 mx-auto mb-5 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-[var(--primary)]" strokeWidth={3} />
            </div>
            <h2 className="text-[20px] font-extrabold text-[var(--gray-900)] mb-2">결제가 완료되었습니다!</h2>
            <p className="text-[14px] text-[var(--gray-500)] mb-1 line-clamp-1">{title}</p>
            <p className="text-[16px] font-bold text-[var(--primary)] mb-6">{price.toLocaleString()}원</p>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-2.5 bg-[var(--gray-100)] text-[var(--gray-700)] rounded-xl text-[13px] font-bold hover:bg-[var(--gray-200)] transition"
              >
                구매 내역 보기
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
      )}
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center">
        <div className="w-6 h-6 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
