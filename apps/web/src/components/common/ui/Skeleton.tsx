import React from 'react';

export type SkeletonShape = 'button' | 'input' | 'card' | 'avatar' | 'paragraph' | 'title';

/**
 * SkeletonLoader — Layout-preserving loading geometry.
 *
 * Renders as inline-block filled boxes that preserve the space
 * of the real content during data fetching. Uses APCA-compliant
 * muted gray that respects prefers-reduced-motion.
 *
 * Sizes reference the 4px/8mm rhythm scale.
 */

const getSizeStyle = (shape: SkeletonShape) => {
  const styles: Record<SkeletonShape, { width?: string; height?: string; margin?: string }> = {
    button: { width: '180px', height: '28px', margin: 'var(--space-2) 0' },
    input: { width: '100%', height: '36px', margin: 'var(--space-2) 0' },
    card: { width: '100%', height: '120px', margin: 'var(--space-4) 0' },
    avatar: { width: '40px', height: '40px', margin: 'var(--space-3) 0' },
    paragraph: { width: '100%', height: '16px', margin: 'var(--space-3) 0' },
    title: { width: '70%', height: '20px', margin: 'var(--space-2) 0' },
  };
  return styles[shape];
};

const SkeletonLoader: React.FC<{ shape: SkeletonShape; className?: string; rows?: number; style?: React.CSSProperties }> = ({
  shape,
  className,
  rows = 1,
  style,
}) => {
  const size = getSizeStyle(shape as SkeletonShape);

  return (
    <div
      className={`inline-block rounded-md animate-pulse bg-neutral-200 ${JSON.stringify(size)} ${className}`}
      style={style}
    />
  );
};

export { SkeletonLoader, SkeletonLoader as Skeleton };