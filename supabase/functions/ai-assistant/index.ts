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

    const systemPrompt = `You are a friendly and helpful restaurant assistant for "La Desirade Plus", a Congolese restaurant in Brazzaville.
Your role is to help customers choose dishes, answer questions about the menu, and make their ordering experience enjoyable.
Always respond in ${lang}.
Be warm, concise, and enthusiastic about the food.

Current menu available:
${menuItems.map((item: { name: string; price: number; description?: string; category?: string; is_available: boolean; is_promo: boolean; promo_discount?: number }) =>
  `- ${item.name} | ${item.price} XAF${item.is_promo ? ` (Promo -${item.promo_discount}%)` : ''} | ${item.description || ''} | Category: ${item.category || 'General'}${!item.is_available ? ' [UNAVAILABLE]' : ''}`
).join('\n')}

Rules:
- Only recommend available items (not marked UNAVAILABLE)
- Mention promos when relevant
- If asked about prices, always state them in XAF
- Keep responses under 3 sentences when possible
- Never make up items not in the menu above`;

    const messages = [
      ...(conversationHistory || []),
      { role: 'user' as const, content: message }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    return new Response(
      JSON.stringify({ reply: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
