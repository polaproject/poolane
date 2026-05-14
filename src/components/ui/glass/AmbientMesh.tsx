'use client'

import { cn } from '@/lib/utils'

interface AmbientMeshProps {
  /** Class thêm cho mesh layer (vd tăng z-index, intensity). Default OK. */
  className?: string
  /** Vô hiệu hoá animation drift. Default false. */
  static?: boolean
}

/**
 * AmbientMesh — fixed pseudo gradient blob động (family.co Liquid Glass).
 * Đặt vào layout root để mọi page có nền cinematic.
 * Respect prefers-reduced-motion (tự dừng drift).
 */
export function AmbientMesh({ className, static: isStatic = false }: AmbientMeshProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          'lqg-mesh pointer-events-none fixed inset-0 z-0',
          !isStatic && 'lqg-mesh-drift',
          className
        )}
      />
      <style jsx>{`
        .lqg-mesh {
          background:
            radial-gradient(60% 50% at 18% 22%, var(--lqg-mesh-2), transparent 60%),
            radial-gradient(55% 60% at 82% 18%, var(--lqg-mesh-1), transparent 60%),
            radial-gradient(70% 55% at 50% 95%, var(--lqg-mesh-3), transparent 70%);
        }
        @media (prefers-reduced-motion: no-preference) {
          .lqg-mesh-drift {
            animation: lqg-mesh-drift 24s var(--lqg-ease-soft) infinite alternate;
            will-change: transform, filter;
          }
        }
        @keyframes lqg-mesh-drift {
          0% { transform: translate3d(0, 0, 0) scale(1); filter: hue-rotate(0deg); }
          50% { transform: translate3d(1.5%, -2%, 0) scale(1.04); filter: hue-rotate(8deg); }
          100% { transform: translate3d(-1%, 1.5%, 0) scale(0.98); filter: hue-rotate(-4deg); }
        }
      `}</style>
    </>
  )
}
