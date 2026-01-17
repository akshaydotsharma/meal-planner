import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
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
  })

  return NextResponse.json(sessions)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { extraIngredientsText, constraintsJson } = body

  const session = await prisma.session.create({
    data: {
      extraIngredientsText: extraIngredientsText || '',
      constraintsJson: JSON.stringify(constraintsJson || {}),
    },
  })

  return NextResponse.json(session)
}
