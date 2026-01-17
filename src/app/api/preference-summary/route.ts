import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { summarizePreferences } from '@/lib/openai'

export async function GET() {
  const summary = await prisma.preferenceSummary.findFirst({
    orderBy: { updatedAt: 'desc' },
  })

  if (!summary) {
    return NextResponse.json({ summary: null, message: 'No preference summary generated yet' })
  }

  return NextResponse.json({ summary })
}

export async function POST() {
  // Get the last 30 feedback events with context
  const feedbackItems = await prisma.optionFeedback.findMany({
    take: 30,
    orderBy: { createdAt: 'desc' },
    include: {
      optionItem: {
        select: {
          title: true,
          timeMins: true,
          difficulty: true,
          ingredientsUsedJson: true,
          missingIngredientsJson: true,
          recommendationSet: {
            select: {
              session: {
                select: {
                  constraintsJson: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (feedbackItems.length === 0) {
    return NextResponse.json({
      error: 'No feedback to summarize',
      summary: null,
    })
  }

  // Prepare data for summarization
  const feedbackData = feedbackItems.map((f) => {
    const ingredients = JSON.parse(f.optionItem.ingredientsUsedJson)
    const missing = JSON.parse(f.optionItem.missingIngredientsJson)
    let constraints = {}
    try {
      constraints = JSON.parse(f.optionItem.recommendationSet.session.constraintsJson)
    } catch {
      // ignore
    }

    return {
      title: f.optionItem.title,
      decision: f.decision,
      reason: f.reason,
      reasonNote: f.reasonNote,
      timeMins: f.optionItem.timeMins,
      difficulty: f.optionItem.difficulty,
      ingredientsUsed: ingredients,
      missingIngredients: missing,
      constraints,
    }
  })

  try {
    const summaryText = await summarizePreferences(feedbackData)

    // Upsert the summary (only keep one)
    const existingSummary = await prisma.preferenceSummary.findFirst()

    let summary
    if (existingSummary) {
      summary = await prisma.preferenceSummary.update({
        where: { id: existingSummary.id },
        data: { summaryText },
      })
    } else {
      summary = await prisma.preferenceSummary.create({
        data: { summaryText },
      })
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Failed to generate preference summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate preference summary' },
      { status: 500 }
    )
  }
}
