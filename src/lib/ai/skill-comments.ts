/**
 * Rule-based skill analysis comments cho HV.
 * KHÔNG dùng LLM — pure logic dựa trên scores + previousScores.
 *
 * Output thiết kế cho `/student/progress` hiển thị "AI phân tích tiến độ":
 *   - overall: 1 câu summary tone ấm áp tiếng Việt
 *   - improvements: list kỹ năng tăng điểm rõ
 *   - weaknesses: list kỹ năng cần focus thêm
 *   - encouragement: 1 câu động viên random từ pool
 *   - graduationReadiness: 0-100% đạt tiêu chí tốt nghiệp
 *
 * Tone guideline:
 *   - Ấm áp, không robotic
 *   - Pair negative với positive (không bao giờ chỉ chê)
 *   - Tiếng Việt natural — không dùng từ thuật ngữ
 */

interface Skill {
  key: string
  label: string
}

interface SkillCommentsInput {
  /** Skills của khoá đang học (8-9 skills theo course) */
  skills: readonly Skill[]
  /** Scores buổi gần nhất (skill.key → 1-5) */
  scores: Record<string, number>
  /** Scores buổi đầu tiên (cho delta calc) */
  previousScores?: Record<string, number>
  /** Course code để custom message theo từng khoá */
  courseCode?: 'ECH' | 'SAI' | 'BUOM'
  /** Session number (1-10+) để context hoá */
  sessionNumber?: number
}

export interface SkillCommentsOutput {
  overall: string
  improvements: string[]
  weaknesses: string[]
  encouragement: string
  graduationReadiness: number // 0-100
  isGraduationReady: boolean
}

const ENCOURAGEMENT_POOL = [
  'Hôm nay tốt hơn hôm qua đã là thành công 💙',
  'Cứ kiên trì, nước sẽ thân với bạn 🌊',
  'Mỗi buổi học là một bước tiến — đừng nóng vội',
  'Bạn đang đi đúng hướng, lớp ở đây để hỗ trợ',
  'Cảm xúc khi xuống nước quan trọng hơn kỹ thuật, hãy tận hưởng',
  'Bơi không phải đua — là kết nối với nhịp thở chính mình',
  'Tin vào cơ thể, nước sẽ nâng bạn lên',
  'Cứ thoải mái thôi, kỹ năng sẽ đến tự nhiên 🐳',
]

/** Random pick 1 câu encouragement — seed by sessionNumber để consistent trong 1 buổi */
function pickEncouragement(sessionNumber = 1): string {
  return ENCOURAGEMENT_POOL[sessionNumber % ENCOURAGEMENT_POOL.length]
}

/** Tính graduation readiness theo CLAUDE.md 7.7 */
function calculateGraduationReadiness(
  scores: Record<string, number>,
  skills: readonly Skill[]
): { score: number; ready: boolean } {
  if (skills.length === 0) return { score: 0, ready: false }

  const allScores = skills.map(s => scores[s.key] ?? 0).filter(s => s > 0)
  if (allScores.length === 0) return { score: 0, ready: false }

  // Tiêu chí 1: tất cả ≥ 3
  const allAbove3 = allScores.every(s => s >= 3)
  // Tiêu chí 2: % kỹ năng ≥ 3
  const percentAbove3 = (allScores.filter(s => s >= 3).length / skills.length) * 100

  // Score = trung bình của 2 yếu tố
  const score = Math.round(percentAbove3)
  const ready = allAbove3 && allScores.every(s => s >= 3)

  return { score, ready }
}

/** Detect improvements (delta ≥ 1) */
function detectImprovements(
  current: Record<string, number>,
  previous: Record<string, number> | undefined,
  skills: readonly Skill[]
): string[] {
  if (!previous) return []

  const improvements: string[] = []
  for (const skill of skills) {
    const now = current[skill.key] ?? 0
    const before = previous[skill.key] ?? 0
    if (now > 0 && before > 0 && now - before >= 1) {
      const delta = now - before
      const emoji = delta >= 2 ? '🚀' : '🎯'
      improvements.push(`${skill.label}: +${delta} điểm ${emoji}`)
    }
  }
  return improvements.slice(0, 3) // max 3 to avoid overflow
}

/** Detect weaknesses (current ≤ 2 hoặc tụt ≥ 0.5) */
function detectWeaknesses(
  current: Record<string, number>,
  previous: Record<string, number> | undefined,
  skills: readonly Skill[]
): string[] {
  const weaknesses: string[] = []
  for (const skill of skills) {
    const now = current[skill.key] ?? 0
    if (now === 0) continue // not assessed yet

    if (now <= 2) {
      weaknesses.push(`${skill.label} cần tập thêm`)
    } else if (previous) {
      const before = previous[skill.key] ?? 0
      if (before > 0 && before - now >= 1) {
        weaknesses.push(`${skill.label}: tụt 1 điểm — chú ý lại`)
      }
    }
  }
  return weaknesses.slice(0, 3) // max 3
}

/** Generate overall summary message based on graduation readiness */
function generateOverall(
  readiness: number,
  sessionNumber: number,
  isGraduationReady: boolean,
  courseCode?: string
): string {
  if (isGraduationReady) {
    return `Bạn đã đạt mọi tiêu chí tốt nghiệp ${courseCode === 'ECH' ? 'khoá Bơi Ếch' : courseCode === 'SAI' ? 'khoá Bơi Sải' : courseCode === 'BUOM' ? 'khoá Bơi Bướm' : 'khoá học'} 🎉`
  }

  if (readiness >= 80) {
    return 'Bạn rất gần tốt nghiệp — chỉ vài kỹ năng nữa thôi! 🌟'
  }
  if (readiness >= 60) {
    return 'Tiến độ ổn định, kiên trì buổi tới sẽ thấy kết quả 💪'
  }
  if (readiness >= 30) {
    if (sessionNumber <= 3) {
      return 'Mới bắt đầu — cần kiên nhẫn. Mỗi buổi đều có tiến bộ 🌱'
    }
    return 'Bạn đang xây nền tảng vững — đừng so sánh với ai 🌊'
  }
  return 'Mỗi người có nhịp riêng. Hãy tận hưởng từng buổi học 💙'
}

/**
 * Main function — generate full analysis cho HV.
 */
export function generateSkillComments(input: SkillCommentsInput): SkillCommentsOutput {
  const { skills, scores, previousScores, courseCode, sessionNumber = 1 } = input

  const { score: graduationReadiness, ready: isGraduationReady } = calculateGraduationReadiness(
    scores,
    skills
  )

  const improvements = detectImprovements(scores, previousScores, skills)
  const weaknesses = detectWeaknesses(scores, previousScores, skills)
  const encouragement = pickEncouragement(sessionNumber)
  const overall = generateOverall(graduationReadiness, sessionNumber, isGraduationReady, courseCode)

  return {
    overall,
    improvements,
    weaknesses,
    encouragement,
    graduationReadiness,
    isGraduationReady,
  }
}
