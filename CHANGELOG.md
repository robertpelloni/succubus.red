# CHANGELOG

## [0.52.0] - Real-time WebGL Engine Performance & Frame Rate Monitor
### Added
- Implemented real-time rolling FPS frame rate calculation in `Character.jsx` using `useFrame`.
- Added toggleable in-viewport performance HUD badge (`.viewport-fps-badge`) with color-coded status indicator and WebGL engine details.
- Added "Performance HUD Overlay" toggle button under 3D Stage & Environment in Companion Studio.

## [0.51.0] - Custom Camera FOV Zoom & Viewport Perspective Tuning
### Added
- Added dynamic Camera Field of View slider (`cameraFov`, 25° telephoto to 75° wide angle) under 3D Stage & Environment in Companion Studio, dynamically updating Three.js canvas projection.

## [0.50.0] - Animation Crossfade Speed Slider & Drag Rejection Chimes
### Added
- Added custom animation crossfade speed duration slider (`crossfadeDuration`, 0.1s to 1.0s) in Companion Studio under "AI Persona & Interaction" and wired dynamically into `Character.jsx`.
- Added distinct low-frequency audio rejection feedback (`playInteractionChime(220, 0.25)`) when unsupported file formats are dropped onto the 3D viewport.

## [0.49.0] - Theatrical Drag Lighting Pulse & Dual-Ring Stage Reticle
### Added
- Upgraded the 3D stage landing zone to a dual-ring concentric holographic reticle (cyan core and magenta accent ring) in `App.jsx`.
- Dynamically pulsed directional key light intensity (2.8x) and adjusted atmosphere tint during active viewport drag events to create theatrical model materialization anticipation.

## [0.48.0] - Holographic Landing Zone & Multi-File Drag Prioritization
### Added
- Rendered 3D holographic landing zone reticle on the stage floor (`y = 0.02`) during file drag events in `App.jsx`, providing spatial guidance for model placement.
- Implemented multi-file drag-and-drop prioritization in `App.jsx`, resolving avatar models first (`.vrm`), environment scenes second (`.glb`/`.gltf`), and images third (`image/*`).

## [0.47.0] - VRM Avatar Metadata Inspector Modal
### Added
- Added interactive VRM Avatar Inspector modal (`.avatar-inspector-modal`) in `App.jsx` and `App.css`, detailing filename, binary filesize, header type, storage cache, active spring bone physics, and retargeting engine.
- Added inspect button (`Inspect 🔍`) to the active model badge in Companion Studio under 3D Avatar Model.

## [0.46.0] - Spatial 3D Positional Audio for Environment Interactions
### Added
- Implemented real-time spatial 3D audio hovering chimes in `Environment.jsx` using Web Audio `StereoPannerNode`, mapping 3D mesh hit points along the X-axis (-1.0 to +1.0) into binaural stereo sound.
- Bound to the global `soundEffectsEnabled` toggle in `App.jsx`.

## [0.45.0] - Real-time Asset Ingestion Spinner Overlay
### Added
- Real-time asset ingestion state and animated progress indicator card (`.asset-ingestion-spinner`) in `App.jsx` and `App.css` during asynchronous VRM and GLB model parsing and IndexedDB caching.

## [0.44.0] - Contextual Drop Detection & Drag Cues
### Added
- Dynamic drag detection in `App.jsx`: automatically distinguishes between image file drops (updating HUD to "Drop Image for AI Vision" with camera icon) and 3D asset drops (updating HUD to "Materialize Avatar or Stage" with mask icon).

## [0.43.0] - Smooth Avatar Transition & Materialization Scale Dissolve
### Added
- Implemented smooth dynamic materialization transition in `Character.jsx`: smoothly interpolates avatar scale from 0 to 1 over 400ms on initial load, model switching, and drag-and-drop loading, eliminating visual popping and mesh snapping.

## [0.42.0] - UI Sound Effects & Procedural Chimes
### Added
- Implemented synthetic Web Audio interactive feedback chimes (`playInteractionChime`) in `App.jsx` triggered on avatar touches, asset drops, and action buttons.
- Added UI interaction sound toggle button ("Sound On" / "Muted") under Voice & Audio Studio in Companion Studio with full tooltip guidance.

