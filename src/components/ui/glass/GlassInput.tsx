'use client'

import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Size variant. Default 'md'. */
  inputSize?: 'sm' | 'md' | 'lg'
  /**
   * Cho phép reveal/hide mật khẩu qua nút Eye toggle (Phase 15.3).
   * Chỉ có hiệu lực khi `type === 'password'`.
   * Default false.
   */
  revealable?: boolean
}

/**
 * GlassInput — Apple Liquid Glass input field (Phase 12 production).
 * Backdrop blur, spring focus halo, refined typography.
 *
 * Với prop `revealable={true}` và `type='password'`:
 *   - Wrap input + button toggle Eye/EyeOff bên phải
 *   - Click toggle giữ focus (onMouseDown preventDefault)
 *   - aria-label cho screen reader
 */
export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ inputSize = 'md', revealable = false, type, className, disabled, ...rest }, ref) => {
    const [visible, setVisible] = useState(false)
    const isRevealable = revealable && type === 'password'
    const effectiveType = isRevealable && visible ? 'text' : type

    if (!isRevealable) {
      // Render đơn giản như trước
      return (
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={cn('lqg-input', `lqg-input-${inputSize}`, className)}
          {...rest}
        />
      )
    }

    // Render với wrapper + toggle button
    return (
      <div className="relative">
        <input
          ref={ref}
          type={effectiveType}
          disabled={disabled}
          className={cn(
            'lqg-input',
            `lqg-input-${inputSize}`,
            'pr-11', // reserve 44px cho button
            className
          )}
          {...rest}
        />
        <button
          type="button"
          tabIndex={disabled ? -1 : 0}
          disabled={disabled}
          onMouseDown={e => e.preventDefault()} // giữ focus input khi click
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
          title={visible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2',
            'inline-flex items-center justify-center',
            'h-8 w-8 rounded-full',
            'text-foreground/50 hover:text-foreground/85',
            'hover:bg-foreground/8',
            'transition disabled:opacity-30 disabled:pointer-events-none',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50'
          )}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
    )
  }
)
GlassInput.displayName = 'GlassInput'
