import Link from 'next/link';
import { CardMedia } from '@/components/ui/Card';

interface BlogPost {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  image: string;
}

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-border bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <CardMedia src={post.image} alt={post.title} aspectRatio="landscape" />
      {/* Content */}
      <div className="p-5">
        <span className="inline-block rounded bg-brand-navy/10 px-2.5 py-1 text-xs font-semibold text-brand-navy">
          {post.category}
        </span>
        <h3 className="mt-3 text-lg font-semibold text-text-primary group-hover:text-brand-navy transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {post.excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
          <span>{post.date}</span>
          <span className="flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
              />
            </svg>
            {post.readTime}
          </span>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-navy opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
          Read Article
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
