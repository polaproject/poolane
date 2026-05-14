'use client'

import { useCallback, type MouseEvent } from 'react'

/**
 * useRipple — hook tạo ripple effect (lan toả từ điểm click) cho button.
 * Yêu cầu container có class `ripple-container` (overflow-hidden + position relative).
 *
 * @example
 * const ripple = useRipple()
 * <button onClick={ripple} className="ripple-container ...">Click me</button>
 */
export function useRipple<T extends HTMLElement = HTMLButtonElement>() {
  return useCallback((e: MouseEvent<T>) => {
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const span = document.createElement('span')
    span.className = 'ripple-effect'
    span.style.width = span.style.height = `${size}px`
    span.style.left = `${x}px`
    span.style.top = `${y}px`

    target.appendChild(span)
    setTimeout(() => span.remove(), 700)
  }, [])
}
