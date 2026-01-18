import { prisma } from "@/lib/prisma";
import HistoryClient from "./HistoryClient";

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      recommendationSets: {
        include: {
          options: {
            include: {
              feedback: true,
            },
          },
        },
      },
    },
  });

  // Find last accepted meal
  const lastAccepted = await prisma.optionFeedback.findFirst({
    where: { decision: "ACCEPT" },
    orderBy: { createdAt: "desc" },
    include: {
      optionItem: {
        include: {
          recommendationSet: {
            include: {
              session: true,
            },
          },
        },
      },
    },
  });

  // Serialize dates for client component
  const serializedSessions = sessions.map((session) => ({
    ...session,
    createdAt: session.createdAt.toISOString(),
    recommendationSets: session.recommendationSets.map((set) => ({
      ...set,
      options: set.options.map((opt) => ({
        title: opt.title,
        feedback: opt.feedback,
      })),
    })),
  }));

  const serializedLastAccepted = lastAccepted
    ? {
        title: lastAccepted.optionItem.title,
        sessionId: lastAccepted.optionItem.recommendationSet.sessionId,
        createdAt: lastAccepted.createdAt.toISOString(),
      }
    : null;

  return (
    <HistoryClient sessions={serializedSessions} lastAccepted={serializedLastAccepted} />
  );
}
