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
    <header className="border-b border-[var(--gray-200)] bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[var(--primary)]">
          PicStore
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-[var(--gray-700)] hover:text-[var(--primary)] transition">
            작품 둘러보기
          </Link>
          {user && (
            <>
              <Link href="/upload" className="text-[var(--gray-700)] hover:text-[var(--primary)] transition">
                작품 업로드
              </Link>
              <Link href="/dashboard" className="text-[var(--gray-700)] hover:text-[var(--primary)] transition">
                대시보드
              </Link>
            </>
          )}
          {profile?.role === 'admin' && (
            <Link href="/admin" className="text-[var(--gray-700)] hover:text-[var(--primary)] transition">
              관리자
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--gray-100)] transition"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-medium">
                  {(profile?.name || user.email || '?')[0].toUpperCase()}
                </div>
                <span className="hidden md:block text-sm text-[var(--gray-700)]">
                  {profile?.name || user.email}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[var(--gray-200)] rounded-lg shadow-lg py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                  >
                    대시보드
                  </Link>
                  <Link
                    href={`/artist/${user.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                  >
                    내 프로필
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[var(--gray-50)]"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition text-sm font-medium"
            >
              로그인
            </Link>
          )}

          {/* 모바일 메뉴 */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일 네비게이션 */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--gray-200)] bg-white px-4 py-3 space-y-2">
          <Link href="/" onClick={() => setMenuOpen(false)} className="block py-2 text-[var(--gray-700)]">
            작품 둘러보기
          </Link>
          {user && (
            <>
              <Link href="/upload" onClick={() => setMenuOpen(false)} className="block py-2 text-[var(--gray-700)]">
                작품 업로드
              </Link>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-[var(--gray-700)]">
                대시보드
              </Link>
            </>
          )}
          {profile?.role === 'admin' && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-[var(--gray-700)]">
              관리자
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
