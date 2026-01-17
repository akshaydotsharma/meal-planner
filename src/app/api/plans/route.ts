import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWeeklyPlan } from '@/lib/openai'
import { PlanInputsSchema } from '@/lib/schemas'

export async function GET() {
  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      days: {
        orderBy: { dayIndex: 'asc' },
      },
      shoppingList: true,
    },
  })

  return NextResponse.json(plans)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate inputs
    const inputs = PlanInputsSchema.parse(body)

    // Get user profile
    const profile = await prisma.userProfile.findFirst()
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please set up your profile first.' },
        { status: 404 }
      )
    }

    // Get recent feedback for personalization
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

    // Generate the weekly plan
    const { response, rawJson } = await generateWeeklyPlan({
      pantryText: profile.pantryText,
      utensilsText: profile.utensilsText,
      inputs,
      preferenceSummary: preferenceSummary?.summaryText,
      recentFeedback: feedbackSummary,
    })

    // Create plan with days in database
    const plan = await prisma.plan.create({
      data: {
        inputsJson: JSON.stringify(inputs),
        days: {
          create: response.days.map((day, index) => ({
            dayIndex: index,
            recipeJson: JSON.stringify(day),
            rawResponseJson: rawJson,
          })),
        },
      },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
        },
      },
    })

    return NextResponse.json({
      plan,
      reuseStrategy: response.reuseStrategy,
    })
  } catch (error) {
    console.error('Error generating plan:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate plan' },
      { status: 500 }
    )
  }
}
