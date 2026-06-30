import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import Character from './Character';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentAnimation, setCurrentAnimation] = useState('idle');
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

  const speak = (text) => {
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
    const savedChat = localStorage.getItem('chat_history');
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Failed to parse local storage chat history", e);
      }
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
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: 'radial-gradient(circle at center, #3a3a5a 0%, #1a1a2e 100%)' }}>

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

        <div className="setting-group">
          <label>
            Character Prompt
            <span className="tooltip">?<span className="tooltiptext">Defines the persona and response format. Must instruct the AI to output valid JSON for the avatar to animate properly.</span></span>
          </label>
          <textarea
            rows={8}
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
          />
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

      <Canvas camera={{ position: [0, 1.4, 2.5], fov: 40 }}>
        <ambientLight intensity={1.2} color="#ffffff" />
        <directionalLight position={[2, 5, 2]} intensity={1.5} color="#fff1e6" castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.5} color="#b3e5fc" />

        <Suspense fallback={null}>
          <Character url="/avatar.vrm" currentAnimation={currentAnimation} emotion={emotion} isSpeaking={isSpeaking} />
          <Environment preset="city" />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2} far={4} />
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
