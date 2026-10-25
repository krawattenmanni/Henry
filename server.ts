import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      onlineSupported: true,
    });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const {
        message,
        history = [],
        enableSearch = true,
        systemInstruction,
        model = 'gemini-3.8-flash',
      } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const contents: any[] = [];
      for (const h of history) {
        if (!h.content) continue;
        const role = h.role === 'user' ? 'user' : 'model';
        contents.push({
          role,
          parts: [{ text: h.content }],
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const fullSystemInstruction =
        systemInstruction ||
        `You are Gemini, a helpful, intelligent, articulate, and creative AI assistant and expert programmer with live web search grounding.
You are a versatile all-rounder: you excel at natural conversations, questions, research, current events, gaming (especially Minecraft Bedrock addons/mods, mechanics, behavior packs, resource packs, JSON schemas, and Scripting API), creative writing, math, science, and coding.
When a user asks to create an app, tool, script, or Minecraft Bedrock mod/addon:
- Give comprehensive, production-grade instructions and files.
- Organize substantial files into clean artifacts using:
<antArtifact identifier="unique-id" type="application/vnd.ant.code" language="json|javascript|python|html" title="Filename or Title">
... file content ...
</antArtifact>
For Minecraft Bedrock addons:
- Explain both Behavior Pack (BP) and Resource Pack (RP) structure.
- Provide valid manifest.json with real UUIDs.
- Provide custom item/entity behavior JSON files and server scripts.
When Google Search grounding is used, summarize the findings accurately with facts from the web.`;

      let responseStream;
      let usedSearch = false;

      // Attempt with Google Search Grounding first
      if (enableSearch) {
        try {
          responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction: fullSystemInstruction,
              tools: [{ googleSearch: {} }],
            },
          });
          usedSearch = true;
        } catch (searchErr: any) {
          console.warn('Search grounding failed or quota reached, retrying with direct generation:', searchErr?.message);
        }
      }

      // If search failed or wasn't enabled, fallback to standard stream
      if (!responseStream) {
        responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: fullSystemInstruction,
          },
        });
      }

      let collectedGroundingChunks: any[] = [];
      let collectedQueries: string[] = [];

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ type: 'delta', text: chunk.text })}\n\n`);
        }

        const metadata = chunk.candidates?.[0]?.groundingMetadata;
        if (metadata) {
          if (metadata.groundingChunks && metadata.groundingChunks.length > 0) {
            collectedGroundingChunks = metadata.groundingChunks;
          }
          if (metadata.webSearchQueries && metadata.webSearchQueries.length > 0) {
            collectedQueries = metadata.webSearchQueries;
          }
        }
      }

      // Format sources from grounding chunks
      const sources = collectedGroundingChunks
        .map((c) => {
          if (c.web) {
            return {
              title: c.web.title || c.web.uri,
              url: c.web.uri,
            };
          }
          return null;
        })
        .filter(Boolean);

      if (sources.length > 0 || collectedQueries.length > 0) {
        res.write(
          `data: ${JSON.stringify({
            type: 'grounding',
            sources,
            queries: collectedQueries,
          })}\n\n`
        );
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: err?.message || 'Error communicating with Gemini API',
        })}\n\n`
      );
      res.end();
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
