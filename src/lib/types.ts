export interface Profile {
  id: string
  email: string
  name: string
  role: 'buyer' | 'artist' | 'admin'
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface Work {
  id: string
  title: string
  description: string | null
  price: number
  is_free: boolean
  image_url: string
  thumbnail_url: string | null
  artist_id: string
  download_count: number
  created_at: string
  updated_at: string
  // 조인 필드
  artist?: Profile
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
}

export interface Purchase {
  id: string
  user_id: string
  work_id: string
  amount: number
  status: 'pending' | 'completed' | 'refunded'
  created_at: string
  work?: Work
}

export interface Download {
  id: string
  user_id: string
  work_id: string
  created_at: string
  work?: Work
}

export interface Like {
  id: string
  user_id: string
  work_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  work_id: string
  content: string
  created_at: string
  user?: Profile
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  error: string | null
}