## [0.41.0] - Atmospheric Procedural Soundscapes
### Added
- Added procedural Web Audio API atmospheric background soundscape synthesizer in `App.jsx` with selectable modes: "None (Silent)", "Cyber Drone Atmosphere", and "Warm Ambient Rain".
- Added dynamic soundscape volume gain slider and preset dropdown in Companion Studio under Voice & Audio Studio with explanatory tooltips.

## [0.40.0] - Automatic VRM Ground Alignment & Scale Normalization
### Added
- Automatic bounding box computation (`THREE.Box3().setFromObject`) on newly loaded VRM models in `Character.jsx`.
- Automatic stage floor contact alignment (`vrm.scene.position.y -= bbox.min.y`) ensuring avatars' feet rest flush on the stage floor regardless of custom model origins.
- Outlier scale normalization automatically sizing abnormal models to standard companion height (~1.6m).

## [0.39.0] - Visual Drop Flash Ripple & Environment Camera Showcase
### Added
- Added fullscreen visual ripple flash overlay (`.drop-success-flash`) triggered upon successful drop and validation of `.vrm`, `.glb`, or image files in `App.jsx` and `App.css`.
- Added smooth cinematic camera showcase transition (`setLookAt(1.2, 1.8, 3.2, 0, 1.0, 0, true)`) when a new 3D environment model is dropped onto the viewport.

## [0.38.1] - UI Category Harmonization & Component Hygiene
### Fixed
- Relocated lighting and postprocessing controls (`Bloom Glow Intensity`, `Ambient Light Brightness`, `Key Light Color`, `Shadow Quality`) from Account & Session into 3D Stage & Environment in `App.jsx`.
- Cleaned up React hook declaration order in `Character.jsx` by elevating `isHovered` state to the top of the component.
- Removed stray testing script `client/screenshot.cjs` and added `*.db*` to `.gitignore`.

## [0.38.0] - Celebratory Avatar Materialization Stage Burst
### Added
- Automated celebratory avatar materialization event in `App.jsx`: triggering wave animation, joyful emotion blendshape, and temporary particle sparkle burst (`<Sparkles>`) when a new VRM model is dropped onto the viewport.
- Spoken companion welcoming phrase celebrating new avatar appearances.

## [0.37.0] - Multimodal Drag-and-Drop Auto-Prompt & Attachment Badges
### Added
- Automated prompt population ("What do you see in this picture?") upon dropping or uploading images in `App.jsx`, enabling instant 1-click multimodal submission.
- Added structured image metadata badges (format type and filesize) and polished thumbnail preview bar in `App.css`.

## [0.36.0] - Avatar Hover Affordance & Attentive Gaze Tracking
### Added
- Added `onPointerOver` and `onPointerOut` event handlers to the 3D VRM avatar in `Character.jsx` to dynamically update document cursor style to `pointer`.
- Amplified look-at mouse tracking responsiveness and brought gaze depth closer when hovering over the companion to create an attentive reaction.

## [0.35.0] - Interactive Viewport Mic HUD Click-to-Test
### Added
- Added interactive click-to-test toggle directly on the in-viewport microphone HUD badge (`.viewport-mic-badge`) in `App.jsx`.
- Enhanced badge hover affordance with smooth translate, glowing borders, and explanatory tooltips in `App.css`.

## [0.34.0] - Interactive Avatar Pointer Down Touch Reactions
### Added
- Attached pointer reaction event listeners to the 3D VRM avatar in `Character.jsx` via `onPointerDown`.
- Implemented spontaneous expressive reaction animations and facial blendshapes (`joy`, `fun`, `surprised`, `wave`) when tapping or clicking on the avatar.
- Displayed real-time user notification toasts confirming touch interactions in the viewport.

## [0.33.0] - In-Viewport Audio Activity HUD & Micro-Waveforms
### Added
- Integrated floating viewport audio HUD badge (`.viewport-mic-badge`) in `App.jsx` showing real-time microphone gain/activity status and dynamic wave bars.
- Connected Web Audio API volume peaks to floating HUD to allow voice monitoring without opening Companion Studio.
- Styled HUD badge with frosted glassmorphism and cyan pulse accents in `App.css`.

