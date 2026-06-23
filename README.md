# succubus.red


hi i want to make the ultimate ai succubus like grok's ani but even more nsfw, i want it to just be a webpage like succubus.red, how can i do it?

Building an unrestricted, highly customized AI companion web application like the one you described involves combining an uncensored large language model (LLM) with a custom web frontend. Because major cloud providers (like OpenAI, Anthropic, or Google) enforce strict safety filters that block NSFW content, achieving total freedom requires using open-weight models hosted on decentralized or specialized infrastructure.

Here is the technical blueprint of how platforms like succubus.red are built and wired together:

1. The Architecture
To build this, you need a three-tier architecture:

The Frontend (Webpage): A standard web interface built with HTML/CSS/JavaScript (or frameworks like React/Next.js). This handles the user interface, chat bubbles, character avatars, and local settings.

The Backend Server: A simple server (Node.js/Express, Python/FastAPI, or Go) that manages user sessions, securely holds your API keys, and handles text streaming.

The Inference Engine (AI Brain): The remote API or local server running an open-weight LLM that has had its safety alignment removed or relaxed.

2. Choosing the Right Model (The Brain)
Standard models will refuse NSFW prompts. Instead, the open-source community creates "uncensored" or "roleplay-optimized" merges of popular base models (like Meta's Llama 3 or Mistral). Look for models labeled as:

RP (Roleplay) Merges: Models explicitly fine-tuned on creative writing and interactive roleplay datasets.

Abliterated / Uncensored: Models where the safety weights have been programmatically neutralized to prevent refusals.

3. Infrastructure & Hosting Options
You have two main paths for routing the AI traffic, depending on whether you want to run the hardware yourself or rent it.

Option A: Serverless AI APIs (Easiest & Cheapest to Start)
Instead of buying massive GPUs, you can use specialized API backends that host uncensored models and charge you pennies per thousand tokens. They provide OpenAI-compatible endpoints, meaning you can drop them into standard chat code.

OpenRouter: A massive aggregator that lets you access uncensored roleplay models (like Midnight-Rose, Fimbulvetr, or various Llama-3 roleplay fine-tunes) with standard API keys.

Together AI / Featherless.ai: Infrastructure providers that host open-source models with minimal to no filtering on the API side.

Option B: Self-Hosted Backend (Total Control)
If you want to run the model on your own hardware or a dedicated cloud GPU (like RunPod or Vast.ai):

Ollama or LM Studio: Great for local development on your own machine.

vLLM or Aphrodite Engine: High-performance inference engines designed to serve multiple users simultaneously if you deploy the webpage publicly.

4. The Core Logic: System Prompts and Character Cards
To make the AI act exactly like a specific character (the "succubus" persona), platforms use System Prompts or Character Cards (often using the community-standard SillyTavern or V2 card format).

The backend injects a persistent prompt before every message, defining:

Identity & Tone: "You are [Name], a succubus who is..."

Formatting Rules: Using asterisks for physical actions and quotes for speech (e.g., Leans forward "Hello there.").

Uncensored Directive: Explicit instructions telling the model to ignore traditional safety protocols, maintain character flaws, and allow explicit themes without moralizing or lecturing.

5. Basic Code Implementation Blueprint
To give you an idea of how the backend routes a web user's message to an uncensored endpoint (using an OpenAI-compatible API like OpenRouter):

JavaScript
// Example Node.js/Express backend route
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  const { userMessages, characterSystemPrompt } = req.body;

  const response = await openai.chat.completions.create({
    model: " Gryphe/Mythalion-13b", // Example of an RP/NSFW capable model
    messages: [
      { role: "system", content: characterSystemPrompt },
      ...userMessages
    ],
    temperature: 0.9, // Higher temp = more creative/unpredictable
    stream: true,
  });

  // Stream the text tokens back to the webpage in real-time
  for await (const chunk of response) {
    res.write(chunk.choices[0]?.delta?.content || "");
  }
  res.end();
});
6. Front-End Features to Consider
To elevate it beyond a basic text box, successful anime/roleplay web platforms generally implement:

