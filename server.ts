import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateVideosOperation, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing JSON with increased limit for audio/image payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI SDK (reads GEMINI_API_KEY from environment)
const ai = new GoogleGenAI({});

// --- 1. Multi-turn Gemini Chatbot Endpoint ---
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      model = 'gemini-3.5-flash',
      systemInstruction,
      mode = 'personal',
    } = req.body;

    const defaultRole =
      mode === 'sme'
        ? 'You are an elite SME Chief Financial Officer (CFO) and Cash Flow Strategist. You provide practical, evidence-grounded financial advice on runway, burn rate, OPEX optimization, margins, and SME tax/working capital efficiency.'
        : 'You are an evidence-based Senior Personal Financial Advisor. You specialize in behavioral finance, 50/30/20 budgeting, debt reduction, high-interest savings, and personalized expense pruning. Be concise, structured, and empathetic.';

    // Model selection validation
    const allowedModels = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
    const chosenModel = allowedModels.includes(model) ? model : 'gemini-3.5-flash';

    // Format previous messages for chat
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content || msg.text || '' }],
    }));

    const chat = ai.chats.create({
      model: chosenModel,
      config: {
        systemInstruction: systemInstruction || defaultRole,
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({
      message: message,
    });

    res.json({
      reply: response.text || 'No response generated.',
      modelUsed: chosenModel,
    });
  } catch (error: any) {
    console.error('Chatbot API error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat message' });
  }
});

// --- 2. Google Search Grounding Endpoint ---
app.post('/api/search-grounding', async (req, res) => {
  try {
    const { query: searchQuery } = req.body;
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Provide up-to-date, grounded financial research and insights on: ${searchQuery}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    res.json({
      text: response.text || '',
      webSearchQueries: groundingMetadata?.webSearchQueries || [],
      groundingChunks: groundingMetadata?.groundingChunks || [],
      sources: (groundingMetadata?.groundingChunks || []).map((chunk: any) => ({
        title: chunk.web?.title || 'Web Reference',
        uri: chunk.web?.uri || '',
      })),
    });
  } catch (error: any) {
    console.error('Search grounding error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute grounded search' });
  }
});

