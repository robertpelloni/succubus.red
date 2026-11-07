import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
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

  // Custom Avatar state
  const [avatarUrl, setAvatarUrl] = useState('/avatar.vrm');
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
  const [customAvatarMeta, setCustomAvatarMeta] = useState(null);
  const [avatarMode, setAvatarMode] = useState('default'); // 'default' or 'custom'
  const [springStiffness, setSpringStiffness] = useState(1.0);
  const [springDragForce, setSpringDragForce] = useState(0.4);

  // Drag-and-Drop and Toast State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const dragCounterRef = useRef(0);

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, duration);
  };

  const handleAvatarTouch = () => {
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

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotion, setEmotion] = useState(null);

  // Dashboard UI state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    `You are a helpful and playful AI companion.
You must always output your response as a valid JSON object.
The JSON object must have the following keys:
"text": the string of what you want to say.
"animation": an animation to play (choose from "idle", "wave").
"emotion": an emotion string (choose from "joy", "angry", "sorrow", "fun") to map to a blendshape.

Do not wrap the JSON in markdown code blocks, output only the JSON object.`
  );
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const endOfMessagesRef = useRef(null);

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
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'));
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.pitch = 1.2;
      utterance.rate = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentAnimation('idle');
      };

      window.speechSynthesis.speak(utterance);
    }
  };

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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file (PNG, JPEG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target.result);
      showToast("📷 Image attached! Ask a question about it.");
    };
    reader.readAsDataURL(file);
  };

  // Viewport Drag-and-Drop Handler
  const handleFileDrop = async (file) => {
    if (!file) return;
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.vrm')) {
      const isValid = await validateVRMBinary(file);
      if (!isValid) {
        showToast("❌ Dropped file is not a valid glTF/VRM binary.");
        return;
      }

      try {
        const { url, meta } = await saveCustomAvatar(file);
        setAvatarUrl(url);
        setCustomAvatarMeta(meta);
        setHasCustomAvatar(true);
        setAvatarMode('custom');
        showToast(`✨ Custom avatar "${meta.name}" cached & loaded!`);
      } catch (err) {
        console.error("Drop VRM error:", err);
        showToast("❌ Failed to load VRM file.");
      }
    } else if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
      try {
        const envUrl = URL.createObjectURL(file);
        setEnvironmentFile(envUrl);
        showToast(`🌐 Custom 3D environment "${file.name}" loaded!`);
      } catch (err) {
        console.error("Drop GLB error:", err);
        showToast("❌ Failed to load 3D environment model.");
      }
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target.result);
        showToast("📷 Image attached! Type a prompt or hit send.");
      };
      reader.readAsDataURL(file);
    } else {
      showToast("⚠️ Unsupported file format. Drop a .vrm avatar, .glb environment, or image file.");
    }
    const savedPrompt = localStorage.getItem('system_prompt');
    if (savedPrompt) setSystemPrompt(savedPrompt);
    const savedKey = localStorage.getItem('openrouter_key');
    if (savedKey) setOpenRouterKey(savedKey);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('system_prompt', systemPrompt);
    localStorage.setItem('openrouter_key', openRouterKey);
    setSettingsOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setErrorMsg(null);
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    localStorage.setItem('chat_history', JSON.stringify(newMessages));

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessages: newMessages.map(m => ({ role: m.role, content: m.content })),
          characterSystemPrompt: systemPrompt,
          // In a real app we'd pass this to the backend safely, or use client-side fetching
          apiKey: openRouterKey
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let textBuffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });
        textBuffer += chunkValue;
      }

      try {
        const payload = JSON.parse(textBuffer);

        const finalMessages = [...newMessages, { role: 'assistant', content: payload.text }];
        setMessages(finalMessages);
        localStorage.setItem('chat_history', JSON.stringify(finalMessages));

        if (payload.animation) {
          setCurrentAnimation(payload.animation);
        }
        if (payload.emotion) {
           setEmotion({ name: payload.emotion, value: 1.0 });
           setTimeout(() => setEmotion(null), 3000);
        }

        speak(payload.text);

      } catch (e) {
        console.error("Failed to parse JSON response:", textBuffer);
        setErrorMsg("AI returned malformed JSON. Falling back to plain text.");
        const finalMessages = [...newMessages, { role: 'assistant', content: textBuffer }];
        setMessages(finalMessages);
        localStorage.setItem('chat_history', JSON.stringify(finalMessages));
        speak(textBuffer);
      }

    } catch (error) {
      console.error("Error fetching from API:", error);
      setErrorMsg(error.message || "Failed to communicate with the server.");
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#222', overflow: 'hidden' }}>

      {/* Drag & Drop Visual HUD Overlay */}
      {isDraggingFile && (
        <div className="drop-overlay">
          <div className="drop-overlay-box">
            <div className="drop-overlay-icon">📥</div>
            <h2 className="drop-overlay-title">Drop File Here</h2>
            <p className="drop-overlay-desc">Drop a .vrm avatar, .glb 3D environment, or an image to share</p>
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

      {/* Settings Toggle Button */}
      <button
        className="settings-toggle"
        onClick={() => setSettingsOpen(!settingsOpen)}
        title="Configuration Dashboard"
      >
        ⚙️
      </button>

      {/* Settings Dashboard Panel */}
      <div className={`settings-panel ${settingsOpen ? 'open' : ''}`}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>Dashboard</h2>

        <div className="setting-group">
          <label>
            OpenRouter API Key
            <span className="tooltip">?<span className="tooltiptext">Required to access uncensored LLM models via OpenRouter. Get one at openrouter.ai/keys.</span></span>
          </label>
          <input
            type="password"
            value={openRouterKey}
            onChange={e => setOpenRouterKey(e.target.value)}
            placeholder="sk-or-v1-..."
          />
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
                <div style={{ fontSize: '11px', color: '#aaccff', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                    📦 {customAvatarMeta?.name || 'custom_avatar.vrm'}
                  </span>
                  <span>
                    {customAvatarMeta?.size ? `${(customAvatarMeta.size / (1024 * 1024)).toFixed(1)} MB` : 'IndexedDB'}
                  </span>
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

        <button
          onClick={handleSaveSettings}
          style={{
            width: '100%',
            padding: '10px',
            background: '#e91e63',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
        >
          Save & Close
        </button>
      </div>

      {/* 3D Canvas Viewport */}
      <Canvas shadows camera={{ position: [0, 1.5, 3], fov: 45 }}>
        <ambientLight intensity={(lightsOn ? 0.8 : 0.05) * ambientLightScale} />
        <directionalLight
          castShadow
          position={[5, 5, 5]}
          intensity={lightsOn ? 2.0 : 0.1}
          color={lightColor}
          shadow-mapSize={[shadowMapResolution, shadowMapResolution]}
        />
        <pointLight position={[-3, 2, -3]} intensity={lightsOn ? 0.5 : 0.05} color="#aaccff" />

        <Suspense fallback={null}>
          {environmentFile !== 'none' && <Environment lightsOn={lightsOn} file={environmentFile} />}

          {particleEffect === 'sparkle' && (
             <Sparkles count={100} scale={2.5} size={6} speed={0.4} opacity={0.8} color="#ffffaa" position={[0, 1, 0]} />
          )}

          <Character
            url={avatarUrl}
            currentAnimation={currentAnimation}
            emotion={emotion}
            isSpeaking={isSpeaking}
            visemes={visemes}
            springBoneStiffness={springStiffness}
            springBoneDragForce={springDragForce}
            onAvatarPointerDown={handleAvatarTouch}
          />
          <EffectComposer>
            <Bloom intensity={bloomIntensity} luminanceThreshold={0.8} luminanceSmoothing={0.025} />
          </EffectComposer>
        </Suspense>

        <OrbitControls target={[0, 1.1, 0]} minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI/2 + 0.1} minDistance={1.5} maxDistance={5} />
      </Canvas>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '800px',
        padding: '25px',
        boxSizing: 'border-box',
        background: 'rgba(20, 20, 30, 0.75)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>

        {errorMsg && (
          <div className="error-message">
            <strong>Warning:</strong> {errorMsg}
          </div>
        )}

        <div style={{
          height: '30vh',
          maxHeight: '300px',
          overflowY: 'auto',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '10px'
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 'auto', marginBottom: 'auto' }}>
              Say hello to start chatting!
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #e91e63, #9c27b0)' : 'rgba(255, 255, 255, 0.1)',
              padding: '12px 18px',
              borderRadius: '20px',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '20px',
              maxWidth: '85%',
              lineHeight: '1.5',
              fontSize: '15px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              {msg.content}
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="What's on your mind?..."
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: '30px',
              border: '1px solid rgba(255,255,255,0.2)',
              outline: 'none',
              background: 'rgba(0,0,0,0.4)',
              color: 'white',
              fontSize: '16px',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#e91e63'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
          />
          <button
            onClick={handleSend}
            style={{
              padding: '16px 32px',
              borderRadius: '30px',
              border: 'none',
              background: 'linear-gradient(135deg, #e91e63, #ff4081)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
              boxShadow: '0 4px 15px rgba(233, 30, 99, 0.4)',
              transition: 'transform 0.2s ease, filter 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
            onMouseOut={(e) => e.target.style.filter = 'brightness(1)'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
