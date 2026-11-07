# Changelog

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