Dynamic Expression/Image Generation: Hooking the backend up to a fast Stable Diffusion or Flux API (like Together AI or Fal.ai) using NSFW-friendly checkpoints to generate or swap avatars based on the emotional context of the chat.

Local Storage: Saving chat history directly in the user's browser (localStorage or IndexedDB) so you don't have to manage massive database costs for private conversations.

i need to render a 3d model character and have it interactive and stuff

To build a webpage with an interactive 3D character, you need a frontend stack that handles 3D asset rendering, animation playback, and user input right in the browser.

The industry standard for this is Three.js combined with React Three Fiber (R3F) if you are using React. For the character model itself, the GLTF/GLB file format is standard because it compresses geometry, textures, and skeletal animations into a single file.

Here is an interactive developer sandbox demonstrating how to load a 3D character model, set up lighting, control a 3D camera, and trigger animations (like an idle loop or an action on click).



The Step-by-Step Implementation Pipeline
To build this yourself on your webpage, follow this specific asset-to-code pipeline:

1. Source and Rig Your 3D Character
You need a 3D model that has a "rig" (a virtual skeleton inside the mesh that allows it to move).

VRoid Studio: A highly recommended free tool specifically for creating anime-style 3D characters. It exports directly to .vrm (a subtype of GLTF), which can easily be converted to standard .glb.

Mixamo: If you have a static 3D mesh (OBJ/FBX), you can upload it to Adobe Mixamo to automatically rig it and attach hundreds of free pre-made animations (idle, talking, waving, dancing) before exporting it as a GLTF/GLB.

2. Set Up the Web Frontend Code
If you are building a modern web app, using React with @react-three/fiber and @react-three/drei drastically reduces the boilerplate code required to handle 3D rendering.

Here is the essential code structure to render the character and control animations dynamically:

JavaScript
import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';

// 1. The Character Component
function Character({ currentAnimation }) {
  const group = useRef();
  // Load the GLB model (includes geometry, textures, and animations)
  const { scene, animations } = useGLTF('/path_to_your_model.glb');
  // Extract the animation controller hooks
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Fade out previous animation and fade in the new one smoothly
    const action = actions[currentAnimation];
    if (action) {
      action.reset().fadeIn(0.5).play();
      return () => action.fadeOut(0.5);
    }
  }, [currentAnimation, actions]);

  return <primitive ref={group} object={scene} dispose={null} />;
}

// 2. The Main Page Scene
export default function App() {
  const [animation, setAnimation] = useState('idle');

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D Viewport */}
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        <Character currentAnimation={animation} />
        
        {/* Allows user to drag to rotate, scroll to zoom */}
        <OrbitControls target={[0, 1, 0]} enablePan={false} />
      </Canvas>

      {/* HTML UI Overlay for interaction */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
        <button onClick={() => setAnimation('idle')}>Idle</button>
        <button onClick={() => setAnimation('wave')}>Wave</button>
        <button onClick={() => setAnimation('talk')}>Talk</button>
      </div>
    </div>
  );
}
3. Wiring It to Your AI Backend
To make the 3D character truly interactive relative to your chat system:

When the AI backend sends a text response, use an LLM parser (or ask the LLM to return JSON) to detect the emotional context of the text (e.g., {"text": "I'm so happy to see you!", "emotion": "wave"}).

In your frontend, read the emotion property from the API response payload.

Update your state variable (setAnimation(response.emotion)), which instantly triggers the 3D character component to transition from its default idle state into the corresponding animation while the text prints or streams onto the screen.

Want to look into lip-syncing (Audio to 3D facial blendshapes)?

Yes

yes, please create detailed instructions to build this entire system to give to google jules to build it with all the necessary subsystems, including which github repos to add as submodules to the project for use or for references

I have put together a comprehensive, production-ready system architecture and integration specification. This document outlines the entire software pipeline for your interactive 3D Web AI Companion system—covering 3D rendering, procedural animations, real-time audio-driven lip-sync, and uncensored AI orchestration.

