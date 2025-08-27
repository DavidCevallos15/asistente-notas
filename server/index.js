import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Simple CORS middleware (acepta llamadas desde el frontend de desarrollo)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.warn('Warning: OPENAI_API_KEY no está definida. El endpoint fallará sin la clave.');
}

app.post('/api/explain', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'missing prompt' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.0,
      }),
    });

    const data = await r.json();
    // Intentar extraer el contenido principal y parsearlo a JSON si viene en formato JSON.
    const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? null;
    if (!content) return res.json({ raw: data });

    // Buscar el primer bloque JSON en la respuesta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsedJson = JSON.parse(jsonMatch[0]);
        return res.json({ ok: true, parsed: parsedJson, raw_text: content });
      } catch (err) {
        // Si no se pudo parsear estrictamente, devolver el raw y un warning
        return res.json({ ok: false, raw_text: content, warning: 'found-json-but-parse-failed' });
      }
    }

    // Si no contiene JSON, devolver el texto crudo para revisión
    return res.json({ ok: false, raw_text: content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'openai error', detail: String(err) });
  }
});

const port = process.env.PORT || 5175;
app.listen(port, () => console.log(`OpenAI proxy server listening on http://localhost:${port}`));
