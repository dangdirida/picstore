import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 작품 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('works')
    .select('*, artist:profiles!artist_id(*), likes_count:likes(count)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ success: false, data: null, error: '작품을 찾을 수 없습니다' }, { status: 404 })
  }

  const formatted = {
    ...data,
    likes_count: Array.isArray(data.likes_count) && data.likes_count.length > 0
      ? (data.likes_count[0] as { count: number }).count
      : 0,
  }

  return NextResponse.json({ success: true, data: formatted, error: null })
}

// 작품 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, data: null, error: '로그인이 필요합니다' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, price } = body

  const { data, error } = await supabase
    .from('works')
    .update({ title, description, price, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('artist_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data, error: null })
}

// 작품 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, data: null, error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { error } = await supabase
    .from('works')
    .delete()
    .eq('id', id)
    .eq('artist_id', user.id)

  if (error) {
    return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: null, error: null })
}
