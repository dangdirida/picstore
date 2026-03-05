'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import WorkCard from '@/components/WorkCard'
import type { Profile, Work } from '@/lib/types'

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [artist, setArtist] = useState<Profile | null>(null)
  const [works, setWorks] = useState<Work[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    // 작가 프로필
    const { data: artistData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (artistData) setArtist(artistData as Profile)

    // 작가의 작품
    const { data: worksData } = await supabase
      .from('works')
      .select('*, artist:profiles!artist_id(*), likes_count:likes(count)')
      .eq('artist_id', id)
      .order('created_at', { ascending: false })

    const formatted = (worksData || []).map((w: Record<string, unknown>) => ({
      ...w,
      likes_count: Array.isArray(w.likes_count) && w.likes_count.length > 0
        ? (w.likes_count[0] as { count: number }).count
        : 0,
    })) as Work[]
    setWorks(formatted)

    // 팔로워 수
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id)
    setFollowersCount(count || 0)

    // 팔로잉 수
    const { count: fCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id)
    setFollowingCount(fCount || 0)

    // 팔로우 여부
    if (user) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', id)
        .single()
      setIsFollowing(!!followData)
    }

    setLoading(false)
  }

  const handleFollow = async () => {
    if (!currentUserId) return window.location.href = '/login'

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', id)
      setIsFollowing(false)
      setFollowersCount((c) => c - 1)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: id })
      setIsFollowing(true)
      setFollowersCount((c) => c + 1)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[var(--gray-200)] rounded-full" />
            <div className="space-y-2">
              <div className="h-6 bg-[var(--gray-200)] rounded w-32" />
              <div className="h-4 bg-[var(--gray-100)] rounded w-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-[var(--gray-500)]">
        <p>작가를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 작가 정보 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10 p-6 bg-[var(--gray-50)] rounded-2xl">
        <div className="w-20 h-20 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-2xl font-bold shrink-0">
          {(artist.name || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--gray-900)]">{artist.name}</h1>
          {artist.bio && <p className="mt-1 text-[var(--gray-500)]">{artist.bio}</p>}
          <div className="flex items-center gap-4 mt-3 text-sm text-[var(--gray-500)]">
            <span>작품 {works.length}개</span>
            <span>팔로워 {followersCount}명</span>
            <span>팔로잉 {followingCount}명</span>
          </div>
        </div>
        {currentUserId !== id && (
          <button
            onClick={handleFollow}
            className={`px-6 py-2.5 rounded-lg font-medium transition ${
              isFollowing
                ? 'border border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-100)]'
                : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
            }`}
          >
            {isFollowing ? '팔로잉' : '팔로우'}
          </button>
        )}
      </div>

      {/* 작품 목록 */}
      {works.length === 0 ? (
        <p className="text-center py-16 text-[var(--gray-500)]">아직 작품이 없습니다</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      )}
    </div>
  )
}
