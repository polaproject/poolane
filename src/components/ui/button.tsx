import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "glass-button group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius-glass-md)] bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none transition-[transform,box-shadow,background-color,filter] duration-200 [transition-timing-function:var(--ease-spring-soft)] hover:scale-[1.03] active:scale-[0.96] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)] disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100 aria-invalid:ring-3 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "!bg-[color-mix(in_srgb,var(--accent)_85%,transparent)] text-foreground hover:!bg-[color-mix(in_srgb,var(--accent)_95%,transparent)]",
        outline:
          "!bg-[var(--glass-tint-1)] text-foreground hover:!bg-[var(--glass-tint-2)] aria-expanded:!bg-[var(--glass-tint-2)]",
        secondary:
          "!bg-[var(--glass-tint-2)] text-secondary-foreground hover:!bg-[var(--glass-tint-3)] aria-expanded:!bg-[var(--glass-tint-3)]",
        ghost:
          "!bg-transparent !backdrop-filter-none !border-transparent hover:!bg-[var(--glass-tint-1)] aria-expanded:!bg-[var(--glass-tint-1)]",
        destructive:
          "!bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-destructive hover:!bg-[color-mix(in_srgb,var(--danger)_28%,transparent)] focus-visible:ring-destructive/30",
        link: "!bg-transparent !backdrop-filter-none !border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem]",
        lg: "h-9 gap-1.5 px-2.5",
        icon: "size-8",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)]",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
