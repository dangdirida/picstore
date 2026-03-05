export interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  user: {
    name: string
    username: string
  }
  likes: number
  width: number
  height: number
}

const GENRES: Record<string, string> = {
  illustration: 'illustration artwork',
  nature: 'nature landscape',
  street: 'street photography city',
  wallpaper: 'wallpaper aesthetic',
  digitalart: 'digital art concept',
  animal: 'animals wildlife',
}

const ALL_GENRE_KEYS = Object.keys(GENRES)

const LIKED_STORAGE_KEY = 'picstore_liked_unsplash'

// ── localStorage 좋아요 관리 ──

export function getLikedUnsplashIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function isUnsplashLiked(photoId: string): boolean {
  return getLikedUnsplashIds().includes(photoId)
}

export function toggleLikedUnsplash(photoId: string): boolean {
  const ids = getLikedUnsplashIds()
  const idx = ids.indexOf(photoId)
  if (idx >= 0) {
    ids.splice(idx, 1)
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(ids))
    return false
  } else {
    ids.unshift(photoId)
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(ids))
    return true
  }
}

// ── API helpers ──

function getAccessKey(): string | undefined {
  return process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
}

export function getGenreQuery(genre: string): string {
  return GENRES[genre] || 'art illustration digital'
}

/** 단일 장르 페이지 요청 (page 1-based, perPage max 30) */
async function fetchPage(
  query: string,
  page: number,
  perPage: number,
  accessKey: string
): Promise<UnsplashPhoto[]> {
  const count = Math.min(perPage, 30)
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&page=${page}&order_by=relevant`,
    { headers: { Authorization: `Client-ID ${accessKey}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.results as UnsplashPhoto[]
}

/** 기존 호환: 장르별 첫 로드 (50개 = 2페이지) */
export async function fetchUnsplashPhotos(
  genre: string,
  perPage = 50
): Promise<UnsplashPhoto[]> {
  const accessKey = getAccessKey()
  if (!accessKey) return []

  if (genre === 'all') {
    const perGenre = Math.ceil(perPage / ALL_GENRE_KEYS.length)
    const promises = ALL_GENRE_KEYS.map((key) =>
      fetchSingleGenre(key, perGenre, accessKey)
    )
    const results = await Promise.all(promises)
    const combined = results.flat()
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]]
    }
    const seen = new Set<string>()
    return combined.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    }).slice(0, perPage)
  }

  return fetchSingleGenre(genre, perPage, accessKey)
}

async function fetchSingleGenre(
  genre: string,
  perPage: number,
  accessKey: string
): Promise<UnsplashPhoto[]> {
  const query = getGenreQuery(genre)
  const p1 = await fetchPage(query, 1, Math.min(perPage, 30), accessKey)
  if (perPage <= 30) return p1
  const p2 = await fetchPage(query, 2, perPage - 30, accessKey)
  return [...p1, ...p2]
}

/** 무한스크롤용: 특정 장르의 N번째 Unsplash 페이지 로드 */
export async function fetchUnsplashPage(
  genre: string,
  page: number,
  perPage = 30
): Promise<UnsplashPhoto[]> {
  const accessKey = getAccessKey()
  if (!accessKey) return []

  if (genre === 'all') {
    // all은 각 장르에서 골고루 가져오기
    const perGenre = Math.ceil(perPage / ALL_GENRE_KEYS.length)
    const promises = ALL_GENRE_KEYS.map((key) =>
      fetchPage(getGenreQuery(key), page, perGenre, accessKey)
    )
    const results = await Promise.all(promises)
    const combined = results.flat()
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]]
    }
    return combined.slice(0, perPage)
  }

  const query = getGenreQuery(genre)
  return fetchPage(query, page, perPage, accessKey)
}

/** 키워드 검색 — 키워드만으로 검색 (장르 무관) */
export async function searchUnsplashPhotos(
  keyword: string,
  _genre: string,
  page = 1,
  perPage = 30
): Promise<UnsplashPhoto[]> {
  const accessKey = getAccessKey()
  if (!accessKey) return []

  return fetchPage(keyword, page, perPage, accessKey)
}

/** ID 목록으로 개별 사진 조회 */
export async function fetchUnsplashPhotosByIds(
  ids: string[]
): Promise<UnsplashPhoto[]> {
  const accessKey = getAccessKey()
  if (!accessKey || ids.length === 0) return []

  const promises = ids.map(async (id) => {
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/${id}`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      )
      if (!res.ok) return null
      return (await res.json()) as UnsplashPhoto
    } catch {
      return null
    }
  })

  const results = await Promise.all(promises)
  return results.filter(Boolean) as UnsplashPhoto[]
}
