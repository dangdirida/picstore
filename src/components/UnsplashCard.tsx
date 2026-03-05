'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isUnsplashLiked, toggleLikedUnsplash, type UnsplashPhoto } from '@/lib/unsplash'

interface UnsplashCardProps {
  photo: UnsplashPhoto
  onClick?: () => void
}

export default function UnsplashCard({ photo, onClick }: UnsplashCardProps) {
  const [liked, setLiked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setLiked(isUnsplashLiked(photo.id))
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    checkAuth()
  }, [photo.id])

  const isPremium = useMemo(() => {
    let hash = 0
    for (let i = 0; i < photo.id.length; i++) {
      hash = ((hash << 5) - hash + photo.id.charCodeAt(i)) | 0
    }
    return Math.abs(hash) % 100 < 30
  }, [photo.id])

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) {
      window.location.href = '/login'
      return
    }
    const newState = toggleLikedUnsplash(photo.id)
    setLiked(newState)
  }, [userId, photo.id])

  return (
    <div className="group block cursor-pointer" onClick={onClick}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--gray-100)]">
          <img
            src={photo.urls.small}
            alt={photo.alt_description || 'Unsplash photo'}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

          {isPremium && (
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
    </div>
  )
}