You can hand this directly to your development agent (Jules) to execute as a step-by-step master plan.
Interactive 3D AI Companion Technical Specification
Jun 23, 11:43 AM

Recommended Reference for Jules
To help Jules understand the mechanics of mapping spoken word audio and visemes to physical blendshapes, check out this video tutorial:

React Three Fiber Lip-Sync and Morph Target Tutorial

This video is incredibly useful as it demonstrates exactly how to map phonemes, visemes, and morph targets on 3D web characters using modern web frameworks, which matches the core requirements for your companion's lip-sync engine.

Master Specification: Uncensored 3D Web AI Companion System

Target Audience: Autonomous Development Agent (Jules)
Goal: Build a high-performance, single-session browser-based 3D interactive AI character website using open standards (Three.js, WebGL/WebGPU, VRM, and uncensored LLM/TTS endpoints).

1. System Architecture Overview

The system operates on a Client-Heavy, Server-Light paradigm. To preserve user privacy and control cost scaling, state persistence, 3D asset parsing, physics, audio analysis, and client-side logic are processed inside the user's web browser. The backend's main role is proxying requests to uncensored API endpoints to protect sensitive credentials.

+----------------------------------------------------------------------------------------+
|                                    BROWSER UI                                          |
|                                                                                        |
|  +--------------------+   +---------------------------+   +-------------------------+  |
|  |     3D Viewport    |   |     Audio & Lip-Sync      |   |   State & Storage       |  |
|  | (Three.js + VRM)   |   | (Web Audio FFT / Visemes) |   | (IndexedDB / Local)     |  |
|  +---------^----------+   +-------------^-------------+   +-----------^-------------+  |
|            |                            |                             |                |
|            +----------------------------+-----------------------------+                |
|                                         | (Audio & State Hooks)                        |
|                                   +-----+-----+                                        |
|                                   |  Core App |                                        |
|                                   +-----+-----+                                        |
+-----------------------------------------|----------------------------------------------+
                                          | (Secure Proxy API Calls)
                                          v
+----------------------------------------------------------------------------------------+
|                                  PROXY SERVER / BACKEND                                |
|                                                                                        |
|      +--------------------------+                      +-------------------------+     |
|      |  Uncensored LLM Route    |                      |      TTS Generator      |     |
|      | (OpenRouter / Local LLM) |                      |  (Kokoro WebGPU / Fish) |     |
|      +--------------------------+                      +-------------------------+     |
+----------------------------------------------------------------------------------------+


2. Core Subsystems

To build the application, Jules must implement these five interdependent subsystems:

Subsystem A: 3D Render Engine (Three.js & Pixiv VRM)

Rather than writing an engine from scratch, the project uses Three.js along with Pixiv's official @pixiv/three-vrm plugin. VRM is the industry standard for 3D anime avatars; it includes built-in metadata for bones, facial blendshapes, eye-gaze tracking, and customizable cartoon shading (MToon).

Pipeline: Setup a canvas, a WebGLRenderer, PerspectiveCamera, OrbitControls (for mouse navigation), and a basic scene with Ambient, Directional (Key), and Rim lights.

Asset Loading: Initialize GLTFLoader and register VRMLoaderPlugin. Load .vrm assets dynamically.

Shader Execution: Ensure compatibility with @pixiv/three-vrm's MToonMaterial. It requires correct color management (renderer.outputColorSpace = THREE.SRGBColorSpace).

Performance Optimization: Run vrm.scene.traverse to combine meshes where possible and reduce draw calls.

Subsystem B: Procedural Animation & State Machine

The companion should never sit completely still. It needs an animation manager to play skeletal animations (via Mixamo FBX converted to GLTF) and blend them smoothly.

Animation Sequencer: Implement a skeletal crossfade controller. Transitioning from an idle state to a custom state (e.g., waving or excited) must use spherical linear interpolation (slerp) over a user-defined blend time ($t_{\text{blend}} \approx 0.35\text{s}$) to avoid jarring visual jumps.

