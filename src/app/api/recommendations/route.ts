import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRecommendations } from '@/lib/openai'
import type { Constraints } from '@/lib/schemas'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId } = body

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get user profile
    const profile = await prisma.userProfile.findFirst()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get recent feedback (last 10)
    const recentFeedback = await prisma.optionFeedback.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        optionItem: {
          select: { title: true },
        },
      },
    })

    const feedbackSummary = recentFeedback.map((f) => ({
      title: f.optionItem.title,
      decision: f.decision,
    }))

    // Get preference summary if available
    const preferenceSummary = await prisma.preferenceSummary.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    // Generate recommendations
    const constraints: Constraints = JSON.parse(session.constraintsJson || '{}')

    const { response, rawJson, model, promptVersion } = await generateRecommendations({
      pantryText: profile.pantryText,
      utensilsText: profile.utensilsText,
      extraIngredientsText: session.extraIngredientsText,
      constraints,
      recentFeedback: feedbackSummary,
      preferenceSummary: preferenceSummary?.summaryText,
    })

    // Save recommendation set
    const recommendationSet = await prisma.recommendationSet.create({
      data: {
        sessionId,
        model,
        promptVersion,
        rawResponseJson: rawJson,
        options: {
          create: response.options.map((opt, idx) => ({
            idx: idx + 1,
            title: opt.title,
            why: opt.why,
            timeMins: opt.timeMins,
            difficulty: opt.difficulty,
            ingredientsUsedJson: JSON.stringify(opt.ingredientsUsed),
            missingIngredientsJson: JSON.stringify(opt.missingIngredients),
            stepsJson: JSON.stringify(opt.steps),
            substitutionsJson: JSON.stringify(opt.substitutions),
          })),
        },
      },
      include: {
        options: true,
      },
    })

    return NextResponse.json(recommendationSet)
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
