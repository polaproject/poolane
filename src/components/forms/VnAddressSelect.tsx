'use client'

import { useEffect, useState } from 'react'

type Province = { code: number; name: string }
type Ward = { code: number; name: string; districtName?: string }

const API = 'https://provinces.open-api.vn/api'

interface Props {
  provinceCode: number | null
  wardCode: number | null
  /** Callback nhận trọn thông tin: name (lưu DB) + code (track state UI). */
  onChange: (data: {
    province: string
    ward: string
    provinceCode: number | null
    wardCode: number | null
  }) => void
  /** Hiển thị error nếu có */
  errorProvince?: string
  errorWard?: string
}

/**
 * VnAddressSelect — cascading dropdown Tỉnh/Thành phố → Phường/Xã.
 *
 * Cấu trúc đơn vị hành chính mới (sau 01/07/2025): bỏ cấp huyện. Ta gọi API
 * cũ `/p/{code}?depth=3` (vẫn 3 cấp) rồi flatten tất cả wards từ các districts
 * thành 1 list cho user chọn. Cache trong sessionStorage để tránh re-fetch.
 *
 * API: provinces.open-api.vn (free, không cần key).
 */
export function VnAddressSelect({ provinceCode, wardCode, onChange, errorProvince, errorWard }: Props) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(true)
  const [loadingWards, setLoadingWards] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load provinces 1 lần (cache sessionStorage)
  useEffect(() => {
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem('vn-provinces') : null
    if (cached) {
      try {
        setProvinces(JSON.parse(cached))
        setLoadingProvinces(false)
        return
      } catch { /* fall through to fetch */ }
    }
    fetch(`${API}/p/`)
      .then(r => {
        if (!r.ok) throw new Error('Provinces fetch failed')
        return r.json()
      })
      .then((data: Array<{ code: number; name: string }>) => {
        const slim: Province[] = data.map(p => ({ code: p.code, name: p.name }))
        setProvinces(slim)
        try { sessionStorage.setItem('vn-provinces', JSON.stringify(slim)) } catch { /* quota */ }
      })
      .catch(() => setError('Không tải được danh sách tỉnh/thành. Vui lòng thử lại.'))
      .finally(() => setLoadingProvinces(false))
  }, [])

  // Khi chọn tỉnh → fetch wards (flatten từ districts)
  useEffect(() => {
    if (!provinceCode) { setWards([]); return }
    const cacheKey = `vn-wards-${provinceCode}`
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    if (cached) {
      try {
        setWards(JSON.parse(cached))
        return
      } catch { /* fall through */ }
    }
    setLoadingWards(true)
    fetch(`${API}/p/${provinceCode}?depth=3`)
      .then(r => {
        if (!r.ok) throw new Error('Wards fetch failed')
        return r.json()
      })
      .then((data: { districts?: Array<{ name: string; wards?: Array<{ code: number; name: string }> }> }) => {
        const flat: Ward[] = (data.districts || []).flatMap(d =>
          (d.wards || []).map(w => ({ code: w.code, name: w.name, districtName: d.name }))
        ).sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        setWards(flat)
        try { sessionStorage.setItem(cacheKey, JSON.stringify(flat)) } catch { /* quota */ }
      })
      .catch(() => setError('Không tải được danh sách phường/xã. Vui lòng thử lại.'))
      .finally(() => setLoadingWards(false))
  }, [provinceCode])

  const provinceName = (code: number | null) => provinces.find(p => p.code === code)?.name || ''
  const wardName = (code: number | null) => wards.find(w => w.code === code)?.name || ''

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Tỉnh/Thành phố */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium lqg-text-primary">
            Tỉnh / Thành phố <span className="text-danger">*</span>
          </label>
          <select
            className="lqg-input lqg-input-md w-full"
            value={provinceCode ?? ''}
            disabled={loadingProvinces}
            onChange={e => {
              const code = e.target.value ? Number(e.target.value) : null
              onChange({
                provinceCode: code,
                wardCode: null,
                province: provinceName(code),
                ward: '',
              })
            }}
          >
            <option value="">{loadingProvinces ? 'Đang tải...' : '— Chọn tỉnh/thành phố —'}</option>
            {provinces.map(p => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
          {errorProvince && <p className="text-xs text-danger">{errorProvince}</p>}
        </div>

        {/* Phường/Xã */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium lqg-text-primary">Phường / Xã</label>
          <select
            className="lqg-input lqg-input-md w-full"
            value={wardCode ?? ''}
            disabled={!provinceCode || loadingWards}
            onChange={e => {
              const code = e.target.value ? Number(e.target.value) : null
              onChange({
                provinceCode,
                wardCode: code,
                province: provinceName(provinceCode),
                ward: wardName(code),
              })
            }}
          >
            <option value="">
              {!provinceCode ? 'Chọn tỉnh trước' : loadingWards ? 'Đang tải...' : '— Chọn (tuỳ chọn) —'}
            </option>
            {wards.map(w => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
          {errorWard && <p className="text-xs text-danger">{errorWard}</p>}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
