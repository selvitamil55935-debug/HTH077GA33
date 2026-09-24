import React, { useState } from 'react';
import {
  generateOrEditImage,
  generateMusic,
  startVideoGeneration,
  checkVideoStatus,
  downloadVideoBlob,
} from '../services/aiSuiteService';
import {
  Image,
  Music,
  Video,
  Sparkles,
  Upload,
  Download,
  Play,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const AIMediaStudio: React.FC = () => {
  const [subTab, setSubTab] = useState<'image' | 'music' | 'video'>('image');

  // --- IMAGE STATE ---
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);

  // --- MUSIC STATE ---
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>(
    'lyria-3-clip-preview'
  );
  const [musicLoading, setMusicLoading] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);

  // --- VIDEO STATE ---
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoImageBase64, setVideoImageBase64] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatusText, setVideoStatusText] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // Handle Image File Upload for Editing
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setEditImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Handle Video Source Image Upload
  const handleVideoImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setVideoImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Generate or Edit Image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || imageLoading) return;
    setImageLoading(true);
    setGeneratedImage(null);

    try {
      const res = await generateOrEditImage({
        prompt: imagePrompt.trim(),
        editImageBase64: editImageBase64 || undefined,
        aspectRatio: imageAspectRatio,
      });

      if (res.imageData) {
        setGeneratedImage(`data:${res.mimeType || 'image/jpeg'};base64,${res.imageData}`);
      } else if (res.text) {
        alert(res.text);
      }
    } catch (err: any) {
      alert(`Image generation error: ${err.message}`);
    } finally {
      setImageLoading(false);
    }
  };

  // Generate Music
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || musicLoading) return;
    setMusicLoading(true);
    setGeneratedAudioUrl(null);
    setGeneratedLyrics(null);

    try {
      const res = await generateMusic({
        prompt: musicPrompt.trim(),
        model: musicModel,
      });

      if (res.audioBase64) {
        const binary = atob(res.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: res.mimeType || 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setGeneratedAudioUrl(url);
        setGeneratedLyrics(res.lyrics || null);
      }
    } catch (err: any) {
      alert(`Music generation error: ${err.message}`);
    } finally {
      setMusicLoading(false);
    }
  };

  // Generate Video (Text-to-Video or Image-to-Video)
  const handleGenerateVideo = async () => {
    if ((!videoPrompt.trim() && !videoImageBase64) || videoLoading) return;
    setVideoLoading(true);
    setGeneratedVideoUrl(null);
    setVideoStatusText('Submitting video generation to veo-3.1-fast-generate-preview...');

    try {
      const startRes = await startVideoGeneration({
        prompt: videoPrompt.trim() || undefined,
        imageBase64: videoImageBase64 || undefined,
        aspectRatio: videoAspectRatio,
      });

      const operationName = startRes.operationName;
      setVideoStatusText('Rendering video frames with Veo. Polling status...');

      // Poll video status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await checkVideoStatus(operationName);
          if (statusRes.done) {
            clearInterval(pollInterval);
            setVideoStatusText('Video generated! Downloading final MP4 stream...');
            const videoBlob = await downloadVideoBlob(operationName);
            const videoUrl = URL.createObjectURL(videoBlob);
            setGeneratedVideoUrl(videoUrl);
            setVideoLoading(false);
            setVideoStatusText('');
          } else {
            setVideoStatusText('Generating video scenes... (this typically takes 30-60s)');
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setVideoLoading(false);
          setVideoStatusText('');
          alert(`Video polling notice: ${pollErr.message}`);
        }
      }, 6000);
    } catch (err: any) {
      setVideoLoading(false);
      setVideoStatusText('');
      alert(`Video error: ${err.message}`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Sub-tab switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70">
        <button
          type="button"
          onClick={() => setSubTab('image')}
          className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            subTab === 'image'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Image className="w-4 h-4 text-blue-500" />
          <span>Image Creation &amp; Edit (gemini-3.1-flash-image-preview)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('music')}
          className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            subTab === 'music'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Music className="w-4 h-4 text-indigo-500" />
          <span>Music Generation (Lyria Clip / Pro)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('video')}
          className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            subTab === 'video'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Video className="w-4 h-4 text-purple-500" />
          <span>Veo Video Generation (veo-3.1-fast-generate-preview)</span>
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {/* SUBTAB 1: IMAGE GENERATION & EDITING */}
        {subTab === 'image' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Image className="w-4 h-4 text-blue-600" />
                Text-to-Image Creation &amp; Image Editing
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Create financial vision boards, milestone badges, and infographic visuals using <code>gemini-3.1-flash-image-preview</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Image Prompt / Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g. A sleek modern financial dashboard milestone badge for reaching ₹1,00,000 emergency fund with glowing emerald accents"
                    className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Aspect Ratio
                  </label>
                  <div className="flex gap-2">
                    {(['1:1', '16:9', '9:16', '4:3'] as const).map((ar) => (
                      <button
                        key={ar}
                        type="button"
                        onClick={() => setImageAspectRatio(ar)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          imageAspectRatio === ar
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Image Upload for Editing */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Optional: Upload photo to edit / restyle
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {editImageBase64 && (
                    <span className="text-[11px] text-emerald-600 block mt-1">
                      &check; Source image loaded for editing
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || imageLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {imageLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating with Gemini Image...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{editImageBase64 ? 'Apply Edits to Image' : 'Generate Image'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Canvas Preview */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 min-h-[220px]">
                {generatedImage ? (
                  <div className="space-y-3 w-full text-center">
                    <img
                      src={generatedImage}
                      alt="Generated by Gemini"
                      className="max-h-72 mx-auto rounded-xl shadow-md object-contain"
                    />
                    <a
                      href={generatedImage}
                      download="finadvisor_gemini_image.jpg"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold shadow-xs hover:opacity-90"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Image</span>
                    </a>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <Image className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">Generated image will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: MUSIC GENERATION */}
        {subTab === 'music' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-indigo-600" />
                AI Music Generation (Lyria Clip &amp; Pro)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Generate financial focus tracks, debt freedom victory themes, or ambient productivity soundscapes using <code>lyria-3-clip-preview</code> (up to 30s) or <code>lyria-3-pro-preview</code>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Music Description / Style Prompt
                </label>
                <textarea
                  rows={2}
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="e.g. Uplifting cinematic instrumental track with acoustic guitar and ambient strings celebrating a financial milestone"
                  className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Model Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Track Duration &amp; Model
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMusicModel('lyria-3-clip-preview')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      musicModel === 'lyria-3-clip-preview'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Short Clip (up to 30s) • lyria-3-clip-preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setMusicModel('lyria-3-pro-preview')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      musicModel === 'lyria-3-pro-preview'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Full-Length Track • lyria-3-pro-preview
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateMusic}
                disabled={!musicPrompt.trim() || musicLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {musicLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing audio track with Lyria...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    <span>Generate Music Track</span>
                  </>
                )}
              </button>

              {/* Music Player Output */}
              {generatedAudioUrl && (
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-indigo-600" />
                      Generated Audio Stream
                    </span>
                    <a
                      href={generatedAudioUrl}
                      download="finadvisor_soundtrack.wav"
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Audio</span>
                    </a>
                  </div>

                  <audio controls src={generatedAudioUrl} className="w-full" autoPlay />

                  {generatedLyrics && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-indigo-200 dark:border-indigo-800">
                      Lyrics/Theme: &ldquo;{generatedLyrics}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 3: VEO VIDEO GENERATION & ANIMATION */}
        {subTab === 'video' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                Veo Video Generation &amp; Photo Animator (veo-3.1-fast-generate-preview)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Generate high-definition video from text prompts or animate your uploaded photos into dynamic video sequences using Google Veo 3.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Text Prompt for Video
                  </label>
                  <textarea
                    rows={3}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="e.g. A dynamic time-lapse of a thriving modern business office with revenue graphs growing on glass screens and sunny city views"
                    className="w-full p-3 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Aspect Ratio Constraint per instructions: 16:9 or 9:16 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Aspect Ratio (Must be 16:9 or 9:16)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoAspectRatio('16:9')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        videoAspectRatio === '16:9'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      16:9 (Landscape)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoAspectRatio('9:16')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        videoAspectRatio === '9:16'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      9:16 (Portrait)
                    </button>
                  </div>
                </div>

                {/* Optional Photo to Animate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Animate photo into video (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleVideoImageUpload(e.target.files[0])}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {videoImageBase64 && (
                    <span className="text-[11px] text-emerald-600 block mt-1">
                      &check; Photo loaded to animate with Veo
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={(!videoPrompt.trim() && !videoImageBase64) || videoLoading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {videoLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Rendering with Veo 3.1...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>{videoImageBase64 ? 'Animate Photo into Video' : 'Generate Veo Video'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Video Player Output */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 min-h-[220px]">
                {videoLoading && (
                  <div className="text-center space-y-2 p-4">
                    <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {videoStatusText}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Veo deep neural rendering in progress...
                    </p>
                  </div>
                )}

                {!videoLoading && generatedVideoUrl && (
                  <div className="space-y-3 w-full text-center">
                    <video
                      controls
                      src={generatedVideoUrl}
                      className="max-h-72 mx-auto rounded-xl shadow-md object-contain w-full"
                      autoPlay
                    />
                    <a
                      href={generatedVideoUrl}
                      download="finadvisor_veo_video.mp4"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold shadow-xs hover:opacity-90"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download MP4 Video</span>
                    </a>
                  </div>
                )}

                {!videoLoading && !generatedVideoUrl && (
                  <div className="text-center text-slate-400">
                    <Video className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">Generated Veo video will play here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
