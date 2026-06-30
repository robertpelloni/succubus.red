# MEMORY
- Project initiated.
- Decided to use React + Vite + Three.js + @pixiv/three-vrm based on the specification.
- A Client-Heavy, Server-Light paradigm.
- For VRM 1.0 avatars, Mixamo animation retargeting does not require a 180-degree baseline rotation. Explicitly lock horizontal root translations (`dx=0, dz=0`) and remove `Math.PI` rotations from the parent group or the VRM scene itself to prevent the character from facing backwards.
- Dead code should be rigorously removed (e.g. unused `LipSyncAnalyser.js`) to pass code reviews.
- Playwright is an effective tool to verify 3D frontend renderings from headless execution.
