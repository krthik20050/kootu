# Groq flight ticket extraction

Server settings: `GROQ_API_KEY`, `GROQ_MODEL=qwen/qwen3.8-27b`.

Implementation: `backend/app/services/providers.py`. The vision model accepts ticket images and extracted PDF text in JSON mode. Backend validation checks the returned flight fields; passengers must confirm them before saving. Upload consent names Groq.

See [official vision documentation](https://console.groq.com/docs/vision), [integration index](../README.md) and [root setup](../../README.md). Groq and Grok/xAI are separate providers; their keys are not interchangeable.
