import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const profile = await prisma.userProfile.findFirst()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json(profile)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { pantryText, utensilsText } = body

  let profile = await prisma.userProfile.findFirst()

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { pantryText, utensilsText },
    })
  } else {
    profile = await prisma.userProfile.update({
      where: { id: profile.id },
      data: { pantryText, utensilsText },
    })
  }

  return NextResponse.json(profile)
}
