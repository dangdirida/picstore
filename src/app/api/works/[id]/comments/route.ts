import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 댓글 목록
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('*, user:profiles!user_id(id, name, avatar_url)')
    .eq('work_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data, error: null })
}

// 댓글 작성
export async function POST(
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
  const content = body.content?.trim()

  if (!content) {
    return NextResponse.json({ success: false, data: null, error: '댓글 내용을 입력하세요' }, { status: 400 })
  }

  if (content.length > 500) {
    return NextResponse.json({ success: false, data: null, error: '댓글은 500자 이내로 작성하세요' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ work_id: id, user_id: user.id, content })
    .select('*, user:profiles!user_id(id, name, avatar_url)')
    .single()

  if (error) {
    return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data, error: null }, { status: 201 })
}
