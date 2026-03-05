import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 좋아요 토글
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, data: null, error: '로그인이 필요합니다' }, { status: 401 })
  }

  // 기존 좋아요 확인
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('work_id', id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // 좋아요 취소
    await supabase.from('likes').delete().eq('id', existing.id)
    return NextResponse.json({ success: true, data: { liked: false }, error: null })
  } else {
    // 좋아요 추가
    await supabase.from('likes').insert({ work_id: id, user_id: user.id })
    return NextResponse.json({ success: true, data: { liked: true }, error: null })
  }
}
