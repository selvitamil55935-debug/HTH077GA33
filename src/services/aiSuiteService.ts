export interface ChatMessageItem {
  id?: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp?: number;
  modelUsed?: string;
}

export interface GroundingSource {
  title: string;
  uri?: string;
}

export interface SearchGroundingResult {
  text: string;
  webSearchQueries: string[];
  sources: GroundingSource[];
}

export interface MapsGroundingResult {
  text: string;
  places: GroundingSource[];
}

export async function sendChatMessage(params: {
  message: string;
  history?: ChatMessageItem[];
  model?: 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';
  systemInstruction?: string;
  mode?: 'personal' | 'sme';
}): Promise<{ reply: string; modelUsed: string }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat error: ${res.statusText}`);
  }
  return res.json();
}

export async function searchGrounding(query: string): Promise<SearchGroundingResult> {
  const res = await fetch('/api/search-grounding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Search grounding failed: ${res.statusText}`);
  }
  return res.json();
}

export async function mapsGrounding(
  query: string,
  locationHint?: string
): Promise<MapsGroundingResult> {
  const res = await fetch('/api/maps-grounding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, locationHint }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Maps grounding failed: ${res.statusText}`);
  }
  return res.json();
}

export async function generateOrEditImage(params: {
  prompt: string;
  editImageBase64?: string;
  mimeType?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}): Promise<{ imageData?: string; text?: string; mimeType?: string }> {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Image generation failed: ${res.statusText}`);
  }
  return res.json();
}

export async function generateMusic(params: {
  prompt: string;
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
}): Promise<{ audioBase64: string; mimeType: string; lyrics?: string; modelUsed: string }> {
  const res = await fetch('/api/generate-music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Music generation failed: ${res.statusText}`);
  }
  return res.json();
}

export async function startVideoGeneration(params: {
  prompt?: string;
  imageBase64?: string;
  mimeType?: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
}): Promise<{ operationName: string }> {
  const res = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Video generation failed: ${res.statusText}`);
  }
  return res.json();
}

export async function checkVideoStatus(
  operationName: string
): Promise<{ done: boolean; hasVideo: boolean }> {
  const res = await fetch('/api/video-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Video status check failed: ${res.statusText}`);
  }
  return res.json();
}

export async function downloadVideoBlob(operationName: string): Promise<Blob> {
  const res = await fetch('/api/video-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Video download failed: ${res.statusText}`);
  }
  return res.blob();
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm'
): Promise<{ transcription: string }> {
  const res = await fetch('/api/transcribe-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Transcription failed: ${res.statusText}`);
  }
  return res.json();
}
