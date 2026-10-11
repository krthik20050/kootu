# Sarvam audio transcription

Server settings: SARVAM_API_KEY, SARVAM_MODEL.

Implementation: backend/app/services/providers.py.

The optional special-instructions box includes an inline microphone. Stopping dictation automatically appends editable text; there is no audio upload or separate transcript confirmation panel. Browser audio becomes mono 16 kHz PCM WAV. Recordings stop at 598 seconds; the backend validates a 600-second/20-MB bound, splits complete audio into up to 21 consecutive 29-second segments and joins transcripts in order. Automatic language detection is the UI default. Permission denial, cancellation and provider failures preserve typed input; failed transcription can retry the retained recording. Microphones require HTTPS or localhost and browser permission. See [intake research and limits](../../docs/ticket-voice-intake.md).

See [integration index](../README.md) and [root setup](../../README.md) for credentials and deployment. Live provider authentication has not yet been verified.
