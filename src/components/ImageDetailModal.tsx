'use client'

import { Crown, X, Heart, Download, Eye, Calendar, ShoppingCart } from 'lucide-react'
import { isUnsplashLiked, toggleLikedUnsplash, type UnsplashPhoto } from '@/lib/unsplash'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ImageDetailModalProps {
  photo: UnsplashPhoto
  onClose: () => void
}

export default function ImageDetailModal({ photo, onClose }: ImageDetailModalProps) {
  const [liked, setLiked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isPremium = useMemo(() => {
    let hash = 0
    for (let i = 0; i < photo.id.length; i++) {
      hash = ((hash << 5) - hash + photo.id.charCodeAt(i)) | 0
    }
    return Math.abs(hash) % 100 < 30
  }, [photo.id])

  const fakeDate = useMemo(() => {
    let hash = 0
    for (let i = 0; i < photo.id.length; i++) {
      hash = ((hash << 5) - hash + photo.id.charCodeAt(i)) | 0
    }
    const daysAgo = Math.abs(hash) % 60 + 1
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  }, [photo.id])

  const fakePrice = useMemo(() => {
    const prices = [1900, 2900, 3900, 4900, 5900, 7900, 9900]
    let h = 0
    for (let i = 0; i < photo.id.length; i++) h = ((h << 5) - h + photo.id.charCodeAt(i)) | 0
    return prices[Math.abs(h) % prices.length]
  }, [photo.id])

  const fakeViews = useMemo(() => Math.abs(photo.likes * 7 + photo.width % 1000), [photo])
  const fakeDownloads = useMemo(() => Math.abs(photo.likes * 2 + photo.height % 500), [photo])

  useEffect(() => {
    setLiked(isUnsplashLiked(photo.id))
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    checkAuth()
  }, [photo.id])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleLike = useCallback(() => {
    if (!userId) {
      window.location.href = '/login'
      return
    }
    const newState = toggleLikedUnsplash(photo.id)
    setLiked(newState)
  }, [userId, photo.id])

  const handleDownload = useCallback(async () => {
    if (isPremium) return
    setDownloading(true)
    try {
      const res = await fetch(photo.urls.full)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const title = (photo.alt_description || 'unsplash-image').replace(/[^a-zA-Z0-9가-힣\s-]/g, '').trim().replace(/\s+/g, '-')
      a.download = `${title}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(photo.urls.full, '_blank')
    }
    setDownloading(false)
  }, [photo, isPremium])

  // 정보 패널 너비 (px)
  const PANEL_W = 340

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* 모달: 이미지 비율에 맞춰 자동 크기, viewport 제한 */}
      <div
        className="relative bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        style={{ maxWidth: '94vw', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* 이미지 — 원본 비율 유지, 자연스러운 크기 */}
        <div className="relative shrink-0 overflow-hidden bg-black md:bg-transparent">
          <img
            src={photo.urls.regular}
            alt={photo.alt_description || 'Image'}
            className="block w-full md:w-auto md:h-full object-contain"
            style={{
              maxHeight: 'min(82vh, 900px)',
              maxWidth: `min(94vw, calc(94vw - ${PANEL_W}px))`,
            }}
          />
          {isPremium && (
            <div className="absolute top-3 left-3 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Crown className="w-4 h-4" fill="#FFD700" stroke="#FFD700" strokeWidth={1.5} />
            </div>
          )}
          <button
            onClick={handleLike}
            className="absolute top-3 right-14 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${liked ? 'text-red-500' : 'text-white'}`}
              fill={liked ? 'currentColor' : 'none'}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* 정보 패널 */}
        <div
          className="p-5 md:p-6 overflow-y-auto shrink-0"
          style={{ width: '100%', maxWidth: PANEL_W }}
        >
          {/* 작가 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[14px] font-bold shrink-0">
              {photo.user.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[var(--gray-900)] text-[14px] truncate">{photo.user.name}</p>
              <p className="text-[12px] text-[var(--gray-400)] truncate">@{photo.user.username}</p>
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-[16px] font-extrabold text-[var(--gray-900)] leading-snug mb-4 line-clamp-2">
            {photo.alt_description || 'Untitled'}
          </h2>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[var(--gray-50)] rounded-lg px-2 py-2 text-center">
              <Eye className="w-3.5 h-3.5 text-[var(--gray-400)] mx-auto mb-0.5" />
              <p className="text-[13px] font-bold text-[var(--gray-900)]">{fakeViews.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--gray-400)]">조회수</p>
            </div>
            <div className="bg-[var(--gray-50)] rounded-lg px-2 py-2 text-center">
              <Download className="w-3.5 h-3.5 text-[var(--gray-400)] mx-auto mb-0.5" />
              <p className="text-[13px] font-bold text-[var(--gray-900)]">{fakeDownloads.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--gray-400)]">다운로드</p>
            </div>
            <div className="bg-[var(--gray-50)] rounded-lg px-2 py-2 text-center">
              <Heart className="w-3.5 h-3.5 text-[var(--gray-400)] mx-auto mb-0.5" />
              <p className="text-[13px] font-bold text-[var(--gray-900)]">{photo.likes.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--gray-400)]">좋아요</p>
            </div>
          </div>

          {/* 메타 */}
          <div className="flex items-center gap-3 mb-5 text-[12px] text-[var(--gray-400)] flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {fakeDate}
            </span>
            <span>{photo.width} x {photo.height}</span>
            {isPremium && (
              <span className="flex items-center gap-1 text-[#DAA520] font-bold">
                <Crown className="w-3.5 h-3.5" fill="#FFD700" stroke="#FFD700" strokeWidth={1.5} />
                Premium
              </span>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-2">
            <button
              onClick={handleLike}
              className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 active:scale-[0.97] ${
                liked
                  ? 'bg-red-50 text-red-500 border border-red-200'
                  : 'bg-[var(--gray-50)] text-[var(--gray-500)] border border-[var(--gray-200)] hover:text-red-500 hover:border-red-200'
              }`}
            >
              <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
              {liked ? '좋아요 취소' : '좋아요'}
            </button>

            {!isPremium ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-[13px] font-bold hover:bg-[var(--primary-hover)] active:scale-[0.97] transition-all duration-200 shadow-[0_2px_8px_rgba(3,195,137,0.3)] disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {downloading ? '다운로드 중...' : '무료 다운로드'}
              </button>
            ) : (
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    id: photo.id,
                    title: photo.alt_description || 'Untitled',
                    image: photo.urls.small,
                    price: String(fakePrice),
                    author: photo.user.name,
                  })
                  router.push(`/checkout?${params.toString()}`)
                }}
                className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-white rounded-xl text-[13px] font-bold hover:brightness-110 active:scale-[0.97] transition-all duration-200 shadow-[0_2px_8px_rgba(218,165,32,0.3)]"
              >
                <ShoppingCart className="w-4 h-4" />
                {fakePrice.toLocaleString()}원 구매하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
