# CHANGELOG

## [0.16.0] - Data Validation & Backend Resilience
### Added
- Created `test_validation.js` to assert backend API behavior under edge-case payloads (missing fields, wrong types, unknown schema keys).
- Hardened all Express API routes (`/api/auth/login`, `/api/chat`, `/api/tts`, `/api/settings`) with strict data validation to prevent 500 errors and gracefully return 400 Bad Request.
- Updated `package.json` to run all validation test suites automatically on `npm test`.

## [0.15.1] - Auth Overlay, Environments, & Interruptibility
### Added
- Phase 22: Basic Frontend Authentication Overlay enforcing usernames.
- Phase 22: Express backend JWT assignment (`/api/auth/login`) and automated rotation (`/api/auth/refresh`).
- Phase 23: `StorageService.js` proxying with `fetchWithRefresh` to auto-handle 401s.
- Phase 24: Dynamic 3D Environments via UI toggle, with backend DB persistence (`environmentFile`).
- Phase 25: ElevenLabs TTS interruptibility via `AbortController` and audio queue resets to prevent overlap.

## [0.10.1] - StorageService Resilience
- Refactored `StorageService.js` to utilize dynamic environment variables (`VITE_BACKEND_URL`) for API routing.
- Enhanced frontend network resilience by implementing explicit HTTP response validation (`response.ok`) and robust error logging for asynchronous database operations.

## [0.10.0] - Multi-User Backend Persistence (SQLite)
- Implemented Phases 18-21. Expanded the single-user local storage system into a relational, multi-user backend database.
- Initialized Prisma ORM and SQLite, creating `User` and `UserSettings` models with foreign-key relations.
- Created `StorageService.js` on the frontend, abstracting data reads/writes asynchronously through `/api/settings` REST endpoints using simulated user sessions.

## [0.9.2] - Visual Particle Effects
- Implemented Phase 17. Integrated `@react-three/drei`'s `<Sparkles>` component to allow the AI to spawn visual particle effects.
- The AI can now emit `[effect:sparkle]` and `[effect:none]` tags mid-sentence to dynamically toggle particles within the 3D scene.

## [0.9.1] - Interactive Environment Lighting Triggers
- Implemented Phase 16. Enabled the AI to dynamically command changes to the 3D environment lighting.
- The AI can now emit `[lights:on]` and `[lights:off]` tags mid-sentence to toggle the room's ambient and directional lighting, and swap between 'city' and 'night' environment presets organically.

## [0.9.0] - Context-Aware System Prompting
- Implemented Phase 15. Enhanced the default system prompt to explicitly ground the AI in its virtual environment ("a modern, neon-lit virtual room on a sleek stage").
- This enables the AI to weave its physical 3D surroundings organically into conversational responses.

## [0.8.0] - Interactive Environment Highlighting
- Implemented Phase 14. Bound `onPointerOver` and `onPointerOut` event handlers to the loaded 3D environment meshes.
- Added a dynamic emissive material highlight effect when the user hovers their mouse over background objects.

## [0.7.0] - Dynamic Camera Perspectives
- Implemented Phase 13. Replaced `@react-three/drei`'s standard `OrbitControls` with `CameraControls`.
- Added programmatic camera perspective presets ("Full", "Portrait", "Close") to the dashboard.
- Users can now smoothly transition the viewpoint using UI buttons via `setLookAt` animations.

## [0.6.0] - Dashboard UI Redesign
- Implemented Phase 12. Completely overhauled the settings dashboard layout in `App.jsx`.
- Grouped configurations into intuitive categories (AI Persona, Voice & Audio, Integrations, Debug & Controls) using custom CSS blocks.
- Added comprehensive tooltips (`?`) to all previously undocumented settings including TTS sliders and the Clear Chat History button.

## [0.5.0] - Interactive Mouse Tracking
- Implemented Phase 11. Enabled dynamic mouse tracking using `vrm.lookAt`. The character's head and eyes will now naturally follow the user's cursor across the viewport.

## [0.4.0] - Conversational Memory & Persona Enhancements
- Implemented Phase 10. Added a sliding window mechanism to the backend chat payload, capping memory at the last 20 messages to prevent token exhaustion and API bloat.
- Expanded the default Character System Prompt to establish a stronger, more engaging AI companion persona with explicit directives for brevity and physical expressiveness.

## [0.3.0] - Voice Input / Speech Recognition
- Implemented Phase 9 by adding browser-native `SpeechRecognition` API support.
- Added a toggleable microphone button with CSS animations to the chat UI.
- Voice transcriptions are now automatically appended to the text input field in real-time.

## [0.2.0] - Advanced Viseme Lip-Syncing
- Implemented Phase 7 by adding an ElevenLabs TTS integration and real-time FFT audio analysis.
- Created `/api/tts` endpoint in the Express server to handle ElevenLabs streaming securely.
- Developed `LipSyncAnalyser` class on the frontend to process HTMLAudioElement streams and convert frequencies to structural visemes (a, i, u).
- Mapped generated visemes to VRM expression blendshapes (`aa`, `ih`, `ou`) in `Character.jsx` for accurate procedural mouth movements during speech.
- Setup fallback behavior to native `SpeechSynthesis` and mathematical lip-sync when no ElevenLabs API key is provided.

## [0.1.0] - Configuration Dashboard UI
- Added a toggleable configuration dashboard to the UI using a glassmorphism side-panel design with CSS tooltips.
- Linked user settings for the OpenRouter API Key, Character System Prompt, and TTS Voice/Pitch/Rate directly to the application state and localStorage.
- Refactored the backend to dynamically instantiate the AI API client using the API key provided dynamically from the frontend dashboard payload.

## [0.0.8] - Codebase Polish & Linting
- Cleaned up the codebase by removing unused variables, unused imports, and resolving all React hooks `exhaustive-deps` warnings. Project now passes static analysis with zero errors.

## [0.0.7] - 3D Environment Loading
- Added functionality to load `.glb` environment models (`room.glb`) as background scenes instead of static primitive meshes.
- Integrated the new environment asset with IndexedDB caching logic (`CacheUtils.js`) for rapid reloading.

## [0.0.6] - UI/UX & MToon Shading Enhancements
- Improved overall UI/UX by adding glassmorphism elements, CSS gradients, scrollbar styling, and button hover states to the chat interface.
- Enhanced MToon character shading with `@react-three/postprocessing` Bloom effect and adjusted directional lighting.

## [0.0.5] - UI Tag Stripping
- Stripped bracket tags ([animation:wave], etc.) from the chat UI so they are processed silently in the background.


## [0.0.4] - Asset Caching
- Implemented IndexedDB caching for large 3D assets (VRM models, FBX animations) to eliminate redundant network fetching and improve application reload speeds.

## [0.0.3] - Environment Upgrade
- Overhauled 3D environment with @react-three/drei realistic lighting, shadows, skybox, and stage platform.

## [0.0.2] - Progressive streaming & animations
- Implemented streaming text chunking by sentence boundary to trigger TTS dynamically.
- Implemented regex tag extraction for real-time `[animation:value]` and `[emotion:value]`.
- Added `Sitting` and `Thinking` animations.
- Added Express integration tests.
## [0.0.1] - Initial setup
- Generated core documentation files.
- Basic 3D VRM rendering and express proxy skeleton.
