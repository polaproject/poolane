'use client'

import { forwardRef, useState, useEffect, useCallback, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  /** ISO date string YYYY-MM-DD (empty string khi chưa có giá trị) */
  value: string
  /** Callback nhận ISO date (YYYY-MM-DD) khi user nhập đủ + valid; '' nếu chưa đủ. */
  onChange: (isoDate: string) => void
  inputSize?: 'sm' | 'md' | 'lg'
}

function isoToDisplay(iso: string): string {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ''
  const [, y, mo, d] = m
  return `${d}/${mo}/${y}`
}

function displayToIso(disp: string): string {
  const m = disp.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ''
  const [, d, mo, y] = m
  const day = Number(d), month = Number(mo), year = Number(y)
  if (month < 1 || month > 12) return ''
  if (day < 1 || day > 31) return ''
  if (year < 1900 || year > new Date().getFullYear()) return ''
  // Validate hợp lệ thực sự (vd 31/02 không tồn tại)
  const dt = new Date(`${y}-${mo}-${d}T00:00:00Z`)
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() + 1 !== month || dt.getUTCDate() !== day) return ''
  return `${y}-${mo}-${d}`
}

function formatTyping(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/**
 * Date input dd/mm/yyyy — masked text input.
 * Lý do KHÔNG dùng native <input type="date">: hiển thị inconsistent giữa
 * Chrome (locale-based), Safari iOS (wheel picker), Firefox (text). Người
 * dùng VN quen format dd/mm/yyyy → mask thủ công đảm bảo nhất quán.
 *
 * Emit ISO YYYY-MM-DD qua onChange khi đủ 10 ký tự + valid. Khi gõ dở dang
 * (vd "15/01"), giữ internal display state, emit '' để parent biết chưa đủ.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, inputSize = 'md', className, onBlur, ...rest }, ref) => {
    const [display, setDisplay] = useState<string>(isoToDisplay(value))

    // Sync khi parent reset value (vd reset form)
    useEffect(() => {
      const want = isoToDisplay(value)
      if (want !== display && !display.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // Chỉ sync nếu user chưa đang gõ dở dang
        setDisplay(want)
      }
    }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatTyping(e.target.value)
      setDisplay(formatted)
      onChange(displayToIso(formatted))
    }, [onChange])

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        autoComplete="bday"
        maxLength={10}
        value={display}
        onChange={handleChange}
        onBlur={onBlur}
        className={cn('lqg-input', `lqg-input-${inputSize}`, className)}
        {...rest}
      />
    )
  }
)
DateInput.displayName = 'DateInput'