// --- 3. Google Maps Grounding Endpoint ---
app.post('/api/maps-grounding', async (req, res) => {
  try {
    const { query: locationQuery, locationHint } = req.body;
    if (!locationQuery) {
      return res.status(400).json({ error: 'Query is required for Maps search' });
    }

    const prompt = locationHint
      ? `Find financial services, banks, accountants, or financial advisors near ${locationHint} matching: ${locationQuery}`
      : `Find financial services, institutions, or businesses matching: ${locationQuery}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    res.json({
      text: response.text || '',
      groundingChunks: groundingMetadata?.groundingChunks || [],
      places: (groundingMetadata?.groundingChunks || []).map((chunk: any) => ({
        title: chunk.web?.title || chunk.maps?.title || 'Location Result',
        uri: chunk.web?.uri || chunk.maps?.uri || '',
      })),
    });
  } catch (error: any) {
    console.error('Maps grounding error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute Maps grounded query' });
  }
});

// --- 4. Create & Edit Images Endpoint ---
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, editImageBase64, mimeType = 'image/jpeg', aspectRatio = '1:1' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for image generation' });
    }

    if (editImageBase64) {
      // Editing existing image with gemini-3.1-flash-image-preview
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: editImageBase64,
                mimeType,
              },
            },
            {
              text: `Edit this image according to these instructions: ${prompt}. Output the edited image directly.`,
            },
          ],
        },
        config: {
          responseModalities: ['IMAGE'],
        },
      });

      const imgPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (imgPart?.inlineData?.data) {
        return res.json({
          imageData: imgPart.inlineData.data,
          mimeType: imgPart.inlineData.mimeType || 'image/png',
        });
      }
      return res.json({ text: response.text });
    } else {
      // Create new image with gemini-3.1-flash-image-preview
      const response = await ai.models.generateImages({
        model: 'gemini-3.1-flash-image-preview',
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio as any,
        },
      });

      const generated = response.generatedImages?.[0];
      if (generated?.image?.imageBytes) {
        return res.json({
          imageData: generated.image.imageBytes,
          mimeType: 'image/jpeg',
        });
      }
      res.status(500).json({ error: 'No image was returned by the model.' });
    }
  } catch (error: any) {
    console.error('Generate image error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate or edit image' });
  }
});

// --- 5. Generate Music (Lyria Clip / Pro) ---
app.post('/api/generate-music', async (req, res) => {
  try {
    const { prompt, model = 'lyria-3-clip-preview' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for music generation' });
    }

    const selectedModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: prompt,
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    res.json({
      audioBase64,
      mimeType,
      lyrics,
      modelUsed: selectedModel,
    });
  } catch (error: any) {
    console.error('Generate music error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate music clip' });
  }
});

// --- 6. Veo Video Generation (Text-to-Video & Image-to-Video) ---
app.post('/api/generate-video', async (req, res) => {
  try {
    const {
      prompt,
      imageBase64,
      mimeType = 'image/png',
      aspectRatio = '16:9',
      resolution = '720p',
    } = req.body;

    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

    if (imageBase64) {
      // Image to Video animation
      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Animate this scene dynamically with subtle motion and lifelike lighting',
        image: {
          imageBytes: imageBase64,
          mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: resolution as any,
          aspectRatio: validAspectRatio,
        },
      });

      return res.json({ operationName: operation.name });
    } else {
      // Text to Video
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required for text-to-video' });
      }

      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution as any,
          aspectRatio: validAspectRatio,
        },
      });

      return res.json({ operationName: operation.name });
    }
  } catch (error: any) {
    console.error('Veo video generate error:', error);
    res.status(500).json({ error: error.message || 'Failed to start video generation' });
  }
});

// --- 7. Veo Video Status Polling ---
app.post('/api/video-status', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: !!updated.done,
      hasVideo: !!updated.response?.generatedVideos?.[0]?.video?.uri,
    });
  } catch (error: any) {
    console.error('Video status error:', error);
    res.status(500).json({ error: error.message || 'Failed to poll video status' });
  }
});

// --- 8. Veo Video Download ---
app.post('/api/video-download', async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: 'Video URI not ready or available' });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: 'Failed to stream video from storage' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    const arrayBuffer = await videoRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Video download error:', error);
    res.status(500).json({ error: error.message || 'Failed to download generated video' });
  }
});

// --- 9. Audio Transcription Endpoint (Microphone Speech-to-Text) ---
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 payload is required' });
    }

    const audioPart = {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this voice audio accurately into clear text. If the user mentions financial figures, transactions, expense items, or budget notes, capture them faithfully.',
          },
        ],
      },
    });

    res.json({
      transcription: response.text || '',
    });
  } catch (error: any) {
    console.error('Transcription API error:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
});

// --- 9.1 Receipt OCR & Analysis Endpoint (gemini-3.8-flash) ---
app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', mode = 'personal' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 payload is required' });
    }

    let cleanBase64 = imageBase64;
    let detectedMime = mimeType;
    if (cleanBase64.startsWith('data:')) {
      const match = cleanBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1];
        cleanBase64 = match[2];
      } else if (cleanBase64.includes('base64,')) {
        cleanBase64 = cleanBase64.split('base64,')[1];
      }
    }

    const imagePart = {
      inlineData: {
        mimeType: detectedMime || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const promptText = `You are an expert optical receipt parser and financial auditor.
Analyze this physical receipt photo carefully.
Extract:
1. The merchant or vendor name (clean, properly capitalized name of store or restaurant or service).
2. The transaction date formatted strictly as 'YYYY-MM-DD'. If year is missing, use the most recent plausible year. If not visible, use current date.
3. The grand total amount paid as a positive floating number. (Must be the final total after tax/discounts/tips).
4. The currency symbol or code (e.g. $, ₹, €, £, USD, INR).
5. Category: choose the single most appropriate category for this purchase in ${mode === 'sme' ? 'SME business finance' : 'personal household finance'} (e.g. Groceries, Food & Dining, Transport, Shopping, Utilities, Office Rent & Utilities, Software & SaaS Tools, Supplier & Inventory, Marketing & Ads, Healthcare, Entertainment, Other).
6. Line items if legible (item description and amount).
7. Tax amount if itemized.
8. Payment method if stated (e.g. "Visa ****1234", "Cash", "UPI", "Apple Pay").
9. Confidence score: High, Medium, or Low.
10. A concise 1-sentence summary of the purchase.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING, description: 'Merchant or vendor name' },
            date: { type: Type.STRING, description: 'Transaction date in YYYY-MM-DD' },
            totalAmount: { type: Type.NUMBER, description: 'Grand total amount paid' },
            currency: { type: Type.STRING, description: 'Currency symbol or ISO code' },
            category: { type: Type.STRING, description: 'Best matching budget/expense category' },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                },
                required: ['description'],
              },
              description: 'Purchased line items',
            },
            taxAmount: { type: Type.NUMBER, description: 'Taxes or VAT included' },
            paymentMethod: { type: Type.STRING, description: 'Payment method used' },
            confidence: { type: Type.STRING, description: 'Extraction confidence: High, Medium, or Low' },
            summary: { type: Type.STRING, description: 'One sentence summary' },
          },
          required: ['merchant', 'date', 'totalAmount'],
        },
      },
    });

    const rawText = response.text || '';
    let parsedData: any = null;
    try {
      parsedData = JSON.parse(rawText);
    } catch (e) {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse structured JSON from receipt scanner');
      }
    }

    res.json({
      success: true,
      extracted: parsedData,
      rawText,
    });
  } catch (error: any) {
    console.error('Receipt scanner error:', error);
    res.status(500).json({ error: error.message || 'Failed to scan receipt image' });
  }
});

// --- 10. Live API WebSocket Voice Bridge (gemini-3.8-live) ---
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/api/live-ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live API WebSocket');
  let liveSession: any = null;

  try {
    liveSession = await (ai as any).live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          'You are a real-time conversational voice financial advisor. Provide concise, clear, spoken guidance on budgeting, cash flow, and financial strategies.',
      },
      callbacks: {
        onmessage: (message: any) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
      },
    });

    clientWs.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.realtimeInput && liveSession) {
          liveSession.send(parsed);
        }
      } catch (err) {
        console.warn('Error forwarding client audio to live session:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected from Live API');
      try {
        liveSession?.close?.();
      } catch (e) {}
    });
  } catch (error) {
    console.error('Failed to initialize gemini-3.8-live session:', error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: 'Live API connection failed' }));
    }
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
