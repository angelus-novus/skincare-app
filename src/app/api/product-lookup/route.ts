import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { name, brand, barcode } = await req.json();

    if (!name && !brand && !barcode) {
      return NextResponse.json({ error: 'Provide name, brand, or barcode' }, { status: 400 });
    }

    const query = barcode
      ? `skincare product with barcode/UPC ${barcode}`
      : `${brand || ''} ${name || ''}`.trim();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a skincare product database. Given the following product query, return a JSON object with the product information. Be as accurate as possible based on your knowledge.

Product query: "${query}"

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "name": "product name",
  "brand": "brand name",
  "category": "one of: cleanser, toner, essence, serum, moisturizer, eye-cream, spf, mask, exfoliant, oil, mist, treatment, lip-care, body-care",
  "size": "e.g. 30ml",
  "price": number or null,
  "imageSearchQuery": "a specific search query to find this exact product's image on Google Images",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "keyIngredients": ["active ingredient 1", "active ingredient 2"],
  "concerns": ["array of skin concerns this product addresses from: acne, hyperpigmentation, anti-aging, dryness, sensitivity, redness, pores, texture, dullness, dark-circles, fine-lines, firmness"],
  "description": "brief 1-2 sentence product description",
  "paoMonths": number or null
}

If you don't have enough information, still return the JSON with null/empty values for unknown fields. Always return the full ingredients list if you know it.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse product data' }, { status: 500 });
    }

    const productData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(productData);
  } catch (error) {
    console.error('Product lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to look up product' },
      { status: 500 }
    );
  }
}
