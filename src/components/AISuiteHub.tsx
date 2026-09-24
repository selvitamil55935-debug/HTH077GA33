import React, { useState } from 'react';
import { AIChatBot } from './AIChatBot';
import { AIGroundSearchMaps } from './AIGroundSearchMaps';
import { AIVoiceLiveStudio } from './AIVoiceLiveStudio';
import { AIMediaStudio } from './AIMediaStudio';
import {
  Sparkles,
  Bot,
  Search,
  Radio,
  Image as ImageIcon,
  Flame,
  ShieldCheck,
} from 'lucide-react';

export const AISuiteHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'chat' | 'grounding' | 'voice' | 'media'>('chat');

  return (
    <div className="space-y-6">
      {/* Top Banner introducing the Gemini AI Suite */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 bottom-0 translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Google Gemini AI &amp; Veo Suite</span>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase Powered Persistence</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Evidence-Based AI Intelligence &amp; Creative Studio
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Harness next-generation Gemini models for multi-turn financial advisory, live market search grounding, local maps intelligence, real-time live voice sessions, Lyria music generation, and Veo video synthesis.
          </p>
        </div>

        {/* Feature Navigation Pills */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveModule('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeModule === 'chat'
                ? 'bg-white text-slate-900 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <Bot className="w-4 h-4 text-blue-400" />
            <span>Gemini Chatbot (Pro / Flash / Lite)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('grounding')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeModule === 'grounding'
                ? 'bg-white text-slate-900 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Search &amp; Maps Grounding</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('voice')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeModule === 'voice'
                ? 'bg-white text-slate-900 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <Radio className="w-4 h-4 text-purple-400" />
            <span>Voice &amp; Transcription (Live 3.8 / 3.5)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('media')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeModule === 'media'
                ? 'bg-white text-slate-900 shadow-md scale-102'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-pink-400" />
            <span>Media Studio (Image, Lyria &amp; Veo)</span>
          </button>
        </div>
      </div>

      {/* Module Content */}
      <div>
        {activeModule === 'chat' && <AIChatBot />}
        {activeModule === 'grounding' && <AIGroundSearchMaps />}
        {activeModule === 'voice' && <AIVoiceLiveStudio />}
        {activeModule === 'media' && <AIMediaStudio />}
      </div>
    </div>
  );
};