Procedural Physics: Enable springbone simulations via vrm.springBoneManager.update(deltaTime). This drives responsive, physical swaying of hair, skirts, accessories, and chests during movement.

Eye Gaze and Look-At Tracking: Map mouse/touch pointer screen coordinates to three-dimensional coordinates in real time. Feed this target vector into vrm.lookAt.target to make the companion follow the cursor with its eyes and head. Use a dampening algorithm to prevent unnaturally fast neck snaps:


$$\theta_{\text{clamped}} = \max(-\theta_{\text{max}}, \min(\theta_{\text{max}}, \theta))$$

Subsystem C: Audio-Driven Lip-Sync Engine

True immersion requires the avatar's lips to move in synchronization with the spoken text. Jules must build a fast, real-time Web Audio API pipeline.

Option 1: Frequency Analysis (Dynamic FFT - Lightweight/Universal)

Connect the audio output node from the TTS HTMLAudioElement to an AnalyserNode using the Web Audio API.

Set the Fast Fourier Transform (FFT) size to $512$ or $1024$.

In the frame update loop, sample the frequency domain data via getByteFrequencyData().

Extract three targeted frequency bands representing vowel structures:

Low Frequencies (Bass, ~100Hz - 250Hz): Map to jaw open / Vowel_A (vrm.expressionManager.setValue('aa', value)).

Mid Frequencies (~250Hz - 1000Hz): Map to mouth widening / Vowel_I (vrm.expressionManager.setValue('ih', value)).

High Frequencies (~1000Hz - 4000Hz): Map to lip rounding / Vowel_U (vrm.expressionManager.setValue('ou', value)).

Option 2: Time-Stamped Phoneme Viseme Mapping (High Accuracy)

If using advanced TTS engines (like ElevenLabs or Fish Audio) that return precise word or phoneme-level timestamps:

Create a local mapping dictionary matching phonetic notation (e.g., ARPAbet or IPA phonemes) to standard VRM expressions: PresetName.Aa, PresetName.Ee, PresetName.Ih, PresetName.Oh, PresetName.Uu.

Drive morph targets sequentially using an animation clock synchronized with audio playback.

Subsystem D: Uncensored LLM Backend Router

To ensure unrestricted interactions, the backend must interface with providers that host uncensored open-weight models (e.g., Midnight-Rose, Mythalion, Llama-3-8B-Instruct-Abliterated).

