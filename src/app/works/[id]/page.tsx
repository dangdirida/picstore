'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Work, Comment, Profile } from '@/lib/types'

export default function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [work, setWork] = useState<Work | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [purchased, setPurchased] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    // 작품 정보
    const { data: workData } = await supabase
      .from('works')
      .select('*, artist:profiles!artist_id(*)')
      .eq('id', id)
      .single()

    if (workData) setWork(workData as Work)

    // 좋아요 수
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('work_id', id)
    setLikesCount(count || 0)

    // 본인 좋아요 여부
    if (user) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('work_id', id)
        .eq('user_id', user.id)
        .single()
      setIsLiked(!!likeData)

      // 구매 여부
      if (workData && !workData.is_free) {
        const { data: purchaseData } = await supabase
          .from('purchases')
          .select('id')
          .eq('work_id', id)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .single()
        setPurchased(!!purchaseData)
      }
    }

    // 댓글
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*, user:profiles!user_id(*)')
      .eq('work_id', id)
      .order('created_at', { ascending: true })
    setComments((commentsData as Comment[]) || [])

    setLoading(false)
  }

  const handleLike = async () => {
    if (!user) return window.location.href = '/login'

    if (isLiked) {
      await supabase.from('likes').delete().eq('work_id', id).eq('user_id', user.id)
      setIsLiked(false)
      setLikesCount((c) => c - 1)
    } else {
      await supabase.from('likes').insert({ work_id: id, user_id: user.id })
      setIsLiked(true)
      setLikesCount((c) => c + 1)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return window.location.href = '/login'
    if (!newComment.trim()) return

    const { data } = await supabase
      .from('comments')
      .insert({ work_id: id, user_id: user.id, content: newComment.trim() })
      .select('*, user:profiles!user_id(*)')
      .single()

    if (data) {
      setComments([...comments, data as Comment])
      setNewComment('')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(comments.filter((c) => c.id !== commentId))
  }

  const handleDownload = async () => {
    if (!user) return window.location.href = '/login'
    if (!work) return

    if (!work.is_free && !purchased) {
      // 유료 작품 구매 처리 (MVP: UI만)
      const confirmed = window.confirm(`${work.price.toLocaleString()}원을 결제하시겠습니까? (테스트: 바로 구매 완료)`)
      if (!confirmed) return

      await supabase.from('purchases').insert({
        user_id: user.id,
        work_id: work.id,
        amount: work.price,
        status: 'completed',
      })
      setPurchased(true)
    }

    // 다운로드 기록
    await supabase.from('downloads').insert({ user_id: user.id, work_id: work.id })

    // 다운로드 수 증가
    await supabase
      .from('works')
      .update({ download_count: (work.download_count || 0) + 1 })
      .eq('id', work.id)

    // 파일 다운로드
    window.open(work.image_url, '_blank')
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('링크가 복사되었습니다!')
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="aspect-video bg-[var(--gray-200)] rounded-xl" />
          <div className="mt-6 h-8 bg-[var(--gray-200)] rounded w-1/2" />
          <div className="mt-3 h-5 bg-[var(--gray-100)] rounded w-1/3" />
        </div>
      </div>
    )
  }

  if (!work) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-lg text-[var(--gray-500)]">작품을 찾을 수 없습니다</p>
        <Link href="/" className="mt-4 inline-block text-[var(--primary)] hover:underline">
          메인으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 이미지 */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl bg-[var(--gray-100)]">
            <img
              src={work.image_url}
              alt={work.title}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* 정보 사이드바 */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--gray-900)]">{work.title}</h1>
            {work.description && (
              <p className="mt-2 text-[var(--gray-500)]">{work.description}</p>
            )}
          </div>

          {/* 작가 정보 */}
          <Link
            href={`/artist/${work.artist_id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--gray-50)] transition"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-medium">
              {((work.artist as Profile)?.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-[var(--gray-900)]">{(work.artist as Profile)?.name}</p>
              <p className="text-sm text-[var(--gray-500)]">작가 프로필 보기</p>
            </div>
          </Link>

          {/* 가격 */}
          <div className="p-4 bg-[var(--gray-50)] rounded-xl">
            <p className="text-3xl font-bold text-[var(--gray-900)]">
              {work.is_free ? '무료' : `${work.price.toLocaleString()}원`}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition font-medium"
            >
              {work.is_free ? '무료 다운로드' : purchased ? '다운로드' : `${work.price.toLocaleString()}원 구매하기`}
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleLike}
                className={`flex-1 py-2.5 rounded-lg border transition font-medium flex items-center justify-center gap-2 ${
                  isLiked
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]'
                }`}
              >
                <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {likesCount}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-2.5 rounded-lg border border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                공유
              </button>
            </div>
          </div>

          {/* 통계 */}
          <div className="flex justify-around text-center text-sm text-[var(--gray-500)]">
            <div>
              <p className="text-lg font-bold text-[var(--gray-900)]">{work.download_count}</p>
              <p>다운로드</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--gray-900)]">{likesCount}</p>
              <p>좋아요</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--gray-900)]">{comments.length}</p>
              <p>댓글</p>
            </div>
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-[var(--gray-900)] mb-6">댓글 ({comments.length})</h2>

        {user && (
          <form onSubmit={handleComment} className="mb-8 flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1 px-4 py-2.5 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition font-medium"
            >
              작성
            </button>
          </form>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-4 bg-[var(--gray-50)] rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-medium shrink-0">
                {((comment.user as Profile)?.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[var(--gray-900)]">
                    {(comment.user as Profile)?.name}
                  </span>
                  <span className="text-xs text-[var(--gray-500)]">
                    {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="mt-1 text-[var(--gray-700)] text-sm">{comment.content}</p>
              </div>
              {user?.id === comment.user_id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-[var(--gray-500)] hover:text-red-500 transition text-sm shrink-0"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center py-8 text-[var(--gray-500)]">아직 댓글이 없습니다</p>
          )}
        </div>
      </section>
    </div>
  )
}
