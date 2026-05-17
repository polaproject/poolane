'use client'

import { useState, type ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Lock, X, User } from 'lucide-react'
import { AvatarUploader } from './AvatarUploader'
import { ChangePasswordDialog } from './ChangePasswordDialog'

interface Props {
  trigger: ReactNode
  currentAvatarUrl: string | null
  fullName: string
}

/**
 * AccountSettingsDialog — cài đặt tài khoản nhanh (avatar + đổi mật khẩu)
 * cho mọi role (admin/staff/student). Mở từ sidebar/header avatar click.
 *
 * Trước Phase 18.7: chỉ student có UI upload avatar (qua /student/profile).
 * Admin/Staff không có chỗ đổi → sidebar/header của họ luôn hiện initial.
 *
 * Sau: click avatar → modal này → upload avatar + đổi mật khẩu trực tiếp.
 */
export function AccountSettingsDialog({ trigger, currentAvatarUrl, fullName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger nativeButton={false} render={(props) => <span {...props}>{trigger}</span>} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(480px,calc(100vw-2rem))] max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--surface)] rounded-card-xl shadow-glass ring-1 ring-foreground/10 p-6 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 transition-all duration-200">
          <Dialog.Close
            aria-label="Đóng"
            className="absolute top-3 right-3 h-9 w-9 rounded-pill bg-foreground/5 hover:bg-foreground/10 grid place-items-center transition"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </Dialog.Close>

          <div className="grid place-items-center h-12 w-12 rounded-pill bg-accent/15 mb-3">
            <User className="h-5 w-5 text-accent" strokeWidth={1.75} />
          </div>
          <Dialog.Title className="lqg-headline text-xl text-foreground mb-1">
            Cài đặt tài khoản
          </Dialog.Title>
          <Dialog.Description className="text-sm text-foreground/65 mb-5">
            Đổi avatar và mật khẩu của bạn.
          </Dialog.Description>

          {/* Avatar */}
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider text-foreground/55 font-semibold mb-3">
              Ảnh đại diện
            </p>
            <AvatarUploader currentAvatarUrl={currentAvatarUrl} fullName={fullName} />
          </div>

          <div className="border-t border-foreground/8 my-5" />

          {/* Password */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium text-foreground">Mật khẩu</p>
              <p className="text-xs text-foreground/55 mt-0.5">Đổi mật khẩu đăng nhập</p>
            </div>
            <ChangePasswordDialog
              trigger={
                <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-pill ring-1 ring-foreground/15 hover:bg-foreground/5 transition text-sm cursor-pointer">
                  <Lock className="h-4 w-4" strokeWidth={1.75} /> Đổi mật khẩu
                </button>
              }
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
