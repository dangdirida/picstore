'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Work } from '@/lib/types'

type AdminTab = 'users' | 'works'

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/')
      return
    }

    // 전체 유저 목록
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers((usersData as Profile[]) || [])

    // 전체 작품 목록
    const { data: worksData } = await supabase
      .from('works')
      .select('*, artist:profiles!artist_id(*)')
      .order('created_at', { ascending: false })
    setWorks((worksData as Work[]) || [])

    setLoading(false)
  }

  const handleDeleteWork = async (workId: string) => {
    if (!confirm('이 작품을 삭제하시겠습니까?')) return

    // admin은 RLS 우회를 위해 서버 API 필요 - 여기서는 클라이언트에서 시도
    await supabase.from('works').delete().eq('id', workId)
    setWorks(works.filter((w) => w.id !== workId))
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--gray-200)] rounded w-32" />
          <div className="h-64 bg-[var(--gray-100)] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-8">관리자 페이지</h1>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-[var(--gray-50)] rounded-xl text-center">
          <p className="text-2xl font-bold text-[var(--gray-900)]">{users.length}</p>
          <p className="text-sm text-[var(--gray-500)]">전체 유저</p>
        </div>
        <div className="p-4 bg-[var(--gray-50)] rounded-xl text-center">
          <p className="text-2xl font-bold text-[var(--gray-900)]">{works.length}</p>
          <p className="text-sm text-[var(--gray-500)]">전체 작품</p>
        </div>
        <div className="p-4 bg-[var(--gray-50)] rounded-xl text-center">
          <p className="text-2xl font-bold text-[var(--gray-900)]">
            {users.filter((u) => u.role === 'artist').length}
          </p>
          <p className="text-sm text-[var(--gray-500)]">작가</p>
        </div>
        <div className="p-4 bg-[var(--gray-50)] rounded-xl text-center">
          <p className="text-2xl font-bold text-[var(--gray-900)]">
            {works.filter((w) => !w.is_free).length}
          </p>
          <p className="text-sm text-[var(--gray-500)]">유료 작품</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b border-[var(--gray-200)]">
        {([
          ['users', `유저 (${users.length})`],
          ['works', `작품 (${works.length})`],
        ] as [AdminTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === key
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--gray-500)] hover:text-[var(--gray-700)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 유저 목록 */}
      {tab === 'users' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-200)]">
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">이름</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">이메일</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">역할</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--gray-100)] hover:bg-[var(--gray-50)]">
                  <td className="py-3 px-4">
                    <Link href={`/artist/${u.id}`} className="text-[var(--primary)] hover:underline">
                      {u.name || '(이름 없음)'}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-[var(--gray-700)]">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700' :
                      u.role === 'artist' ? 'bg-blue-100 text-blue-700' :
                      'bg-[var(--gray-100)] text-[var(--gray-700)]'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--gray-500)]">
                    {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 작품 목록 */}
      {tab === 'works' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-200)]">
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">이미지</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">제목</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">작가</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">가격</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">등록일</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">관리</th>
              </tr>
            </thead>
            <tbody>
              {works.map((w) => (
                <tr key={w.id} className="border-b border-[var(--gray-100)] hover:bg-[var(--gray-50)]">
                  <td className="py-3 px-4">
                    <img
                      src={w.thumbnail_url || w.image_url}
                      alt={w.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/works/${w.id}`} className="text-[var(--primary)] hover:underline">
                      {w.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-[var(--gray-700)]">
                    {(w.artist as Profile)?.name}
                  </td>
                  <td className="py-3 px-4">
                    {w.is_free ? (
                      <span className="text-green-600">무료</span>
                    ) : (
                      <span>{w.price.toLocaleString()}원</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[var(--gray-500)]">
                    {new Date(w.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteWork(w.id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
