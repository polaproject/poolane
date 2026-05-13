import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, { message: 'Slug chỉ chứa a-z, 0-9 và dấu -' }),
  content: z.string().min(50),
  excerpt: z.string().max(300).optional(),
  category: z.enum(['technique', 'safety', 'nutrition', 'student_story', 'news']),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  scheduledAt: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()
    const parsed = createPostSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() } }, { status: 400 })
    }

    const existing = await prisma.blogPost.findUnique({ where: { slug: parsed.data.slug } })
    if (existing) {
      return NextResponse.json({ data: null, error: { code: 'DUPLICATE_SLUG', message: 'Slug này đã tồn tại' } }, { status: 409 })
    }

    const post = await prisma.blogPost.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        content: parsed.data.content,
        excerpt: parsed.data.excerpt,
        category: parsed.data.category,
        authorId: user.id,
        status: parsed.data.status,
        publishedAt: parsed.data.status === 'published' ? new Date() : null,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      }
    })

    return NextResponse.json({ data: post, error: null }, { status: 201 })
  } catch (error) {
    await logError({ context: 'blog.create', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, title: true, slug: true, category: true, status: true, publishedAt: true, viewCount: true }
    })
    return NextResponse.json({ data: posts, error: null })
  } catch (error) {
    await logError({ context: 'blog.list', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
