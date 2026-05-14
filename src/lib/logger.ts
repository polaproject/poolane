// Structured logging — mọi error phải truy xuất được trong 60 giây
// Format: [context] message { data }

type LogLevel = 'info' | 'warn' | 'error' | 'critical'

interface LogEntry {
  level: LogLevel
  context: string
  message: string
  data?: Record<string, unknown>
  error?: Error | unknown
}

function formatLog(entry: LogEntry): string {
  const { level, context, message, data, error } = entry
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`

  let output = `${prefix} ${message}`

  if (data && Object.keys(data).length > 0) {
    output += ` ${JSON.stringify(data)}`
  }

  if (error instanceof Error) {
    output += `\n  Error: ${error.message}`
    if (error.stack) {
      output += `\n  Stack: ${error.stack.split('\n').slice(1, 3).join(' | ')}`
    }
  }

  return output
}

// Sanitize sensitive data trước khi log
function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ['password', 'token', 'key', 'secret', 'idCard', 'cccd']
  const result = { ...data }

  for (const key of Object.keys(result)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      result[key] = '[REDACTED]'
    }
  }

  return result
}

export const log = {
  info(context: string, message: string, data?: Record<string, unknown>) {
    console.log(formatLog({ level: 'info', context, message, data: data ? sanitize(data) : undefined }))
  },

  warn(context: string, message: string, data?: Record<string, unknown>) {
    console.warn(formatLog({ level: 'warn', context, message, data: data ? sanitize(data) : undefined }))
  },

  error(context: string, message: string, error?: unknown, data?: Record<string, unknown>) {
    console.error(formatLog({
      level: 'error',
      context,
      message,
      error,
      data: data ? sanitize(data) : undefined
    }))
  },

  critical(context: string, message: string, error?: unknown, data?: Record<string, unknown>) {
    console.error(formatLog({
      level: 'critical',
      context,
      message,
      error,
      data: data ? sanitize(data) : undefined
    }))
    // TODO: Phase 7 — gửi email alert cho admin khi critical
  },
}

// Helper để log lỗi và lưu vào error_logs table
export async function logError({
  context,
  message,
  error,
  userId,
  inputData,
  severity = 'error',
}: {
  context: string
  message: string
  error?: unknown
  userId?: string
  inputData?: Record<string, unknown>
  severity?: 'info' | 'warn' | 'error' | 'critical'
}) {
  const data = { userId, inputData: inputData ? sanitize(inputData) : undefined }
  if (severity === 'error' || severity === 'critical') {
    log[severity](context, message, error, data)
  } else {
    log[severity](context, message, data)
  }

  // TODO: Phase 1 sau khi có Prisma schema — lưu vào error_logs table
  // try {
  //   await prisma.errorLog.create({ ... })
  // } catch {
  //   // Không crash nếu log thất bại
  // }
}
