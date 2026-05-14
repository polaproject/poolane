'use client'

/**
 * AmbientMesh — fixed pseudo-element với 3 gradient blob động (family.co style).
 * Render LANG full viewport, behind content. Spring-sway lệch pha tạo "thở".
 */
export function AmbientMesh() {
  return (
    <>
      <div
        aria-hidden="true"
        className="lqg-mesh-layer pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(60% 50% at 18% 22%, var(--lqg-mesh-2), transparent 60%),
            radial-gradient(55% 60% at 82% 18%, var(--lqg-mesh-1), transparent 60%),
            radial-gradient(70% 55% at 50% 95%, var(--lqg-mesh-3), transparent 70%)
          `,
        }}
      />
      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          .lqg-mesh-layer {
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
