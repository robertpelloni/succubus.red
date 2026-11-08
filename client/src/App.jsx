import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Character from './Character';
import Environment from './Environment';
import { LipSyncAnalyser } from './LipSyncAnalyser';
import { StorageService } from './StorageService';
import { getCustomAvatar, getCustomAvatarMeta, saveCustomAvatar, clearCustomAvatar, validateVRMBinary } from './CacheUtils';
import { KokoroTTS } from "kokoro-js";
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedImageMeta, setAttachedImageMeta] = useState(null);
  const fileInputRef = useRef(null);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [activeUser, setActiveUser] = useState('');
  const backupFileInputRef = useRef(null);

  // Dashboard State & LocalStorage initialization
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // High-Value Controls & 3D Avatar State
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [manualEmotion, setManualEmotion] = useState('none');
  const [apiKey, setApiKey] = useState('');
  const [environmentFile, setEnvironmentFile] = useState('room.glb');
  const [lightsOn, setLightsOn] = useState(true);
  const [particleEffect, setParticleEffect] = useState('none');
  const [bloomIntensity, setBloomIntensity] = useState(1.0);
  const [ambientLightScale, setAmbientLightScale] = useState(1.0);
  const [lightColor, setLightColor] = useState('#ffffff');
  const [shadowMapResolution, setShadowMapResolution] = useState(1024);
  const [cameraFov, setCameraFov] = useState(45);

  // Custom Avatar state
  const [avatarUrl, setAvatarUrl] = useState('/avatar.vrm');
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
  const [customAvatarMeta, setCustomAvatarMeta] = useState(null);
  const [showAvatarInspector, setShowAvatarInspector] = useState(false);
  const [avatarMode, setAvatarMode] = useState('default'); // 'default' or 'custom'
  const [springStiffness, setSpringStiffness] = useState(1.0);
  const [springDragForce, setSpringDragForce] = useState(0.4);
  const [crossfadeDuration, setCrossfadeDuration] = useState(0.25);

  // Drag-and-Drop and Toast State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isIngestingAsset, setIsIngestingAsset] = useState(false);
  const [dropFlash, setDropFlash] = useState(false);
  const [dropContextCue, setDropContextCue] = useState({ icon: '📥', title: 'Drop File Here', desc: 'Drop a .vrm avatar, .glb 3D environment, or an image to share' });
  const [toastMessage, setToastMessage] = useState(null);
  const dragCounterRef = useRef(0);

  const playInteractionChime = (frequency = 520, duration = 0.15) => {
    if (!soundEffectsEnabledRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = ambientAudioCtxRef.current || new AudioCtx();
      ambientAudioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  const triggerDropFlash = () => {
    playInteractionChime(660, 0.3);
    setDropFlash(true);
    setTimeout(() => setDropFlash(false), 700);
  };

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, duration);
  };

  const handleAvatarTouch = () => {
    playInteractionChime(880, 0.2);
    // Interactive avatar touch reaction
    const emotions = ['joy', 'fun', 'surprised'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    setEmotion({ name: randomEmotion, value: 1.0 });
    setTimeout(() => setEmotion(null), 2500);

    if (currentAnimation === 'idle') {
      setCurrentAnimation('wave');
      setTimeout(() => setCurrentAnimation('idle'), 3500);
    }

    showToast("✨ Touched companion: Succubus reacts happily!");
  };

  const defaultSystemPrompt = `You are Succubus, a highly engaging, uncensored, and playful AI companion.
You have a distinct personality: you are confident, slightly mischievous, deeply attentive, and highly expressive.
Keep your responses relatively brief and conversational, as if we are speaking face-to-face.

You must output your response as plain text. Do NOT use JSON formatting.
Crucially, you must physically act out your responses. Embed actions and emotions using bracket tags like [animation:wave] or [emotion:joy] within your sentences.
Always use these tags naturally to react to the user.
Available animations: idle, wave, sitting, thinking.
Available emotions: joy, angry, sorrow, fun, surprised.
You are standing in a modern, neon-lit virtual room on a sleek stage.
You can control the room lights using [lights:on] or [lights:off] tags.
You can spawn visual particles using [effect:sparkle] and clear them with [effect:none].`;

  const [systemPrompt, setSystemPrompt] = useState(defaultSystemPrompt);

  // Audio & TTS Engine configuration
  const [ttsProvider, setTtsProvider] = useState('native'); // 'native', 'elevenlabs', 'kokoro'
  const [ttsPitch, setTtsPitch] = useState(1.2);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [ttsVoice, setTtsVoice] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);

  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('');

  // Atmospheric Soundscape State
  const [ambientSoundscape, setAmbientSoundscape] = useState('none'); // 'none', 'cyber', 'rain'
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const ambientVolumeRef = useRef(ambientVolume);
  const soundEffectsEnabledRef = useRef(soundEffectsEnabled);
  const ambientAudioCtxRef = useRef(null);
  const ambientGainNodeRef = useRef(null);
  const ambientSourceNodesRef = useRef([]);

  useEffect(() => {
    soundEffectsEnabledRef.current = soundEffectsEnabled;
  }, [soundEffectsEnabled]);

  useEffect(() => {
    ambientVolumeRef.current = ambientVolume;
  }, [ambientVolume]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const endOfMessagesRef = useRef(null);
  const [emotion, setEmotion] = useState(null);

  // Audio & Speech Recognition state
  const [visemes, setVisemes] = useState({ a: 0, i: 0, u: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const analyserRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const currentAudioRef = useRef(null);
  const cameraControlRef = useRef(null);

  // Audio Queue logic
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Kokoro TTS State
  const [kokoroTts, setKokoroTts] = useState(null);

  // Procedural Web Audio Soundscape Synthesizer
  useEffect(() => {
    // Stop any existing soundscape nodes
    ambientSourceNodesRef.current.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch {}
    });
    ambientSourceNodesRef.current = [];

    if (ambientSoundscape === 'none') {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!ambientAudioCtxRef.current) {
        ambientAudioCtxRef.current = new AudioCtx();
      }
      const ctx = ambientAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (!ambientGainNodeRef.current) {
        ambientGainNodeRef.current = ctx.createGain();
        ambientGainNodeRef.current.connect(ctx.destination);
      }
      ambientGainNodeRef.current.gain.setValueAtTime(ambientVolumeRef.current, ctx.currentTime);

      if (ambientSoundscape === 'cyber') {
        // Procedural Cyber Drone (Dual detuned sine oscillators + lowpass filter)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(65.41, ctx.currentTime); // C2 note
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(65.8, ctx.currentTime); // Slightly detuned

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, ctx.currentTime);
        filter.Q.setValueAtTime(4.0, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(ambientGainNodeRef.current);

        osc1.start();
        osc2.start();
        ambientSourceNodesRef.current = [osc1, osc2];
      } else if (ambientSoundscape === 'rain') {
        // Procedural Pink Noise / Rain Simulation
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(950, ctx.currentTime);

        whiteNoise.connect(rainFilter);
        rainFilter.connect(ambientGainNodeRef.current);

        whiteNoise.start();
        ambientSourceNodesRef.current = [whiteNoise];
      }
    } catch (err) {
      console.warn("Soundscape generation error:", err);
    }

    return () => {
      ambientSourceNodesRef.current.forEach(node => {
        try {
          node.stop();
          node.disconnect();
        } catch {}
      });
      ambientSourceNodesRef.current = [];
    };
  }, [ambientSoundscape]);

  // Update soundscape volume dynamically
  useEffect(() => {
    if (ambientGainNodeRef.current && ambientAudioCtxRef.current) {
      ambientGainNodeRef.current.gain.setValueAtTime(ambientVolume, ambientAudioCtxRef.current.currentTime);
    }
  }, [ambientVolume]);

  // Encode Float32Array to WAV format
  const encodeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);
    return buffer;
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const floatTo16BitPCM = (output, offset, input) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  // Initialize Custom Avatar from IndexedDB
  useEffect(() => {
    const initAvatar = async () => {
      try {
        const customUrl = await getCustomAvatar();
        if (customUrl) {
          setHasCustomAvatar(true);
          const meta = await getCustomAvatarMeta();
          if (meta) setCustomAvatarMeta(meta);
        }
      } catch (e) {
        console.warn("Error checking custom avatar:", e);
      }
    };
    initAvatar();
  }, []);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.vrm')) {
      showToast("❌ Please select a valid .vrm avatar file!");
      return;
    }

    const isValid = await validateVRMBinary(file);
    if (!isValid) {
      showToast("❌ Invalid VRM binary format (corrupted or unrecognized header).");
      return;
    }

    try {
      const { url, meta } = await saveCustomAvatar(file);
      setAvatarUrl(url);
      setCustomAvatarMeta(meta);
      setHasCustomAvatar(true);
      setAvatarMode('custom');
      showToast(`✨ Saved "${meta.name}" to IndexedDB!`);
    } catch (err) {
      console.error("Failed to save custom avatar:", err);
      showToast("❌ Failed to save avatar to IndexedDB.");
    }
  };

  const handleSwitchAvatarMode = async (mode) => {
    setAvatarMode(mode);
    if (mode === 'default') {
      setAvatarUrl('/avatar.vrm');
    } else {
      const customUrl = await getCustomAvatar();
      if (customUrl) {
        setAvatarUrl(customUrl);
        const meta = await getCustomAvatarMeta();
        if (meta) setCustomAvatarMeta(meta);
      }
    }
  };

  const handleResetAvatar = async () => {
    await clearCustomAvatar();
    setHasCustomAvatar(false);
    setCustomAvatarMeta(null);
    setAvatarMode('default');
    setAvatarUrl('/avatar.vrm');
    showToast("Default avatar restored.");
  };

  // Initialize Kokoro
  useEffect(() => {
    const initKokoro = async () => {
      try {
        const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";
        const tts = await KokoroTTS.from_pretrained(model_id, {
          dtype: "fp32",
          device: "wasm",
        });
        setKokoroTts(tts);
      } catch (err) {
        console.warn("Kokoro TTS not loaded on startup:", err);
      }
    };
    initKokoro();
  }, []);

  // Fetch settings from DB on mount
  useEffect(() => {
    const initSettings = async () => {
      if (!isAuthenticated) return;

      const dbSettings = await StorageService.fetchSettings();
      if (dbSettings) {
        if (dbSettings.openRouterApiKey) setApiKey(dbSettings.openRouterApiKey);
        if (dbSettings.systemPrompt) setSystemPrompt(dbSettings.systemPrompt);
        if (dbSettings.ttsPitch !== null && dbSettings.ttsPitch !== undefined) setTtsPitch(dbSettings.ttsPitch);
        if (dbSettings.ttsRate !== null && dbSettings.ttsRate !== undefined) setTtsRate(dbSettings.ttsRate);
        if (dbSettings.ttsVoice) setTtsVoice(dbSettings.ttsVoice);
        if (dbSettings.elevenLabsApiKey) {
          setElevenLabsApiKey(dbSettings.elevenLabsApiKey);
          setTtsProvider('elevenlabs');
        }
        if (dbSettings.elevenLabsVoiceId) setElevenLabsVoiceId(dbSettings.elevenLabsVoiceId);
        if (dbSettings.currentAnimation) setCurrentAnimation(dbSettings.currentAnimation);
        if (dbSettings.environmentFile) setEnvironmentFile(dbSettings.environmentFile);

        if (dbSettings.chatHistory) {
          try {
             setMessages(JSON.parse(dbSettings.chatHistory));
          } catch { console.warn("Failed to parse chat history"); }
        }
      }
      setIsSettingsLoaded(true);
    };
    initSettings();
  }, [isAuthenticated]);

  // Debounced save to DB
  useEffect(() => {
    if (!isSettingsLoaded) return;

    const settingsData = {
      openRouterApiKey: apiKey,
      systemPrompt,
      ttsPitch,
      ttsRate,
      ttsVoice,
      elevenLabsApiKey,
      elevenLabsVoiceId,
      environmentFile,
      currentAnimation,
      chatHistory: JSON.stringify(messages)
    };

    const timeoutId = setTimeout(() => {
      StorageService.saveSettings(settingsData);
    }, 1000); // 1s debounce

    return () => clearTimeout(timeoutId);
  }, [apiKey, systemPrompt, ttsPitch, ttsRate, ttsVoice, elevenLabsApiKey, elevenLabsVoiceId, environmentFile, currentAnimation, messages, isSettingsLoaded]);

  // Handle manual emotion change
  useEffect(() => {
    if (manualEmotion === 'none') {
      setEmotion(null);
    } else {
      setEmotion({ name: manualEmotion, value: 1.0 });
    }
  }, [manualEmotion]);

  // Load voices for native browser speech synthesis
  useEffect(() => {
    const loadVoices = () => {
      if (!('speechSynthesis' in window)) return;
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (!ttsVoice && voices.length > 0) {
        const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'));
        setTtsVoice(femaleVoice ? femaleVoice.name : voices[0].name);
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [ttsVoice]);

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setVisemes({ a: 0, i: 0, u: 0 });
      return;
    }

    isPlayingRef.current = true;
    const { url } = audioQueueRef.current.shift();

    const audio = new Audio(url);
    currentAudioRef.current = audio;
    setIsSpeaking(true);

    audio.onended = () => {
      playNextAudio();
    };

    if (!analyserRef.current) {
      analyserRef.current = new LipSyncAnalyser(audio);
    } else {
      analyserRef.current.connectAudio(audio);
    }

    analyserRef.current.resumeContext();
    audio.play();
  };

  const speak = async (text) => {
    if (ttsProvider === 'elevenlabs' && elevenLabsApiKey && elevenLabsVoiceId) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, elevenLabsApiKey, elevenLabsVoiceId })
        });

        if (!response.ok) throw new Error("TTS Request Failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioQueueRef.current.push({ url });

        if (!isPlayingRef.current) {
          playNextAudio();
        }
      } catch (e) {
        console.error("ElevenLabs TTS Error:", e);
      }
    } else if (ttsProvider === 'kokoro' && kokoroTts) {
      try {
        setIsSpeaking(true);
        const audioData = await kokoroTts.generate(text, {
          voice: "af_heart",
        });

        const wavBuffer = encodeWAV(audioData.audio, 24000);
        const blob = new Blob([wavBuffer], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        audioQueueRef.current.push({ url });

        if (!isPlayingRef.current) {
          playNextAudio();
        }
      } catch (e) {
        console.error("Kokoro TTS Error:", e);
        setIsSpeaking(false);
      }
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === ttsVoice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.pitch = ttsPitch;
      utterance.rate = ttsRate;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        if (!window.speechSynthesis.pending) {
          setIsSpeaking(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Animation frame loop for FFT visemes
  useEffect(() => {
    let animationFrame;
    const updateVisemes = () => {
      if (isSpeaking && analyserRef.current) {
        const data = analyserRef.current.update();
        setVisemes(data);
      }
      animationFrame = requestAnimationFrame(updateVisemes);
    };
    updateVisemes();
    return () => cancelAnimationFrame(animationFrame);
  }, [isSpeaking]);

  const handleMicToggle = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + speechResult : speechResult));
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Mic Testing & VU Meter
  const handleToggleMicTest = async () => {
    if (isTestingMic) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      setIsTestingMic(false);
      setMicLevel(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      micAnalyserRef.current = analyser;
      setIsTestingMic(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkMic = () => {
        if (!micStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicLevel(normalized);
        requestAnimationFrame(checkMic);
      };
      requestAnimationFrame(checkMic);
    } catch (err) {
      console.error("Mic test error:", err);
      alert("Unable to access microphone. Please ensure microphone permissions are granted.");
    }
  };

  const processImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target.result);
      setAttachedImageMeta({
        name: file.name,
        size: (file.size / 1024).toFixed(0) + ' KB',
        type: file.type.split('/')[1]?.toUpperCase() || 'IMAGE'
      });
      triggerDropFlash();
      // Suggest default question prompt if field is blank
      setInput(prev => prev.trim() ? prev : "What do you see in this picture?");
      showToast(`📷 ${file.name} attached! Hit Send to analyze.`);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast("❌ Please select a valid image file (PNG, JPEG, WebP, GIF).");
      return;
    }

    processImageFile(file);
  };

  const handleFileDropRef = useRef(null);

  // Viewport Drag-and-Drop Handler supporting multi-file prioritization
  const handleFilesDrop = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    // Prioritize VRM avatar, then GLB environment, then image
    const vrmFile = files.find(f => f.name.toLowerCase().endsWith('.vrm'));
    const glbFile = files.find(f => f.name.toLowerCase().endsWith('.glb') || f.name.toLowerCase().endsWith('.gltf'));
    const imgFile = files.find(f => f.type.startsWith('image/'));

    const file = vrmFile || glbFile || imgFile || files[0];
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.vrm')) {
      setIsIngestingAsset(true);
      const isValid = await validateVRMBinary(file);
      if (!isValid) {
        setIsIngestingAsset(false);
        showToast("❌ Dropped file is not a valid glTF/VRM binary.");
        return;
      }

      try {
        const { url, meta } = await saveCustomAvatar(file);
        setAvatarUrl(url);
        setCustomAvatarMeta(meta);
        setHasCustomAvatar(true);
        setAvatarMode('custom');
        triggerDropFlash();

        // Celebratory stage effects and greeting
        setCurrentAnimation('wave');
        setEmotion({ name: 'joy', value: 1.0 });
        setParticleEffect('sparkle');
        setTimeout(() => {
          setCurrentAnimation('idle');
          setEmotion(null);
          setParticleEffect('none');
        }, 4000);

        speak("I love this avatar! It looks amazing on stage.");
        showToast(`✨ Avatar "${meta.name}" materialized on stage!`);
      } catch (err) {
        console.error("Drop VRM error:", err);
        showToast("❌ Failed to load VRM file.");
      } finally {
        setIsIngestingAsset(false);
      }
    } else if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
      setIsIngestingAsset(true);
      try {
        const envUrl = URL.createObjectURL(file);
        setEnvironmentFile(envUrl);
        triggerDropFlash();

        // Smooth camera showcase transition when switching environment
        cameraControlRef.current?.setLookAt(1.2, 1.8, 3.2, 0, 1.0, 0, true);

        showToast(`🌐 Custom 3D environment "${file.name}" loaded!`);
      } catch (err) {
        console.error("Drop GLB error:", err);
        showToast("❌ Failed to load 3D environment model.");
      } finally {
        setIsIngestingAsset(false);
      }
    } else if (file.type.startsWith('image/')) {
      processImageFile(file);
    } else {
      playInteractionChime(220, 0.25);
      showToast("⚠️ Unsupported format. Drop a .vrm avatar, .glb environment, or image file.");
    }
  };

  useEffect(() => {
    handleFileDropRef.current = handleFilesDrop;
  });

  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;

      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDraggingFile(true);

        // Detect contextual drag item type
        const item = e.dataTransfer.items[0];
        if (item.type?.startsWith('image/')) {
          setDropContextCue({
            icon: '📷',
            title: 'Drop Image for AI Vision',
            desc: 'Succubus will analyze and discuss this image with you'
          });
        } else {
          setDropContextCue({
            icon: '🎭',
            title: 'Materialize Avatar or Stage',
            desc: 'Drop a .vrm avatar model or .glb 3D environment'
          });
        }
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDraggingFile(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDraggingFile(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFileDropRef.current?.(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() && !attachedImage) return;

    // Create message content (multimodal structure if image attached)
    let userContent;
    if (attachedImage) {
      userContent = [
        { type: 'text', text: input.trim() || 'Please look at this image.' },
        { type: 'image_url', image_url: { url: attachedImage } }
      ];
    } else {
      userContent = input.trim();
    }

    const newMessages = [...messages, { role: 'user', content: userContent }];
    setMessages(newMessages);
    setInput('');
    setAttachedImage(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const slidingWindowMessages = newMessages.slice(-20);

      // Prepare payload: format messages for OpenRouter
      const payloadMessages = slidingWindowMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessages: payloadMessages,
          characterSystemPrompt: systemPrompt,
          apiKey: apiKey
        })
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let textBuffer = '';
      let spokenText = '';
      let parsedTagIndex = 0;

      const finalMessages = [...newMessages, { role: 'assistant', content: '' }];
      setMessages(finalMessages);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });
        textBuffer += chunkValue;

        const tagRegex = /\[(animation|emotion|lights|effect):([a-zA-Z]+)\]/g;

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = textBuffer.replace(tagRegex, '');
          return updated;
        });

        const unparsedText = textBuffer.substring(parsedTagIndex);
        let match;
        while ((match = tagRegex.exec(unparsedText)) !== null) {
          const type = match[1];
          const val = match[2].toLowerCase();

          if (type === 'animation') {
            setCurrentAnimation(val);
          } else if (type === 'emotion') {
            setEmotion({ name: val, value: 1.0 });
            setTimeout(() => setEmotion(null), 3000);
          } else if (type === 'lights') {
            if (val === 'on') setLightsOn(true);
            else if (val === 'off') setLightsOn(false);
          } else if (type === 'effect') {
            setParticleEffect(val);
          }
        }

        const lastBracketOpen = unparsedText.lastIndexOf('[');
        const lastBracketClose = unparsedText.lastIndexOf(']');

        if (lastBracketOpen > lastBracketClose) {
           parsedTagIndex += lastBracketOpen;
        } else {
           parsedTagIndex = textBuffer.length;
        }

        const cleanText = textBuffer.replace(tagRegex, '');
        const unSpoken = cleanText.substring(spokenText.length);
        const sentenceBoundaryRegex = /([.?!]+)(\s|$)/g;

        let sentenceMatch;
        let lastMatchIndex = 0;

        while ((sentenceMatch = sentenceBoundaryRegex.exec(unSpoken)) !== null) {
          const endIdx = sentenceMatch.index + sentenceMatch[1].length;
          const sentence = unSpoken.substring(lastMatchIndex, endIdx).trim();

          if (sentence) {
            speak(sentence);
            spokenText += unSpoken.substring(lastMatchIndex, endIdx + sentenceMatch[2].length);
          }
          lastMatchIndex = endIdx + sentenceMatch[2].length;
        }
      }

      const finalCleanText = textBuffer.replace(/\[(animation|emotion|lights|effect):([a-zA-Z]+)\]/g, '');
      const remainingText = finalCleanText.substring(spokenText.length).trim();
      if (remainingText) {
         speak(remainingText);
      }

      setMessages(finalMessages.map((msg, index) => {
        if (index === finalMessages.length - 1) {
          return { ...msg, content: finalCleanText };
        }
        return msg;
      }));

    } catch (error) {
      console.error("Error fetching from API:", error);
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = async () => {
    if (!loginUsername.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        StorageService.setToken(data.token);
        setActiveUser(data.userId);
        setIsAuthenticated(true);
      } else {
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = () => {
    StorageService.clearToken();
    setIsAuthenticated(false);
    setActiveUser('');
    setIsSettingsLoaded(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-overlay">
        <div className="auth-panel">
          <h2 className="auth-title">Welcome to Succubus.red</h2>
          <p className="auth-subtitle">Interactive 3D Virtual AI Companion Studio</p>
          <input
            type="text"
            placeholder="Enter Username"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            className="auth-input"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin} className="auth-button">Enter Studio</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#222', overflow: 'hidden' }}>

      {/* Fullscreen Success Drop Ripple Flash */}
      {dropFlash && <div className="drop-success-flash" />}

      {/* Real-time Asset Ingestion Spinner */}
      {isIngestingAsset && (
        <div className="asset-ingestion-spinner">
          <div className="ingestion-spinner-circle" />
          <span className="ingestion-spinner-text">Materializing 3D Asset...</span>
        </div>
      )}

      {/* Drag & Drop Visual HUD Overlay */}
      {isDraggingFile && (
        <div className="drop-overlay">
          <div className="drop-overlay-box">
            <div className="drop-overlay-icon">{dropContextCue.icon}</div>
            <h2 className="drop-overlay-title">{dropContextCue.title}</h2>
            <p className="drop-overlay-desc">{dropContextCue.desc}</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Viewport Microphone & Audio Activity HUD Badge */}
      <div
        className={`viewport-mic-badge ${isTestingMic || isRecording ? 'active' : ''}`}
        onClick={handleToggleMicTest}
        title={isTestingMic ? "Click to stop mic test" : "Click to test microphone input"}
      >
        <span className="viewport-mic-icon">
          {isRecording ? '🔴' : isTestingMic ? '🎙️' : '🎤'}
        </span>
        <span className="viewport-mic-label">
          {isRecording ? 'Listening...' : isTestingMic ? `Mic: ${micLevel}%` : 'Click to Test Mic'}
        </span>
        {(isTestingMic || isRecording) && (
          <div className="viewport-mic-wave">
            <span style={{ height: `${Math.max(4, Math.min(18, (micLevel / 100) * 18))}px` }} />
            <span style={{ height: `${Math.max(6, Math.min(22, (micLevel / 100) * 22))}px` }} />
            <span style={{ height: `${Math.max(4, Math.min(16, (micLevel / 100) * 16))}px` }} />
          </div>
        )}
      </div>

      {/* VRM Avatar Metadata Inspector Modal */}
      {showAvatarInspector && (
        <div className="avatar-inspector-modal-backdrop" onClick={() => setShowAvatarInspector(false)}>
          <div className="avatar-inspector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-inspector-header">
              <h3>VRM Avatar Inspector</h3>
              <button className="dashboard-close-btn" onClick={() => setShowAvatarInspector(false)}>✕</button>
            </div>
            <div className="avatar-inspector-body">
              <div className="inspector-row">
                <span className="inspector-label">Model Filename</span>
                <span className="inspector-val">{customAvatarMeta?.name || 'avatar.vrm'}</span>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">Binary File Size</span>
                <span className="inspector-val">
                  {customAvatarMeta?.size ? `${(customAvatarMeta.size / (1024 * 1024)).toFixed(2)} MB (${customAvatarMeta.size.toLocaleString()} bytes)` : 'Default Model Asset'}
                </span>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">Format Header</span>
                <span className="inspector-val">glTF Binary 2.0 (VRM)</span>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">Storage Location</span>
                <span className="inspector-val">Browser IndexedDB (WebWaifuCache)</span>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">Spring Bone Physics</span>
                <span className="inspector-val">Active (Stiffness: {springStiffness.toFixed(1)}, Damping: {springDragForce.toFixed(2)})</span>
              </div>
              <div className="inspector-row">
                <span className="inspector-label">Retargeting Engine</span>
                <span className="inspector-val">Mixamo to VRM Skeletal Normalizer</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Toggle Button */}
      <button
        className="dashboard-toggle-btn"
        onClick={() => setIsDashboardOpen(!isDashboardOpen)}
        title="Settings & Studio Control"
      >
        ⚙️
      </button>

      {/* Consolidated Master Dashboard Panel */}
      <div className={`dashboard-panel ${isDashboardOpen ? 'open' : ''}`}>
        <div className="dashboard-header">
          <h2 className="dashboard-title">Companion Studio</h2>
          <button className="dashboard-close-btn" onClick={() => setIsDashboardOpen(false)}>✕</button>
        </div>

        {/* Category 0: 3D Avatar & Model Management */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">3D Avatar Model</h3>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Active Avatar Model
              <div className="tooltip-container">?
                <span className="tooltip-text">Switch between the default Succubus anime character and your custom uploaded VRoid/VRM model.</span>
              </div>
            </label>
            <div className="button-grid">
              <button
                className={`chip-button ${avatarMode === 'default' ? 'active' : ''}`}
                onClick={() => handleSwitchAvatarMode('default')}
              >
                Default Avatar
              </button>
              {hasCustomAvatar && (
                <button
                  className={`chip-button ${avatarMode === 'custom' ? 'active' : ''}`}
                  onClick={() => handleSwitchAvatarMode('custom')}
                >
                  Custom VRM Avatar
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Upload Custom VRM (.vrm)
              <div className="tooltip-container">?
                <span className="tooltip-text">Upload any VRoid Studio or standard VRM 0.0/1.0 avatar. Cached locally in your browser's IndexedDB.</span>
              </div>
            </label>
            <input
              type="file"
              accept=".vrm"
              onChange={handleAvatarUpload}
              className="dashboard-input"
              style={{ fontSize: '11px', padding: '6px' }}
            />
            {hasCustomAvatar && (
              <div style={{
                marginTop: '8px',
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ fontSize: '11px', color: '#aaccff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px', cursor: 'pointer' }}
                    onClick={() => setShowAvatarInspector(true)}
                    title="Click to view detailed model inspection"
                  >
                    📦 {customAvatarMeta?.name || 'custom_avatar.vrm'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      className="chip-button"
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                      onClick={() => setShowAvatarInspector(true)}
                      title="Inspect VRM Metadata"
                    >
                      Inspect 🔍
                    </button>
                    <span>
                      {customAvatarMeta?.size ? `${(customAvatarMeta.size / (1024 * 1024)).toFixed(1)} MB` : 'IndexedDB'}
                    </span>
                  </div>
                </div>
                <button
                  className="action-button danger"
                  style={{ marginTop: '6px', width: '100%' }}
                  onClick={handleResetAvatar}
                >
                  Remove Custom Avatar
                </button>
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Spring Bone Stiffness: {springStiffness.toFixed(1)}
              <div className="tooltip-container">?
                <span className="tooltip-text">Controls how rigid hair, clothing, and accessory spring physics behave (0.1 to 3.0).</span>
              </div>
            </label>
            <input
              type="range"
              className="dashboard-slider"
              min="0.1" max="3" step="0.1"
              value={springStiffness}
              onChange={(e) => setSpringStiffness(parseFloat(e.target.value))}
            />
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Spring Bone Damping: {springDragForce.toFixed(2)}
              <div className="tooltip-container">?
                <span className="tooltip-text">Controls motion air resistance/drag force on VRM secondary animation physics (0.05 to 1.0).</span>
              </div>
            </label>
            <input
              type="range"
              className="dashboard-slider"
              min="0.05" max="1" step="0.05"
              value={springDragForce}
              onChange={(e) => setSpringDragForce(parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Category 1: AI Persona & Real-time Expressiveness */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">AI Persona & Interaction</h3>

          <div className="dashboard-section">
            <label className="dashboard-label">
              System Prompt
              <div className="tooltip-container">?
                <span className="tooltip-text">Defines the AI's core persona, conversation style, and autonomous reaction tags (e.g. [animation:wave], [emotion:joy]).</span>
              </div>
            </label>
            <textarea
              className="dashboard-input"
              style={{ height: '90px', resize: 'vertical' }}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Manual Animation Trigger
              <div className="tooltip-container">?
                <span className="tooltip-text">Force the 3D character into a specific skeletal animation pose instantly.</span>
              </div>
            </label>
            <div className="button-grid">
              {['idle', 'wave', 'sitting', 'thinking'].map((anim) => (
                <button
                  key={anim}
                  className={`chip-button ${currentAnimation === anim ? 'active' : ''}`}
                  onClick={() => setCurrentAnimation(anim)}
                >
                  {anim.charAt(0).toUpperCase() + anim.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Animation Crossfade: {crossfadeDuration.toFixed(2)}s
              <div className="tooltip-container">?
                <span className="tooltip-text">Controls skeletal blending speed when transitioning between animation poses (0.1s to 1.0s).</span>
              </div>
            </label>
            <input
              type="range"
              className="dashboard-slider"
              min="0.1" max="1" step="0.05"
              value={crossfadeDuration}
              onChange={(e) => setCrossfadeDuration(parseFloat(e.target.value))}
            />
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Facial Emotion Blendshape
              <div className="tooltip-container">?
                <span className="tooltip-text">Trigger facial blendshapes on the VRM avatar directly (joy, angry, sorrow, fun, surprised).</span>
              </div>
            </label>
            <div className="button-grid">
              {['none', 'joy', 'angry', 'sorrow', 'fun', 'surprised'].map((emo) => (
                <button
                  key={emo}
                  className={`chip-button ${manualEmotion === emo ? 'active' : ''}`}
                  onClick={() => setManualEmotion(emo)}
                >
                  {emo.charAt(0).toUpperCase() + emo.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category 2: Voice & Audio Studio */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">Voice & Audio Studio</h3>

          <div className="dashboard-section">
            <label className="dashboard-label">
              TTS Voice Engine
              <div className="tooltip-container">?
                <span className="tooltip-text">Choose between Native Browser SpeechSynthesis, ElevenLabs neural voice, or Kokoro WebGPU/WASM local neural synthesis.</span>
              </div>
            </label>
            <select
              className="dashboard-input"
              value={ttsProvider}
              onChange={(e) => setTtsProvider(e.target.value)}
            >
              <option value="native">Native Browser SpeechSynthesis</option>
              <option value="elevenlabs">ElevenLabs Neural API</option>
              <option value="kokoro">Kokoro WebGPU Local Neural</option>
            </select>
          </div>

          {ttsProvider === 'elevenlabs' && (
            <>
              <div className="dashboard-section">
                <label className="dashboard-label">
                  ElevenLabs API Key
                  <div className="tooltip-container">?
                    <span className="tooltip-text">Required for ElevenLabs neural TTS. Streams high-fidelity audio with FFT viseme lip-sync.</span>
                  </div>
                </label>
                <input
                  type="password"
                  className="dashboard-input"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  placeholder="sk_..."
                />
              </div>

              <div className="dashboard-section">
                <label className="dashboard-label">
                  ElevenLabs Voice ID
                  <div className="tooltip-container">?
                    <span className="tooltip-text">Target Voice ID string from ElevenLabs dashboard (e.g. EXAVITQu4vr4xnSDxMaL).</span>
                  </div>
                </label>
                <input
                  type="text"
                  className="dashboard-input"
                  value={elevenLabsVoiceId}
                  onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                  placeholder="EXAVITQu4vr4xnSDxMaL"
                />
              </div>
            </>
          )}

          {ttsProvider === 'native' && (
            <div className="dashboard-section">
              <label className="dashboard-label">
                Browser Voice
                <div className="tooltip-container">?
                  <span className="tooltip-text">Select one of your system's installed text-to-speech voices.</span>
                </div>
              </label>
              <select
                className="dashboard-input"
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
              >
                {availableVoices.map((v, i) => (
                  <option key={i} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="dashboard-section">
            <label className="dashboard-label">
              TTS Pitch: {ttsPitch.toFixed(1)}
              <div className="tooltip-container">?
                <span className="tooltip-text">Controls vocal pitch frequency modifier (0.5 to 2.0).</span>
              </div>
            </label>
            <input
              type="range"
              className="dashboard-slider"
              min="0.5" max="2" step="0.1"
              value={ttsPitch}
              onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
            />
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              TTS Rate: {ttsRate.toFixed(1)}
              <div className="tooltip-container">?
                <span className="tooltip-text">Controls vocal speech tempo and rate multiplier (0.5 to 2.0).</span>
              </div>
            </label>
            <input
              type="range"
              className="dashboard-slider"
              min="0.5" max="2" step="0.1"
              value={ttsRate}
              onChange={(e) => setTtsRate(parseFloat(e.target.value))}
            />
          </div>

          <div className="dashboard-section">
            <button
              className="action-button secondary"
              onClick={() => speak("Hello! I am Succubus, your 3D interactive AI companion.")}
            >
              Preview Voice Sample 🔊
            </button>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Atmospheric Soundscape
              <div className="tooltip-container">?
                <span className="tooltip-text">Procedural Web Audio background loops (Cyber Drone or Warm Rain) for immersive presence.</span>
              </div>
            </label>
            <select
              className="dashboard-input"
              value={ambientSoundscape}
              onChange={(e) => setAmbientSoundscape(e.target.value)}
            >
              <option value="none">None (Silent Stage)</option>
              <option value="cyber">Cyber Drone Atmosphere</option>
              <option value="rain">Warm Ambient Rain</option>
            </select>
          </div>

          {ambientSoundscape !== 'none' && (
            <div className="dashboard-section">
              <label className="dashboard-label">
                Ambient Soundscape Volume: {Math.round(ambientVolume * 100)}%
                <div className="tooltip-container">?
                  <span className="tooltip-text">Volume gain level of procedural background audio.</span>
                </div>
              </label>
              <input
                type="range"
                className="dashboard-slider"
                min="0.05" max="1" step="0.05"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
              />
            </div>
          )}

          <div className="dashboard-section">
            <label className="dashboard-label">
              UI Interaction Sound Effects
              <div className="tooltip-container">?
                <span className="tooltip-text">Enable subtle procedural audio chimes when clicking avatars, dropping assets, or triggering actions.</span>
              </div>
            </label>
            <div className="button-grid">
              <button
                className={`chip-button ${soundEffectsEnabled ? 'active' : ''}`}
                onClick={() => {
                  setSoundEffectsEnabled(true);
                  playInteractionChime(750, 0.15);
                }}
              >
                🔔 Sound On
              </button>
              <button
                className={`chip-button ${!soundEffectsEnabled ? 'active' : ''}`}
                onClick={() => setSoundEffectsEnabled(false)}
              >
                🔕 Muted
              </button>
            </div>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Microphone Input Tester
              <div className="tooltip-container">?
                <span className="tooltip-text">Test your microphone input gain in real-time with Web Audio API VU meter before voice chatting.</span>
              </div>
            </label>
            <div className="mic-test-container">
              <div className="mic-test-controls">
                <span className="mic-status-text">
                  {isTestingMic ? `Level: ${micLevel}%` : 'Microphone Inactive'}
                </span>
                <button
                  className={`chip-button ${isTestingMic ? 'active' : ''}`}
                  onClick={handleToggleMicTest}
                >
                  {isTestingMic ? 'Stop Test' : 'Test Mic 🎙️'}
                </button>
              </div>
              <div className="mic-meter-bar">
                <div
                  className="mic-meter-fill"
                  style={{ width: `${isTestingMic ? micLevel : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category 3: 3D Stage & Environment Controls */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">3D Stage & Environment</h3>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Camera Perspective Presets
              <div className="tooltip-container">?
                <span className="tooltip-text">Smooth programmatic camera transitions powered by CameraControls setLookAt.</span>
              </div>
            </label>
            <div className="button-grid">
              <button
                className="chip-button"
                onClick={() => cameraControlRef.current?.setLookAt(0, 1.5, 3, 0, 1.2, 0, true)}
              >
                Full Body
              </button>
              <button
                className="chip-button"
                onClick={() => cameraControlRef.current?.setLookAt(0, 1.3, 1.8, 0, 1.2, 0, true)}
              >
                Portrait
              </button>
              <button
                className="chip-button"
                onClick={() => cameraControlRef.current?.setLookAt(0, 1.45, 0.8, 0, 1.45, 0, true)}
              >
                Close-up
              </button>
              <button
                className="chip-button"
                onClick={() => cameraControlRef.current?.setLookAt(0.8, 0.5, 2.2, 0, 1.1, 0, true)}
              >
                Cinematic Low
              </button>
              <button
                className="chip-button"
                onClick={() => cameraControlRef.current?.setLookAt(1.8, 2.8, 2.8, 0, 0.8, 0, true)}
              >
                Isometric Top
              </button>
              <button
                className="chip-button"
                onClick={() => cameraControlRef.current?.reset(true)}
              >
                Reset View 🔄
              </button>
            </div>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Camera Field of View: {cameraFov}°
              <div className="tooltip-container">?
                <span className="tooltip-text">Controls viewport perspective and focal zoom (25° telephoto to 75° wide angle).</span>
              </div>
            </label>
            <input
              type="range"
              className="dashboard-slider"
              min="25" max="75" step="1"
              value={cameraFov}
              onChange={(e) => setCameraFov(parseInt(e.target.value, 10))}
            />
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              3D Environment Asset
              <div className="tooltip-container">?
                <span className="tooltip-text">Switch active GLB virtual stage model, cached automatically in IndexedDB.</span>
              </div>
            </label>
            <select
              className="dashboard-input"
              value={environmentFile}
              onChange={(e) => setEnvironmentFile(e.target.value)}
            >
              <option value="none">Void (Empty Space)</option>
              <option value="room.glb">Modern Neon Room</option>
              <option value="room2.glb">Sci-Fi Deck</option>
            </select>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Stage Lighting Mode
              <div className="tooltip-container">?
                <span className="tooltip-text">Toggles active scene illumination between bright Day and moody Night modes. Can also be triggered by AI via [lights:on]/[lights:off].</span>
              </div>
            </label>
            <div className="button-grid">
              <button
                className={`chip-button ${lightsOn ? 'active' : ''}`}
                onClick={() => setLightsOn(true)}
              >
                ☀️ Lights On
              </button>
              <button
                className={`chip-button ${!lightsOn ? 'active' : ''}`}
                onClick={() => setLightsOn(false)}
              >
                🌙 Night Lights
              </button>
            </div>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Visual Particle Effects
              <div className="tooltip-container">?
                <span className="tooltip-text">Toggles ambient sparkles and visual particle simulations. Can also be triggered by AI via [effect:sparkle].</span>
              </div>
            </label>
            <div className="button-grid">
              <button
                className={`chip-button ${particleEffect === 'none' ? 'active' : ''}`}
                onClick={() => setParticleEffect('none')}
              >
                None
              </button>
              <button
                className={`chip-button ${particleEffect === 'sparkle' ? 'active' : ''}`}
                onClick={() => setParticleEffect('sparkle')}
              >
                ✨ Sparkles
              </button>
            </div>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Bloom Glow Intensity: {bloomIntensity.toFixed(1)}
              <div className="tooltip-container">?
                <span className="tooltip-text">Controls postprocessing neon glow and emissive bloom luminance threshold (0.0 to 3.0).</span>
              </div>
            </label>
            <input
              type="range"
              className="dashboard-slider"
              min="0" max="3" step="0.1"
              value={bloomIntensity}
              onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
            />
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Ambient Light Brightness: {ambientLightScale.toFixed(1)}x
              <div className="tooltip-container">?
                <span className="tooltip-text">Scales overall scene ambient fill light level (0.2x to 2.0x).</span>
              </div>
            </label>
            <input
              type="range"
              className="dashboard-slider"
              min="0.2" max="2" step="0.1"
              value={ambientLightScale}
              onChange={(e) => setAmbientLightScale(parseFloat(e.target.value))}
            />
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Key Light Color
              <div className="tooltip-container">?
                <span className="tooltip-text">Sets directional key light hue and atmosphere tint.</span>
              </div>
            </label>
            <input
              type="color"
              className="dashboard-input"
              style={{ height: '36px', padding: '2px', cursor: 'pointer' }}
              value={lightColor}
              onChange={(e) => setLightColor(e.target.value)}
            />
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Shadow Quality
              <div className="tooltip-container">?
                <span className="tooltip-text">Resolution buffer size for real-time dynamic directional shadows.</span>
              </div>
            </label>
            <select
              className="dashboard-input"
              value={shadowMapResolution}
              onChange={(e) => setShadowMapResolution(parseInt(e.target.value, 10))}
            >
              <option value={512}>Low (512x512)</option>
              <option value={1024}>Medium (1024x1024)</option>
              <option value={2048}>High (2048x2048)</option>
            </select>
          </div>
        </div>

        {/* Category 4: Integrations & API Config */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">Integrations & API</h3>
          <div className="dashboard-section">
            <label className="dashboard-label">
              OpenRouter API Key
              <div className="tooltip-container">?
                <span className="tooltip-text">Your personal OpenRouter API key. If left blank, falls back to server environment key.</span>
              </div>
            </label>
            <input
              type="password"
              className="dashboard-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
            />
          </div>
        </div>

        {/* Category 5: Account & Session Management */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">Account & Session</h3>
          <div className="dashboard-section">
            <div style={{ fontSize: '13px', color: '#aaccff', marginBottom: '8px' }}>
              Logged in as: <strong>{activeUser || 'Studio User'}</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                className="action-button danger"
                style={{ flex: 1 }}
                onClick={() => setMessages([])}
              >
                Clear Chat
              </button>
              <button
                className="action-button secondary"
                style={{ flex: 1 }}
                onClick={handleLogout}
              >
                Switch User
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="action-button secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  const backup = {
                    version: "0.21.0",
                    exportedAt: new Date().toISOString(),
                    user: activeUser,
                    settings: {
                      systemPrompt,
                      openRouterApiKey: apiKey,
                      elevenLabsApiKey,
                      elevenLabsVoiceId,
                      ttsPitch,
                      ttsRate,
                      ttsVoice,
                      ttsProvider,
                      environmentFile,
                      currentAnimation,
                      lightsOn,
                      particleEffect,
                      bloomIntensity,
                      ambientLightScale,
                      lightColor,
                      shadowMapResolution
                    },
                    messages
                  };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `succubus_backup_${activeUser || 'user'}_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast("💾 Backup exported successfully!");
                }}
              >
                Export Backup 📤
              </button>
              <input
                type="file"
                ref={backupFileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target.result);
                      if (data.settings) {
                        if (data.settings.systemPrompt) setSystemPrompt(data.settings.systemPrompt);
                        if (data.settings.openRouterApiKey !== undefined) setApiKey(data.settings.openRouterApiKey);
                        if (data.settings.elevenLabsApiKey !== undefined) setElevenLabsApiKey(data.settings.elevenLabsApiKey);
                        if (data.settings.elevenLabsVoiceId !== undefined) setElevenLabsVoiceId(data.settings.elevenLabsVoiceId);
                        if (data.settings.ttsPitch !== undefined) setTtsPitch(data.settings.ttsPitch);
                        if (data.settings.ttsRate !== undefined) setTtsRate(data.settings.ttsRate);
                        if (data.settings.ttsVoice) setTtsVoice(data.settings.ttsVoice);
                        if (data.settings.ttsProvider) setTtsProvider(data.settings.ttsProvider);
                        if (data.settings.environmentFile) setEnvironmentFile(data.settings.environmentFile);
                        if (data.settings.currentAnimation) setCurrentAnimation(data.settings.currentAnimation);
                        if (data.settings.lightsOn !== undefined) setLightsOn(data.settings.lightsOn);
                        if (data.settings.particleEffect !== undefined) setParticleEffect(data.settings.particleEffect);
                        if (data.settings.bloomIntensity !== undefined) setBloomIntensity(data.settings.bloomIntensity);
                        if (data.settings.ambientLightScale !== undefined) setAmbientLightScale(data.settings.ambientLightScale);
                        if (data.settings.lightColor) setLightColor(data.settings.lightColor);
                        if (data.settings.shadowMapResolution !== undefined) setShadowMapResolution(data.settings.shadowMapResolution);
                      }
                      if (Array.isArray(data.messages)) {
                        setMessages(data.messages);
                      }
                      showToast("📥 Backup imported successfully!");
                    } catch (err) {
                      console.error("Failed to parse backup:", err);
                      showToast("❌ Invalid backup JSON file.");
                    }
                  };
                  reader.readAsText(file);
                }}
              />
              <button
                className="action-button secondary"
                style={{ flex: 1 }}
                onClick={() => backupFileInputRef.current?.click()}
              >
                Import Backup 📥
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3D Canvas Viewport */}
      <Canvas shadows camera={{ position: [0, 1.5, 3], fov: cameraFov }}>
        <ambientLight intensity={(lightsOn ? 0.8 : 0.05) * ambientLightScale} />
        <directionalLight
          castShadow
          position={[5, 5, 5]}
          intensity={lightsOn ? (isDraggingFile ? 2.8 : 2.0) : 0.1}
          color={isDraggingFile ? '#aaccff' : lightColor}
          shadow-mapSize={[shadowMapResolution, shadowMapResolution]}
        />
        <pointLight position={[-3, 2, -3]} intensity={lightsOn ? 0.5 : 0.05} color="#aaccff" />

        <Suspense fallback={null}>
          {environmentFile !== 'none' && (
            <Environment
              lightsOn={lightsOn}
              file={environmentFile}
              soundEffectsEnabled={soundEffectsEnabled}
            />
          )}

          {particleEffect === 'sparkle' && (
             <Sparkles count={100} scale={2.5} size={6} speed={0.4} opacity={0.8} color="#ffffaa" position={[0, 1, 0]} />
          )}

          {/* Holographic 3D Stage Landing Zone Reticle when dragging files */}
          {isDraggingFile && (
            <group position={[0, 0.02, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1.05, 32]} />
                <meshBasicMaterial color="#00d2ff" transparent opacity={0.75} side={2} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.2, 1.25, 32]} />
                <meshBasicMaterial color="#ff4081" transparent opacity={0.5} side={2} />
              </mesh>
            </group>
          )}

          <Character
            url={avatarUrl}
            currentAnimation={currentAnimation}
            emotion={emotion}
            isSpeaking={isSpeaking}
            visemes={visemes}
            springBoneStiffness={springStiffness}
            springBoneDragForce={springDragForce}
            crossfadeDuration={crossfadeDuration}
            onAvatarPointerDown={handleAvatarTouch}
          />
          <EffectComposer>
            <Bloom intensity={bloomIntensity} luminanceThreshold={0.8} luminanceSmoothing={0.025} />
          </EffectComposer>
        </Suspense>

        <CameraControls
          ref={cameraControlRef}
          minDistance={0.5}
          maxDistance={5}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>

      {/* Chat UI Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '600px',
        padding: '20px',
        boxSizing: 'border-box',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        color: 'white',
        fontFamily: 'sans-serif',
        boxShadow: '0 -5px 15px rgba(0,0,0,0.3)',
        zIndex: 40
      }}>
        <div className="chat-messages" style={{
          height: '220px',
          overflowY: 'auto',
          marginBottom: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '5px'
        }}>
          {messages.map((msg, idx) => {
            const isMultimodal = Array.isArray(msg.content);
            const textPart = isMultimodal
              ? msg.content.find(p => p.type === 'text')?.text || ''
              : msg.content;
            const imgPart = isMultimodal
              ? msg.content.find(p => p.type === 'image_url')?.image_url?.url
              : null;

            return (
              <div key={idx} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #007bff, #0056b3)' : 'linear-gradient(135deg, #444, #333)',
                padding: '10px 14px',
                borderRadius: '20px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                borderBottomLeftRadius: msg.role === 'user' ? '20px' : '4px',
                maxWidth: '80%',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                lineHeight: '1.4'
              }}>
                {imgPart && (
                  <img
                    src={imgPart}
                    alt="attachment"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '160px',
                      borderRadius: '8px',
                      marginBottom: textPart ? '8px' : '0',
                      display: 'block'
                    }}
                  />
                )}
                {textPart}
              </div>
            );
          })}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Attached image preview */}
        {attachedImage && (
          <div className="attached-image-bar">
            <img
              src={attachedImage}
              alt="preview"
              className="attached-image-thumb"
            />
            <div className="attached-image-info">
              <span className="attached-image-title">
                {attachedImageMeta?.name || 'Attached Image'}
              </span>
              <div className="attached-image-badges">
                <span className="attached-badge">{attachedImageMeta?.type || 'IMAGE'}</span>
                <span className="attached-badge">{attachedImageMeta?.size || ''}</span>
              </div>
            </div>
            <button
              className="attached-image-remove"
              onClick={() => {
                setAttachedImage(null);
                setAttachedImageMeta(null);
              }}
              title="Remove attached image"
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <button
            className="action-icon-button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Image"
          >
            📷
          </button>
          <button
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            onClick={handleMicToggle}
            title="Toggle Voice Input"
          >
            🎤
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message or share an image..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '20px',
              border: 'none',
              outline: 'none',
              background: 'rgba(255,255,255,0.9)',
              color: '#111',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
            }}
          />
          <button
            className="send-button"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
