# Groq flight ticket extraction

Server settings: `GROQ_API_KEY`, `GROQ_MODEL=qwen/qwen3.8-27b`.

Implementation: `backend/app/services/providers.py`. The vision model accepts ticket images and bounded renders of all PDF pages in JSON mode, including scanned PDFs. Backend validation checks nullable flight fields, display name and passenger count; passengers must confirm details before saving. Unknown flight fields clear previous suggestions. Upload consent names Groq. PNRs and ticket numbers are excluded. See [intake research and limits](../../docs/ticket-voice-intake.md).

See [official vision documentation](https://console.groq.com/docs/vision), [integration index](../README.md) and [root setup](../../README.md). Groq and Grok/xAI are separate providers; their keys are not interchangeable.
