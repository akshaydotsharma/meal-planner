import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FeedbackDecision, FeedbackReason } from '@/lib/schemas'

export async function POST(request: Request) {
  const body = await request.json()
  const { optionItemId, decision, reason, reasonNote } = body

  // Validate decision
  if (!Object.values(FeedbackDecision).includes(decision)) {
    return NextResponse.json(
      { error: 'Invalid decision. Must be ACCEPT, REJECT, or NOT_NOW' },
      { status: 400 }
    )
  }

  // Validate reason if provided
  if (reason && !Object.values(FeedbackReason).includes(reason)) {
    return NextResponse.json(
      { error: 'Invalid reason' },
      { status: 400 }
    )
  }

  // Check if option exists
  const option = await prisma.optionItem.findUnique({
    where: { id: optionItemId },
  })

  if (!option) {
    return NextResponse.json({ error: 'Option not found' }, { status: 404 })
  }

  // Upsert feedback (replace if exists)
  const feedback = await prisma.optionFeedback.upsert({
    where: { optionItemId },
    update: {
      decision,
      reason: reason || null,
      reasonNote: reason === FeedbackReason.OTHER ? reasonNote : null,
    },
    create: {
      optionItemId,
      decision,
      reason: reason || null,
      reasonNote: reason === FeedbackReason.OTHER ? reasonNote : null,
    },
  })

  return NextResponse.json(feedback)
}
