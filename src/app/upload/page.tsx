'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [isFree, setIsFree] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?returnUrl=/upload')
        return
      }
      setUserId(user.id)

      // 역할을 작가로 업데이트
      await supabase.from('profiles').update({ role: 'artist' }).eq('id', user.id)
    }
    checkAuth()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다')
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다')
      return
    }

    setFile(selectedFile)
    setError('')
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !userId) return

    setLoading(true)
    setError('')

    // 이미지 업로드
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('works')
      .upload(fileName, file)

    if (uploadError) {
      setError('이미지 업로드에 실패했습니다: ' + uploadError.message)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('works').getPublicUrl(fileName)

    // 작품 등록
    const { error: insertError } = await supabase.from('works').insert({
      title,
      description: description || null,
      price: isFree ? 0 : price,
      image_url: urlData.publicUrl,
      thumbnail_url: urlData.publicUrl,
      artist_id: userId,
    })

    if (insertError) {
      setError('작품 등록에 실패했습니다: ' + insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-8">작품 업로드</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
            이미지 파일 *
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-[var(--primary)] transition ${
              preview ? 'border-[var(--primary)]' : 'border-[var(--gray-300)]'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            {preview ? (
              <img src={preview} alt="미리보기" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <div>
                <svg className="w-12 h-12 mx-auto mb-3 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-[var(--gray-500)]">클릭하여 이미지를 선택하세요</p>
                <p className="text-sm text-[var(--gray-500)] mt-1">최대 10MB, JPG/PNG/GIF/WEBP</p>
              </div>
            )}
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="w-full px-4 py-2.5 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            placeholder="작품 제목을 입력하세요"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-2.5 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
            placeholder="작품에 대한 설명을 입력하세요"
          />
        </div>

        {/* 가격 설정 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-700)] mb-3">가격 설정</label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={isFree}
                onChange={() => { setIsFree(true); setPrice(0) }}
                className="w-4 h-4 text-[var(--primary)]"
              />
              <span className="text-sm">무료</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!isFree}
                onChange={() => setIsFree(false)}
                className="w-4 h-4 text-[var(--primary)]"
              />
              <span className="text-sm">유료</span>
            </label>
          </div>
          {!isFree && (
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={100}
                step={100}
                required
                className="w-full px-4 py-2.5 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent pr-12"
                placeholder="가격을 입력하세요"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--gray-500)]">원</span>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !file || !title}
          className="w-full py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition font-medium disabled:opacity-50"
        >
          {loading ? '업로드 중...' : '작품 등록'}
        </button>
      </form>
    </div>
  )
}