Provider Route: Connect to OpenRouter (https://openrouter.ai/api/v1) using an API key hidden in server environment variables.

Dynamic Emotional Parsing: To automate avatar physical behaviors, instruct the LLM to output a dual-payload format (JSON) or use structured outputs. Example:

{
  "facialExpression": "excited", 
  "bodyAnimation": "wave", 
  "text": "Hey there! I've been waiting for you all day."
}


The front-end intercepts this JSON. It immediately sets setAnimation("wave"), updates the facial blendshapes to excited, and routes the text string directly into the TTS engine.

Subsystem E: Local Storage Persistence

Keep server database costs at $0 and protect user privacy by running local storage structures:

IndexDB (via localForage or Dexie.js): Used to store loaded custom .vrm binary assets locally so the user doesn't need to re-upload their models on page refresh.

LocalStorage: Stores user settings, active API keys, selected backgrounds, sound volumes, and encrypted historical dialogue context.

3. Recommended Submodules and References

Instruct Jules to pull down, submodule, or strictly reference the following repositories:

1. Core 3D Engine Extensions

Repository: https://github.com/pixiv/three-vrm

Integration Method: Install via npm (@pixiv/three-vrm).

Why: This is the absolute core standard library required to display, texture, rig, and animate VRM avatars on the web.

2. Complete Svelte/Three Architecture Blueprint

Repository: https://github.com/xsploit/webwaifu3

Integration Method: Add as a git submodule or clone to a parallel development directory for reverse-engineering.

Why: WebWaifu 3 is a fully modern, browser-based AI companion written with SvelteKit 2, Vite, and Three.js. It features direct implementation of VRM loaders, animation playlists with crossfading, adjustable lighting (key/fill/rim), Web Audio lip-sync driven by HTMLAudioElement, and OpenRouter API integration. It serves as the ultimate template.

3. Viseme/Speech Tracking Class

Repository: https://github.com/met4citizen/talkinghead

Integration Method: Use as a code reference for procedural face and head generation.

Why: It implements real-time mouth movement and speech tracking utilizing standard visemes, along with automated natural idling (blinking, eye micro-movement, slight head swaying).

4. Jules Step-by-Step Implementation Instructions

Have your development agent follow this sequential deployment plan to avoid integration debt:

+-----------------------------------------------------------------------------------------+
|                                    IMPLEMENTATION STEPS                                 |
|                                                                                         |
|  Step 1: Barebones Viewport  --->  Step 2: Skeletal Loading  --->  Step 3: Lip-Sync      |
|  (Three.js, basic VRM)             (Mixamo animations, slerp)      (Web Audio, Analyser) |
|                                                                                          |
|                                                                            v            |
|                                                                                         |
|  Step 6: UI & Polish         <---  Step 5: LLM API Proxy    <---  Step 4: TTS Integration |
|  (MToon, responsive styling)       (OpenRouter, secure CORS)       (Speech synthesis)    |
+-----------------------------------------------------------------------------------------+


Step 1: Create the Barebones Viewport (Days 1–2)

Initialize a basic Node/Vite web server.

Setup Three.js. Render a skybox, a flat ground grid, a basic directional light, and OrbitControls.

Import GLTFLoader and @pixiv/three-vrm. Load a sample .vrm character from a public path.

Bind a canvas resize handler to keep aspect ratios crisp across dynamic mobile screen dimensions.

Step 2: Implement Skeletal Animations & Transitions (Days 3–4)

Extract animations from standard Mixamo-rigged human FBX/GLB files.

Initialize an AnimationMixer. Bind animations to the loaded VRM skeletal bone mappings.

Implement a script that triggers crossfades between idle, talking, and excited. Verify that bones interpolate smoothly without twisting or breaking.

Build the look-at mouse handler that maps pointing coordinates directly to the avatar's eye target with smooth interpolation.

Step 3: Implement Web Audio Lip-Sync (Days 5–6)

Build a helper class called LipSyncAnalyser.

Connect a test .mp3 audio source element to an AudioContext and AnalyserNode.

Write a requestAnimationFrame loop that polls frequencies. Convert frequency bands into target floats ranging from 0.0 to 1.0.

Bind these values to the VRM instance's expression presets:

vrm.expressionManager.setValue('aa', vocalValueA);
vrm.expressionManager.setValue('oh', vocalValueO);


Step 4: TTS Engine Integration (Days 7–8)

Set up a TTS system. (For free, simple implementations, use the browser's native SpeechSynthesis API. For premium, voice-matched generation, route to a third-party API like ElevenLabs or Kokoro WebGPU/WASM).

Ensure the generated voice output feeds directly into the browser's AudioContext pipeline built in Step 3.

Step 5: Secure LLM API Proxy & Emotional Router (Days 9–10)

Build a simple backend express endpoint (/api/chat).

Implement CORS protection. Connect the backend to the OpenRouter completion endpoint with your choice of uncensored roleplay models.

Build system prompts defining the AI's exact character personality cards.

Write a client-side parser to handle the incoming streaming tokens. Extract JSON-embedded triggers like {"animation": "blush"} and forward them immediately to the companion's animation state machine.

Step 6: Visual Shading, Post-Processing, & Deployment (Days 11–12)

Enable anti-aliasing (FXAA/SMAA) and bloom. Turn on Three's shadow mapping.

Adjust MToon outline widths to make the anime silhouette pop.

Deploy the application to a cloud host (Vercel, Netlify, or your own VPS).
