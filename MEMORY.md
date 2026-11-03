# MEMORY
- Project initiated based on succubus.red design specification.
- Architecture: Client-Heavy, Server-Light paradigm utilizing React + Three.js + @pixiv/three-vrm.
- VRM 1.0 specifications require root translation locks (dx=0, dz=0) and neutral scene rotation.
- Settings dashboard consolidated into a single panel (`Companion Studio`) without fragmented subpages, structured by value hierarchy.
- Audio synthesis supports fallback gracefully: ElevenLabs -> Kokoro WebGPU -> Native SpeechSynthesis.
- Native speech synthesis requires guarding `isSpeaking` reset using `!window.speechSynthesis.pending` in multi-sentence utterance flows.
- System tray management implemented in `tray_app.py` supporting both pystray GUI and headless CLI execution with IPv4/IPv6 port detection.
