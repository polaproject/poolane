import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const updatePostSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(50).optional(),
  excerpt: z.string().max(300).optional(),
  category: z.enum(['technique', 'safety', 'nutrition', 'student_story', 'news']).optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  scheduledAt: z.string().optional().nullable(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const post = await prisma.blogPost.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } }, { status: 404 })
    return NextResponse.json({ data: post, error: null })
  } catch (error) {
    await logError({ context: 'blog.get', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Lỗi' } }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const { id } = await params
    const body = await request.json()
    const parsed = updatePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } }, { status: 400 })
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } }, { status: 404 })

    // Check slug trùng (nếu đổi)
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const dup = await prisma.blogPost.findUnique({ where: { slug: parsed.data.slug } })
      if (dup) return NextResponse.json({ data: null, error: { code: 'DUPLICATE_SLUG', message: 'Slug đã tồn tại' } }, { status: 409 })
    }

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.scheduledAt !== undefined) {
      updateData.scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null
    }
    if (parsed.data.status === 'published' && !existing.publishedAt) {
      updateData.publishedAt = new Date()
    }

    const post = await prisma.blogPost.update({ where: { id }, data: updateData })

    await prisma.auditLog.create({
      data: {
        userId: user.id, role: user.role,
        action: 'blog.update', entityType: 'blog_post', entityId: id,
        afterData: parsed.data as Record<string, unknown> as never,
      }
    })

    return NextResponse.json({ data: post, error: null })
  } catch (error) {
    await logError({ context: 'blog.update', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireRole(['admin'])
    const { id } = await params
    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } }, { status: 404 })
    await prisma.blogPost.delete({ where: { id } })
    await prisma.auditLog.create({
      data: {
        userId: user.id, role: user.role,
        action: 'blog.delete', entityType: 'blog_post', entityId: id,
        beforeData: { title: existing.title, slug: existing.slug },
      }
    })
    return NextResponse.json({ data: { id }, error: null })
  } catch (error) {
    await logError({ context: 'blog.delete', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
