import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { log, logError } from '@/lib/logger'

const BUCKET = 'poolane-public'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])

// ─── POST /api/upload — Upload ảnh lên Supabase Storage ───
// formData: file=<File>, folder=<string>
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const form = await request.formData()
    const file = form.get('file') as File | null
    const folder = (form.get('folder') as string | null) ?? 'misc'

    if (!file) {
      return NextResponse.json(
        { data: null, error: { code: 'NO_FILE', message: 'Chưa chọn file' } },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { data: null, error: { code: 'TOO_LARGE', message: 'File quá lớn (tối đa 5MB)' } },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_TYPE', message: 'Chỉ chấp nhận JPG, PNG, WebP, GIF' } },
        { status: 400 }
      )
    }

    // Sanitize folder name
    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '').slice(0, 30) || 'misc'

    // Gen unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${safeFolder}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const buffer = await file.arrayBuffer()

    const supabase = await createAdminClient()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) {
      // Bucket chưa tồn tại → friendly message
      const msg = uploadError.message ?? 'Upload failed'
      const isBucketMissing = msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('not found')
      await logError({ context: 'upload', message: msg, error: uploadError })
      return NextResponse.json(
        {
          data: null,
          error: {
            code: isBucketMissing ? 'BUCKET_MISSING' : 'UPLOAD_FAILED',
            message: isBucketMissing
              ? `Bucket "${BUCKET}" chưa tồn tại trên Supabase. Vào Supabase Dashboard → Storage → New bucket → tên: ${BUCKET}, Public.`
              : `Không thể upload file: ${msg}`
          }
        },
        { status: 500 }
      )
    }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(filename)

    log.info('upload.success', `Uploaded ${filename}`, { userId: user.id, size: file.size })

    return NextResponse.json({
      data: {
        url: publicUrl.publicUrl,
        path: filename,
      },
      error: null
    }, { status: 201 })

  } catch (error) {
    await logError({ context: 'upload', message: 'Failed', error })
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra khi upload' } },
      { status: 500 }
    )
  }
}
