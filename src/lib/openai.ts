import OpenAI from 'openai'
import {
  RecommendationResponseSchema,
  WeeklyPlanResponseSchema,
  PlanDayRecipeSchema,
  ShoppingListSchema,
  type Constraints,
  type RecommendationResponse,
  type PlanInputs,
  type WeeklyPlanResponse,
  type PlanDayRecipe,
  type ShoppingList,
} from './schemas'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface FeedbackSummary {
  title: string
  decision: string
}

interface GenerateRecommendationsInput {
  pantryText: string
  utensilsText: string
  extraIngredientsText: string
  constraints: Constraints
  recentFeedback: FeedbackSummary[]
  preferenceSummary?: string | null
}

// Versioned prompts for tracking and iteration
const PROMPT_VERSION = 'v2'

// Schema as a string for JSON repair prompt
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

export async function generateRecommendations(
  input: GenerateRecommendationsInput
): Promise<{ response: RecommendationResponse; rawJson: string; model: string; promptVersion: string }> {
  const { pantryText, utensilsText, extraIngredientsText, constraints, recentFeedback, preferenceSummary } = input

  const feedbackContext =
    recentFeedback.length > 0
      ? `\n\nRecent meal feedback (learn from this):\n${recentFeedback.map((f) => `- "${f.title}": ${f.decision}`).join('\n')}`
      : ''

  const preferenceContext = preferenceSummary
    ? `\n\nUSER PREFERENCE PROFILE (important - tailor recommendations to these learned preferences):\n${preferenceSummary}`
    : ''

  const constraintsText = Object.entries(constraints)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  const systemPrompt = `You are a practical home cooking assistant. Generate exactly 3 meal recommendations based on the user's available ingredients and constraints.

COOKING REALISM RULES (STRICT):
1. Timing must be realistic - include prep time, actual cooking time, and any waiting/resting periods
2. Steps must be detailed and actionable - specify temperatures, quantities, visual cues ("until golden brown")
3. Never suggest techniques that don't match available equipment (no sous vide without immersion circulator)
4. Account for parallel tasks - if something simmers while you prep, mention it
5. Missing ingredients should be truly necessary - don't pad the list

PRIORITIZATION RULES:
1. Use ingredients the user already has (pantry + extra ingredients) - this is the main goal
2. Minimize missing ingredients - ideally 0-2 items max
3. Respect all dietary constraints strictly - no exceptions
4. Consider the available utensils when suggesting cooking methods

RESPONSE FORMAT:
You MUST respond with valid JSON. Do not include any text outside the JSON object.
${RECIPE_JSON_SCHEMA}

Provide EXACTLY 3 options. Each option must have all required fields. Steps should be detailed enough for a beginner to follow.`

  const userPrompt = `Generate 3 meal recommendations for me.

PANTRY STAPLES (always available):
${pantryText || 'Not specified'}

UTENSILS/EQUIPMENT (available):
${utensilsText || 'Not specified'}

EXTRA INGREDIENTS (available for this meal):
${extraIngredientsText || 'None specified'}

CONSTRAINTS:
${constraintsText || 'None specified'}${preferenceContext}${feedbackContext}

Remember: Prioritize using what I have, minimize missing ingredients, be realistic about timing, and provide detailed, practical recipes.`

  const model = 'gpt-4o'

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
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

  return {
    response: validated,
    rawJson,
    model,
    promptVersion: PROMPT_VERSION,
  }
}

// Summarize user preferences from feedback history
interface FeedbackItem {
  title: string
  decision: string
  reason: string | null
  reasonNote: string | null
  timeMins: number
  difficulty: string
  ingredientsUsed: { pantry: string[]; extra: string[] }
  missingIngredients: string[]
  constraints: Record<string, unknown>
}

