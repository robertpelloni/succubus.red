# Session Handoff

## Completed Work
- Built foundational 3D architecture using Vite, React Three Fiber, and `@pixiv/three-vrm`.
- Implemented an Express backend proxy for routing chat to OpenRouter.
- Connected the frontend UI to interact with the LLM.
- **Fixed the major 3D orientation bug**: The character was rendering upside down and facing backwards. This was fixed by adapting the official `loadMixamoAnimation.js` retargeting script to properly lock horizontal root translations (`dx=0, dz=0`) and ensuring the `vrm.scene.rotation.y` is left at `0` for VRM 1.0 specifications.
- **Enabled lip sync and facial interactivity**: Updated `Character.jsx` to receive `emotion` and `isSpeaking` props from the LLM JSON payload. Integrated procedural mouth movement while speaking and mapped LLM string emotions directly to VRM `expressionManager` blendshapes (happy, angry, sad, relaxed, surprised).
- **Refactored LLM Streaming**: Changed the system prompt to output plain text with embedded tags (e.g. `[animation:wave]`). Updated `App.jsx` to parse these tags incrementally and speak text chunk-by-chunk at sentence boundaries, resolving the long buffering delay.
- **Added New Animations**: Added `Sitting.fbx` and `Thinking.fbx` Mixamo animations.
- **Environment Upgrade**: Implemented Phase 6 by replacing the primitive environment meshes with a dynamic `.glb` environment loading system in `Environment.jsx`. The room asset is downloaded, parsed, and configured to receive shadows automatically.
- **Asset Caching**: Implemented IndexedDB caching in `client/src/CacheUtils.js` to store `.vrm` and `.fbx` files, preventing re-downloading on page refresh. Removed `<StrictMode>` from `main.jsx` to fix double-load issues.
- **UI Refinement**: Added regex tag stripping in `App.jsx` so `[animation:wave]` tags are hidden from the chat UI while still triggering animations.
- **Backend Tests**: Added integration tests using Mocha and Supertest.
- **UI/UX Polish**: Implemented a glassmorphism aesthetic for the chat UI, complete with rounded message bubbles, drop shadows, gradient backgrounds, and button hover states.
- **MToon Post-Processing**: Added a `@react-three/postprocessing` Bloom effect and adjusted lighting to provide a stylized, glowing anime look.
- **Codebase Polish**: Cleaned up React hook dependencies, removed unused imports, and achieved zero linting errors/warnings across the project.
- **Dashboard UI**: Designed and built a toggleable configuration panel (`App.jsx`) featuring glassmorphism styling and CSS tooltips to manage API keys, system prompts, TTS settings, and manual animations, backed entirely by `localStorage`.
- **Backend Dynamic Instantiation**: Refactored `server/index.js` to instantiate the OpenAI client on every request, allowing users to pass in their API keys dynamically from the new dashboard.
- **Advanced Viseme Lip-Syncing**: Implemented Phase 7. Built an `/api/tts` ElevenLabs integration in `server/index.js`. Built a `LipSyncAnalyser.js` utility that pipes the `HTMLAudioElement` into a Web Audio API `AnalyserNode`, extracts frequency data, maps them to viseme weights (a, i, u), and dynamically applies these to the VRM blendshapes (`aa`, `ih`, `ou`) in `Character.jsx`.
- **Speech Recognition Integration**: Implemented Phase 9 by adding a voice-to-text microphone button in the chat UI. Wired `window.SpeechRecognition` to the application state in `App.jsx`, allowing users to talk directly to the AI, appending the transcription to their text input field dynamically.
- **Conversational Memory & Persona**: Implemented Phase 10. Added a sliding window in `App.jsx` to restrict the API payload to the last 20 messages, preventing token limit exhaustion. Updated the default system prompt for a stronger, more engaging AI companion persona.
- **Interactive Mouse Tracking**: Implemented Phase 11. Attached a dynamic `THREE.Object3D` target to `vrm.lookAt.target` in `Character.jsx`. Mapped normalized mouse coordinates to world space in the `useFrame` hook, allowing the character's head and eyes to seamlessly follow the user's cursor.
- **Dashboard UI Redesign**: Implemented Phase 12. Reorganized the floating settings panel into logical, CSS-styled categories. Added explicit tooltips to all fields to ensure robust user guidance across the entire configuration scope.
- **Dynamic Camera Perspectives**: Implemented Phase 13. Replaced `OrbitControls` with `@react-three/drei`'s `CameraControls`. Added UI presets (Full, Portrait, Close) to the dashboard that trigger smooth, programmatic `setLookAt` cinematic transitions.
- **Interactive Environment**: Implemented Phase 14. Integrated pointer event handlers to the background GLTF scene (`room.glb`). Enabled an emissive material highlight that triggers when the user hovers over environment meshes, expanding immersion.
- **Context-Aware Prompting**: Implemented Phase 15. Injected environmental awareness (room/stage details) into the default AI system prompt, allowing for deeper roleplay and immersion where the AI acknowledges its virtual surroundings.
- **AI Environment Triggers**: Implemented Phase 16. Added parsing for `[lights:on]` and `[lights:off]` tags to the LLM streaming parser. When the AI uses these tags, it dynamically toggles the intensities of the 3D scene's lights.
- **AI Particle Effect Triggers**: Implemented Phase 17. Integrated `@react-three/drei`'s `<Sparkles>` component. The AI can now emit `[effect:sparkle]` and `[effect:none]` tags to spawn and despawn particle effects in the 3D scene.
- **Audio and Network Interruption**: Implemented Phase 18. Added `AbortController` logic to the main fetch request in `App.jsx` and created a `stopSpeakingAndAbort()` helper. This guarantees that if a user sends a new message or clears the chat, the active LLM stream cancels, the audio queue is emptied, and the currently playing TTS audio halts immediately.
- **Native TTS Queue Fix**: Implemented Phase 19. Corrected a state race condition where the native browser `SpeechSynthesisUtterance.onend` handler would disable the `isSpeaking` boolean prematurely, freezing the character's face. The app now waits for the entire `speechSynthesis` queue to clear.
- **Persistence Layer Abstraction**: Implemented Phase 20. Replaced all raw `localStorage` calls in `App.jsx` with a new `StorageService` utility. This sets the foundation for seamlessly swapping browser cache with cloud-based persistent user profiles.
- **Backend Database Initialization**: Implemented Phase 21. Installed Prisma and initialized a local SQLite database (`dev.db`). Defined a `UserSettings` schema mirroring the frontend's `StorageService` properties, preparing the project for cloud synchronization and multi-user support.
- Ran all required Playwright verifications to ensure the character renders correctly and chat UI displays appropriately.

## Known Issues / Next Steps
- Implement REST API endpoints in `server/index.js` to handle saving and fetching data from the Prisma `UserSettings` model, and link them to `client/src/StorageService.js`.

## Structural Notes
- Mixamo -> VRM retargeting logic is encapsulated entirely inside `client/src/MixamoVRMRetargeting.js`.
- The main entry point for the 3D canvas is `client/src/App.jsx`, which manages all state.
- `client/src/Character.jsx` handles Three.js / VRM rendering and animation mixing.

## Git State
Code has been tested, verified via Playwright, and is ready for submission.
