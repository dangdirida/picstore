'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Work, Purchase, Download, Profile } from '@/lib/types'

type Tab = 'uploads' | 'purchases' | 'downloads' | 'profile'

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('uploads')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [uploads, setUploads] = useState<Work[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [downloads, setDownloads] = useState<Download[]>([])
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
      router.push('/login')
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

    // 내 구매
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('*, work:works(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setPurchases((purchasesData as Purchase[]) || [])

    // 내 다운로드
    const { data: downloadsData } = await supabase
      .from('downloads')
      .select('*, work:works(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDownloads((downloadsData as Download[]) || [])

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
    { key: 'downloads', label: `다운로드 (${downloads.length})` },
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
              <div key={p.id} className="flex items-center gap-4 p-4 border border-[var(--gray-200)] rounded-lg">
                {p.work && (
                  <>
                    <img
                      src={(p.work as Work).thumbnail_url || (p.work as Work).image_url}
                      alt={(p.work as Work).title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <Link href={`/works/${p.work_id}`} className="font-medium text-[var(--gray-900)] hover:text-[var(--primary)]">
                        {(p.work as Work).title}
                      </Link>
                      <p className="text-sm text-[var(--gray-500)]">
                        {new Date(p.created_at).toLocaleDateString('ko-KR')} | {p.amount.toLocaleString()}원
                      </p>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.status === 'completed' ? '완료' : p.status === 'pending' ? '대기' : '환불'}
                    </span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 다운로드 내역 */}
      {tab === 'downloads' && (
        <div className="space-y-4">
          {downloads.length === 0 ? (
            <p className="text-center py-16 text-[var(--gray-500)]">다운로드 내역이 없습니다</p>
          ) : (
            downloads.map((d) => (
              <div key={d.id} className="flex items-center gap-4 p-4 border border-[var(--gray-200)] rounded-lg">
                {d.work && (
                  <>
                    <img
                      src={(d.work as Work).thumbnail_url || (d.work as Work).image_url}
                      alt={(d.work as Work).title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <Link href={`/works/${d.work_id}`} className="font-medium text-[var(--gray-900)] hover:text-[var(--primary)]">
                        {(d.work as Work).title}
                      </Link>
                      <p className="text-sm text-[var(--gray-500)]">
                        {new Date(d.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))
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
    </div>
  )
}
