import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSwapDay } from '@/lib/openai'
import { PlanInputsSchema, type PlanDayRecipe } from '@/lib/schemas'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { dayIndex } = body

    if (typeof dayIndex !== 'number' || dayIndex < 0) {
      return NextResponse.json({ error: 'Invalid dayIndex' }, { status: 400 })
    }

    // Get the plan with all days
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Parse inputs
    const inputs = PlanInputsSchema.parse(JSON.parse(plan.inputsJson))

    if (dayIndex >= inputs.days) {
      return NextResponse.json({ error: 'dayIndex out of range' }, { status: 400 })
    }

    // Get user profile
    const profile = await prisma.userProfile.findFirst()
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get preference summary
    const preferenceSummary = await prisma.preferenceSummary.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    // Parse existing days
    const existingDays: PlanDayRecipe[] = plan.days.map((d) =>
      JSON.parse(d.recipeJson)
    )

    // Generate swap
    const { recipe, rawJson } = await generateSwapDay({
      pantryText: profile.pantryText,
      utensilsText: profile.utensilsText,
      inputs,
      dayIndex,
      existingDays,
      preferenceSummary: preferenceSummary?.summaryText,
    })

    // Update the day in database
    const updatedDay = await prisma.planDay.update({
      where: {
        planId_dayIndex: {
          planId: id,
          dayIndex,
        },
      },
      data: {
        recipeJson: JSON.stringify(recipe),
        rawResponseJson: rawJson,
      },
    })

    // Delete existing shopping list since ingredients changed
    await prisma.shoppingList.deleteMany({
      where: { planId: id },
    })

    return NextResponse.json({
      day: updatedDay,
      recipe,
    })
  } catch (error) {
    console.error('Error swapping day:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to swap day' },
      { status: 500 }
    )
  }
}
