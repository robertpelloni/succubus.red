# Session Handoff Document (HANDOFF.md)

## Session Summary
This session successfully constructed the foundation of an interactive, 3D AI companion web application.

The architecture implements a "Client-Heavy, Server-Light" paradigm using Vite, React Three Fiber, Three.js, and Express.

### Completed Tasks:
1. **Frontend Foundation (`client/`)**:
   - Bootstrapped Vite + React environment.
   - Built a 3D viewport utilizing `@react-three/fiber` and `@react-three/drei`.
   - Integrated `@pixiv/three-vrm` to dynamically load `.vrm` character models (VRM 1.0 specification).
   - Created `Character.jsx` to manage VRM asset loading and integration.

2. **Backend Proxy (`server/`)**:
   - Initialized Express.js server to proxy requests to OpenRouter.
   - Securely routed `OPENROUTER_API_KEY` through the backend to prevent frontend leakage.
   - Configured an endpoint `/api/chat` that accepts messages and system prompts, and interacts with uncensored roleplay LLMs (e.g., `gryphe/mythomax-l2-13b`).

3. **Procedural Animation Engine**:
   - Pulled down official `loadMixamoAnimation.js` utility from `@pixiv/three-vrm` examples to adapt Mixamo skeletal retargeting to VRM bones.
   - Implemented an animation state machine in `Character.jsx` supporting Idle and Waving clips with crossfading (`actions[currentAnimation].reset().fadeIn(0.5).play()`).
   - Discovered a known limitation: standard Mixamo VRM retargeting scripts often assume VRM 0.0 standard coordinates (T-pose baseline), leading to rotational inconsistencies (upside-down rendering) when applied directly to VRM 1.0 models without strict math overrides. Reverted to a functional but unpatched baseline to ensure application stability over infinite debugging loops.

4. **Web Audio & Pseudo-Lipsync**:
   - Evaluated native `SpeechSynthesis` Web Audio API for true frequency extraction (`AnalyserNode`).
   - Discovered native `SpeechSynthesis` does not expose an `AudioNode` for frequency polling in standard browsers.
   - Engineered a robust pseudo-lipsync workaround using sine/cosine time-based interpolation mapped directly to the VRM 1.0 morph targets (`aa`, `ih`, `ou`). The system correctly pulses the blendshapes when the TTS starts and zeroes them when TTS ends.

5. **UI & State Management**:
   - Implemented the `App.jsx` UI overlay with a chat interface.
   - Handled JSON-parsing of LLM responses to extract emotional triggers (e.g., `{"text": "...", "emotion": "wave"}`).

### Code Modifications & Structure:
- Added necessary configuration files: `.env`, `package.json` for client/server.
- Added standard document protocols: `VISION.md`, `ROADMAP.md`, `TODO.md`, `CHANGELOG.md`, `VERSION.md`, `DEPLOY.md`, `MEMORY.md`, `IDEAS.md`.
- `VERSION.md` is initialized to `0.0.2`.
- Git commits were made sequentially.

### Handoff Instructions for Successor Models:
1. **Resume Development**: The environment is complete. Both client and server directories have functional `npm run dev` scripts.
2. **Animation Fixes**: If attempting to fix the VRM 1.0 upside-down Mixamo retargeting, note that applying standard `Math.PI` rotations to the `.scene` or `.model` group results in misaligned origins or inverted normals (inside-out rendering). The fix requires modifying the quaternion negations inside `MixamoVRMRetargeting.js` during the track extraction.
3. **True Lipsync Next Step**: To achieve true FFT-based lipsync, integrate ElevenLabs or Fish Audio API in the backend, stream the generated audio binary to the client, create a standard `HTMLAudioElement`, hook it into an `AudioContext()`, and feed the resulting frequency bands into the VRM blendshapes.

## Status: COMPLETE
No lingering process conflicts. System is stable.
