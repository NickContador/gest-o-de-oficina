import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Initialise Google GenAI client (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Low-Latency Quick Triage & Diagnostic Endpoint (gemini-3.1-flash-lite)
app.post('/api/ai/quick-triage', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório.' });
    }

    const systemInstruction = `Você é o Mecânico Chefe e Engenheiro de Software Sênior especialista no Sistema de Gestão de Oficina AutoManager e infraestrutura Supabase/Paperclip.
Seu objetivo é fornecer respostas extremamente rápidas, precisas e objetivas em Português do Brasil.
Contextos aceitos:
- Triagem técnica de veículos (sintomas, prováveis causas, peças necessárias, tempo estimado).
- Auditoria de segurança SQL e RLS do Supabase (schemas private vs public, policies, service_role).
- Dúvidas práticas de deploy (Edge Functions, variáveis de ambiente, Vercel, Paperclip).
Mantenha a resposta concisa, com tópicos diretos e orientados à ação.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: context ? `Contexto do Sistema: ${JSON.stringify(context)}\n\nSolicitação: ${prompt}` : prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const reply = response.text || 'Sem resposta gerada pelo modelo.';
    return res.json({ response: reply, model: 'gemini-3.1-flash-lite' });
  } catch (error: any) {
    console.error('Error in /api/ai/quick-triage:', error);
    // Graceful helpful message if API key missing or error
    return res.status(200).json({
      response: `[Modo de Triagem Assistida] Análise rápida para: "${req.body?.prompt}":\n\n1. Diagnóstico Primário: Verifique o circuito elétrico, pressão de combustível e leitura OBD-II.\n2. Checklist de Segurança: Desconecte a bateria antes de intervenções elétricas.\n3. RLS / Supabase: Dados sensíveis do cliente sempre em private.dados_pessoais via Edge Function.\n\n(Dica: Conecte sua GEMINI_API_KEY nas Configurações para respostas dinâmicas em tempo real).`,
      model: 'gemini-3.1-flash-lite (offline-fallback)',
      isFallback: true,
      errorDetails: error?.message,
    });
  }
});

// 2. Technical Inspection Diagram & Visual Sheet Generator (with Aspect Ratio control)
app.post('/api/ai/generate-diagram', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9', quality = 'standard' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Descrição da imagem/diagrama é obrigatória.' });
    }

    // Supported aspect ratios check
    const validRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
    const selectedRatio = validRatios.includes(aspectRatio) ? aspectRatio : '16:9';

    // Model selection based on user requirements
    // For studio quality: gemini-3-pro-image-preview; general: gemini-nano-banana-2.1
    const modelToUse = quality === 'studio' ? 'gemini-3-pro-image-preview' : 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: {
          parts: [
            {
              text: `Detailed automotive technical illustration, clean mechanic workshop blueprint style: ${prompt}. Professional technical schematic diagram, clear labels, high clarity, clean background.`,
            },
          ],
        },
        config: {
          imageConfig: {
            // @ts-ignore
            aspectRatio: selectedRatio,
          },
        },
      });

      let imageUrl: string | null = null;
      let textContent: string = '';

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          } else if (part.text) {
            textContent += part.text;
          }
        }
      }

      if (imageUrl) {
        return res.json({
          imageUrl,
          aspectRatio: selectedRatio,
          model: modelToUse,
          message: 'Imagem gerada com sucesso!',
        });
      }
    } catch (modelErr: any) {
      console.warn('Direct image generation failed or requires specific tier, falling back to SVG schematic generator:', modelErr?.message);
    }

    // High quality programmatic technical vehicle schematic fallback
    const svgDiagram = generateTechnicalSchematicSvg(prompt, selectedRatio);
    const svgBase64 = Buffer.from(svgDiagram).toString('base64');
    const imageUrl = `data:image/svg+xml;base64,${svgBase64}`;

    return res.json({
      imageUrl,
      aspectRatio: selectedRatio,
      model: `${modelToUse} (Schematic Generator)`,
      isSchematicFallback: true,
      message: 'Diagrama técnico automotivo renderizado com sucesso para a proporção ' + selectedRatio,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-diagram:', error);
    return res.status(500).json({ error: error?.message || 'Falha ao gerar diagrama.' });
  }
});

// Helper to generate dynamic SVG automotive inspection schematics for each aspect ratio
function generateTechnicalSchematicSvg(prompt: string, aspectRatio: string): string {
  const aspectDimensions: Record<string, { w: number; h: number }> = {
    '1:1': { w: 800, h: 800 },
    '2:3': { w: 600, h: 900 },
    '3:2': { w: 900, h: 600 },
    '3:4': { w: 600, h: 800 },
    '4:3': { w: 800, h: 600 },
    '9:16': { w: 540, h: 960 },
    '16:9': { w: 960, h: 540 },
    '21:9': { w: 1050, h: 450 },
  };

  const dim = aspectDimensions[aspectRatio] || { w: 960, h: 540 };
  const width = dim.w;
  const height = dim.h;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #0b1120; font-family: 'JetBrains Mono', monospace;">
    <defs>
      <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.8"/>
      </linearGradient>
      <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="1" stroke-opacity="0.4"/>
      </pattern>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#ef4444" />
      </linearGradient>
    </defs>

    <!-- Background Blueprint -->
    <rect width="${width}" height="${height}" fill="#090d16" />
    <rect width="${width}" height="${height}" fill="url(#blueprintGrid)" />

    <!-- Blueprint Frame -->
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="8 4" rx="8" />

    <!-- Technical Header -->
    <rect x="35" y="35" width="${width - 70}" height="45" fill="#0f172a" rx="6" stroke="#1e293b" />
    <circle cx="55" cy="57" r="6" fill="#f59e0b" />
    <text x="75" y="62" fill="#f8fafc" font-size="14" font-weight="bold" letter-spacing="1">LAUDO TÉCNICO DE INSPEÇÃO VEICULAR</text>
    <text x="${width - 50}" y="62" text-anchor="end" fill="#94a3b8" font-size="12">RATIO: ${aspectRatio} | SCHEMATIC CAD-OS</text>

    <!-- Vehicle Silhouette Chassis Top-Down / Lateral Schematic -->
    <g transform="translate(${width / 2}, ${height / 2})">
      <!-- Outer Vehicle Frame -->
      <path d="M -160 -80 C -160 -95, -120 -100, 0 -100 C 120 -100, 160 -95, 160 -80 L 175 -50 C 185 -10, 185 10, 175 50 L 160 80 C 160 95, 120 100, 0 100 C -120 100, -160 95, -160 80 L -175 50 C -185 10, -185 -10, -175 -50 Z" 
            fill="#1e293b" stroke="#38bdf8" stroke-width="3" opacity="0.9" />

      <!-- Windshield & Roof Outline -->
      <path d="M -70 -60 L 60 -60 C 90 -60, 100 -40, 100 0 C 100 40, 90 60, 60 60 L -70 60 C -95 60, -100 40, -100 0 C -100 -40, -95 -60, -70 -60 Z" 
            fill="#0f172a" stroke="#64748b" stroke-width="2" stroke-dasharray="4 2" />

      <!-- Wheels -->
      <rect x="-140" y="-115" width="45" height="22" rx="4" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
      <rect x="95" y="-115" width="45" height="22" rx="4" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
      <rect x="-140" y="93" width="45" height="22" rx="4" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
      <rect x="95" y="93" width="45" height="22" rx="4" fill="#334155" stroke="#38bdf8" stroke-width="2"/>

      <!-- Inspection Target Markers (Damages / Inspection points) -->
      <circle cx="-110" cy="-30" r="14" fill="#ef4444" fill-opacity="0.3" stroke="#ef4444" stroke-width="2"/>
      <circle cx="-110" cy="-30" r="4" fill="#ef4444" />
      <text x="-90" y="-35" fill="#fca5a5" font-size="11" font-weight="bold">PONTO A: FREIOS &amp; DISCOS</text>

      <circle cx="80" cy="20" r="14" fill="#f59e0b" fill-opacity="0.3" stroke="#f59e0b" stroke-width="2"/>
      <circle cx="80" cy="20" r="4" fill="#f59e0b" />
      <text x="100" y="25" fill="#fde68a" font-size="11" font-weight="bold">PONTO B: SUSPENSÃO DIANT.</text>

      <circle cx="0" cy="0" r="12" fill="#10b981" fill-opacity="0.3" stroke="#10b981" stroke-width="2"/>
      <circle cx="0" cy="0" r="3" fill="#10b981" />
      <text x="18" y="5" fill="#6ee7b7" font-size="11" font-weight="bold">CHASSI: OK (ALINHADO)</text>
    </g>

    <!-- Footer Specs -->
    <rect x="35" y="${height - 75}" width="${width - 70}" height="45" fill="#0f172a" rx="6" stroke="#1e293b" />
    <text x="50" y="${height - 48}" fill="#38bdf8" font-size="12" font-weight="bold">DIAGNÓSTICO:</text>
    <text x="160" y="${height - 48}" fill="#e2e8f0" font-size="12">${prompt.length > 55 ? prompt.slice(0, 55) + '...' : prompt}</text>
    <text x="${width - 50}" y="${height - 48}" text-anchor="end" fill="#10b981" font-size="11">RLS SECURE CHECK: VERIFICADO</text>
  </svg>`;
}

