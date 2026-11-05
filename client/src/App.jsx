import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Character from './Character';
import Environment from './Environment';
import { LipSyncAnalyser } from './LipSyncAnalyser';
import { StorageService } from './StorageService';
import { KokoroTTS } from "kokoro-js";
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');

  // Dashboard State & LocalStorage initialization
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [apiKey, setApiKey] = useState('');
  const [environmentFile, setEnvironmentFile] = useState('room.glb');

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

  const [ttsPitch, setTtsPitch] = useState(1.2);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [ttsVoice, setTtsVoice] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);

  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('');

  const [isSpeaking, setIsSpeaking] = useState(false);
  const endOfMessagesRef = useRef(null);
  const [emotion, setEmotion] = useState(null);
  const [lightsOn, setLightsOn] = useState(true);
  const [particleEffect, setParticleEffect] = useState('none');

  // Audio & Speech Recognition state
  const [visemes, setVisemes] = useState({ a: 0, i: 0, u: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const analyserRef = useRef(null);
  const currentAudioRef = useRef(null);
  const cameraControlRef = useRef(null);

  // Audio Queue logic
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Kokoro TTS State
  const [kokoroTts, setKokoroTts] = useState(null);

  // Utility to encode Float32Array to WAV format
  const encodeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count (1)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
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
        console.error("Failed to load Kokoro TTS:", err);
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
        if (dbSettings.ttsPitch) setTtsPitch(dbSettings.ttsPitch);
        if (dbSettings.ttsRate) setTtsRate(dbSettings.ttsRate);
        if (dbSettings.ttsVoice) setTtsVoice(dbSettings.ttsVoice);
        if (dbSettings.elevenLabsApiKey) setElevenLabsApiKey(dbSettings.elevenLabsApiKey);
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

  // Ensure voices are loaded for the dashboard dropdown
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (!ttsVoice && voices.length > 0) {
        const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'));
        setTtsVoice(femaleVoice ? femaleVoice.name : voices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [ttsVoice]);

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      setVisemes({ a: 0, i: 0, u: 0 }); // reset visemes
      return;
    }

    isPlayingRef.current = true;
    const { url } = audioQueueRef.current.shift();

    const audio = new Audio(url);
    currentAudioRef.current = audio;
    setIsSpeaking(true);

    audio.onended = () => {
      // Play the next audio in the queue
      playNextAudio();
    };

    // Initialize FFT analyser
    if (!analyserRef.current) {
      analyserRef.current = new LipSyncAnalyser(audio);
    } else {
      analyserRef.current.connectAudio(audio);
    }

    analyserRef.current.resumeContext();
    audio.play();
  };

  const speak = async (text) => {
    if (elevenLabsApiKey && elevenLabsVoiceId) {
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

        // Push onto queue
        audioQueueRef.current.push({ url });

        // If not currently playing anything, start playback loop
        if (!isPlayingRef.current) {
          playNextAudio();
        }

      } catch (e) {
        console.error("ElevenLabs TTS Error:", e);
      }
    } else if (kokoroTts) {
      try {
        setIsSpeaking(true);
        const audioData = await kokoroTts.generate(text, {
          voice: "af_heart", // Using default voice as placeholder
        });

        // kokoro-js outputs a Float32Array on audioData.audio. We must encode it to a standard WAV.
        // Assuming a standard sample rate of 24000 for Kokoro models (adjust if different).
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
        setIsSpeaking(false);
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


  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    // Save locally
    localStorage.setItem('chat_history', JSON.stringify(newMessages));

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

      // Limit memory to the last 20 messages to prevent token exhaustion
      const slidingWindowMessages = newMessages.slice(-20);

      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessages: slidingWindowMessages.map(m => ({ role: m.role, content: m.content })),
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

      // Update UI with partial messages
      const finalMessages = [...newMessages, { role: 'assistant', content: '' }];
      setMessages(finalMessages);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });
        textBuffer += chunkValue;

        // Regex to find and process tags like [animation:wave], [emotion:joy], [lights:on], and [effect:sparkle]
        const tagRegex = /\[(animation|emotion|lights|effect):([a-zA-Z]+)\]/g;

        // Update the last message content in UI, stripping out tags
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
            setTimeout(() => setEmotion(null), 3000); // Reset emotion after 3s
          } else if (type === 'lights') {
            if (val === 'on') {
              setLightsOn(true);
            } else if (val === 'off') {
              setLightsOn(false);
            }
          } else if (type === 'effect') {
            setParticleEffect(val);
          }
        }

        // Update parsedTagIndex based on fully parsed tags, but if there's a '[' without a ']' near the end, wait
        const lastBracketOpen = unparsedText.lastIndexOf('[');
        const lastBracketClose = unparsedText.lastIndexOf(']');

        if (lastBracketOpen > lastBracketClose) {
           // We have a partial tag, only advance up to the last bracket
           parsedTagIndex += lastBracketOpen;
        } else {
           parsedTagIndex = textBuffer.length;
        }

        // Remove tags from text for speaking and sentence boundary detection
        const cleanText = textBuffer.replace(tagRegex, '');

        // Look for new sentence boundaries to speak incrementally
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

      // Speak any remaining text that didn't end with a punctuation mark
      const finalCleanText = textBuffer.replace(/\[(animation|emotion|lights|effect):([a-zA-Z]+)\]/g, '');
      const remainingText = finalCleanText.substring(spokenText.length).trim();
      if (remainingText) {
         speak(remainingText);
      }

      // The debounced useEffect handles saving messages array automatically.
      // But we update the final messages locally with tags stripped.
      setMessages(finalMessages.map((msg, index) => {
        if (index === finalMessages.length - 1) {
          return { ...msg, content: textBuffer.replace(/\[(animation|emotion|lights|effect):([a-zA-Z]+)\]/g, '') };
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
        body: JSON.stringify({ username: loginUsername })
      });

      if (response.ok) {
        const data = await response.json();
        StorageService.setToken(data.token);
        setIsAuthenticated(true);
      } else {
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-overlay">
        <div className="auth-panel">
          <h2 className="auth-title">Welcome to Succubus.red</h2>
          <input
            type="text"
            placeholder="Enter Username"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            className="auth-input"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin} className="auth-button">Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#222', overflow: 'hidden' }}>

      {/* Settings Toggle Button */}
      <button
        className="dashboard-toggle-btn"
        onClick={() => setIsDashboardOpen(!isDashboardOpen)}
        title="Settings"
      >
        ⚙️
      </button>

      {/* Dashboard Panel */}
      <div className={`dashboard-panel ${isDashboardOpen ? 'open' : ''}`}>
        <h2 style={{ margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>Settings</h2>

        {/* Category 1: AI Persona & Behavior */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">AI Persona</h3>
          <div className="dashboard-section">
            <label className="dashboard-label">
              System Prompt
              <div className="tooltip-container">?
                <span className="tooltip-text">Defines the AI's core personality, behavior, and formatting rules. Use [animation:name] tags to trigger 3D actions.</span>
              </div>
            </label>
            <textarea
              className="dashboard-input"
              style={{ height: '100px', resize: 'vertical' }}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
        </div>

        {/* Category 2: Voice & Audio */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">Voice & Audio</h3>

          <div className="dashboard-section">
            <label className="dashboard-label">
              ElevenLabs API Key
              <div className="tooltip-container">?
                <span className="tooltip-text">Required for premium AI voices and accurate FFT lip sync. If empty, the system falls back to native browser TTS.</span>
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
                <span className="tooltip-text">The specific Voice ID string from your ElevenLabs dashboard (e.g. EXAVITQu4vr4xnSDxMaL).</span>
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

          <div className="dashboard-section">
            <label className="dashboard-label">
              Native TTS Voice
              <div className="tooltip-container">?
                <span className="tooltip-text">The fallback local voice used if ElevenLabs is not configured. Relies on voices installed on your OS/Browser.</span>
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

          <div className="dashboard-section">
            <label className="dashboard-label">
              TTS Pitch: {ttsPitch.toFixed(1)}
              <div className="tooltip-container">?
                <span className="tooltip-text">Adjusts the pitch/tone of the native fallback TTS voice.</span>
              </div>
            </label>
            <input
              type="range"
              className="dashboard-slider"
              min="0" max="2" step="0.1"
              value={ttsPitch}
              onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
            />
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              TTS Rate: {ttsRate.toFixed(1)}
              <div className="tooltip-container">?
                <span className="tooltip-text">Adjusts the speaking speed of the native fallback TTS voice.</span>
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
        </div>

        {/* Category 3: Integrations */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">Integrations</h3>
          <div className="dashboard-section">
            <label className="dashboard-label">
              OpenRouter API Key
              <div className="tooltip-container">?
                <span className="tooltip-text">Required to talk to the AI model. Obtain your key from openrouter.ai.</span>
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

        {/* Category 4: Debug & Controls */}
        <div className="dashboard-category">
          <h3 className="dashboard-category-title">Debug & Controls</h3>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Camera Preset
              <div className="tooltip-container">?
                <span className="tooltip-text">Smoothly transitions the 3D camera to predefined viewpoints.</span>
              </div>
            </label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                className="dashboard-input"
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => cameraControlRef.current?.setLookAt(0, 1.5, 3, 0, 1.2, 0, true)}
              >
                Full
              </button>
              <button
                className="dashboard-input"
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => cameraControlRef.current?.setLookAt(0, 1.3, 1.8, 0, 1.2, 0, true)}
              >
                Portrait
              </button>
              <button
                className="dashboard-input"
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => cameraControlRef.current?.setLookAt(0, 1.45, 0.8, 0, 1.45, 0, true)}
              >
                Close
              </button>
            </div>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              Manual Animation
              <div className="tooltip-container">?
                <span className="tooltip-text">Force the 3D character into a specific animation state immediately, bypassing the LLM response.</span>
              </div>
            </label>
            <select
              className="dashboard-input"
              value={currentAnimation}
              onChange={(e) => setCurrentAnimation(e.target.value)}
            >
              <option value="idle">Idle</option>
              <option value="sitting">Sitting</option>
              <option value="thinking">Thinking</option>
              <option value="wave">Wave</option>
            </select>
          </div>

          <div className="dashboard-section">
            <label className="dashboard-label">
              3D Environment
              <div className="tooltip-container">?
                <span className="tooltip-text">Change the background 3D scene. Requires a brief loading pause.</span>
              </div>
            </label>
            <select
              className="dashboard-input"
              value={environmentFile}
              onChange={(e) => setEnvironmentFile(e.target.value)}
            >
              <option value="none">Void (Empty)</option>
              <option value="room.glb">Default Room</option>
              <option value="room2.glb">Sci-Fi Deck</option>
            </select>
          </div>

          <div className="dashboard-section" style={{ borderBottom: 'none', paddingBottom: '0' }}>
            <button
              className="send-button"
              style={{ width: '100%', background: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                setMessages([]);
              }}
            >
              Clear Chat History
              <div className="tooltip-container" style={{ marginLeft: '10px' }}>?
                <span className="tooltip-text">Instantly wipes the current conversation and resets the chat memory sliding window.</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Canvas shadows camera={{ position: [0, 1.5, 3], fov: 45 }}>
        <ambientLight intensity={lightsOn ? 0.8 : 0.05} />
        <directionalLight castShadow position={[5, 5, 5]} intensity={lightsOn ? 2.0 : 0.1} color="#ffffff" shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-3, 2, -3]} intensity={lightsOn ? 0.5 : 0.05} color="#aaccff" />

        <Suspense fallback={null}>
          {environmentFile !== 'none' && <Environment lightsOn={lightsOn} file={environmentFile} />}

          {particleEffect === 'sparkle' && (
             <Sparkles count={100} scale={2.5} size={6} speed={0.4} opacity={0.8} color="#ffffaa" position={[0, 1, 0]} />
          )}

          <Character
            url="/avatar.vrm"
            currentAnimation={currentAnimation}
            emotion={emotion}
            isSpeaking={isSpeaking}
            visemes={visemes}
          />
          <EffectComposer>
            <Bloom intensity={1.0} luminanceThreshold={0.8} luminanceSmoothing={0.025} />
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
        boxShadow: '0 -5px 15px rgba(0,0,0,0.3)'
      }}>
        <div className="chat-messages" style={{
          height: '250px',
          overflowY: 'auto',
          marginBottom: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '5px'
        }}>
          {messages.map((msg, idx) => (
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
              {msg.content}
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '20px',
              border: 'none',
              outline: 'none',
              background: 'rgba(255,255,255,0.9)',
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
