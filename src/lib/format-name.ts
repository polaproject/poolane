/**
 * Rút gọn tên đầy đủ tiếng Việt cho hiển thị compact (vd cột lịch tuần
 * trong admin schedule, popover narrow widths, etc.).
 *
 * Rule: viết tắt họ (từ đầu) còn 2 chữ, giữ NGUYÊN VẸN tên đệm + tên chính
 * (last word = first name theo tiếng Việt).
 *
 * @example
 * shortenVietnameseName("Nguyễn Ngọc Hoàng Việt") // "Ng Ngọc Hoàng Việt"
 * shortenVietnameseName("Trần Thị Thu Hương")     // "Tr Thị Thu Hương"
 * shortenVietnameseName("Phạm Minh Anh")          // "Phạm Minh Anh" (≤20)
 * shortenVietnameseName("Hoàng")                  // "Hoàng" (1 từ)
 * shortenVietnameseName("Nguyễn Lan")             // "Nguyễn Lan" (≤20)
 */
export function shortenVietnameseName(fullName: string, maxLength = 20): string {
  if (!fullName) return ''
  const trimmed = fullName.trim()
  if (trimmed.length <= maxLength) return trimmed

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return trimmed // 1 từ → không rút được nữa

  // Bước 1: viết tắt họ (từ đầu) còn 2 chữ
  const surname = parts[0].slice(0, 2)
  const rest = parts.slice(1)
  let abbr = surname + ' ' + rest.join(' ')
  if (abbr.length <= maxLength) return abbr

  // Bước 2: vẫn dài → viết tắt tên đệm từ trái sang (giữ tên chính = last word)
  if (rest.length >= 2) {
    const lastName = rest[rest.length - 1]
    const middle = rest.slice(0, -1)
    for (let i = 0; i < middle.length; i++) {
      middle[i] = middle[i].charAt(0) + '.'
      abbr = surname + ' ' + middle.join(' ') + ' ' + lastName
      if (abbr.length <= maxLength) return abbr
    }
  }

  // Worst case: vẫn dài → fallback truncate
  return abbr.length > maxLength ? abbr.slice(0, maxLength - 1) + '…' : abbr
}