## [0.32.0] - Binary VRM Validation & Drop Overlay Visuals
### Added
- Implemented `validateVRMBinary` in `CacheUtils.js` to inspect glTF/VRM magic binary headers (`0x46546C67` / `glTF`) prior to IndexedDB writes.
- Added pre-upload and drag-and-drop binary validation in `App.jsx`, preventing corrupt or masquerading files from entering IndexedDB storage.
- Enhanced viewport `.drop-overlay-box` with pulsing dual-tone cyan/magenta border animation in `App.css`.

## [0.31.0] - VRM Drag-and-Drop & IndexedDB Metadata Persistence
### Added
- Enhanced `CacheUtils.js` with `saveCustomAvatar` and `getCustomAvatarMeta` to persist filename, byte size, and timestamp in IndexedDB alongside the avatar binary blob.
- Added dynamic custom avatar metadata badge in Companion Studio displaying the loaded model filename, formatted file size (MB), and a quick removal button.
- Updated viewport drag-and-drop notifications and upload flows to provide immediate model name feedback upon caching.

## [0.30.0] - Cinematic & Isometric Camera Perspectives
### Added
- Added Cinematic Low and Isometric Top perspective presets to `Companion Studio` under 3D Stage & Environment.
- Added Reset View button to restore baseline camera framing smoothly using `CameraControls.reset`.

## [0.29.0] - Interactive CLI Daemon Controller & Graceful Signal Handling
### Added
- Added interactive persistent command menu loop in `tray_app.py` supporting `menu` and `interactive` subcommands.
- Added POSIX signal handlers (`SIGINT`, `SIGTERM`) to ensure clean server process termination upon interruption.

## [0.28.0] - Viewport Drag-and-Drop 3D Environment Support
### Added
- Direct drag-and-drop ingestion of 3D environment models (`.glb` and `.gltf`) directly onto the 3D viewport canvas.
- Updated `Environment.jsx` to dynamically detect and mount Blob and Data URLs alongside standard preset paths.
- Updated HUD overlay copy and toast feedback for seamless environment switching.

## [0.27.0] - Healthcheck Diagnostic API & CLI Health Command
### Added
- Added `/api/health` diagnostic endpoint in `server/index.js` reporting uptime, database status, memory usage, and health state.
- Added unit tests in `server/test.js` validating `/api/health` response schema.
- Added `health` command in `tray_app.py` for comprehensive dual-service HTTP reachability and database connection verification.

## [0.26.0] - WebGL Memory Disposal on Avatar Switching
### Added
- Explicit WebGL memory disposal in `Character.jsx` unmount/update cleanup, calling `VRMUtils.deepDispose(scene)` and `mixer.stopAllAction()` to purge textures, geometries, and materials during avatar model switching.

## [0.25.0] - Key Light Color & Shadow Map Resolution Controls
### Added
- Key Light Color picker and Shadow Quality dropdown (Low 512, Medium 1024, High 2048) under 3D Stage & Environment in Companion Studio.
- Dynamic binding to `<directionalLight color={...} shadow-mapSize={[...]} />` in `client/src/App.jsx`.
- JSON studio backup integration for directional light color and shadow resolution.

## [0.24.0] - Postprocessing Bloom & Ambient Lighting Controls
### Added
- Interactive sliders for Bloom Glow Intensity (0.0 to 3.0) and Ambient Light Brightness (0.2x to 2.0x) under 3D Stage & Environment in Companion Studio.
- Dynamic wiring in `client/src/App.jsx` to `<Bloom intensity={...} />` and `<ambientLight intensity={...} />`.
- Full state persistence and integration into JSON backup export and import routines.

## [0.23.0] - Procedural Natural Eye Blinking
### Added
- Procedural natural eye blinking in `Character.jsx` using `@pixiv/three-vrm` preset expression `blink`.
- Implemented randomized blink interval scheduling (2.5 to 5.5 seconds) with half-sine smooth open/close curves (~180ms).

## [0.22.0] - Facial Emotion Blendshape Easing & Transition Smoothing
### Added
- Smooth procedural exponential easing for VRM facial expression blendshapes in `Character.jsx` using `THREE.MathUtils.lerp`.
- Multi-emotion blendshape target tracking preventing snapping or visual jumping between emotional states.

## [0.21.0] - VRM Spring Bone Physics & Backup Export/Import
### Added
- Dynamic VRM Spring Bone secondary animation physics controls (stiffness and damping/drag force sliders) directly in `Companion Studio` under 3D Avatar Model.
- Dynamic spring physics joint traversal in `Character.jsx` updating `vrm.springBoneManager.joints` settings in real-time.
- Settings and chat transcript JSON backup export and import features under Account & Session in `Companion Studio`, with validation and toast notifications.

