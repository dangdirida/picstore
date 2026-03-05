'use client'

import Link from 'next/link'
import { Crown } from 'lucide-react'
import type { Work } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface WorkCardProps {
  work: Work
}

export default function WorkCard({ work }: WorkCardProps) {
  const [liked, setLiked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('work_id', work.id)
        .eq('user_id', user.id)
        .single()
      if (data) setLiked(true)
    }
    check()
  }, [work.id])

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`
      return
    }
    if (liked) {
      await supabase.from('likes').delete().eq('work_id', work.id).eq('user_id', userId)
      setLiked(false)
    } else {
      await supabase.from('likes').insert({ work_id: work.id, user_id: userId })
      setLiked(true)
    }
  }

  return (
    <Link href={`/works/${work.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--gray-100)]">
          <img
            src={work.thumbnail_url || work.image_url}
            alt={work.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

          {!work.is_free && (
            <div className="absolute top-3 left-3 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Crown className="w-[18px] h-[18px]" fill="#FFD700" stroke="#FFD700" strokeWidth={1.5} />
            </div>
          )}

          <button
            onClick={handleLike}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          >
            <div className={`w-9 h-9 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm ${liked ? 'bg-red-500' : 'bg-white/90'}`}>
              <svg className={`w-[18px] h-[18px] ${liked ? 'text-white' : 'text-[var(--gray-500)]'}`} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </Link>
  )
}
