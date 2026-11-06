# Changelog

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