## [0.20.0] - Viewport Drag-and-Drop, Mic Audio Tester & Script Consolidation
### Added
- Implemented full viewport drag-and-drop listener in `client/src/App.jsx` with an interactive, animated visual HUD overlay.
- Automatically handles `.vrm` files by parsing and saving into IndexedDB (`saveCustomAvatar`) and dynamically hot-reloading the active avatar.
- Automatically handles dropped images (`image/*`, PNG, JPEG, WebP) by converting to Base64 data URLs for immediate multimodal vision chat inquiries.
- Animated non-intrusive toast notification component (`.toast-notification`) delivering real-time user feedback on file processing and actions.
- Added real-time Web Audio API frequency analyser and dynamic VU audio volume level meter in the Voice & Audio Studio category in `Companion Studio`.
- Enhanced Playwright automated verification suite `scripts/verify_all.py` covering microphone testing widget, drag-and-drop overlay HUD, camera presets, and auth workflows.
- Cleaned up duplicated root-level scripts, consolidating into `scripts/archive/` and ensuring `tray_app.py` runs with headless and GUI lifecycle management.

## [0.19.0] - Multimodal Vision & Image Sharing
### Added
- Implemented multimodal vision capabilities in `Companion Studio` and chat interface.
- Added image file attachment button (`📷`) and preview thumbnail with dismiss button (`✕`) in `client/src/App.jsx`.
- Converted user-uploaded images to Base64 data URLs formatted in standard OpenAI multimodal message array structure (`[{ type: 'text', text }, { type: 'image_url', image_url: { url } }]`).
- Integrated dynamic model routing in Express `/api/chat`: automatically switches to `meta-llama/llama-3.2-11b-vision-instruct` whenever images are present, preserving fast roleplay models for standard text.
- Enhanced backend schema validation in `server/index.js` and `server/test_validation.js` to accept structured multimodal message payloads without schema rejections.
- Rendered inline thumbnail preview directly inside chat speech bubbles with responsive max dimensions.
- Updated automated Playwright test suite `scripts/verify_all.py` to assert image file input presence and chat container responsiveness.

## [0.18.0] - Custom VRM Avatar Upload & IndexedDB Storage
### Added
- Added custom VRM avatar upload feature in `Companion Studio` allowing users to upload `.vrm` character files.
- Integrated browser-side IndexedDB persistence for user-uploaded models via `CacheUtils.js` (`saveCustomAvatar`, `getCustomAvatar`, `clearCustomAvatar`).
- Updated `Character.jsx` to dynamically reload avatars when switching between Default and Custom VRM models with proper cleanup and animation retargeting.
- Added visual avatar mode switcher chips and reset buttons with informative tooltips in `App.jsx`.

## [0.17.0] - Dashboard Consolidation & System Tray Control
### Added
- Consolidated and redesigned the settings dashboard in `client/src/App.jsx` into a singular, cohesive Companion Studio panel categorized by value hierarchy:
  - AI Persona & Interaction (System prompt, manual animation chips, manual emotion blendshape triggers).
  - Voice & Audio Studio (TTS provider selection: Native, ElevenLabs, Kokoro WebGPU; Voice selection; Pitch/Rate sliders; Voice sample preview).
  - 3D Stage & Environment (Camera perspective presets, GLB environment switcher, Day/Night lighting toggle, Particle sparkle effects).
  - Integrations & API Config (OpenRouter API Key).
  - Account & Session Management (Current user display, clear chat, user logout/switch).
- Added comprehensive tooltips (`?`) to every configuration item across the entire dashboard.
- Implemented `tray_app.py`, providing graphical system tray capabilities (via `pystray`) and automated daemon/CLI management (`status`, `start`, `stop`, `restart`, `logs`, `open`) with dual-stack IPv4/IPv6 port monitoring and clean server process termination.
- Created root `package.json` to orchestrate scripts across frontend and backend (`npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm run tray`, `npm run verify`).
- Reorganized legacy testing scripts nondestructively into `scripts/archive/` and unified end-to-end verification under `scripts/verify_all.py`.

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
- Implemented Phase 12. Overhauled the settings dashboard layout in `App.jsx`.
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
