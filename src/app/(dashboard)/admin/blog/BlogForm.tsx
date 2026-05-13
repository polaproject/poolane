'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PhotoUploader } from '@/components/features/PhotoUploader'

const CATEGORIES = [
  { value: 'technique', label: '🏊 Kỹ thuật' },
  { value: 'safety', label: '🦺 An toàn' },
  { value: 'nutrition', label: '🥗 Dinh dưỡng' },
  { value: 'student_story', label: '⭐ Câu chuyện HV' },
  { value: 'news', label: '📰 Tin tức' },
] as const

interface FormData {
  title: string
  slug: string
  category: string
  excerpt: string
  content: string
  status: string
  scheduledAt: string
  coverImageUrl: string
}

interface Props {
  mode: 'create' | 'edit'
  initial?: Partial<FormData> & { id?: string }
}

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/đ/g, 'd').replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e').replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o').replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').slice(0, 100)
}

export function BlogForm({ mode, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    category: initial?.category ?? 'technique',
    excerpt: initial?.excerpt ?? '',
    content: initial?.content ?? '',
    status: initial?.status ?? 'draft',
    scheduledAt: initial?.scheduledAt ?? '',
    coverImageUrl: initial?.coverImageUrl ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateTitle(v: string) {
    setForm(f => ({ ...f, title: v, slug: mode === 'create' && !f.slug ? slugify(v) : f.slug }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        slug: form.slug,
        category: form.category,
        excerpt: form.excerpt || undefined,
        content: form.content,
        status: form.status,
        coverImageUrl: form.coverImageUrl || undefined,
      }
      if (form.status === 'scheduled' && form.scheduledAt) {
        payload.scheduledAt = form.scheduledAt
      }

      const url = mode === 'create' ? '/api/blog' : `/api/blog/${initial?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      router.push('/admin/blog')
      router.refresh()
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  async function onDelete() {
    if (!initial?.id) return
    if (!confirm('Xoá bài viết này?')) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/blog/${initial.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error?.message ?? 'Có lỗi')
        setSubmitting(false)
        return
      }
      router.push('/admin/blog')
      router.refresh()
    } catch {
      setError('Không thể kết nối')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5 space-y-4">
        <FormField label="Tiêu đề" required>
          <input type="text" maxLength={200} required
            value={form.title} onChange={e => updateTitle(e.target.value)}
            className="input-blog" placeholder="VD: 5 lỗi thường gặp khi mới học bơi ếch" />
        </FormField>

        <FormField label="Slug (URL)" required>
          <input type="text" maxLength={100} required pattern="[a-z0-9-]+"
            value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase() }))}
            className="input-blog font-mono text-sm" placeholder="vd-loi-hoc-boi" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Danh mục" required>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-blog">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </FormField>
          <FormField label="Trạng thái" required>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-blog">
              <option value="draft">Nháp</option>
              <option value="published">Đăng ngay</option>
              <option value="scheduled">Lên lịch</option>
            </select>
          </FormField>
        </div>

        {form.status === 'scheduled' && (
          <FormField label="Thời điểm đăng">
            <input type="datetime-local" value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              className="input-blog" />
          </FormField>
        )}

        <FormField label="Ảnh bìa">
          <PhotoUploader
            folder="blog-covers"
            value={form.coverImageUrl ? [form.coverImageUrl] : []}
            onChange={urls => setForm(f => ({ ...f, coverImageUrl: urls[0] ?? '' }))}
            max={1}
            variant="single"
          />
        </FormField>

        <FormField label="Tóm tắt (excerpt — hiển thị ở list)">
          <textarea maxLength={300} rows={2}
            value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
            className="input-blog" placeholder="Mô tả ngắn..." />
        </FormField>

        <FormField label="Nội dung (Markdown)" required>
          <textarea required minLength={50} rows={16}
            value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            className="input-blog font-mono text-sm" placeholder="# Tiêu đề chính&#10;&#10;Đoạn văn nội dung..." />
          <p className="text-xs text-[#1C2B4A]/40 mt-1">Hỗ trợ Markdown. Tối thiểu 50 ký tự.</p>
        </FormField>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#1C2B4A]/90 disabled:opacity-50">
          {submitting ? 'Đang lưu...' : (mode === 'create' ? 'Tạo bài viết' : 'Lưu thay đổi')}
        </button>
        {mode === 'edit' && (
          <button type="button" onClick={onDelete} disabled={submitting}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-red-300 text-red-700 hover:bg-red-50">
            Xoá
          </button>
        )}
        <Link href="/admin/blog"
          className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[#1C2B4A]/15 text-[#1C2B4A]/70 hover:bg-[#1C2B4A]/5">
          Huỷ
        </Link>
      </div>

      <style jsx>{`
        .input-blog {
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #1C2B4A;
          background: #fff;
          border: 1px solid rgba(28, 43, 74, 0.15);
          border-radius: 0.5rem;
          outline: none;
        }
        .input-blog:focus {
          border-color: rgba(28, 43, 74, 0.4);
          box-shadow: 0 0 0 3px rgba(28, 43, 74, 0.1);
        }
      `}</style>
    </form>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
