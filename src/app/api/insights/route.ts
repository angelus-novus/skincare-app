import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, ingredients, userProfile, journalEntries, procedures } = body;

    // Build a comprehensive summary of the user's data
    const ratedProducts = products.filter((p: { rating?: { overall: number } }) => p.rating);
    const goodProducts = ratedProducts.filter((p: { rating: { overall: number } }) => p.rating.overall >= 4);
    const badProducts = ratedProducts.filter((p: { rating: { overall: number } }) => p.rating.overall < 3.5);
    const adverseProducts = products.filter(
      (p: { rating?: { adverseReactions: string[] } }) => (p.rating?.adverseReactions?.length ?? 0) > 0
    );

    const productSummaries = ratedProducts.map((p: {
      name: string;
      brand: string;
      category: string;
      rating: { overall: number; efficacy: number; wouldRepurchase: boolean; adverseReactions: string[]; pros: string[]; cons: string[]; notes: string };
      keyIngredients: string[];
      concerns: string[];
    }) => `
- ${p.name} by ${p.brand} (${p.category}): Rating ${p.rating.overall}/5, Efficacy ${p.rating.efficacy}/5
  Key ingredients: ${p.keyIngredients.join(', ')}
  Targets: ${p.concerns.join(', ')}
  Pros: ${p.rating.pros.join(', ')}
  Cons: ${p.rating.cons.join(', ')}
  Adverse reactions: ${p.rating.adverseReactions.length > 0 ? p.rating.adverseReactions.join(', ') : 'None'}
  Would repurchase: ${p.rating.wouldRepurchase ? 'Yes' : 'No'}
  Notes: ${p.rating.notes}`).join('\n');

    const ingredientMap = new Map(ingredients.map((i: { id: string; name: string; evidenceLevel: string; whatItDoes: string }) => [i.id, i]));

    const goodIngredients = [...new Set(goodProducts.flatMap((p: { keyIngredients: string[] }) => p.keyIngredients))];
    const badIngredients = [...new Set(badProducts.flatMap((p: { keyIngredients: string[] }) => p.keyIngredients))];
    const adverseIngredients = [...new Set(adverseProducts.flatMap((p: { keyIngredients: string[] }) => p.keyIngredients))];

    const journalSummary = journalEntries
      .slice(0, 10)
      .map((e: { date: string; skinCondition: number; mood: string; concerns: string[]; environment?: { stress?: string; sleep?: number } }) =>
        `${e.date}: Skin ${e.skinCondition}/10, Mood: ${e.mood}, Concerns: ${e.concerns.join(', ')}, Stress: ${e.environment?.stress || 'unknown'}, Sleep: ${e.environment?.sleep || '?'}h`
      )
      .join('\n');

    const procedureSummary = procedures
      .map((p: { name: string; date: string; rating?: number; results?: string; sideEffects?: string[] }) =>
        `${p.name} (${p.date}): Rating ${p.rating || 'unrated'}/5, Results: ${p.results || 'none noted'}, Side effects: ${p.sideEffects?.join(', ') || 'none'}`
      )
      .join('\n');

    const prompt = `You are a knowledgeable skincare expert and dermatology advisor. Analyze this user's skincare data and provide personalized, actionable insights.

USER PROFILE:
- Name: ${userProfile.name || 'User'}
- Skin type: ${userProfile.skinType}
- Skin concerns: ${userProfile.skinConcerns.join(', ')}
- Known allergies: ${userProfile.allergies.join(', ') || 'None'}
- Known irritants: ${userProfile.knownIrritants.join(', ') || 'None'}
- Budget: ${userProfile.budget || 'mixed'}
- Goals: ${userProfile.goals?.join(', ') || 'Not specified'}

PRODUCT REVIEWS (${ratedProducts.length} rated out of ${products.length} total):
${productSummaries || 'No rated products yet'}

INGREDIENT PATTERNS:
- Ingredients in well-loved products (4+ stars): ${(goodIngredients as string[]).map((id) => (ingredientMap.get(id) as { name: string })?.name || id).join(', ') || 'None identified'}
- Ingredients in disliked products: ${(badIngredients as string[]).map((id) => (ingredientMap.get(id) as { name: string })?.name || id).join(', ') || 'None identified'}
- Ingredients associated with adverse reactions: ${(adverseIngredients as string[]).map((id) => (ingredientMap.get(id) as { name: string })?.name || id).join(', ') || 'None'}

RECENT SKIN JOURNAL (last 10 entries):
${journalSummary || 'No journal entries'}

PROCEDURE HISTORY:
${procedureSummary || 'No procedures logged'}

Please provide a comprehensive analysis in the following JSON format:

{
  "whatIsWorking": {
    "summary": "Brief 2-3 sentence overview of what's working",
    "topIngredients": ["ingredient1", "ingredient2", "ingredient3"],
    "bestProducts": ["product name 1", "product name 2"],
    "keyInsight": "One key insight about their successful products"
  },
  "potentialConcerns": {
    "summary": "Overview of potential issues",
    "suspectedIrritants": ["ingredient or product causing issues"],
    "conflicts": [{"ingredients": ["retinol", "glycolic acid"], "explanation": "Why they conflict and timing advice"}],
    "gapInRoutine": "Any critical missing step"
  },
  "ingredientInsights": {
    "lovesList": [{"name": "Niacinamide", "reason": "Consistently appears in your highest-rated products and targets your pore concerns"}],
    "watchList": [{"name": "Ingredient", "reason": "Associated with adverse reactions or low-rated products"}],
    "shouldTry": [{"name": "Ingredient", "why": "Based on skin type and concerns", "evidenceLevel": "strong"}]
  },
  "routineRecommendations": {
    "amOptimizations": ["Specific tip 1", "Specific tip 2"],
    "pmOptimizations": ["Specific tip 1", "Specific tip 2"],
    "weeklyAdditions": ["Weekly treatment suggestion"]
  },
  "productRecommendations": [
    {
      "reason": "Why they need this",
      "category": "serum",
      "keyIngredients": ["tranexamic acid"],
      "suggestion": "Specific product name and brand",
      "price": "$XX",
      "priority": "high"
    }
  ],
  "skinJournalInsights": {
    "averageCondition": 7.2,
    "trend": "improving",
    "correlations": ["Skin tends to be better when stress is low", "Sleep quality affects skin condition"],
    "worstDayTriggers": ["High stress", "Poor sleep"]
  },
  "overallScore": {
    "routineCompleteness": 75,
    "ingredientSynergy": 80,
    "concernCoverage": 65,
    "overallGrade": "B+",
    "summaryMessage": "Your routine shows great fundamentals. Focus on..."
  },
  "nextSteps": ["Immediate action 1", "Short term goal", "Long term consideration"]
}

Be specific, use the actual product names and ingredients from their data. Be honest but encouraging. Focus on actionable advice.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Try to parse as JSON, fall back to raw text
    let parsedInsights;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                        responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      parsedInsights = JSON.parse(jsonStr);
    } catch {
      parsedInsights = { rawText: responseText };
    }

    return NextResponse.json({
      success: true,
      insights: parsedInsights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
