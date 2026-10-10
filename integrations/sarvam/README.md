# Sarvam audio transcription

Server settings: SARVAM_API_KEY, SARVAM_MODEL.

Implementation: backend/app/services/providers.py.

Preferences include microphone recording with listen-back, automatic stop at 29 seconds, and a WAV upload fallback. Browser-native recordings are decoded locally and converted to mono 16 kHz PCM WAV. The backend accepts complete nonempty WAV recordings up to 30 seconds and 5 MB. Select automatic language detection, Malayalam, English, Hindi, Tamil or Kannada. Users edit and accept the transcript before it becomes driver notes; structured needs remain explicit form selections. Microphones require HTTPS or localhost and browser permission. Unsupported devices and provider failures retain typed input. See [intake research and limits](../../docs/ticket-voice-intake.md).

See [integration index](../README.md) and [root setup](../../README.md) for credentials, consent and deployment. Live provider authentication has not yet been verified.