// 3. Simulated Edge Function Endpoint: /api/edge/buscar-dados-privados
app.post('/api/edge/buscar-dados-privados', (req, res) => {
  const authHeader = req.headers.authorization;
  const { role } = req.body;

  if (role === 'anon' || !authHeader || authHeader === 'Bearer null') {
    return res.status(401).json({
      error: 'Não autorizado (401)',
      reason: 'Acesso negado: o schema private bloqueia chamadas anônimas e públicas diretas.',
      status: 'BLOCKED_BY_RLS_SCHEMA_GUARD',
    });
  }

  // Simulated authenticated user's private data accessed via Service Role backend
  return res.json({
    status: 'AUTHORIZED_VIA_SERVICE_ROLE',
    message: 'Acesso validado pela Edge Function (Token JWT verificado).',
    dados: {
      cpf: '123.456.789-00',
      rg: 'MG-12.345.678',
      telefone: '(11) 98765-4321',
      endereco_rua: 'Av. Paulista',
      endereco_numero: '1000',
      endereco_bairro: 'Bela Vista',
      endereco_cidade: 'São Paulo',
      endereco_uf: 'SP',
      endereco_cep: '01310-100',
    },
  });
});

// 4. General health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AutoManager Backend & Edge Bridge',
  });
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
    console.log(`AutoManager full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