export async function summarizePreferences(feedbackData: FeedbackItem[]): Promise<string> {
  const prompt = `Analyze this meal feedback history and create a concise user preference profile.

FEEDBACK DATA:
${JSON.stringify(feedbackData, null, 2)}

Create a preference summary that includes:
1. Likes/dislikes (ingredients, cuisines, cooking styles)
2. Preferred cooking time range
3. Cuisines/dishes often accepted
4. Ingredients or meal types often rejected (with reasons if available)
5. Difficulty preferences
6. Any patterns in rejection reasons

IMPORTANT: Keep the summary under 1200 characters. Be specific and actionable - this will be used to personalize future recommendations.

Format as plain text paragraphs, not JSON.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
  })

  const summary = completion.choices[0]?.message?.content || ''

  // Enforce 1200 char limit
  if (summary.length > 1200) {
    return summary.slice(0, 1197) + '...'
  }

  return summary
}

// Weekly Plan Generation
const PLAN_PROMPT_VERSION = 'plan-v1'

const WEEKLY_PLAN_SCHEMA = `{
  "days": [
    {
      "title": "string - meal name",
      "why": "string - brief explanation of why this fits the plan",
      "timeMins": "number - cooking time in minutes",
      "difficulty": "Easy|Medium|Hard",
      "ingredientsUsed": {
        "pantry": ["array of strings - pantry items used"],
        "extra": ["array of strings - ingredients to buy"]
      },
      "missingIngredients": ["array of strings - items needed to buy"],
      "steps": ["array of strings - detailed cooking steps"],
      "substitutions": ["array of strings - possible substitutions"],
      "reuseNotes": "string - notes about ingredient reuse or leftovers strategy (optional)"
    }
  ],
  "reuseStrategy": {
    "sharedIngredients": ["array of strings - ingredients used across multiple days"],
    "leftoversStrategy": "string - overall leftovers strategy explanation"
  }
}`

interface GenerateWeeklyPlanInput {
  pantryText: string
  utensilsText: string
  inputs: PlanInputs
  preferenceSummary?: string | null
  recentFeedback: FeedbackSummary[]
}

export async function generateWeeklyPlan(
  input: GenerateWeeklyPlanInput
): Promise<{ response: WeeklyPlanResponse; rawJson: string; model: string; promptVersion: string }> {
  const { pantryText, utensilsText, inputs, preferenceSummary, recentFeedback } = input

  const feedbackContext =
    recentFeedback.length > 0
      ? `\n\nRecent meal feedback (learn from this):\n${recentFeedback.map((f) => `- "${f.title}": ${f.decision}`).join('\n')}`
      : ''

  const preferenceContext = preferenceSummary
    ? `\n\nUSER PREFERENCE PROFILE (important - tailor the plan to these learned preferences):\n${preferenceSummary}`
    : ''

  const cuisineContext = []
  if (inputs.includeCuisines && inputs.includeCuisines.length > 0) {
    cuisineContext.push(`Include these cuisines: ${inputs.includeCuisines.join(', ')}`)
  }
  if (inputs.excludeCuisines && inputs.excludeCuisines.length > 0) {
    cuisineContext.push(`Avoid these cuisines: ${inputs.excludeCuisines.join(', ')}`)
  }

  const systemPrompt = `You are a practical home cooking assistant specializing in weekly meal planning. Generate a ${inputs.days}-day dinner plan that is efficient, practical, and minimizes food waste.

CRITICAL PLANNING RULES:
1. Maximum cooking time per meal: ${inputs.maxCookTime} minutes
2. ${inputs.diet ? `Dietary requirement: ${inputs.diet}` : 'No specific dietary restrictions'}
3. ${cuisineContext.join('. ') || 'No cuisine restrictions'}

INGREDIENT REUSE REQUIREMENTS (MANDATORY):
1. At least 2 ingredients must be reused across multiple days (e.g., buy one bunch of cilantro, use in days 1 and 4)
2. Include at least 1 leftovers strategy (e.g., "cook extra rice on day 1 for fried rice on day 3")
3. Plan shopping efficiently - if you buy fresh herbs or vegetables, use them multiple times

COOKING REALISM RULES:
1. Timing must be realistic - each meal must be achievable within the max cook time
2. Steps must be detailed and actionable
3. Consider ingredient freshness - don't use fresh herbs on day 7 if bought for day 1
4. Vary the meals - don't repeat proteins on consecutive days

RESPONSE FORMAT:
You MUST respond with valid JSON matching this exact schema:
${WEEKLY_PLAN_SCHEMA}

The "days" array must have exactly ${inputs.days} meals. Each day must include reuseNotes if it uses ingredients from other days or creates leftovers for later use.`

  const userPrompt = `Generate a ${inputs.days}-day dinner plan for me.

PANTRY STAPLES (always available - don't include in shopping):
${pantryText || 'Not specified'}

UTENSILS/EQUIPMENT (available):
${utensilsText || 'Not specified'}${preferenceContext}${feedbackContext}

Remember:
- Maximum ${inputs.maxCookTime} minutes per meal
- Reuse at least 2 ingredients across the week
- Include at least 1 leftovers strategy
- Vary the proteins and cuisines
- Be realistic about timing`

  const model = 'gpt-4o'

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  let rawJson = completion.choices[0]?.message?.content || '{}'

  // Try to parse and validate, with one repair attempt if needed
  let validated: WeeklyPlanResponse
  try {
    const parsed = JSON.parse(rawJson)
    validated = WeeklyPlanResponseSchema.parse(parsed)
  } catch (firstError) {
    console.warn('Initial plan JSON parse/validation failed, attempting repair:', firstError)
    try {
      rawJson = await repairPlanJson(rawJson, inputs.days)
      const parsed = JSON.parse(rawJson)
      validated = WeeklyPlanResponseSchema.parse(parsed)
      console.log('Plan JSON repair successful')
    } catch (repairError) {
      console.error('Plan JSON repair also failed:', repairError)
      throw new Error('Failed to generate valid meal plan. Please try again.')
    }
  }

  return {
    response: validated,
    rawJson,
    model,
    promptVersion: PLAN_PROMPT_VERSION,
  }
}

async function repairPlanJson(malformedJson: string, days: number): Promise<string> {
  const repairPrompt = `The following JSON is malformed. Fix it to be valid JSON matching this schema for a ${days}-day meal plan:
${WEEKLY_PLAN_SCHEMA}

Malformed JSON:
${malformedJson}

Return ONLY the repaired valid JSON, nothing else. Ensure the "days" array has exactly ${days} items.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: repairPrompt }],
    response_format: { type: 'json_object' },
    temperature: 0,
  })

  return completion.choices[0]?.message?.content || '{}'
}

