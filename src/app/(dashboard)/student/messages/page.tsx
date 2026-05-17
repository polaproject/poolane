import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { MessagesClient } from '@/components/features/chat/MessagesClient'

export default async function StudentMessagesPage() {
  const user = await requireRole(['student'])

  let withUnread: Array<Record<string, unknown>> = []
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: user.id, leftAt: null } } },
      include: {
        participants: {
          where: { leftAt: null },
          include: { user: { select: { id: true, fullName: true, role: true, avatarUrl: true } } },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    })

    if (conversations.length > 0) {
      const myParts = await prisma.conversationParticipant.findMany({
        where: { userId: user.id, leftAt: null, conversationId: { in: conversations.map(c => c.id) } },
        select: { conversationId: true, lastReadAt: true },
      })
      const lastReadMap = new Map(myParts.map(p => [p.conversationId, p.lastReadAt]))

      const unreadCounts = await Promise.all(
        conversations.map(async c => {
          const last = lastReadMap.get(c.id) ?? new Date(0)
          return prisma.chatMessage.count({
            where: {
              conversationId: c.id,
              senderId: { not: user.id },
              deletedAt: null,
              createdAt: { gt: last },
            },
          })
        }),
      )
      withUnread = conversations.map((c, i) => ({ ...c, unreadCount: unreadCounts[i] }))
    }
  } catch (error) {
    await logError({ context: 'student.messages.page', message: 'Failed to load conversations', error, userId: user.id })
    // Fallback graceful: render empty state thay vì crash
    withUnread = []
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="lqg-headline text-xl">Tin nhắn</h1>
        <p className="text-sm text-foreground/55 mt-0.5">Nhắn tin trực tiếp với giáo viên và bạn bè</p>
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
