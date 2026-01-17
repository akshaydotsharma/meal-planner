import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const savedMeals = await prisma.savedMeal.findMany({
    include: {
      optionItem: {
        include: {
          recommendationSet: {
            include: {
              session: true,
            },
          },
          feedback: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(savedMeals)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { optionItemId } = body

  if (!optionItemId) {
    return NextResponse.json({ error: 'optionItemId is required' }, { status: 400 })
  }

  // Check if option exists
  const option = await prisma.optionItem.findUnique({
    where: { id: optionItemId },
  })

  if (!option) {
    return NextResponse.json({ error: 'Option not found' }, { status: 404 })
  }

  // Check if already saved
  const existing = await prisma.savedMeal.findUnique({
    where: { optionItemId },
  })

  if (existing) {
    return NextResponse.json(existing)
  }

  const savedMeal = await prisma.savedMeal.create({
    data: { optionItemId },
  })

  return NextResponse.json(savedMeal)
}

export async function DELETE(request: Request) {
  const body = await request.json()
  const { optionItemId } = body

  if (!optionItemId) {
    return NextResponse.json({ error: 'optionItemId is required' }, { status: 400 })
  }

  const existing = await prisma.savedMeal.findUnique({
    where: { optionItemId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Saved meal not found' }, { status: 404 })
  }

  await prisma.savedMeal.delete({
    where: { optionItemId },
  })

  return NextResponse.json({ success: true })
}
