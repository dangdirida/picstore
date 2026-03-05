'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'

const TOTAL = 4
const INTERVAL = 3000

export default function HeroBanner() {
  // index 0 = 클론(마지막), 1~4 = 실제, 5 = 클론(첫번째)
  const [index, setIndex] = useState(1)
  const [transition, setTransition] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const realIndex = ((index - 1) % TOTAL + TOTAL) % TOTAL

  const goTo = useCallback((newIndex: number) => {
    setTransition(true)
    setIndex(newIndex)
  }, [])

  const next = useCallback(() => goTo(index + 1), [index, goTo])
  const prev = useCallback(() => goTo(index - 1), [index, goTo])

  // 경계 도달 시 순간 점프
  const handleTransitionEnd = useCallback(() => {
    if (index === TOTAL + 1) {
      setTransition(false)
      setIndex(1)
    } else if (index === 0) {
      setTransition(false)
      setIndex(TOTAL)
    }
  }, [index])

  // 자동 재생
  useEffect(() => {
    if (isHovered) return
    timerRef.current = setInterval(next, INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next, isHovered])

  // 슬라이드 순서: [클론-마지막, 0, 1, 2, 3, 클론-처음]
  const slideOrder = [TOTAL - 1, 0, 1, 2, 3, 0]

  return (
    <div
      className="relative w-full h-full rounded-3xl overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex h-full ${transition ? 'transition-transform duration-500 ease-out' : ''}`}
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slideOrder.map((slideIdx, i) => (
          <BannerSlide key={i} slideIndex={slideIdx} />
        ))}
      </div>

      {/* 화살표 */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:scale-125 active:scale-95 transition-transform duration-200 z-10"
      >
        <svg className="w-6 h-6 text-white/70 hover:text-white drop-shadow-md transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:scale-125 active:scale-95 transition-transform duration-200 z-10"
      >
        <svg className="w-6 h-6 text-white/70 hover:text-white drop-shadow-md transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 인디케이터 도트 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i + 1)}
            className={`rounded-full transition-all duration-300 ${
              realIndex === i
                ? 'w-6 h-2.5 bg-white shadow-sm'
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function BannerSlide({ slideIndex }: { slideIndex: number }) {
  switch (slideIndex) {
    case 0: return <BannerCreator />
    case 1: return <BannerPopular />
    case 2: return <BannerWelcome />
    case 3: return <BannerGuide />
    default: return null
  }
}

function BannerCreator() {
  return (
    <div className="w-full h-full shrink-0 relative bg-[#03C389] overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 border-[6px] border-white/20 rounded-full" />
      <div className="absolute top-16 right-20 w-20 h-20 border-[4px] border-white/15 rounded-full" />
      <div className="absolute bottom-12 left-10 w-24 h-24 bg-white/10 rotate-45" />
      <div className="absolute top-8 left-[40%] w-3 h-3 bg-white/30 rounded-full" />
      <div className="absolute bottom-20 right-[30%] w-4 h-4 bg-white/25 rotate-45" />
      <div className="absolute top-[45%] right-12 w-16 h-16 border-[3px] border-white/15 rotate-12" />
      <div className="absolute bottom-8 left-[55%] w-6 h-6 border-[3px] border-white/20 rounded-full" />
      <div className="relative h-full flex flex-col justify-center px-10 py-8">
        <span className="inline-block w-fit px-3 py-1 bg-white/20 rounded-full text-[11px] font-bold text-white tracking-wider uppercase mb-4">
          Now Recruiting
        </span>
        <h2 className="text-[32px] lg:text-[38px] font-extrabold text-white leading-[1.15] tracking-tight">
          크리에이터
          <br />
          모집 중
        </h2>
        <p className="mt-3 text-[15px] text-white/80 font-medium leading-relaxed">
          당신의 작품을 세상에 공유하세요
        </p>
        <Link href="/upload" className="mt-6 inline-flex w-fit items-center gap-2 px-5 py-2.5 bg-white text-[#03C389] rounded-xl text-[13px] font-extrabold hover:bg-white/90 active:scale-[0.97] transition-all duration-200">
          지금 시작하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </div>
  )
}

function BannerPopular() {
  return (
    <div className="w-full h-full shrink-0 relative bg-[#1a1a1a] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(#03C389 1px, transparent 1px), linear-gradient(90deg, #03C389 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#03C389] opacity-[0.06] rounded-full blur-[80px]" />
      <div className="relative h-full flex flex-col justify-center px-10 py-8">
        <span className="inline-block w-fit px-3 py-1 border border-[#03C389]/40 rounded-full text-[11px] font-bold text-[#03C389] tracking-wider uppercase mb-4" style={{ textShadow: '0 0 12px rgba(3,195,137,0.5)' }}>
          Trending
        </span>
        <h2 className="text-[32px] lg:text-[38px] font-extrabold text-white leading-[1.15] tracking-tight">
          이달의
          <br />
          <span className="text-[#03C389]" style={{ textShadow: '0 0 20px rgba(3,195,137,0.4)' }}>인기 작품</span>
        </h2>
        <p className="mt-3 text-[15px] text-white/50 font-medium leading-relaxed">
          가장 많은 사랑을 받은 작품들을 만나보세요
        </p>
        <Link href="/popular" className="mt-6 inline-flex w-fit items-center gap-2 px-5 py-2.5 bg-[#03C389] text-white rounded-xl text-[13px] font-extrabold hover:bg-[#02a875] active:scale-[0.97] transition-all duration-200 shadow-[0_0_20px_rgba(3,195,137,0.3)]">
          구경하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </div>
  )
}

function BannerWelcome() {
  return (
    <div className="w-full h-full shrink-0 relative bg-[#FFFDF5] overflow-hidden">
      <svg className="absolute bottom-0 left-0 w-full opacity-[0.12]" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0,100 C200,180 400,20 600,100 C800,180 1000,20 1200,100 L1200,200 L0,200Z" fill="#03C389" />
        <path d="M0,130 C200,200 400,60 600,130 C800,200 1000,60 1200,130 L1200,200 L0,200Z" fill="#03C389" opacity="0.5" />
      </svg>
      <svg className="absolute top-0 right-0 w-full opacity-[0.06] rotate-180" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,60 C300,120 600,0 900,60 C1050,90 1150,30 1200,60 L1200,0 L0,0Z" fill="#03C389" />
      </svg>
      <div className="absolute top-12 right-16 w-3 h-3 bg-[#03C389]/20 rounded-full" />
      <div className="absolute top-24 right-28 w-2 h-2 bg-[#03C389]/15 rounded-full" />
      <div className="relative h-full flex flex-col justify-center px-10 py-8">
        <span className="inline-block w-fit px-3 py-1 bg-[#03C389]/10 rounded-full text-[11px] font-bold text-[#03C389] tracking-wider uppercase mb-4">
          Welcome Gift
        </span>
        <h2 className="text-[32px] lg:text-[38px] font-extrabold text-[#3d3428] leading-[1.15]" style={{ fontStyle: 'italic' }}>
          처음 오셨나요?
          <br />
          <span className="text-[#03C389]">환영합니다!</span>
        </h2>
        <p className="mt-3 text-[15px] text-[#8a7e6b] font-medium leading-relaxed">
          신규 가입하고 무료 작품을 다운로드하세요
        </p>
        <Link href="/login" className="mt-6 inline-flex w-fit items-center gap-2 px-5 py-2.5 bg-[#03C389] text-white rounded-xl text-[13px] font-extrabold hover:bg-[#02a875] active:scale-[0.97] transition-all duration-200">
          무료 가입하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </div>
  )
}

function BannerGuide() {
  return (
    <div className="w-full h-full shrink-0 relative bg-[#6C3FC4] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }} />
      <div className="absolute -bottom-8 -right-8 w-36 h-36 border-[4px] border-white/10 rounded-full" />
      <div className="absolute top-10 right-16 w-10 h-10 border-[3px] border-dashed border-white/15 rounded-full" />
      <div className="relative h-full flex flex-col justify-center px-10 py-8">
        <span className="inline-block w-fit px-3 py-1 bg-white/15 rounded-full text-[11px] font-bold text-white tracking-wider uppercase mb-4">
          How to Sell
        </span>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>
        <h2 className="text-[28px] lg:text-[34px] font-extrabold text-white leading-[1.15] tracking-tight">
          3단계로 끝!
          <br />
          <span className="text-[#c9b3f0]">작품 등록 가이드</span>
        </h2>
        <p className="mt-3 text-[15px] text-white/60 font-medium leading-relaxed">
          업로드 &rarr; 정보 입력 &rarr; 판매 시작
        </p>
        <Link href="/upload" className="mt-5 inline-flex w-fit items-center gap-2 px-5 py-2.5 bg-white text-[#6C3FC4] rounded-xl text-[13px] font-extrabold hover:bg-white/90 active:scale-[0.97] transition-all duration-200">
          작품 등록하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </div>
  )
}
