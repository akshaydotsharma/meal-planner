# Meal Recco v2

A personal meal recommendation app that generates customized recipe suggestions based on your pantry staples, available ingredients, and preferences. Now with weekly meal planning and smart ingredient reuse!

## Features

### Core Features
- **Natural Language Chat**: Describe what you want to eat in plain English
- **Personalized Recommendations**: Get 3 meal options tailored to what you have on hand
- **Smart Ingredient Matching**: Prioritizes using your pantry staples and extra ingredients
- **Detailed Recipes**: Full step-by-step instructions, time estimates, and difficulty ratings
- **Constraint Support**: Filter by cooking time, cuisine, spice level, diet, and effort
- **Session History**: Track past recommendations and your feedback

### v1 New Features

#### Feedback with Reasons
When rejecting or deferring a meal, you can optionally select a reason:
- Too long
- Too complex
- Don't like ingredient
- Not in mood
- Too unhealthy
- Other (with custom text)

#### Preference Memory
The app learns from your feedback over time:
- Summarizes your last 30 feedback events into a preference profile
- Includes likes/dislikes, preferred cooking times, favorite cuisines, and rejected ingredients
- Uses this profile to improve future recommendations

To update your preference summary:
```bash
curl -X POST http://localhost:3000/api/preference-summary
```

#### Regenerate Options
On any session detail page, click "Regenerate options" to get new recommendations while keeping the same inputs. Previous recommendation sets are preserved for comparison.

#### Saved Meals Library
Bookmark any meal using the bookmark icon on the card. Access your saved meals from:
- The navigation bar (Saved)
- History page "Saved" button

#### History Filters
Filter your session history:
- All Sessions: View everything
- Accepted Only: Only sessions where you accepted a meal

### v2 New Features

#### Weekly Meal Planning
Plan your dinners for the entire week with smart ingredient reuse:
- **Flexible Duration**: Choose 3, 5, or 7 days
- **Time Constraints**: Set maximum cooking time per meal (15-90 minutes)
- **Dietary Preferences**: Vegetarian, vegan, pescatarian, gluten-free, dairy-free, keto, low-carb
- **Cuisine Control**: Include or exclude specific cuisines (Italian, Mexican, Chinese, Japanese, Indian, Thai, Mediterranean, American, French, Korean, Vietnamese, Greek, Middle Eastern)

#### Smart Ingredient Reuse
Every weekly plan is optimized for ingredient efficiency:
- At least 2 ingredients are reused across multiple days
- At least 1 leftovers strategy (e.g., "Cook extra rice on Day 1 for Day 3 fried rice")
- Reuse notes on each day showing how ingredients connect
- Shared ingredients highlighted in the plan

#### Swap Day
Don't like a meal in your plan? Click "Swap" to regenerate just that day:
- Maintains context of other days in the plan
- Respects original constraints (time, diet, cuisines)
- Updates shopping list automatically

#### Shopping List
Generate a categorized shopping list from your meal plan:
- **Categories**: Produce, Protein, Dairy, Pantry, Spices
- **Pantry-Aware**: Excludes items already in your pantry
- **Interactive Checklist**: Check off items as you shop
- **Export Options**: Copy to clipboard, download as .txt or .json
- **Progress Tracking**: See how many items you've checked off

### Reliability Improvements

#### JSON Robustness
If the AI returns malformed JSON:
1. Automatic repair attempt using a smaller, faster model
2. Strict validation before database write
3. Clear error message if repair fails

#### Versioned Prompts
All prompts are versioned (e.g., `v2`, `chat-v2`) and stored with recommendations for debugging and iteration.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma + SQLite
- **AI**: OpenAI GPT-4o (server-side only)

## Setup

### Prerequisites

- Node.js 18+
- npm
- OpenAI API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:

   Copy the example `.env` file or create one:
   ```bash
   # .env
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY="your-openai-api-key-here"
   ```

   Replace `your-openai-api-key-here` with your actual OpenAI API key.

3. **Initialize the database**:
   ```bash
   npx prisma migrate dev
   ```

4. **Seed the database** (creates default user profile):
   ```bash
   npm run db:seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open the app**:

   Visit [http://localhost:3000](http://localhost:3000)

## Usage

### First Time Setup

1. Go to **Profile** (`/profile`) to customize your baseline pantry staples and cooking utensils
2. These will be included in every recommendation session

### Getting Recommendations

**Chat Mode** (Home page):
1. Type what you want to eat in natural language
2. Click send or press Enter
3. Review the 3 recommendations

**Detailed Mode** (`/new`):
1. **Step 1**: Enter any extra ingredients you have available (one per line)
2. **Step 2**: Optionally set constraints (time, cuisine, spice, diet, effort)
3. **Step 3**: Review and click "Generate 3 Options"
4. **Step 4**: Review recommendations and provide feedback

### Feedback

- **Accept**: You plan to make this meal
- **Reject**: Not interested - optionally provide a reason
- **Not Now**: Save for later - optionally provide a reason
- **Bookmark**: Save to your Saved Meals library (separate from Accept)

Your feedback helps improve future recommendations by:
1. Showing the AI your recent choices
2. Building a preference profile from your patterns

## API Endpoints

### Core
- `POST /api/chat` - Chat-based recommendation generation
- `POST /api/recommendations` - Generate recommendations for a session
- `GET/POST /api/sessions` - Session management
- `GET /api/sessions/[id]` - Get session details
- `POST /api/feedback` - Submit feedback with optional reason
- `GET/PUT /api/profile` - User profile management

### v1 New
- `GET /api/preference-summary` - Get current preference summary
- `POST /api/preference-summary` - Generate/update preference summary
- `GET/POST/DELETE /api/saved-meals` - Saved meals management

### v2 New (Weekly Planning)
- `GET/POST /api/plans` - List plans / Create a new weekly plan
- `GET/DELETE /api/plans/[id]` - Get or delete a specific plan
- `POST /api/plans/[id]/swap` - Swap a single day in a plan
- `GET/POST /api/plans/[id]/shopping-list` - Get or generate shopping list for a plan

## Database Schema

- **UserProfile**: Pantry staples and utensils
- **Session**: Recommendation session with extra ingredients and constraints
- **RecommendationSet**: AI response with model info, prompt version, and raw JSON
- **OptionItem**: Individual meal recommendation
- **OptionFeedback**: User feedback (ACCEPT/REJECT/NOT_NOW) with optional reason and note
- **PreferenceSummary**: AI-generated summary of user preferences (max 1200 chars)
- **SavedMeal**: Bookmarked meals (separate from feedback)
- **Plan**: Weekly meal plan with inputs (days, maxCookTime, diet, cuisines)
- **PlanDay**: Individual day in a plan with recipe details and reuse notes
- **ShoppingList**: Categorized shopping list for a plan

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with default profile
- `npm run db:reset` - Reset database

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database path | Yes |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o | Yes |

## Migrations

v1 adds the following to the database:
- `OptionFeedback.reason` - Feedback reason code
- `OptionFeedback.reasonNote` - Custom note for "Other" reason
- `PreferenceSummary` table - Stores preference summary
- `SavedMeal` table - Stores bookmarked meals

v2 adds the following to the database:
- `Plan` table - Weekly meal plans with configuration
- `PlanDay` table - Individual days with recipes
- `ShoppingList` table - Categorized shopping lists

Run `npx prisma migrate dev` to apply migrations.

## License

MIT
