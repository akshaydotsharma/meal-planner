import { z } from 'zod'

export const OptionSchema = z.object({
  title: z.string(),
  why: z.string(),
  timeMins: z.number(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  ingredientsUsed: z.object({
    pantry: z.array(z.string()),
    extra: z.array(z.string()),
  }),
  missingIngredients: z.array(z.string()),
  steps: z.array(z.string()),
  substitutions: z.array(z.string()),
})

export const RecommendationResponseSchema = z.object({
  options: z.array(OptionSchema).length(3),
})

export type Option = z.infer<typeof OptionSchema>
export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>

export const ConstraintsSchema = z.object({
  timeMins: z.number().optional(),
  cuisineMood: z.string().optional(),
  spiceLevel: z.enum(['mild', 'medium', 'spicy']).optional(),
  diet: z.string().optional(),
  effort: z.enum(['minimal', 'moderate', 'involved']).optional(),
})

export type Constraints = z.infer<typeof ConstraintsSchema>

export const FeedbackDecision = {
  ACCEPT: 'ACCEPT',
  REJECT: 'REJECT',
  NOT_NOW: 'NOT_NOW',
} as const

export type FeedbackDecisionType = (typeof FeedbackDecision)[keyof typeof FeedbackDecision]

export const FeedbackReason = {
  TOO_LONG: 'TOO_LONG',
  TOO_COMPLEX: 'TOO_COMPLEX',
  DONT_LIKE_INGREDIENT: 'DONT_LIKE_INGREDIENT',
  NOT_IN_MOOD: 'NOT_IN_MOOD',
  TOO_UNHEALTHY: 'TOO_UNHEALTHY',
  OTHER: 'OTHER',
} as const

export type FeedbackReasonType = (typeof FeedbackReason)[keyof typeof FeedbackReason]

export const FeedbackReasonLabels: Record<FeedbackReasonType, string> = {
  TOO_LONG: 'Too long',
  TOO_COMPLEX: 'Too complex',
  DONT_LIKE_INGREDIENT: "Don't like ingredient",
  NOT_IN_MOOD: 'Not in mood',
  TOO_UNHEALTHY: 'Too unhealthy',
  OTHER: 'Other',
}

// Weekly Plan Schemas
export const PlanInputsSchema = z.object({
  days: z.union([z.literal(3), z.literal(5), z.literal(7)]),
  maxCookTime: z.number().min(15).max(120),
  diet: z.string().optional(),
  includeCuisines: z.array(z.string()).optional(),
  excludeCuisines: z.array(z.string()).optional(),
})

export type PlanInputs = z.infer<typeof PlanInputsSchema>

export const PlanDayRecipeSchema = z.object({
  title: z.string(),
  why: z.string(),
  timeMins: z.number(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  ingredientsUsed: z.object({
    pantry: z.array(z.string()),
    extra: z.array(z.string()),
  }),
  missingIngredients: z.array(z.string()),
  steps: z.array(z.string()),
  substitutions: z.array(z.string()),
  reuseNotes: z.string().optional(), // e.g., "Uses leftover rice from Day 1"
})

export type PlanDayRecipe = z.infer<typeof PlanDayRecipeSchema>

export const WeeklyPlanResponseSchema = z.object({
  days: z.array(PlanDayRecipeSchema),
  reuseStrategy: z.object({
    sharedIngredients: z.array(z.string()), // Ingredients used across multiple days
    leftoversStrategy: z.string(), // e.g., "Cook extra rice on Day 1 for Day 3 fried rice"
  }),
})

export type WeeklyPlanResponse = z.infer<typeof WeeklyPlanResponseSchema>

export const ShoppingListSchema = z.object({
  produce: z.array(z.string()),
  pantry: z.array(z.string()),
  dairy: z.array(z.string()),
  protein: z.array(z.string()),
  spices: z.array(z.string()),
})

export type ShoppingList = z.infer<typeof ShoppingListSchema>

export const CUISINE_OPTIONS = [
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'Mediterranean',
  'American',
  'French',
  'Korean',
  'Vietnamese',
  'Greek',
  'Middle Eastern',
] as const
