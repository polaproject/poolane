'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Question {
  id: string
  questionText: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | string
  options: string[]
}

interface ResultDetail {
  questionId: string
  questionText: string
  userAnswer: string
  correctAnswer: string
  correct: boolean
  explanation: string | null
}

interface QuizResult {
  attemptId: string
  score: number
  maxScore: number
  percentage: number
  detail: ResultDetail[]
}

export function QuizRunner({ quizId, questions }: { quizId: string; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)

  const totalAnswered = Object.values(answers).filter(v => v.trim().length > 0).length
  const canSubmit = totalAnswered === questions.length

  function setAnswer(qid: string, value: string) {
    setAnswers(a => ({ ...a, [qid]: value }))
  }

  async function onSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Có lỗi xảy ra')
        setSubmitting(false)
        return
      }
      setResult(json.data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Không thể kết nối tới máy chủ')
      setSubmitting(false)
    }
  }

  if (result) {
    const grade = result.percentage >= 80 ? 'green' : result.percentage >= 60 ? 'amber' : 'red'
    const gradeColor = grade === 'green' ? 'text-green-600' : grade === 'amber' ? 'text-amber-600' : 'text-red-600'

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-[#1C2B4A]/50 font-semibold mb-2">Kết quả</p>
          <p className={`font-heading text-5xl ${gradeColor}`}>{result.percentage}%</p>
          <p className="text-sm text-[#1C2B4A]/60 mt-1">{result.score}/{result.maxScore} câu đúng</p>
        </div>

        <div className="space-y-3">
          {result.detail.map((d, i) => (
            <div key={d.questionId}
              className={`bg-white rounded-2xl shadow-sm border p-4 ${d.correct ? 'border-green-200' : 'border-red-200'}`}>
              <div className="flex items-start gap-2 mb-2">
                {d.correct
                  ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                }
                <p className="font-semibold text-sm text-[#1C2B4A]">Câu {i + 1}. {d.questionText}</p>
              </div>
              <div className="pl-7 text-sm space-y-1">
                <p className={d.correct ? 'text-green-700' : 'text-red-700'}>
                  Bạn chọn: <strong>{d.userAnswer || '(không trả lời)'}</strong>
                </p>
                {!d.correct && (
                  <p className="text-green-700">
                    Đáp án đúng: <strong>{d.correctAnswer}</strong>
                  </p>
                )}
                {d.explanation && (
                  <p className="text-xs text-[#1C2B4A]/60 italic mt-2">💡 {d.explanation}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Link href="/student/quiz"
          className="block text-center bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-3 text-sm font-semibold hover:bg-[#1C2B4A]/90">
          Quay lại danh sách quiz
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900">
        Đã trả lời {totalAnswered}/{questions.length} câu
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-[#1C2B4A]/8 p-5">
          <p className="font-semibold text-[#1C2B4A] mb-3">Câu {i + 1}. {q.questionText}</p>

          {q.type === 'multiple_choice' && (
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#F6F1EA]/40">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswer(q.id, opt)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#1C2B4A]">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-2">
              {['Đúng', 'Sai'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(q.id, opt)}
                  className={`py-2 rounded-lg text-sm font-semibold border ${
                    answers[q.id] === opt
                      ? 'bg-[#1C2B4A] text-[#F6F1EA] border-[#1C2B4A]'
                      : 'bg-white text-[#1C2B4A]/70 border-[#1C2B4A]/15 hover:border-[#1C2B4A]/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === 'short_answer' && (
            <input
              type="text"
              value={answers[q.id] ?? ''}
              onChange={e => setAnswer(q.id, e.target.value)}
              placeholder="Nhập câu trả lời..."
              className="w-full px-3 py-2 text-sm border border-[#1C2B4A]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 bg-white"
            />
          )}
        </div>
      ))}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || !canSubmit}
        className="w-full bg-[#1C2B4A] text-[#F6F1EA] rounded-lg py-3 text-sm font-semibold hover:bg-[#1C2B4A]/90 disabled:opacity-50"
      >
        {submitting
          ? <span className="inline-flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang nộp...</span>
          : canSubmit ? 'Nộp bài' : `Còn ${questions.length - totalAnswered} câu chưa trả lời`
        }
      </button>
    </div>
  )
}
