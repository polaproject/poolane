import Link from 'next/link'

interface EmptyStateProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any
  title: string
  description?: string
  action?: {
    label: string
    href: string
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-[#F6F1EA] flex items-center justify-center mx-auto mb-3">
          <Icon className="w-7 h-7 text-[#1C2B4A]/30" />
        </div>
      )}
      <p className="text-base font-semibold text-[#1C2B4A] mb-1">{title}</p>
      {description && (
        <p className="text-sm text-[#1C2B4A]/50 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-block mt-4 px-4 py-2 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
