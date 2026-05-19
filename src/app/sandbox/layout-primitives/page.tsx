import {
  Page,
  PageHero,
  PageContent,
  Section,
  SurfaceCard,
} from '@/components/layouts'
import { Heading } from '@/components/ui/Heading'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Text } from '@/components/ui/Text'
import { Sparkles, Layout, Type, Layers, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Phase 29 — Layout Primitives Sandbox',
}

/**
 * Sandbox demo cho Phase 29 — Unified Page Architecture.
 *
 * Render mọi primitive với mọi variant để owner review API + visual trước khi migrate
 * 99 trang sang pattern mới.
 *
 * Cách dùng: mở /sandbox/layout-primitives, toggle dark/light mode, test 4 viewport.
 */
export default function LayoutPrimitivesSandbox() {
  return (
    <Page>
      <PageHero
        eyebrow={
          <Eyebrow icon={<Sparkles className="h-3 w-3 text-accent" strokeWidth={1.75} />}>
            Phase 29 · Foundation
          </Eyebrow>
        }
        title="Layout Primitives Sandbox"
        description="Demo cho Page / PageHero / PageContent / Section / SurfaceCard + typography primitives. Owner review API + visual trước khi migrate 99 trang."
        width="wide"
        actions={
          <button className="inline-flex items-center gap-1.5 bg-accent text-ink font-semibold px-4 py-2.5 rounded-pill text-sm shadow-cta">
            Approve
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        }
      />

      <PageContent width="wide">
        {/* ── Typography demo ── */}
        <Section
          title="Typography Primitives"
          description="Heading levels 1-4 + Eyebrow + Text variants. §13 italic discipline enforced."
        >
          <SurfaceCard padding="loose">
            <div className="space-y-5">
              <div>
                <Eyebrow
                  icon={<Type className="h-3 w-3 text-accent" strokeWidth={1.75} />}
                >
                  Heading levels
                </Eyebrow>
                <div className="mt-3 space-y-3">
                  <Heading level={1}>H1 — Page title (level 1, normal)</Heading>
                  <Heading level={1} variant="display">
                    H1 display — bigger size for hero
                  </Heading>
                  <Heading level={1} variant="greeting">
                    H1 greeting — italic Cormorant (chỉ chào HV)
                  </Heading>
                  <Heading level={2}>H2 — Section title (level 2)</Heading>
                  <Heading level={3}>H3 — Card title (level 3)</Heading>
                  <Heading level={4}>H4 — Form section label (level 4)</Heading>
                </div>
              </div>

              <div className="border-t border-foreground/10 pt-5">
                <Eyebrow>Text variants (opacity hierarchy)</Eyebrow>
                <div className="mt-3 space-y-1.5">
                  <Text variant="primary">Primary text — 100% opacity, main content</Text>
                  <Text variant="secondary">
                    Secondary text — 72% opacity, descriptions & subtitles
                  </Text>
                  <Text variant="tertiary">Tertiary text — 55% opacity, metadata</Text>
                  <Text variant="muted">Muted text — 40% opacity, disabled & hints</Text>
                </div>
              </div>

              <div className="border-t border-foreground/10 pt-5">
                <Eyebrow>Text sizes</Eyebrow>
                <div className="mt-3 space-y-1.5">
                  <Text size="xs">Extra small (text-xs) — captions, badges</Text>
                  <Text size="sm">Small (text-sm) — descriptions, secondary content</Text>
                  <Text size="base">Base (text-base) — body content default</Text>
                  <Text size="lg">Large (text-lg) — emphasized body</Text>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </Section>

        {/* ── SurfaceCard variants ── */}
        <Section
          title="SurfaceCard Variants"
          description="Thay 62 chỗ inline bg-[var(--surface)] rounded-card-lg ring-1 ring-foreground/8 p-5."
        >
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 'var(--card-gap)' }}
          >
            <SurfaceCard padding="compact" radius="md">
              <Heading level={3}>Compact + Radius md</Heading>
              <Text variant="secondary" size="sm" className="mt-1">
                padding 16px, radius 16px
              </Text>
            </SurfaceCard>
            <SurfaceCard padding="default" radius="lg">
              <Heading level={3}>Default + Radius lg</Heading>
              <Text variant="secondary" size="sm" className="mt-1">
                padding 20px, radius 24px (most common)
              </Text>
            </SurfaceCard>
            <SurfaceCard padding="loose" radius="xl" interactive>
              <Heading level={3}>Loose + Radius xl + interactive</Heading>
              <Text variant="secondary" size="sm" className="mt-1">
                padding 24px, radius 28px, hover lift
              </Text>
            </SurfaceCard>
          </div>
        </Section>

        {/* ── Container widths ── */}
        <Section
          title="Container Widths"
          description="4 width tokens thay 7 max-w-* values lộn xộn hiện tại."
        >
          <SurfaceCard padding="loose">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-foreground/8">
                  narrow
                </span>
                <Text variant="secondary" size="sm">
                  672px — auth, short forms
                </Text>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-foreground/8">
                  content
                </span>
                <Text variant="secondary" size="sm">
                  768px — DEFAULT (67% pages)
                </Text>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-foreground/8">
                  wide
                </span>
                <Text variant="secondary" size="sm">
                  1024px — admin lists, schedule
                </Text>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-foreground/8">
                  full
                </span>
                <Text variant="secondary" size="sm">
                  1152px — wide tables, dashboard builder
                </Text>
              </div>
            </div>
          </SurfaceCard>
        </Section>

        {/* ── Token reference ── */}
        <Section
          title="Token Reference"
          description="CSS variables — sửa 1 chỗ → 99 trang đổi theo."
        >
          <SurfaceCard padding="loose">
            <Eyebrow
              icon={<Layers className="h-3 w-3 text-accent" strokeWidth={1.75} />}
            >
              Spacing tokens
            </Eyebrow>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                ['--space-1', '4px'],
                ['--space-2', '8px'],
                ['--space-3', '12px'],
                ['--space-4', '16px'],
                ['--space-5', '20px'],
                ['--space-6', '24px'],
                ['--space-8', '32px'],
                ['--space-12', '48px'],
              ].map(([name, val]) => (
                <div key={name} className="font-mono">
                  <Text variant="tertiary" size="xs" as="span">
                    {name}
                  </Text>
                  <Text variant="primary" size="sm" as="span" className="ml-1">
                    {val}
                  </Text>
                </div>
              ))}
            </div>

            <div className="border-t border-foreground/10 mt-5 pt-5">
              <Eyebrow
                icon={<Layout className="h-3 w-3 text-accent" strokeWidth={1.75} />}
              >
                Semantic tokens
              </Eyebrow>
              <div className="mt-3 space-y-1 text-xs font-mono">
                <div>
                  <Text variant="tertiary" size="xs" as="span">
                    --page-pb
                  </Text>
                  <Text variant="primary" size="sm" as="span" className="ml-1">
                    var(--space-12) · 48px
                  </Text>
                </div>
                <div>
                  <Text variant="tertiary" size="xs" as="span">
                    --hero-pt / --hero-pb
                  </Text>
                  <Text variant="primary" size="sm" as="span" className="ml-1">
                    32px / 48px
                  </Text>
                </div>
                <div>
                  <Text variant="tertiary" size="xs" as="span">
                    --hero-overlap
                  </Text>
                  <Text variant="primary" size="sm" as="span" className="ml-1">
                    24px (negative margin content vào hero)
                  </Text>
                </div>
                <div>
                  <Text variant="tertiary" size="xs" as="span">
                    --section-gap
                  </Text>
                  <Text variant="primary" size="sm" as="span" className="ml-1">
                    20px (giữa sections)
                  </Text>
                </div>
                <div>
                  <Text variant="tertiary" size="xs" as="span">
                    --card-p
                  </Text>
                  <Text variant="primary" size="sm" as="span" className="ml-1">
                    20px (padding default)
                  </Text>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </Section>
      </PageContent>
    </Page>
  )
}
