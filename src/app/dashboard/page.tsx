'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Work, Profile } from '@/lib/types'

interface LocalPurchase {
  id: string
  itemId: string
  title: string
  image: string
  price: number
  author: string
  method: string
  purchasedAt: string
}
import { getLikedUnsplashIds, fetchUnsplashPhotosByIds, type UnsplashPhoto } from '@/lib/unsplash'
import UnsplashCard from '@/components/UnsplashCard'
import ImageDetailModal from '@/components/ImageDetailModal'

type Tab = 'uploads' | 'purchases' | 'likes' | 'following' | 'profile'

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('uploads')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [uploads, setUploads] = useState<Work[]>([])
  const [purchases, setPurchases] = useState<LocalPurchase[]>([])
  const [likedWorks, setLikedWorks] = useState<Work[]>([])
  const [likedUnsplash, setLikedUnsplash] = useState<UnsplashPhoto[]>([])
  const [followingArtists, setFollowingArtists] = useState<Profile[]>([])
  const [likedUnsplashLoading, setLikedUnsplashLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null)
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?returnUrl=/dashboard')
      return
    }

    // 프로필
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (profileData) {
      setProfile(profileData as Profile)
      setEditName(profileData.name || '')
      setEditBio(profileData.bio || '')
    }

    // 내 업로드
    const { data: uploadsData } = await supabase
      .from('works')
      .select('*')
      .eq('artist_id', user.id)
      .order('created_at', { ascending: false })
    setUploads((uploadsData as Work[]) || [])

    // 내 구매 (localStorage)
    try {
      const stored = JSON.parse(localStorage.getItem('picstore_purchases') || '[]')
      setPurchases(stored as LocalPurchase[])
    } catch {
      setPurchases([])
    }

    // 좋아요한 작품
    const { data: likesData } = await supabase
      .from('likes')
      .select('*, work:works(*, artist:profiles!artist_id(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const liked = (likesData || [])
      .map((l: Record<string, unknown>) => l.work as Work)
      .filter(Boolean)
    setLikedWorks(liked)

    // 팔로우한 작가
    const { data: followsData } = await supabase
      .from('follows')
      .select('following:profiles!following_id(*)')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })
    const artists = (followsData || [])
      .map((f: Record<string, unknown>) => f.following as Profile)
      .filter(Boolean)
    setFollowingArtists(artists)

    // Unsplash 좋아요 (localStorage)
    const unsplashIds = getLikedUnsplashIds()
    if (unsplashIds.length > 0) {
      setLikedUnsplashLoading(true)
      const photos = await fetchUnsplashPhotosByIds(unsplashIds.slice(0, 30))
      setLikedUnsplash(photos)
      setLikedUnsplashLoading(false)
    }

    setLoading(false)
  }

  const handleProfileUpdate = async () => {
    if (!profile) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ name: editName, bio: editBio })
      .eq('id', profile.id)
    setProfile({ ...profile, name: editName, bio: editBio })
    setSaving(false)
    alert('프로필이 수정되었습니다')
  }

  const handleDeleteWork = async (workId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('works').delete().eq('id', workId)
    setUploads(uploads.filter((w) => w.id !== workId))
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--gray-200)] rounded w-48" />
          <div className="h-64 bg-[var(--gray-100)] rounded-xl" />
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'uploads', label: `내 작품 (${uploads.length})` },
    { key: 'purchases', label: `구매 내역 (${purchases.length})` },
    { key: 'likes', label: `좋아요 (${likedWorks.length + likedUnsplash.length})` },
    { key: 'following', label: `팔로우 (${followingArtists.length})` },
    { key: 'profile', label: '프로필 수정' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--gray-900)]">대시보드</h1>
        <Link
          href="/upload"
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition text-sm font-medium"
        >
          작품 업로드
        </Link>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-8 border-b border-[var(--gray-200)] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t.key
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--gray-500)] hover:text-[var(--gray-700)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 내 작품 */}
      {tab === 'uploads' && (
        <div>
          {uploads.length === 0 ? (
            <div className="text-center py-16 text-[var(--gray-500)]">
              <p>아직 업로드한 작품이 없습니다</p>
              <Link href="/upload" className="mt-2 inline-block text-[var(--primary)] hover:underline">
                첫 작품 업로드하기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploads.map((work) => (
                <div key={work.id} className="border border-[var(--gray-200)] rounded-xl overflow-hidden">
                  <Link href={`/works/${work.id}`}>
                    <div className="aspect-[4/3] overflow-hidden bg-[var(--gray-100)]">
                      <img src={work.thumbnail_url || work.image_url} alt={work.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  </Link>
                  <div className="p-4">
                    <h3 className="font-medium text-[var(--gray-900)]">{work.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-sm font-medium ${work.is_free ? 'text-green-600' : 'text-[var(--primary)]'}`}>
                        {work.is_free ? '무료' : `${work.price.toLocaleString()}원`}
                      </span>
                      <span className="text-sm text-[var(--gray-500)]">다운로드 {work.download_count}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteWork(work.id)}
                      className="mt-3 text-sm text-red-500 hover:text-red-700 transition"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 구매 내역 */}
      {tab === 'purchases' && (
        <div className="space-y-4">
          {purchases.length === 0 ? (
            <p className="text-center py-16 text-[var(--gray-500)]">구매 내역이 없습니다</p>
          ) : (
            purchases.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-white border border-[var(--gray-200)] rounded-xl">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--gray-100)] shrink-0">
                  {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--gray-900)] text-[14px] truncate">{p.title}</p>
                  <p className="text-[12px] text-[var(--gray-400)] mt-0.5">{p.author}</p>
                  <p className="text-[12px] text-[var(--gray-400)] mt-0.5">
                    {new Date(p.purchasedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-bold text-[var(--primary)]">{p.price.toLocaleString()}원</p>
                  <span className="text-[11px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">완료</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 좋아요한 작품 */}
      {tab === 'likes' && (
        <div>
          {likedWorks.length === 0 && likedUnsplash.length === 0 && !likedUnsplashLoading ? (
            <p className="text-center py-16 text-[var(--gray-500)]">좋아요한 작품이 없습니다</p>
          ) : (
            <>
              {/* DB 작품 좋아요 */}
              {likedWorks.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-[16px] font-bold text-[var(--gray-900)] mb-4">PicStore 작품</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {likedWorks.map((work) => (
                      <div key={work.id} className="border border-[var(--gray-200)] rounded-xl overflow-hidden">
                        <Link href={`/works/${work.id}`}>
                          <div className="aspect-[4/3] overflow-hidden bg-[var(--gray-100)]">
                            <img src={work.thumbnail_url || work.image_url} alt={work.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </div>
                        </Link>
                        <div className="p-4">
                          <h3 className="font-medium text-[var(--gray-900)]">{work.title}</h3>
                          <p className="text-sm text-[var(--gray-500)] mt-1">
                            {work.is_free ? '무료' : `${work.price.toLocaleString()}원`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unsplash 좋아요 */}
              {likedUnsplashLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : likedUnsplash.length > 0 && (
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--gray-900)] mb-4">추천 이미지</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {likedUnsplash.map((photo, idx) => (
                      <UnsplashCard
                        key={`${photo.id}-${idx}`}
                        photo={photo}
                        onClick={() => setSelectedPhoto(photo)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 팔로우한 작가 */}
      {tab === 'following' && (
        <div>
          {followingArtists.length === 0 ? (
            <p className="text-center py-16 text-[var(--gray-500)]">팔로우한 작가가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {followingArtists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  className="flex items-center gap-4 p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--primary)] transition"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[16px] font-bold shrink-0">
                    {(artist.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--gray-900)] text-[14px] truncate">{artist.name || '이름 없음'}</p>
                    {artist.bio && <p className="text-[12px] text-[var(--gray-400)] truncate mt-0.5">{artist.bio}</p>}
                  </div>
                  <svg className="w-4 h-4 text-[var(--gray-400)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 프로필 수정 */}
      {tab === 'profile' && profile && (
        <div className="max-w-md space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">이메일</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2.5 border border-[var(--gray-200)] rounded-lg bg-[var(--gray-50)] text-[var(--gray-500)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">이름</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">소개</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              placeholder="자기소개를 입력하세요"
            />
          </div>
          <button
            onClick={handleProfileUpdate}
            disabled={saving}
            className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition font-medium disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}
      {/* Unsplash 상세 모달 */}
      {selectedPhoto && (
        <ImageDetailModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}
