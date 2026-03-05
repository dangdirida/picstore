'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Work } from '@/lib/types'
import { Users, Image, DollarSign, TrendingUp } from 'lucide-react'

type AdminTab = 'users' | 'works' | 'purchases'

interface LocalPurchase {
  id: string
  itemId: string
  title: string
  image: string
  price: number
  author: string
  method: string
  orderId?: string
  purchasedAt: string
}

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [purchases, setPurchases] = useState<LocalPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
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

    // 구매 내역 (localStorage)
    try {
      const stored = JSON.parse(localStorage.getItem('picstore_purchases') || '[]')
      setPurchases(stored as LocalPurchase[])
    } catch {
      setPurchases([])
    }

    setLoading(false)
  }

  const handleDeleteWork = async (workId: string) => {
    if (!confirm('이 작품을 삭제하시겠습니까?')) return
    await supabase.from('works').delete().eq('id', workId)
    setWorks(works.filter((w) => w.id !== workId))
  }

  const handleSuspendUser = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'suspended' ? 'buyer' : 'suspended'
    const action = currentRole === 'suspended' ? '복구' : '정지'
    if (!confirm(`이 유저를 ${action}하시겠습니까?`)) return

    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(users.map((u) => u.id === userId ? { ...u, role: newRole as Profile['role'] } : u))
  }

  const totalRevenue = purchases.reduce((sum, p) => sum + p.price, 0)

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

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[12px] font-bold text-[var(--gray-400)]">전체 유저</span>
          </div>
          <p className="text-[24px] font-extrabold text-[var(--gray-900)]">{users.length}</p>
        </div>
        <div className="p-5 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Image className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-[12px] font-bold text-[var(--gray-400)]">전체 작품</span>
          </div>
          <p className="text-[24px] font-extrabold text-[var(--gray-900)]">{works.length}</p>
        </div>
        <div className="p-5 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-[12px] font-bold text-[var(--gray-400)]">총 매출</span>
          </div>
          <p className="text-[24px] font-extrabold text-[var(--primary)]">{totalRevenue.toLocaleString()}원</p>
        </div>
        <div className="p-5 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-[12px] font-bold text-[var(--gray-400)]">총 구매 건수</span>
          </div>
          <p className="text-[24px] font-extrabold text-[var(--gray-900)]">{purchases.length}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b border-[var(--gray-200)]">
        {([
          ['users', `유저 (${users.length})`],
          ['works', `작품 (${works.length})`],
          ['purchases', `구매 내역 (${purchases.length})`],
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
                <th className="text-left py-3 px-4 font-medium text-[var(--gray-500)]">관리</th>
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
                      u.role === 'suspended' as string ? 'bg-yellow-100 text-yellow-700' :
                      'bg-[var(--gray-100)] text-[var(--gray-700)]'
                    }`}>
                      {u.role === ('suspended' as string) ? '정지됨' : u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--gray-500)]">
                    {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleSuspendUser(u.id, u.role)}
                      className={`text-xs font-medium transition ${
                        u.role === ('suspended' as string)
                          ? 'text-green-500 hover:text-green-700'
                          : 'text-yellow-500 hover:text-yellow-700'
                      }`}
                    >
                      {u.role === ('suspended' as string) ? '복구' : '정지'}
                    </button>
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
                      className="text-red-500 hover:text-red-700 transition text-xs font-medium"
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

      {/* 구매 내역 */}
      {tab === 'purchases' && (
        <div className="space-y-3">
          {purchases.length === 0 ? (
            <p className="text-center py-16 text-[var(--gray-500)]">구매 내역이 없습니다</p>
          ) : (
            purchases.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-white border border-[var(--gray-200)] rounded-xl">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--gray-100)] shrink-0">
                  {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--gray-900)] text-[13px] truncate">{p.title}</p>
                  <p className="text-[11px] text-[var(--gray-400)] mt-0.5">{p.author}</p>
                  <p className="text-[11px] text-[var(--gray-400)] mt-0.5">
                    {new Date(p.purchasedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold text-[var(--primary)]">{p.price.toLocaleString()}원</p>
                  <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">완료</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
