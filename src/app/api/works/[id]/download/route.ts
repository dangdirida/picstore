import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  // 작품 조회
  const { data: work } = await supabase
    .from('works')
    .select('*')
    .eq('id', id)
    .single()

  if (!work) {
    return NextResponse.json({ success: false, data: null, error: '작품을 찾을 수 없습니다' }, { status: 404 })
  }

  // 유료 작품인 경우 구매 여부 확인
  if (!work.is_free) {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('work_id', id)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single()

    if (!purchase) {
      return NextResponse.json(
        { success: false, data: null, error: '이 작품을 구매해야 다운로드할 수 있습니다' },
        { status: 403 }
      )
    }
  }

  // 다운로드 기록
  await supabase.from('downloads').insert({ user_id: user.id, work_id: id })

  // 다운로드 수 증가
  await supabase
    .from('works')
    .update({ download_count: (work.download_count || 0) + 1 })
    .eq('id', id)

  return NextResponse.json({
    success: true,
    data: { download_url: work.image_url },
    error: null,
  })
}
