'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import WorkCard from '@/components/WorkCard'
import UnsplashCard from '@/components/UnsplashCard'
import ImageDetailModal from '@/components/ImageDetailModal'
import HeroBanner from '@/components/HeroBanner'
import type { Work } from '@/lib/types'
import {
  fetchUnsplashPhotos,
  fetchUnsplashPage,
  searchUnsplashPhotos,
  type UnsplashPhoto,
} from '@/lib/unsplash'

const GENRES = [
  { key: 'all', label: '전체' },
  { key: 'illustration', label: '일러스트' },
  { key: 'nature', label: '자연' },
  { key: 'street', label: '거리사진' },
  { key: 'wallpaper', label: '배경화면' },
  { key: 'digitalart', label: '디지털아트' },
  { key: 'animal', label: '동물' },
] as const

type GenreKey = (typeof GENRES)[number]['key']

export default function HomePage() {
  const [followedWorks, setFollowedWorks] = useState<Work[]>([])
  const [unsplashPhotos, setUnsplashPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [genre, setGenre] = useState<GenreKey>('all')
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null)
  const [unsplashPage, setUnsplashPage] = useState(3) // 초기 로드가 page 1-2 사용
  const sentinelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // 검색어 디바운스 (400ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  // 장르 또는 검색어 변경 시 데이터 리셋 & 로드
  const fetchData = useCallback(async () => {
    setLoading(true)
    setHasMore(true)

    // 팔로우한 작가의 최신 작품
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
        const followingIds = (followsData || []).map((f: { following_id: string }) => f.following_id)
        if (followingIds.length > 0) {
          const { data: worksData } = await supabase
            .from('works')
            .select('*, artist:profiles!artist_id(*), likes_count:likes(count)')
            .in('artist_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(12)
          const formatted = (worksData || []).map((w: Record<string, unknown>) => ({
            ...w,
            artist: w.artist,
            likes_count: Array.isArray(w.likes_count) && w.likes_count.length > 0
              ? (w.likes_count[0] as { count: number }).count
              : 0,
          })) as Work[]
          setFollowedWorks(formatted)
        } else {
          setFollowedWorks([])
        }
      } else {
        setFollowedWorks([])
      }
    } catch {
      setFollowedWorks([])
    }

    // Unsplash
    let photos: UnsplashPhoto[]
    if (debouncedSearch) {
      photos = await searchUnsplashPhotos(debouncedSearch, genre, 1, 30)
      setUnsplashPage(2)
    } else {
      photos = await fetchUnsplashPhotos(genre, 50)
      setUnsplashPage(3) // 초기 로드가 page 1,2 사용
    }

    setUnsplashPhotos(photos)
    if (photos.length < 10) setHasMore(false)
    setLoading(false)
  }, [genre, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 무한 스크롤: 다음 페이지 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    const existingIds = new Set(unsplashPhotos.map((p) => p.id))
    let newPhotos: UnsplashPhoto[]

    if (debouncedSearch) {
      newPhotos = await searchUnsplashPhotos(debouncedSearch, genre, unsplashPage, 30)
    } else {
      newPhotos = await fetchUnsplashPage(genre, unsplashPage, 30)
    }

    // 중복 제거
    const unique = newPhotos.filter((p) => !existingIds.has(p.id))

    if (unique.length === 0) {
      setHasMore(false)
    } else {
      setUnsplashPhotos((prev) => [...prev, ...unique])
      setUnsplashPage((prev) => prev + 1)
    }

    setLoadingMore(false)
  }, [loadingMore, hasMore, unsplashPhotos, debouncedSearch, genre, unsplashPage])

  // IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore()
        }
      },
      { rootMargin: '400px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, loading])

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 히어로 2컬럼 */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--gray-900) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-[1400px] mx-auto px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            <div className="flex flex-col justify-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary-light)] rounded-full mb-6 w-fit">
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
                <span className="text-[13px] font-bold text-[var(--primary)]">디지털 이미지 마켓</span>
              </div>
              <h1 className="text-[36px] md:text-[46px] font-extrabold text-[var(--gray-900)] leading-[1.15] tracking-tight">
                크리에이터의 작품을
                <br />
                <span className="text-[var(--primary)]">발견</span>하고 <span className="text-[var(--primary)]">소장</span>하세요
              </h1>
              <p className="mt-5 text-[16px] text-[var(--gray-500)] leading-relaxed font-medium">
                누구나 쉽게 디지털 이미지를 올리고, 사고, 다운로드할 수 있는 마켓플레이스
              </p>

              <div className="mt-8 relative max-w-xl">
                <input
                  type="text"
                  placeholder="작품, 작가, 키워드 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-[52px] px-6 pl-13 bg-[var(--gray-50)] border-2 border-[var(--gray-200)] rounded-2xl text-[15px] font-medium text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--primary)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(3,195,137,0.1)] transition-all duration-200"
                />
                <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="mt-8 flex items-center gap-8">
                <div>
                  <p className="text-[24px] font-extrabold text-[var(--gray-900)]">1,200+</p>
                  <p className="text-[13px] font-medium text-[var(--gray-400)]">등록 작품</p>
                </div>
                <div className="w-px h-10 bg-[var(--gray-200)]" />
                <div>
                  <p className="text-[24px] font-extrabold text-[var(--gray-900)]">350+</p>
                  <p className="text-[13px] font-medium text-[var(--gray-400)]">크리에이터</p>
                </div>
                <div className="w-px h-10 bg-[var(--gray-200)]" />
                <div>
                  <p className="text-[24px] font-extrabold text-[var(--primary)]">FREE</p>
                  <p className="text-[13px] font-medium text-[var(--gray-400)]">무료 작품</p>
                </div>
              </div>
            </div>

            <div className="min-h-[360px] lg:min-h-0">
              <HeroBanner />
            </div>
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <section className="max-w-[1400px] mx-auto px-6 py-10">
        {/* 장르 탭 */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {GENRES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setGenre(key)}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all duration-200 ${
                genre === key
                  ? 'bg-[var(--primary)] text-white shadow-[0_2px_8px_rgba(3,195,137,0.3)]'
                  : 'bg-white text-[var(--gray-600)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] border border-[var(--gray-200)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 검색 중 표시 */}
        {debouncedSearch && (
          <div className="mb-6 flex items-center gap-2">
            <p className="text-[15px] font-bold text-[var(--gray-900)]">
              &ldquo;{debouncedSearch}&rdquo; 검색 결과
            </p>
            <button
              onClick={() => setSearch('')}
              className="text-[13px] text-[var(--gray-400)] hover:text-[var(--gray-600)] underline"
            >
              초기화
            </button>
          </div>
        )}

        {/* 팔로우한 작가의 최신 작품 */}
        {followedWorks.length > 0 && !debouncedSearch && (
          <div className="mb-10">
            <h2 className="text-[20px] font-extrabold text-[var(--gray-900)] mb-5">
              팔로우한 작가의 최신 작품
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {followedWorks.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          </div>
        )}

        {/* Unsplash 갤러리 */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="aspect-[4/3] bg-[var(--gray-100)] animate-pulse" />
                </div>
              ))}
            </div>
          ) : unsplashPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unsplashPhotos.map((photo, idx) => (
                <UnsplashCard
                  key={`${photo.id}-${idx}`}
                  photo={photo}
                  onClick={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>
          ) : debouncedSearch && unsplashPhotos.length === 0 ? (
            <p className="text-center py-16 text-[var(--gray-500)]">
              &ldquo;{debouncedSearch}&rdquo;에 대한 검색 결과가 없습니다
            </p>
          ) : null}
        </div>

        {/* 무한 스크롤 센티넬 + 로딩 스피너 */}
        {!loading && unsplashPhotos.length > 0 && (
          <div ref={sentinelRef} className="flex justify-center py-10">
            {loadingMore && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-[14px] font-medium text-[var(--gray-400)]">이미지 불러오는 중...</span>
              </div>
            )}
            {!hasMore && (
              <p className="text-[13px] text-[var(--gray-400)]">모든 이미지를 불러왔습니다</p>
            )}
          </div>
        )}
      </section>

      {/* 이미지 상세 모달 */}
      {selectedPhoto && (
        <ImageDetailModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}