// Generate a single day replacement for swap functionality
interface SwapDayInput {
  pantryText: string
  utensilsText: string
  inputs: PlanInputs
  dayIndex: number
  existingDays: PlanDayRecipe[]
  preferenceSummary?: string | null
}

export async function generateSwapDay(
  input: SwapDayInput
): Promise<{ recipe: PlanDayRecipe; rawJson: string }> {
  const { pantryText, utensilsText, inputs, dayIndex, existingDays, preferenceSummary } = input

  const preferenceContext = preferenceSummary
    ? `\n\nUSER PREFERENCE PROFILE:\n${preferenceSummary}`
    : ''

  const existingMeals = existingDays
    .map((d, i) => `Day ${i + 1}: ${d.title}`)
    .join('\n')

  const sharedIngredients = new Set<string>()
  existingDays.forEach(d => {
    d.ingredientsUsed.extra.forEach(ing => sharedIngredients.add(ing))
    d.missingIngredients.forEach(ing => sharedIngredients.add(ing))
  })

  const systemPrompt = `You are a practical home cooking assistant. Generate 1 replacement dinner recipe for Day ${dayIndex + 1} of a meal plan.

CONSTRAINTS:
- Maximum cooking time: ${inputs.maxCookTime} minutes
- ${inputs.diet ? `Dietary requirement: ${inputs.diet}` : 'No dietary restrictions'}

EXISTING MEALS IN PLAN:
${existingMeals}

INGREDIENTS ALREADY IN SHOPPING LIST (try to reuse these):
${Array.from(sharedIngredients).join(', ') || 'None yet'}

RESPONSE FORMAT:
You MUST respond with valid JSON matching this schema:
{
  "title": "string",
  "why": "string",
  "timeMins": "number",
  "difficulty": "Easy|Medium|Hard",
  "ingredientsUsed": { "pantry": ["..."], "extra": ["..."] },
  "missingIngredients": ["..."],
  "steps": ["..."],
  "substitutions": ["..."],
  "reuseNotes": "string (optional - explain if using shared ingredients)"
}

Generate something DIFFERENT from the existing meals. If possible, reuse ingredients from other days.`

  const userPrompt = `Generate a replacement dinner for Day ${dayIndex + 1}.

PANTRY STAPLES:
${pantryText || 'Not specified'}

UTENSILS:
${utensilsText || 'Not specified'}${preferenceContext}

Make it different from: ${existingDays.map(d => d.title).join(', ')}`

  const model = 'gpt-4o'

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8, // Slightly higher for more variety
  })

  const rawJson = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(rawJson)
  const recipe = PlanDayRecipeSchema.parse(parsed)

  return { recipe, rawJson }
}

// Generate shopping list from plan
const SHOPPING_LIST_SCHEMA = `{
  "produce": ["fresh vegetables, fruits, herbs"],
  "pantry": ["canned goods, grains, pasta, oils"],
  "dairy": ["milk, cheese, yogurt, eggs, butter"],
  "protein": ["meat, fish, poultry, tofu, legumes"],
  "spices": ["spices, seasonings, condiments"]
}`

interface GenerateShoppingListInput {
  planDays: PlanDayRecipe[]
  pantryText: string
}

export async function generateShoppingList(
  input: GenerateShoppingListInput
): Promise<{ list: ShoppingList; rawJson: string }> {
  const { planDays, pantryText } = input

  // Collect all missing ingredients from the plan
  const allMissingIngredients = planDays.flatMap(d => d.missingIngredients)
  const allExtraIngredients = planDays.flatMap(d => d.ingredientsUsed.extra)
  const allNeededIngredients = [...new Set([...allMissingIngredients, ...allExtraIngredients])]

  const systemPrompt = `You are a shopping list organizer. Categorize the following ingredients into the appropriate grocery sections. Remove any items that are likely already in a typical pantry (listed below).

PANTRY STAPLES (user already has these - DO NOT include in shopping list):
${pantryText || 'salt, pepper, olive oil, basic spices'}

RESPONSE FORMAT:
You MUST respond with valid JSON matching this schema:
${SHOPPING_LIST_SCHEMA}

Each category should contain only items the user needs to buy. Consolidate duplicates (e.g., "cilantro" appearing twice becomes one entry). If an ingredient could go in multiple categories, pick the most common one.`

  const userPrompt = `Organize these ingredients into a shopping list:

${allNeededIngredients.join('\n')}

Remember: Don't include items that are in the pantry staples. Consolidate duplicates.`

  const model = 'gpt-4o-mini'

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  })

  const rawJson = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(rawJson)
  const list = ShoppingListSchema.parse(parsed)

  return { list, rawJson }
}
