'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { PRODUCT_TYPES, PRODUCT_TYPE_LABELS, type ProductType } from '@/lib/validations/product'
import { PhotoUploader } from '@/components/features/PhotoUploader'

interface Course {
  id: string
  code: string
  name: string
  price: number
}

interface FormData {
  name: string
  sku: string
  type: ProductType
  price: string
  cost: string
  description: string
  linkedCourseId: string
  sessionsCount: string
  stockQuantity: string
  lowStockThreshold: string
  isActive: boolean
  photos: string[]
}

interface Props {
  courses: Course[]
  mode: 'create' | 'edit'
  initial?: Partial<FormData> & { id?: string }
}

export function ProductForm({ courses, mode, initial }: Props) {
  const router = useRouter()

  const [form, setForm] = useState<FormData>({
    name: initial?.name ?? '',
    sku: initial?.sku ?? '',
    type: (initial?.type as ProductType) ?? 'physical',
    price: initial?.price ?? '',
    cost: initial?.cost ?? '',
    description: initial?.description ?? '',
    linkedCourseId: initial?.linkedCourseId ?? '',
    sessionsCount: initial?.sessionsCount ?? '',
    stockQuantity: initial?.stockQuantity ?? '',
    lowStockThreshold: initial?.lowStockThreshold ?? '3',
    isActive: initial?.isActive ?? true,
    photos: initial?.photos ?? [],
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
    if (fieldErrors[key as string]) {
      setFieldErrors(e => { const { [key as string]: _, ...rest } = e; return rest })
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        sku: form.sku.toUpperCase(),
        type: form.type,
        price: Number(form.price),
        cost: form.cost ? Number(form.cost) : null,
        description: form.description || undefined,
        photos: form.photos,
      }

      if (form.type === 'course') {
        payload.linkedCourseId = form.linkedCourseId || null
      }
      if (form.type === 'improvement_pack') {
        payload.sessionsCount = form.sessionsCount ? Number(form.sessionsCount) : null
      }
      if (form.type === 'physical') {
        payload.stockQuantity = form.stockQuantity !== '' ? Number(form.stockQuantity) : null
        payload.lowStockThreshold = form.lowStockThreshold ? Number(form.lowStockThreshold) : 3
      }
      if (mode === 'edit') {
        payload.isActive = form.isActive
      }

      const url = mode === 'create' ? '/api/shop/products' : `/api/shop/products/${initial?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) {
        if (json.error?.details?.fieldErrors) {
          const fe: Record<string, string> = {}
          for (const [k, v] of Object.entries(json.error.details.fieldErrors)) {
            if (Array.isArray(v) && v.length > 0) fe[k] = String(v[0])
          }
          setFieldErrors(fe)
        }
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }

      // Phase 15.1 — Bug fix: edit trên cùng URL '/admin/shop/products/[id]'.
      // Trước đây router.push(sameUrl) = no-op trên Next.js → setSubmitting(false)
      // không chạy → button stuck "Đang lưu...". Giờ tách 2 flow:
      const productId = json.data?.id ?? initial?.id

      if (mode === 'create') {
        // Create: redirect to detail page mới
        toast.success('Đã tạo sản phẩm')
        router.push(productId ? `/admin/shop/products/${productId}` : '/admin/shop/products')
      } else {
        // Edit: stay on same page, refresh data + reset state + show toast
        toast.success('Đã lưu thay đổi')
        router.refresh()
        setSubmitting(false)
      }
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Type selector */}
      <div className="glass-card glass-card-hover p-5">
        <Label>Loại sản phẩm</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {PRODUCT_TYPES.map(t => (
            <button
              key={t}
              type="button"
              disabled={mode === 'edit'}
              onClick={() => update('type', t)}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                form.type === t
                  ? 'bg-ink-soft text-paper border-ink'
                  : 'bg-[var(--surface)] text-foreground/70 border-foreground/15 hover:border-foreground/40 disabled:opacity-50'
              }`}
            >
              {PRODUCT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {mode === 'edit' && (
          <p className="text-xs text-foreground/40 mt-2">Không thể đổi loại sản phẩm sau khi tạo</p>
        )}
      </div>

      {/* Basic info */}
      <div className="glass-card glass-card-hover p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tên sản phẩm <Req /></Label>
            <Input value={form.name} onChange={v => update('name', v)} maxLength={100} placeholder="VD: Kính bơi Aqua Pro" />
            <FieldError msg={fieldErrors.name} />
          </div>
          <div>
            <Label>Mã SKU <Req /></Label>
            <Input
              value={form.sku}
              onChange={v => update('sku', v.toUpperCase())}
              maxLength={50}
              placeholder="VD: KINH-BOI-001"
              className="font-mono"
            />
            <FieldError msg={fieldErrors.sku} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Giá bán (VNĐ) <Req /></Label>
            <Input type="number" value={form.price} onChange={v => update('price', v)} placeholder="VD: 150000" />
            <FieldError msg={fieldErrors.price} />
          </div>
          <div>
            <Label>Giá vốn (VNĐ)</Label>
            <Input type="number" value={form.cost} onChange={v => update('cost', v)} placeholder="Tuỳ chọn" />
            <FieldError msg={fieldErrors.cost} />
          </div>
        </div>

        <div>
          <Label>Mô tả</Label>
          <textarea
            rows={3}
            maxLength={2000}
            value={form.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Mô tả ngắn về sản phẩm..."
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-[var(--surface)]"
          />
        </div>

        <div>
          <Label>Ảnh sản phẩm</Label>
          <PhotoUploader
            folder="products"
            value={form.photos}
            onChange={photos => update('photos', photos)}
            max={5}
            variant="grid"
          />
        </div>
      </div>

      {/* Type-specific fields */}
      {form.type === 'course' && (
        <div className="glass-card glass-card-hover p-5">
          <Label>Khoá học liên kết <Req /></Label>
          <p className="text-xs text-foreground/50 mt-1 mb-2">
            Khi học viên mua, hệ thống tự tạo enrollment với khoá này
          </p>
          <select
            value={form.linkedCourseId}
            onChange={e => update('linkedCourseId', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-[var(--surface)]"
          >
            <option value="">— Chọn khoá học —</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name} · {c.price.toLocaleString('vi-VN')}đ
              </option>
            ))}
          </select>
          <FieldError msg={fieldErrors.linkedCourseId} />
        </div>
      )}

      {form.type === 'improvement_pack' && (
        <div className="glass-card glass-card-hover p-5">
          <Label>Số buổi cải thiện <Req /></Label>
          <p className="text-xs text-foreground/50 mt-1 mb-2">
            Pack sẽ chứa bao nhiêu buổi bơi lẻ để cải thiện kỹ năng
          </p>
          <Input type="number" value={form.sessionsCount} onChange={v => update('sessionsCount', v)} placeholder="VD: 5 hoặc 10" />
          <FieldError msg={fieldErrors.sessionsCount} />
        </div>
      )}

      {form.type === 'physical' && (
        <div className="glass-card glass-card-hover p-5 space-y-4">
          <div>
            <Label>Số lượng tồn kho <Req /></Label>
            <Input type="number" value={form.stockQuantity} onChange={v => update('stockQuantity', v)} placeholder="VD: 20" />
            <FieldError msg={fieldErrors.stockQuantity} />
          </div>
          <div>
            <Label>Ngưỡng cảnh báo sắp hết</Label>
            <p className="text-xs text-foreground/50 mt-0.5 mb-1">
              Khi tồn kho ≤ giá trị này, hệ thống hiển thị cảnh báo
            </p>
            <Input type="number" value={form.lowStockThreshold} onChange={v => update('lowStockThreshold', v)} />
            <FieldError msg={fieldErrors.lowStockThreshold} />
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div className="glass-card glass-card-hover p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => update('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-foreground/30"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Đang bán</p>
              <p className="text-xs text-foreground/50">Bỏ tick để ngừng bán sản phẩm này (không xoá)</p>
            </div>
          </label>
        </div>
      )}

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-ink-soft text-paper rounded-lg py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50"
        >
          {submitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
        </button>
        <Link
          href={mode === 'edit' && initial?.id ? `/admin/shop/products/${initial.id}` : '/admin/shop/products'}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-foreground/15 text-foreground/70 hover:bg-foreground/5"
        >
          Huỷ
        </Link>
      </div>
    </form>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1.5">
      {children}
    </label>
  )
}

function Req() {
  return <span className="text-danger">*</span>
}

function Input({
  value, onChange, type = 'text', placeholder, maxLength, className,
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  maxLength?: number
  className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-[var(--surface)] ${className ?? ''}`}
    />
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-danger mt-1">{msg}</p>
}
