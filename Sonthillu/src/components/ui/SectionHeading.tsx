import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('mb-8 md:mb-12', align === 'center' && 'text-center', className)}>
      <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-lg text-text-secondary">{subtitle}</p>}
    </div>
  );
}
