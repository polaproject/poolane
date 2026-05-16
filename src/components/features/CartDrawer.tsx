'use client'

import { Dialog } from '@base-ui/react/dialog'
import { X, Plus, Minus, Trash2, ShoppingCart, Loader2 } from 'lucide-react'

export interface CartDrawerItem {
  productId: string
  name: string
  price: number
  qty: number
  photo: string | null
  isOutOfStock?: boolean
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  items: CartDrawerItem[]
  total: number
  note: string
  onNoteChange: (v: string) => void
  onAdd: (id: string) => void
  onRemove: (id: string) => void
  onRemoveAll: (id: string) => void
  onCheckout: () => void
  ordering: boolean
}

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

/**
 * CartDrawer — bottom sheet liệt kê toàn bộ items giỏ + qty stepper + xoá +
 * ghi chú + nút đặt hàng.
 *
 * Pattern e-commerce phổ biến: card grid chỉ "+ Thêm" button (no inline -),
 * edit qty + remove xảy ra trong drawer này. Tránh các FAB che chặn.
 */
export function CartDrawer({
  open, onOpenChange,
  items, total,
  note, onNoteChange,
  onAdd, onRemove, onRemoveAll,
  onCheckout, ordering,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed bottom-0 inset-x-0 z-50 max-h-[88vh] overflow-y-auto bg-[var(--surface)] rounded-t-card-xl shadow-glass ring-1 ring-foreground/10 p-5 data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full transition-transform duration-300">
          {/* Pull handle */}
          <div className="flex justify-center mb-3">
            <span className="h-1 w-10 rounded-pill bg-foreground/15" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="lqg-headline text-xl text-foreground inline-flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-accent" strokeWidth={1.75} />
              Giỏ hàng <span className="text-foreground/55 text-base font-medium">({items.length})</span>
            </Dialog.Title>
            <Dialog.Close
              aria-label="Đóng"
              className="h-9 w-9 rounded-pill bg-foreground/5 hover:bg-foreground/10 grid place-items-center transition"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Dialog.Close>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-foreground/20" strokeWidth={1.25} />
              <p className="text-sm text-foreground/55">Giỏ hàng trống</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 p-3 rounded-card bg-paper-tint/30 ring-1 ring-foreground/5">
                    <div className="h-14 w-14 rounded-card overflow-hidden bg-paper-tint shrink-0 grid place-items-center">
                      {item.photo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-foreground/30 text-xs">—</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-accent font-bold mt-0.5">{fmt(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onRemove(item.productId)}
                        aria-label="Bớt 1"
                        className="h-8 w-8 rounded-pill ring-1 ring-foreground/15 grid place-items-center hover:ring-danger/40 hover:text-danger transition"
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </button>
                      <span className="lqg-numeric-sans w-7 text-center text-sm text-foreground font-bold">{item.qty}</span>
                      <button
                        onClick={() => onAdd(item.productId)}
                        disabled={item.isOutOfStock}
                        aria-label="Thêm 1"
                        className="h-8 w-8 rounded-pill bg-ink text-paper grid place-items-center hover:bg-foreground/90 transition disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => onRemoveAll(item.productId)}
                        aria-label="Xoá khỏi giỏ"
                        className="h-8 w-8 rounded-pill text-foreground/45 grid place-items-center hover:bg-danger/10 hover:text-danger transition ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note input */}
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-wider text-foreground/55 font-semibold mb-1.5">
                  Ghi chú cho lớp (tuỳ chọn)
                </label>
                <input
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="VD: Cần lấy hàng cuối tuần..."
                  maxLength={300}
                  className="w-full h-10 px-3 text-sm rounded-card bg-paper-tint/30 ring-1 ring-foreground/15 focus:ring-accent/40 focus:outline-none transition"
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t border-foreground/8 mb-4">
                <span className="text-sm text-foreground/65">Tổng cộng</span>
                <span className="lqg-numeric-sans text-2xl text-foreground font-bold">{fmt(total)}</span>
              </div>

              {/* Checkout */}
              <button
                onClick={onCheckout}
                disabled={ordering || items.length === 0}
                className="w-full h-12 rounded-pill bg-accent text-ink font-bold shadow-cta hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {ordering ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Đang đặt...</>
                ) : (
                  <>Đặt hàng · {fmt(total)}</>
                )}
              </button>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
