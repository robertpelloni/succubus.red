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
- **Environment Lighting Triggers**: Implemented Phase 16. Added `lightsOn` state to `App.jsx` and updated the tag parser regex to handle `[lights:on]` and `[lights:off]`. The AI is now instructed via system prompt that it can control the room lights using these tags. Passed this state down to `Environment.jsx` to dynamically swap the DreiEnvironment preset between 'city' and 'night' and conditionally render the Sky component. The main ambient, directional, and point lights in the scene are also dimmed when off.
- **Multi-User Backend Persistence**: Implemented Phases 18, 19, 20, & 21. Abstracted local storage into `StorageService.js`. Set up a relational Prisma SQLite database in the backend (`User` and `UserSettings` schema) and exposed `/api/settings` REST endpoints capable of partitioning data by `userId`. `App.jsx` now mounts by fetching state asynchronously and uses a debounced effect to synchronize user config and chat memory back to the API.
- **Particle Effects**: Implemented Phase 17. Integrated `@react-three/drei`'s `<Sparkles>` component, parsing `[effect:sparkle]` and `[effect:none]` tags to allow the AI to spawn/despawn visual particles mid-sentence.
- Ran all required Playwright verifications to ensure the character renders correctly and chat UI displays appropriately.

## Known Issues / Next Steps


## Structural Notes
- Mixamo -> VRM retargeting logic is encapsulated entirely inside `client/src/MixamoVRMRetargeting.js`.
- The main entry point for the 3D canvas is `client/src/App.jsx`, which manages all state.
- `client/src/Character.jsx` handles Three.js / VRM rendering and animation mixing.

## Git State
Code has been tested, verified via Playwright, and is ready for submission.
### Phase 22-25 (v0.15.1) Auth, Environments, and TTS refinement
- Implemented basic JWT authentication layer with auto-refresh mechanism.
- Added dynamic 3D environment switching and persisted the config to Prisma DB.
- Added AbortControllers to prevent streaming audio/TTS overlapping during interruptions.
### Phase 26 (v0.16.0) Data Validation & Backend Resilience
- Added a new `test_validation.js` suite in `server/` to deliberately test edge cases and invalid payloads against the Express REST APIs.
- Updated the Express routes in `server/index.js` to strictly validate `typeof` strings, `Array.isArray`, and whitelist `req.body` keys before interacting with Prisma or OpenAI, preventing 500 crashes.

### Session Conclusion
- All requested work completed successfully. Final sign off.
