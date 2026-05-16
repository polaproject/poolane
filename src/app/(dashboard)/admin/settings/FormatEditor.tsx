'use client'

import type { AmountStyleSetting } from '@/lib/settings'

const AMOUNT_OPTIONS: Array<{ value: AmountStyleSetting; label: string; example: string }> = [
  { value: 'vn_full',    label: 'Việt Nam đầy đủ',   example: '1.300.000đ' },
  { value: 'vn_compact', label: 'Việt Nam rút gọn',  example: '1,3M' },
  { value: 'no_symbol',  label: 'Không có đơn vị',   example: '1.300.000' },
  { value: 'us',         label: 'US Dollar',         example: '$1,300,000' },
]

const PERCENT_OPTIONS = [
  { value: 0, label: '0 số lẻ', example: '15%' },
  { value: 1, label: '1 số lẻ', example: '15,3%' },
  { value: 2, label: '2 số lẻ', example: '15,28%' },
]

const SEPARATOR_OPTIONS: Array<{ value: '.' | ','; label: string; example: string }> = [
  { value: '.', label: 'Dấu chấm (kiểu Việt)',  example: '1.300.000' },
  { value: ',', label: 'Dấu phẩy (kiểu US)',    example: '1,300,000' },
]

interface Props {
  amountStyle: AmountStyleSetting
  percentDecimals: number
  thousandSeparator: '.' | ','
  onChange: (key: 'format.amount_style' | 'format.percent_decimals' | 'format.thousand_separator', value: AmountStyleSetting | number | '.' | ',') => void
}

export function FormatEditor({ amountStyle, percentDecimals, thousandSeparator, onChange }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/65">
        Định dạng hiển thị số mặc định cho mọi báo cáo / dashboard tuỳ chỉnh. Trong widget builder
        bạn vẫn override được cho từng cột riêng.
      </p>

      {/* Amount style */}
      <div>
        <h3 className="lqg-headline text-base text-foreground mb-2">Định dạng tiền (VND)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AMOUNT_OPTIONS.map(opt => {
            const active = amountStyle === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange('format.amount_style', opt.value)}
                className={[
                  'text-left px-4 py-3 rounded-card-lg ring-1 transition',
                  active
                    ? 'bg-accent/15 ring-accent text-foreground'
                    : 'bg-paper-tint/40 ring-foreground/10 hover:ring-foreground/25 text-foreground/85',
                ].join(' ')}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-foreground/55 mt-0.5 font-mono">{opt.example}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Percent decimals */}
      <div>
        <h3 className="lqg-headline text-base text-foreground mb-2">Số chữ số thập phân cho %</h3>
        <div className="flex gap-2 flex-wrap">
          {PERCENT_OPTIONS.map(opt => {
            const active = percentDecimals === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange('format.percent_decimals', opt.value)}
                className={[
                  'px-4 py-2 rounded-pill ring-1 transition text-sm',
                  active
                    ? 'bg-accent/15 ring-accent text-foreground'
                    : 'bg-paper-tint/40 ring-foreground/10 hover:ring-foreground/25 text-foreground/85',
                ].join(' ')}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="ml-2 text-xs text-foreground/55 font-mono">{opt.example}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Thousand separator */}
      <div>
        <h3 className="lqg-headline text-base text-foreground mb-2">Dấu phân cách hàng nghìn</h3>
        <div className="flex gap-2 flex-wrap">
          {SEPARATOR_OPTIONS.map(opt => {
            const active = thousandSeparator === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange('format.thousand_separator', opt.value)}
                className={[
                  'px-4 py-2 rounded-pill ring-1 transition text-sm',
                  active
                    ? 'bg-accent/15 ring-accent text-foreground'
                    : 'bg-paper-tint/40 ring-foreground/10 hover:ring-foreground/25 text-foreground/85',
                ].join(' ')}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="ml-2 text-xs text-foreground/55 font-mono">{opt.example}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
