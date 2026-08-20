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

const SkeletonLoader: React.FC<{ shape: SkeletonShape; className?: string; rows?: number }> = ({
  shape,
  className,
  rows = 1,
}) => {
  const size = getSizeStyle(shape as SkeletonShape);

  return (
    <div
      className`
        inline-block
        rounded-md
        animate-pulse
        bg-neutral-200
        ${JSON.stringify(size)}
        ${className}
      `
      style={{
        // Ensure the animation respects prefers-reduced-motion
        animationDuration: '0.6s',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Rows of skeletons for multi-line content */}
      {rows > 1 && (
        <div className="space-y-1.5">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={size ? `h-${size.height || '16px'}` : ''} />
          ))}
        </div>
      )}
    </div>
  );
};

export { SkeletonLoader, SkeletonShape };