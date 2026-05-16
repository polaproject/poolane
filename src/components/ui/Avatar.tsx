import { cn } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type AvatarVariant = 'default' | 'hero' | 'mist' | 'accent' | 'ink'

const SIZES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-3xl',
}

const VARIANTS: Record<AvatarVariant, { bg: string; text: string; ring: string }> = {
  default: { bg: 'bg-mist/15', text: 'text-mist', ring: 'ring-1 ring-mist/20' },
  hero:    { bg: 'bg-accent',  text: 'text-ink',  ring: '' },
  mist:    { bg: 'bg-mist/15', text: 'text-mist', ring: '' },
  accent:  { bg: 'bg-accent/15', text: 'text-accent', ring: '' },
  ink:     { bg: 'bg-ink/8',   text: 'text-foreground', ring: 'ring-1 ring-foreground/10' },
}

/** Lấy chữ cái đầu (vd "Hoàng Việt" → "H"). */
export function getInitial(fullName: string | null | undefined): string {
  if (!fullName) return '?'
  return fullName.trim().charAt(0).toUpperCase() || '?'
}

/** Lấy 2 chữ cái (đầu + cuối, vd "Hoàng Việt" → "HV"). Phục vụ avatar nhỏ. */
export function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

interface AvatarProps {
  avatarUrl: string | null | undefined
  fullName: string | null | undefined
  size?: AvatarSize
  variant?: AvatarVariant
  /** 'first' = "Hoàng" → "H" (default). 'both' = "Hoàng Việt" → "HV". */
  initialsStyle?: 'first' | 'both'
  className?: string
}

/**
 * Avatar — render image nếu có avatarUrl, fallback initials.
 *
 * Dùng thay cho mọi pattern inline `.charAt(0).toUpperCase()` ở 14+ chỗ
 * trong app để đảm bảo avatar đồng nhất + tự động cập nhật khi HV đổi.
 *
 * Sizes: xs(24px)·sm(32)·md(36)·lg(48)·xl(80)
 * Variants: default(mist)·hero(gold)·mist·accent·ink
 */
export function Avatar({
  avatarUrl,
  fullName,
  size = 'md',
  variant = 'default',
  initialsStyle = 'first',
  className,
}: AvatarProps) {
  const cfg = VARIANTS[variant]
  const initial = initialsStyle === 'both' ? getInitials(fullName) : getInitial(fullName)
  const name = fullName ?? ''

  return (
    <div
      className={cn(
        'rounded-pill overflow-hidden grid place-items-center shrink-0 font-bold',
        SIZES[size],
        cfg.bg,
        cfg.text,
        cfg.ring,
        className,
      )}
    >
      {avatarUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}
