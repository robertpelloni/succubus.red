# succubus.red

**This repository contains no code and no website.** Its only file is the
document that used to be this README: a chat transcript designing an
adult AI-companion webpage to live at the succubus.red domain. Nothing was
built, deployed, or committed beyond that transcript (two commits,
2026-06-23).

## The design in the transcript

An NSFW AI companion (in the style of Grok's Ani) as a three-tier web app:

1. **Frontend** — chat UI with character avatar; later sections extend it
   to an interactive **3D character**: Three.js / React Three Fiber,
   VRoid Studio `.vrm` models or Mixamo-rigged GLB, `useGLTF` /
   `useAnimations` for idle/talk/action clips (starter R3F component code
   included inline).
2. **Backend** — a thin Node/Express (or FastAPI/Go) server holding API
   keys and streaming tokens to the browser (sample OpenAI-compatible
   streaming route included inline).
3. **Inference** — an uncensored/roleplay open-weight model, because
   mainstream hosted APIs refuse the content. Options covered:
   OpenRouter / Together / Featherless hosted RP models, or self-hosted
   Ollama/LM Studio for development and vLLM/Aphrodite for serving.
4. **Persona** — SillyTavern/V2-style character cards: a persistent system
   prompt defining the succubus character, action/dialogue formatting
   conventions, and an explicit-behavior directive.
5. **Extras discussed** — emotion-driven image generation (Stable
   Diffusion/Flux APIs) for avatar swaps, and browser-local chat history
   (localStorage/IndexedDB) to avoid server-side storage costs.

## Status

Spec only. The domain name is the repo name; whether succubus.red itself
ever served this design is not recorded anywhere in the repository.
