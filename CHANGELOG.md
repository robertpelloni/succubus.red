# Changelog

## [0.59.0] - 3D Stage Landing Guidance Beacon & Rising Harmonic Audio Materialization
### Added
- **Vertical 3D Holographic Guidance Beacon Ray**: Extended `HolographicLandingReticle` in `client/src/App.jsx` with an illuminated rotating light pillar beacon cylinder (`cylinderGeometry args={[0.08, 0.45, 4.0, 32, 1, true]}`) descending vertically onto the 3D stage landing zone with zone-responsive color and opacity.
- **Web Audio Rising Harmonic Materialization Chord**: Implemented `playMaterializationChord()` in `client/src/App.jsx` using three-tone ascending chord synthesis (C5 523.25Hz, E5 659.25Hz, G5 783.99Hz) via Web Audio API triangle wave oscillators upon successful asset ingestion.
- **Stage Landing Guidance Beacon Studio Control**: Added "Stage Landing Guidance Beacon" toggle button (`stageBeaconEnabled`) with informative tooltip guidance under 3D Stage & Environment in Companion Studio.
- **Robust Drop Ingestion Diagnostics**: Repaired asset array population in `handleFilesDrop` with explicit asset metadata strings, voice reaction speech feedback, and comprehensive batch toast notifications.

## [0.58.0] - Multi-Asset Drag Batch Ingestion HUD & Viewport Holographic Target Ring Spin
### Added
- Multi-Asset Batch Ingestion support: dragging and dropping multiple assets concurrently processes avatars (`.vrm`), animations (`.fbx`), 3D stage scenes (`.glb`), and vision images without discarding complementary files.
- Dynamic multi-file drag queue badge (`.drop-overlay-batch-badge`) in the HUD overlay showing real-time item count (`📂 Batch Ingest: X Items Detected`).
- `HolographicLandingReticle` component with dynamic counter-rotating rings and accelerated spin speed when hovering directly over the avatar target zone.
- Added "Multi-Asset Batch Ingestion" toggle button in Companion Studio under 3D Stage & Environment with explanatory tooltips.
- Refined CameraControls `onInit` hook framing the VRM avatar's face and upper torso directly on initial canvas mount.

## [0.57.0] - Real-Time Drag Target Zones & Spoken Companion Reactions
### Added
- Real-time cursor distance tracking during viewport drag gestures detects target zones (`dragTargetZone`: 'avatar' vs 'stage').
- Concentric 3D landing reticle dynamically highlights an inner avatar aura ring (`#ff4081`) with intensified opacity when dragging near the avatar, or an outer perimeter stage ring (`#00e5ff`) when aiming at stage surroundings.
- AI Companion dynamically vocalizes contextual reactions upon asset drops (celebrating new avatars, announcing animation retargeting, or welcoming the user to a new stage environment).
- Added "Voice Drop Reactions" toggle button in Companion Studio under Voice & Audio Studio to allow toggling between spoken reactions and silent drops.

## [0.56.0] - Dynamic Viewport FBX Retargeting & Camera Alignment
### Added
- Direct drag-and-drop ingestion of Mixamo FBX skeletal animation files onto the 3D viewport canvas.
- Dynamic skeletal retargeting via `MixamoVRMRetargeting.js` (`loadMixamoAnimation`) blending new animations into active mixer actions without re-materializing the avatar.
- Concentric holographic landing zone reticle on the stage floor plane with theatrical key light intensity pulsing during file drags.
- Hierarchical multi-file drag prioritization (.vrm -> .fbx -> .glb -> images).
- Camera framing initialized directly on the VRM avatar's face and upper torso on canvas mount.

## [0.55.0] - Persistent Custom 3D Environments via IndexedDB
### Added
- Extended IndexedDB persistence in `client/src/CacheUtils.js` for custom 3D environment scenes (`custom_environment.glb`) and metadata (`custom_environment_meta.json`).
- Automatically caches dropped `.glb`/`.gltf` environments to IndexedDB in `client/src/App.jsx` and auto-restores them seamlessly on session start.
- Added Custom Environment indicator badge with byte size readout and "Reset Room ✕" restore button in Companion Studio under 3D Stage & Environment.

## [0.54.0] - Drop Impact Ground Shockwave & Avatar Landing Physics
### Added
- Dynamic 3D ground shockwave ring (`dropShockwave`) rendered on the stage floor plane (`y = 0.03`) upon successful VRM/GLB drops via `triggerDropFlash` in `client/src/App.jsx`.
- Soft vertical avatar landing bounce and damped spring settling physics (`landingOffsetY`) in `client/src/Character.jsx` during model loading and drops.
- Added "Drop Shockwave & Landing Bounce" toggle control (`dropPhysicsEnabled`) in Companion Studio with real-time audio chimes and descriptive tooltips.

## [0.53.0] - Atmospheric Particle Simulation Presets
### Added
- Upgraded 3D scene particle simulations beyond sparkles to four distinctive atmospheric simulation presets: `none`, `sparkle` (100 particles, golden yellow #ffd166), `fireflies` (45 floating particles, glowing lime #aaff44 with gentle bob), `snow` (160 particles, icy white #e0f7fa with drifting vertical descent), and `stardust` (220 particles, luminous cyan #70d6ff with expansive ambient drift).
- Added responsive preset selector button grid in Companion Studio under "3D Stage & Environment" with real-time active highlighting and informative tooltips.
- Enhanced Companion system prompt to guide LLM particle tags (`[effect:sparkle]`, `[effect:fireflies]`, `[effect:snow]`, `[effect:stardust]`, `[effect:none]`).

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
- Configuration Dashboard UI with settings toggle.
- OpenRouter API Key input with secure proxy forwarding.
- Character System Prompt editor in the dashboard.
- CSS tooltips for UI fields.
- Visual error state handling in the chat window.

### Changed
- Express server now dynamically resolves API keys sent from the client instead of only `process.env`.
