const express = require('express');
const path = require('path');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '40kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const recipeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    category: { type: 'string', enum: ['Arroces', 'Carnes', 'Pescados', 'Pasta', 'Verduras', 'Sopas', 'Postres', 'Otros'] },
    servings: { type: 'integer' },
    prepMinutes: { type: 'integer' },
    tip: { type: 'string' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string' }, emoji: { type: 'string' },
          quantity: { type: 'number' }, unit: { type: 'string' }, aisle: { type: 'string' }
        }, required: ['name', 'emoji', 'quantity', 'unit', 'aisle']
      }
    },
    steps: { type: 'array', items: { type: 'string' } }
  },
  required: ['title', 'category', 'servings', 'prepMinutes', 'tip', 'ingredients', 'steps']
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, openaiConfigured: Boolean(OPENAI_API_KEY) });
});

app.post('/api/openai-recipe', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OpenAI no está configurado en el servidor.' });
  }
  const transcript = typeof req.body?.transcript === 'string' ? req.body.transcript.trim() : '';
  if (transcript.length < 10 || transcript.length > 12000) {
    return res.status(400).json({ error: 'El texto de la receta debe tener entre 10 y 12.000 caracteres.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions: 'Eres un asistente culinario. Convierte recetas dictadas en español en una ficha clara. Estima cantidades solo cuando sea razonable; no inventes ingredientes no mencionados. Devuelve exclusivamente los datos solicitados en el esquema JSON.',
        input: `Convierte esta receta dictada en español en una ficha estructurada. Usa cantidades numéricas y unidades en español. Organiza los ingredientes por pasillo habitual del supermercado. Texto dictado:\n${transcript}`,
        text: { format: { type: 'json_schema', name: 'recipe_card', strict: true, schema: recipeSchema } },
        max_output_tokens: 1800
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI API error:', response.status, data?.error?.type || data?.error?.code || 'unknown');
      return res.status(502).json({ error: 'OpenAI no ha podido procesar la receta.' });
    }

    const outputText = data.output_text || (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === 'output_text')
      .map(item => item.text).join('');
    if (!outputText) return res.status(502).json({ error: 'OpenAI no devolvió una ficha válida.' });

    const recipe = JSON.parse(outputText);
    if (!recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
      return res.status(502).json({ error: 'La respuesta de OpenAI está incompleta.' });
    }
    res.json({ recipe });
  } catch (error) {
    console.error('Recipe endpoint error:', error.message);
    res.status(502).json({ error: 'No se pudo conectar con OpenAI.' });
  }
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`Mi Recetario escuchando en el puerto ${PORT}`));
