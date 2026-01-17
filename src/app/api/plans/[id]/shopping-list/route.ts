import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateShoppingList } from '@/lib/openai'
import type { PlanDayRecipe } from '@/lib/schemas'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const shoppingList = await prisma.shoppingList.findUnique({
    where: { planId: id },
  })

  if (!shoppingList) {
    return NextResponse.json(
      { error: 'Shopping list not found. Generate one first.' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ...shoppingList,
    list: JSON.parse(shoppingList.listJson),
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Get user profile for pantry
    const profile = await prisma.userProfile.findFirst()
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse plan days
    const planDays: PlanDayRecipe[] = plan.days.map((d) =>
      JSON.parse(d.recipeJson)
    )

    // Generate shopping list
    const { list, rawJson } = await generateShoppingList({
      planDays,
      pantryText: profile.pantryText,
    })

    // Upsert shopping list
    const shoppingList = await prisma.shoppingList.upsert({
      where: { planId: id },
      update: { listJson: JSON.stringify(list) },
      create: {
        planId: id,
        listJson: JSON.stringify(list),
      },
    })

    return NextResponse.json({
      ...shoppingList,
      list,
    })
  } catch (error) {
    console.error('Error generating shopping list:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate shopping list' },
      { status: 500 }
    )
  }
}
