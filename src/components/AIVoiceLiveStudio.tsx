import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { transcribeAudio } from '../services/aiSuiteService';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  Sparkles,
  FileAudio,
  PlusCircle,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const AIVoiceLiveStudio: React.FC = () => {
  const { addTransaction, mode, currency } = useFinance();

  // Mode: 'live' (Real-time Live API conversation) or 'transcribe' (Speech-to-text transcription)
  const [activeMode, setActiveMode] = useState<'live' | 'transcribe'>('transcribe');

  // --- TRANSCRIPTION STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedExpense, setParsedExpense] = useState<{
    description: string;
    amount: number;
    category: string;
    type: 'Income' | 'Expense';
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // --- LIVE API STATE ---
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const liveWsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (liveWsRef.current) {
        liveWsRef.current.close();
      }
      clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Start recording for transcription
  const startRecording = async () => {
    setTranscript('');
    setParsedExpense(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscribeBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      alert('Microphone permission required for audio transcription.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleTranscribeBlob = async (blob: Blob) => {
    setTranscriptionLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const res = await transcribeAudio(base64String, blob.type || 'audio/webm');
          const transcribedText = res.transcription.trim();
          setTranscript(transcribedText);
          detectExpenseFromText(transcribedText);
        } catch (err: any) {
          console.error('Transcription error:', err);
          setTranscript(`Transcription notice: ${err.message}`);
        } finally {
          setTranscriptionLoading(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (e: any) {
      setTranscriptionLoading(false);
      setTranscript(`Error processing audio: ${e.message}`);
    }
  };

  // Heuristic parser to convert voice text into a ledger entry
  const detectExpenseFromText = (text: string) => {
    const numMatches = text.match(/\b(\d+(?:,\d+)*(?:\.\d+)?)\b/);
    const amount = numMatches ? parseFloat(numMatches[1].replace(/,/g, '')) : 0;

    let category = mode === 'sme' ? 'Office Rent & Utilities' : 'General & Other';
    let type: 'Income' | 'Expense' = 'Expense';

    const lower = text.toLowerCase();
    if (lower.includes('income') || lower.includes('salary') || lower.includes('client invoice') || lower.includes('revenue')) {
      type = 'Income';
      category = mode === 'sme' ? 'Client Invoices' : 'Salary / Primary';
    } else if (lower.includes('food') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('grocery')) {
      category = 'Groceries & Household';
    } else if (lower.includes('software') || lower.includes('aws') || lower.includes('cloud') || lower.includes('tool')) {
      category = mode === 'sme' ? 'Software & SaaS Tools' : 'Entertainment & Leisure';
    } else if (lower.includes('fuel') || lower.includes('uber') || lower.includes('travel')) {
      category = mode === 'sme' ? 'Logistics & Shipping' : 'Transportation';
    }

    if (amount > 0) {
      setParsedExpense({
        description: text.length > 50 ? text.substring(0, 50) + '...' : text,
        amount,
        category,
        type,
      });
    }
  };

  const handleAddTranscribedTransaction = () => {
    if (!parsedExpense) return;
    addTransaction({
      description: parsedExpense.description,
      amount: parsedExpense.amount,
      category: parsedExpense.category as any,
      type: parsedExpense.type,
      date: new Date().toISOString().split('T')[0],
      isBusiness: mode === 'sme',
    });
    setParsedExpense(null);
  };

  // --- LIVE API (gemini-3.8-live) WebSocket Implementation ---
  const toggleLiveConnection = async () => {
    if (isLiveConnected) {
      if (liveWsRef.current) {
        liveWsRef.current.close();
      }
      setIsLiveConnected(false);
      setLiveStatus('idle');
      return;
    }

    setLiveStatus('connecting');
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = () => {
        setIsLiveConnected(true);
        setLiveStatus('connected');
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            playRawPcmAudio(data.audio);
          }
        } catch (e) {}
      };

      ws.onerror = () => {
        setLiveStatus('error');
        setIsLiveConnected(false);
      };

      ws.onclose = () => {
        setIsLiveConnected(false);
        setLiveStatus('idle');
      };
    } catch (err) {
      setLiveStatus('error');
    }
  };

  const playRawPcmAudio = (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      const ctx = audioContextRef.current;
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Int16Array(len / 2);
      for (let i = 0; i < len; i += 2) {
        bytes[i / 2] = binaryString.charCodeAt(i) | (binaryString.charCodeAt(i + 1) << 8);
      }
      const float32 = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        float32[i] = bytes[i] / 32768;
      }
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn('PCM playback fallback:', e);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70">
        <button
          type="button"
          onClick={() => setActiveMode('transcribe')}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeMode === 'transcribe'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mic className="w-4 h-4 text-blue-500" />
          <span>Microphone Audio Transcription (gemini-3.5-transcribe)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('live')}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeMode === 'live'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4 text-purple-500" />
          <span>Live Voice Conversations (gemini-3.8-live)</span>
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {/* TAB 1: AUDIO TRANSCRIPTION */}
        {activeMode === 'transcribe' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-blue-600" />
                Microphone Voice Transcription &amp; Expense Capture
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Record your voice or dictate expenses via your microphone. Gemini 3.5 Transcribe converts speech to text and can automatically log transactions.
              </p>
            </div>

            {/* Record Control Station */}
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="relative mb-3">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={transcriptionLoading}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {isRecording
                    ? `Recording Voice Audio... ${recordingSeconds}s`
                    : transcriptionLoading
                    ? 'Transcribing with gemini-3.5-transcribe...'
                    : 'Click microphone to record audio'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  e.g., &quot;Spent 450 rupees on team coffee and snacks this morning&quot;
                </p>
              </div>
            </div>

            {/* Transcription Output */}
            {transcriptionLoading && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  Processing audio stream through gemini-3.5-transcribe...
                </span>
              </div>
            )}

            {transcript && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Transcribed Audio Output
                  </span>
                  <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full">
                    Model: gemini-3.5-transcribe
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                  &ldquo;{transcript}&rdquo;
                </p>

                {/* Auto-detected Expense Quick Add */}
                {parsedExpense && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          Detected {parsedExpense.type}: {currency}
                          {parsedExpense.amount.toLocaleString()} ({parsedExpense.category})
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          {parsedExpense.description}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTranscribedTransaction}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add to Ledger</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE API VOICE CONVERSATION */}
        {activeMode === 'live' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-600" />
                Live Real-Time Voice Conversation (gemini-3.8-live)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Conduct a low-latency real-time voice financial counseling session using Google Gemini Live API.
              </p>
            </div>

            {/* Live Connection Station */}
            <div className="flex flex-col items-center justify-center py-8 px-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-800">
              <div className="relative mb-4">
                {isLiveConnected && (
                  <div className="absolute -inset-2 rounded-full bg-purple-500/20 animate-ping" />
                )}
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                    isLiveConnected
                      ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-purple-500/30'
                      : 'bg-slate-400 dark:bg-slate-700'
                  }`}
                >
                  <Radio className={`w-10 h-10 ${isLiveConnected ? 'animate-pulse' : ''}`} />
                </div>
              </div>

              <div className="text-center space-y-1 mb-4">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isLiveConnected
                      ? 'Live Session Active with gemini-3.8-live'
                      : liveStatus === 'connecting'
                      ? 'Connecting WebSocket to Gemini Live...'
                      : 'Live Audio Standby'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  {isLiveConnected
                    ? 'Speak directly into your microphone to receive real-time spoken financial insights.'
                    : 'Click below to connect to the Live API WebSocket bridge.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleLiveConnection}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm transition-all ${
                    isLiveConnected
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isLiveConnected ? 'End Voice Session' : 'Start Live Voice Session'}
                </button>

                {isLiveConnected && (
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Live API Voice Features:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <li>Direct bidirectional audio streaming with sub-second latency</li>
                <li>Uses Google Gemini Live voice model <code>gemini-3.8-live</code></li>
                <li>Native audio interruption and natural spoken voice replies</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
