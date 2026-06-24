import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Character from './Character';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const endOfMessagesRef = useRef(null);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a female voice
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

  const [emotion, setEmotion] = useState(null);

  useEffect(() => {
    // Load from local storage
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local storage chat history", e);
      }
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    // Save locally
    localStorage.setItem('chat_history', JSON.stringify(newMessages));

    const characterSystemPrompt = `You are a helpful and playful AI companion.
    You must always output your response as a valid JSON object.
    The JSON object must have the following keys:
    "text": the string of what you want to say.
    "animation": an animation to play (choose from "idle", "wave").
    "emotion": an emotion string (e.g., "joy", "angry", "sorrow", "fun") to map to a blendshape.

    Do not wrap the JSON in markdown code blocks, output only the JSON object.`;

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessages: newMessages.map(m => ({ role: m.role, content: m.content })),
          characterSystemPrompt
        })
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Read stream (for a real app, you'd chunk this into a buffer. We'll aggregate for JSON parsing here)
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

      // Try to parse the complete JSON
      try {
        const payload = JSON.parse(textBuffer);

        const finalMessages = [...newMessages, { role: 'assistant', content: payload.text }];
        setMessages(finalMessages);
        localStorage.setItem('chat_history', JSON.stringify(finalMessages));

        if (payload.animation) {
          setCurrentAnimation(payload.animation);
        }
        if (payload.emotion) {
           // MToon/VRM standard expressions are usually lower case or specific. Let's map loosely:
           setEmotion({ name: payload.emotion, value: 1.0 });
           setTimeout(() => setEmotion(null), 3000); // Reset emotion after 3s
        }

        speak(payload.text);

      } catch (e) {
        console.error("Failed to parse JSON response:", textBuffer);
        // Fallback if model fails to output valid JSON
        const finalMessages = [...newMessages, { role: 'assistant', content: textBuffer }];
        setMessages(finalMessages);
        localStorage.setItem('chat_history', JSON.stringify(finalMessages));
        speak(textBuffer);
      }

    } catch (error) {
      console.error("Error fetching from API:", error);
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ensure voices are loaded
  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#222' }}>
      <Canvas camera={{ position: [0, 1.5, 3], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Suspense fallback={null}>
          <Character url="/avatar.vrm" currentAnimation={currentAnimation} emotion={emotion} isSpeaking={isSpeaking} />
        </Suspense>

        <OrbitControls target={[0, 1.2, 0]} />
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
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          height: '250px',
          overflowY: 'auto',
          marginBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#007bff' : '#444',
              padding: '8px 12px',
              borderRadius: '16px',
              maxWidth: '80%'
            }}>
              {msg.content}
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '20px',
              border: 'none',
              outline: 'none',
              background: 'rgba(255,255,255,0.9)'
            }}
          />
          <button
            onClick={handleSend}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              background: '#e91e63',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
