import Link from 'next/link'
import type { Work } from '@/lib/types'

interface WorkCardProps {
  work: Work
}

export default function WorkCard({ work }: WorkCardProps) {
  return (
    <Link href={`/works/${work.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--gray-100)]">
        <img
          src={work.thumbnail_url || work.image_url}
          alt={work.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {work.is_free ? (
          <span className="absolute top-3 left-3 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
            무료
          </span>
        ) : (
          <span className="absolute top-3 left-3 px-2 py-1 bg-[var(--primary)] text-white text-xs font-medium rounded-full">
            {work.price.toLocaleString()}원
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-medium text-[var(--gray-900)] group-hover:text-[var(--primary)] transition line-clamp-1">
          {work.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-[var(--gray-500)]">
            {work.artist?.name || '작가'}
          </p>
          <div className="flex items-center gap-3 text-sm text-[var(--gray-500)]">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              {work.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {work.download_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
