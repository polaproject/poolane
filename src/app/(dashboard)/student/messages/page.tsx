import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MessagesClient } from '@/components/features/chat/MessagesClient'

export default async function StudentMessagesPage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({ where: { userId: user.id } })
  if (!student) {
    return <div className="p-8 text-center text-foreground/55">Không tìm thấy hồ sơ học viên</div>
  }

  const conversations = await prisma.conversation.findMany({
    where: { studentId: student.id },
    include: {
      staffUser: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
      messages: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  // Unread count per conversation
  const unreadCounts = await Promise.all(
    conversations.map(c =>
      prisma.chatMessage.count({
        where: { conversationId: c.id, senderId: { not: user.id }, readAt: null, deletedAt: null },
      })
    )
  )
  const withUnread = conversations.map((c, i) => ({ ...c, unreadCount: unreadCounts[i] }))

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="lqg-headline text-xl">Tin nhắn</h1>
        <p className="text-sm text-foreground/55 mt-0.5">Nhắn tin trực tiếp với giáo viên</p>
      </div>
      <div className="flex-1 min-h-0">
        <MessagesClient
          initialConversations={JSON.parse(JSON.stringify(withUnread))}
          currentUserId={user.id}
          currentUserRole={user.role}
          currentUserName={user.fullName}
          currentUserAvatar={user.avatarUrl}
        />
      </div>
    </div>
  )
}
