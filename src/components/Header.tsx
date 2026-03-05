'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setMenuOpen(false)
    window.location.href = '/'
  }

  return (
    <header className="bg-white sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1400px] mx-auto px-6 h-[68px] flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-[22px] font-extrabold tracking-tight text-[var(--gray-900)]">
            Pic<span className="text-[var(--primary)]">Store</span>
          </span>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="px-4 py-2 text-[15px] font-semibold text-[var(--gray-600)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--primary-light)] transition-all duration-200">
            둘러보기
          </Link>
          {user && (
            <>
              <Link href="/upload" className="px-4 py-2 text-[15px] font-semibold text-[var(--gray-600)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--primary-light)] transition-all duration-200">
                업로드
              </Link>
              <Link href="/dashboard" className="px-4 py-2 text-[15px] font-semibold text-[var(--gray-600)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--primary-light)] transition-all duration-200">
                대시보드
              </Link>
            </>
          )}
          {profile?.role === 'admin' && (
            <Link href="/admin" className="px-4 py-2 text-[15px] font-semibold text-[var(--gray-600)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--primary-light)] transition-all duration-200">
              관리자
            </Link>
          )}
        </nav>

        {/* 우측 액션 */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border border-[var(--gray-200)] hover:border-[var(--primary)] hover:shadow-[0_0_0_3px_rgba(3,195,137,0.1)] transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">
                  {(profile?.name || user.email || '?')[0].toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-semibold text-[var(--gray-700)]">
                  {profile?.name || user.email}
                </span>
                <svg className={`hidden md:block w-4 h-4 text-[var(--gray-400)] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-[var(--gray-200)] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-[var(--gray-100)]">
                      <p className="text-sm font-bold text-[var(--gray-900)]">{profile?.name || '사용자'}</p>
                      <p className="text-xs text-[var(--gray-400)] truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      대시보드
                    </Link>
                    <Link
                      href={`/artist/${user.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      내 프로필
                    </Link>
                    <div className="border-t border-[var(--gray-100)] mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        로그아웃
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-bold text-[var(--gray-700)] hover:text-[var(--primary)] transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] active:scale-[0.97] transition-all duration-200 text-sm font-bold shadow-[0_2px_8px_rgba(3,195,137,0.3)]"
              >
                시작하기
              </Link>
            </div>
          )}

          {/* 모바일 햄버거 */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--gray-100)] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg className="w-6 h-6 text-[var(--gray-700)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-[var(--gray-700)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 모바일 네비게이션 */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--gray-100)] bg-white px-4 py-3 space-y-1 shadow-lg">
          <Link href="/" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-[15px] font-semibold text-[var(--gray-700)] rounded-xl hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
            둘러보기
          </Link>
          {user && (
            <>
              <Link href="/upload" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-[15px] font-semibold text-[var(--gray-700)] rounded-xl hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
                업로드
              </Link>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-[15px] font-semibold text-[var(--gray-700)] rounded-xl hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
                대시보드
              </Link>
            </>
          )}
          {profile?.role === 'admin' && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-[15px] font-semibold text-[var(--gray-700)] rounded-xl hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
              관리자
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
