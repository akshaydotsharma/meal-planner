import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { RecommendationResponseSchema, type RecommendationResponse } from '@/lib/schemas'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const CHAT_PROMPT_VERSION = 'chat-v2'

const RECIPE_JSON_SCHEMA = `{
  "options": [
    {
      "title": "string - meal name",
      "why": "string - brief explanation",
      "timeMins": "number - cooking time in minutes",
      "difficulty": "Easy|Medium|Hard",
      "ingredientsUsed": {
        "pantry": ["array of strings - pantry items used"],
        "extra": ["array of strings - extra ingredients used"]
      },
      "missingIngredients": ["array of strings - items needed but not available"],
      "steps": ["array of strings - detailed cooking steps"],
      "substitutions": ["array of strings - possible substitutions"]
    }
  ]
}`

async function repairJson(malformedJson: string): Promise<string> {
  const repairPrompt = `The following JSON is malformed. Fix it to be valid JSON matching this schema:
${RECIPE_JSON_SCHEMA}

Malformed JSON:
${malformedJson}

Return ONLY the repaired valid JSON, nothing else.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: repairPrompt }],
    response_format: { type: 'json_object' },
    temperature: 0,
  })

  return completion.choices[0]?.message?.content || '{}'
}

function parseAndValidateJson(rawJson: string): RecommendationResponse {
  const parsed = JSON.parse(rawJson)
  return RecommendationResponseSchema.parse(parsed)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user profile
    const profile = await prisma.userProfile.findFirst()
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please set up your profile first.' }, { status: 404 })
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

    // Get preference summary if available
    const preferenceSummary = await prisma.preferenceSummary.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    const feedbackContext =
      recentFeedback.length > 0
        ? `\n\nRecent meal feedback (learn from this):\n${recentFeedback.map((f) => `- "${f.optionItem.title}": ${f.decision}`).join('\n')}`
        : ''

    const preferenceContext = preferenceSummary
      ? `\n\nUSER PREFERENCE PROFILE (tailor recommendations to these learned preferences):\n${preferenceSummary.summaryText}`
      : ''

    const systemPrompt = `You are a practical home cooking assistant. The user will describe what they want to eat in natural language. Based on their request and available ingredients, generate exactly 3 meal recommendations.

AVAILABLE PANTRY STAPLES:
${profile.pantryText || 'Not specified'}

AVAILABLE UTENSILS/EQUIPMENT:
${profile.utensilsText || 'Not specified'}${preferenceContext}${feedbackContext}

COOKING REALISM RULES (STRICT):
1. Timing must be realistic - include prep time, actual cooking time, and any waiting/resting periods
2. Steps must be detailed and actionable - specify temperatures, quantities, visual cues
3. Never suggest techniques that don't match available equipment
4. Account for parallel tasks - if something simmers while you prep, mention it

PRIORITIZATION RULES:
1. Prioritize using ingredients from the pantry staples
2. If the user mentions specific ingredients, use those as "extra" ingredients
3. Respect any constraints the user mentions (time, cuisine, diet, etc.)
4. Minimize missing ingredients - ideally 0-2 items max

RESPONSE FORMAT:
You MUST respond with valid JSON. Do not include any text outside the JSON object.
${RECIPE_JSON_SCHEMA}

Provide EXACTLY 3 options. Each option must have all required fields.`

    const model = 'gpt-4o'

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    let rawJson = completion.choices[0]?.message?.content || '{}'

    // Try to parse and validate, with one repair attempt if needed
    let validated: RecommendationResponse
    try {
      validated = parseAndValidateJson(rawJson)
    } catch (firstError) {
      console.warn('Initial JSON parse/validation failed, attempting repair:', firstError)
      try {
        rawJson = await repairJson(rawJson)
        validated = parseAndValidateJson(rawJson)
        console.log('JSON repair successful')
      } catch (repairError) {
        console.error('JSON repair also failed:', repairError)
        throw new Error('Failed to generate valid meal recommendations. Please try again.')
      }
    }

    // Create session from chat
    const session = await prisma.session.create({
      data: {
        extraIngredientsText: message,
        constraintsJson: JSON.stringify({ chatInput: message }),
      },
    })

    // Save recommendation set
    const recommendationSet = await prisma.recommendationSet.create({
      data: {
        sessionId: session.id,
        model,
        promptVersion: CHAT_PROMPT_VERSION,
        rawResponseJson: rawJson,
        options: {
          create: validated.options.map((opt, idx) => ({
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

    return NextResponse.json({
      sessionId: session.id,
      options: recommendationSet.options,
    })
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
