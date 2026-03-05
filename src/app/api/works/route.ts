import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 작품 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const filter = searchParams.get('filter') // all, free, paid
  const limit = Number(searchParams.get('limit')) || 50
  const offset = Number(searchParams.get('offset')) || 0

  let query = supabase
    .from('works')
    .select('*, artist:profiles!artist_id(id, name, avatar_url), likes_count:likes(count)')

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (filter === 'free') query = query.eq('is_free', true)
  if (filter === 'paid') query = query.eq('is_free', false)

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 })
  }

  const formatted = (data || []).map((w: Record<string, unknown>) => ({
    ...w,
    likes_count: Array.isArray(w.likes_count) && w.likes_count.length > 0
      ? (w.likes_count[0] as { count: number }).count
      : 0,
  }))

  return NextResponse.json({ success: true, data: formatted, error: null })
}

// 작품 업로드
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, data: null, error: '로그인이 필요합니다' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, price, image_url, thumbnail_url } = body

  if (!title || !image_url) {
    return NextResponse.json({ success: false, data: null, error: '제목과 이미지는 필수입니다' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('works')
    .insert({
      title,
      description: description || null,
      price: price || 0,
      image_url,
      thumbnail_url: thumbnail_url || image_url,
      artist_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data, error: null }, { status: 201 })
}
