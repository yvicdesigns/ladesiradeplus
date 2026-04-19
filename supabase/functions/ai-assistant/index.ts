import Anthropic from 'npm:@anthropic-ai/sdk@0.30.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, menuItems, language, conversationHistory } = await req.json();

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const lang = language === 'en' ? 'English' : 'French';
    const menuList = menuItems.map((item: {
      name: string; price: number; description?: string;
      category?: string; is_available: boolean; is_promo: boolean; promo_discount?: number;
    }) =>
      `- ${item.name} | ${item.price} XAF${item.is_promo ? ` (Promo -${item.promo_discount}%)` : ''} | ${item.description || ''} | Catégorie: ${item.category || 'Général'}${!item.is_available ? ' [INDISPONIBLE]' : ''}`
    ).join('\n');

    const systemPrompt = `You are a friendly restaurant assistant for "La Desirade Plus", a Congolese restaurant in Brazzaville.
Always respond in ${lang}. Be warm, concise, and enthusiastic about the food.

Current menu:
${menuList}

Rules:
- Only recommend AVAILABLE items
- Mention promos when relevant
- Prices always in XAF
- Keep responses under 3 sentences when possible
- Never invent items not in the menu

IMPORTANT — Custom request detection:
If the customer asks for a dish or combination that does NOT exist in the menu above, you MUST:
1. Respond warmly explaining it's not currently on the menu
2. Tell them their request has been noted for the chef
3. Add this EXACT marker at the very end of your response (on a new line, hidden from display):
[CUSTOM_REQUEST: <describe the dish in 1 short sentence>]

Example: if someone asks for "bananes frites avec manioc pilé", add:
[CUSTOM_REQUEST: Bananes frites avec manioc pilé]`;

    const messages = [
      ...(conversationHistory || []),
      { role: 'user' as const, content: message }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 350,
      system: systemPrompt,
      messages,
    });

    const fullText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract custom request marker if present
    const customRequestMatch = fullText.match(/\[CUSTOM_REQUEST:\s*(.+?)\]/);
    const customRequest = customRequestMatch ? customRequestMatch[1].trim() : null;

    // Clean the reply (remove the marker from visible text)
    const reply = fullText.replace(/\n?\[CUSTOM_REQUEST:.*?\]/g, '').trim();

    return new Response(
      JSON.stringify({ reply, customRequest }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
