import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MessagesClient } from '@/components/features/chat/MessagesClient'

// Admin xem TẤT CẢ conversations (giữ admin privilege)
export default async function AdminMessagesPage() {
  const user = await requireRole(['admin'])

  const conversations = await prisma.conversation.findMany({
    include: {
      participants: {
        where: { leftAt: null },
        include: { user: { select: { id: true, fullName: true, role: true, avatarUrl: true } } },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
  })

  // Admin có thể không là participant của conv → unreadCount = 0 cho những conv đó
  const myParts = await prisma.conversationParticipant.findMany({
    where: { userId: user.id, leftAt: null, conversationId: { in: conversations.map(c => c.id) } },
    select: { conversationId: true, lastReadAt: true },
  })
  const lastReadMap = new Map(myParts.map(p => [p.conversationId, p.lastReadAt]))

  const unreadCounts = await Promise.all(
    conversations.map(async c => {
      if (!lastReadMap.has(c.id)) return 0 // admin không là participant → 0
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
  const withUnread = conversations.map((c, i) => ({ ...c, unreadCount: unreadCounts[i] }))

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="lqg-headline text-xl">Tin nhắn</h1>
        <p className="text-sm text-foreground/55 mt-0.5">Quản lý tất cả cuộc hội thoại trong hệ thống</p>
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
