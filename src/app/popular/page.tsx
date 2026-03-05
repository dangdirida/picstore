'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import WorkCard from '@/components/WorkCard'
import UnsplashCard from '@/components/UnsplashCard'
import ImageDetailModal from '@/components/ImageDetailModal'
import { fetchUnsplashPhotos, type UnsplashPhoto } from '@/lib/unsplash'
import type { Work } from '@/lib/types'

export default function PopularPage() {
  const [works, setWorks] = useState<Work[]>([])
  const [unsplashPhotos, setUnsplashPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)

    // 인기순(좋아요 수)으로 작품 조회
    const { data } = await supabase
      .from('works')
      .select('*, artist:profiles!artist_id(*), likes_count:likes(count)')
      .order('created_at', { ascending: false })
      .limit(50)

    const formatted = (data || [])
      .map((w: Record<string, unknown>) => ({
        ...w,
        artist: w.artist,
        likes_count: Array.isArray(w.likes_count) && w.likes_count.length > 0
          ? (w.likes_count[0] as { count: number }).count
          : 0,
      })) as Work[]

    // 좋아요 수 기준 내림차순 정렬
    formatted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    setWorks(formatted)

    const photos = await fetchUnsplashPhotos('all', 50)
    // likes 기준 내림차순 정렬
    photos.sort((a, b) => b.likes - a.likes)
    setUnsplashPhotos(photos)

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      <section className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold text-[var(--gray-900)]">
            이달의 인기 작품
          </h1>
          <p className="mt-2 text-[15px] text-[var(--gray-500)] font-medium">
            가장 많은 사랑을 받은 작품들을 만나보세요
          </p>
        </div>

        {/* DB 작품 */}
        {works.length > 0 && (
          <div className="mb-12">
            <h2 className="text-[20px] font-extrabold text-[var(--gray-900)] mb-5">
              PicStore 인기 작품
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {works.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          </div>
        )}

        {/* Unsplash 인기 이미지 */}
        <div>
          {works.length > 0 && unsplashPhotos.length > 0 && (
            <h2 className="text-[20px] font-extrabold text-[var(--gray-900)] mb-5">
              추천 인기 이미지
            </h2>
          )}

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
          ) : works.length === 0 ? (
            <p className="text-center py-16 text-[var(--gray-500)]">아직 등록된 작품이 없습니다</p>
          ) : null}
        </div>
      </section>

      {selectedPhoto && (
        <ImageDetailModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}
