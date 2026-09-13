import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-white shadow-md',
        hover && 'transition-all duration-200 hover:shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'landscape';
}

export function CardImage({ src, alt, className, aspectRatio = 'video' }: CardImageProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-border',
        aspectRatio === 'video' ? 'aspect-[4/3]' : 'aspect-square',
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}

export const CardMedia = CardImage;

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('border-b border-border px-4 py-3 sm:px-5', className)}>{children}</div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('border-t border-border px-4 py-3 sm:px-5', className)}>{children}</div>
  );
}
