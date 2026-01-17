import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const plan = await prisma.plan.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayIndex: 'asc' },
      },
      shoppingList: true,
    },
  })

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  return NextResponse.json(plan)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const plan = await prisma.plan.findUnique({
    where: { id },
  })

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  await prisma.plan.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
