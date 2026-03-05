'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import WorkCard from '@/components/WorkCard'
import type { Work } from '@/lib/types'

type FilterType = 'all' | 'free' | 'paid'
type SortType = 'latest' | 'popular'

export default function HomePage() {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('latest')
  const supabase = createClient()

  useEffect(() => {
    fetchWorks()
  }, [filter, sort])

  const fetchWorks = async () => {
    setLoading(true)
    let query = supabase
      .from('works')
      .select('*, artist:profiles!artist_id(*), likes_count:likes(count)')

    if (filter === 'free') query = query.eq('is_free', true)
    if (filter === 'paid') query = query.eq('is_free', false)

    if (sort === 'latest') {
      query = query.order('created_at', { ascending: false })
    }

    const { data } = await query.limit(50)

    const formatted = (data || []).map((w: Record<string, unknown>) => ({
      ...w,
      artist: w.artist,
      likes_count: Array.isArray(w.likes_count) && w.likes_count.length > 0
        ? (w.likes_count[0] as { count: number }).count
        : 0,
    })) as Work[]

    if (sort === 'popular') {
      formatted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    }

    setWorks(formatted)
    setLoading(false)
  }

  const filteredWorks = works.filter((w) =>
    w.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 히어로 */}
      <section className="text-center py-12 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--gray-900)] mb-4">
          디지털 이미지 마켓플레이스
        </h1>
        <p className="text-lg text-[var(--gray-500)] mb-8">
          작가는 쉽게 올리고, 구매자는 쉽게 찾고 다운로드
        </p>

        <div className="max-w-xl mx-auto relative">
          <input
            type="text"
            placeholder="작품 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3 pl-12 border border-[var(--gray-300)] rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </section>

      {/* 필터 & 정렬 */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex gap-2">
          {([['all', '전체'], ['free', '무료'], ['paid', '유료']] as [FilterType, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === key
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--gray-100)] text-[var(--gray-700)] hover:bg-[var(--gray-200)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {([['latest', '최신순'], ['popular', '인기순']] as [SortType, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                sort === key
                  ? 'bg-[var(--gray-900)] text-white'
                  : 'bg-[var(--gray-100)] text-[var(--gray-700)] hover:bg-[var(--gray-200)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 작품 그리드 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-[var(--gray-200)] rounded-xl" />
              <div className="mt-3 h-5 bg-[var(--gray-200)] rounded w-3/4" />
              <div className="mt-2 h-4 bg-[var(--gray-100)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="text-center py-20 text-[var(--gray-500)]">
          <svg className="w-16 h-16 mx-auto mb-4 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">아직 등록된 작품이 없습니다</p>
          <p className="mt-1">첫 번째 작품을 업로드해보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredWorks.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      )}
    </div>
  )
}
