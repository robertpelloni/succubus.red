# CHANGELOG

## [0.15.0] - Backend Database Initialization
- Implemented Phase 21. Initialized Prisma and configured a local SQLite database in the backend.
- Generated the `UserSettings` schema to eventually replace frontend-only configuration persistence.

## [0.14.0] - Persistence Layer Abstraction
- Implemented Phase 20. Created a `StorageService` utility to abstract all browser `localStorage` interactions.
- Refactored `App.jsx` to rely exclusively on this service, streamlining the future implementation of cloud database synchronization for user profiles.

## [0.13.0] - Native TTS Queue Fix
- Implemented Phase 19. Fixed a bug where the native browser `SpeechSynthesis` queue would prematurely set `isSpeaking` to false at the end of the very first sentence chunk, breaking the character's facial animations.
- The state now properly checks `window.speechSynthesis.pending` before concluding playback.

## [0.12.0] - Network Request and TTS Interruption
- Implemented Phase 18. Added an `AbortController` mechanism to the LLM fetch requests in `App.jsx`.
- When the user sends a new message or clicks "Clear Chat History", any ongoing LLM streams are now safely aborted.
- Simultaneously, all queued TTS audio chunks and actively playing ElevenLabs/native SpeechSynthesis audio are instantly halted and cleared.

## [0.11.0] - AI Particle Effect Triggers
- Implemented Phase 17. Integrated `@react-three/drei`'s `<Sparkles>` component to handle dynamic particle effects.
- The AI can now emit `[effect:sparkle]` and `[effect:none]` tags to toggle particle rendering within the 3D scene.
- Updated the default system prompt to instruct the AI on utilizing these new visual effect controls.

## [0.10.0] - AI Environment Triggers
- Implemented Phase 16. Added the ability for the AI to dynamically control the 3D scene's lighting.
- The AI can now emit `[lights:on]` and `[lights:off]` tags mid-sentence to toggle the ambient, directional, and point light intensities.
- Updated the default system prompt to instruct the AI on utilizing these new environmental controls.

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
