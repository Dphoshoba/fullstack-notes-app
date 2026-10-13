import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, AlertTriangle } from "lucide-react";
import { transcribeAudio } from "../api/ai.js";
import { useI18n } from "../context/I18nContext.jsx";

export function VoiceRecorder({ onTranscript, language = "", prompt = "", disabled = false }) {
  const { t } = useI18n();
  const mediaRecorderRef = useRef(null);
  const elapsedRef = useRef(0);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const silenceRef = useRef(0);
  const silenceStartedAtRef = useRef(null);
  const silenceRafRef = useRef(null);
  const audioContextRef = useRef(null);
  const recordingStartedAtRef = useRef(0);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.MediaRecorder || !window.navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setError("");
    setElapsed(0);
    silenceRef.current = 0;
    silenceStartedAtRef.current = null;
    elapsedRef.current = 0;
    recordingStartedAtRef.current = window.performance?.now?.() || Date.now();

    try {
      if (!window.MediaRecorder || !window.navigator.mediaDevices?.getUserMedia) {
        setSupported(false);
        return;
      }

      const stream = await window.navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/wav"
      ];
      const mimeType = mimeCandidates.find((type) => window.MediaRecorder.isTypeSupported(type)) || "";

      const recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (silenceRafRef.current) {
          window.cancelAnimationFrame(silenceRafRef.current);
          silenceRafRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        setRecording(false);
        setTranscribing(true);

        try {
          const result = await transcribeAudio(blob, { language, prompt });
          const text = String(result?.text || "").trim();
          if (text) {
            onTranscript(text);
          } else {
            setError(t("transcribeEmpty") || "No speech detected. Try again.");
          }
        } catch (err) {
          setError(err?.message || t("transcribeFailed") || "Transcription failed. Please try again.");
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start(250);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setElapsed((current) => {
          const next = current + 1;
          elapsedRef.current = next;
          return next;
        });
      }, 1000);

      // Silence detection via Web Audio API analyser
      try {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (AudioContextCtor) {
          const audioContext = new AudioContextCtor();
          audioContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);

          const data = new Uint8Array(analyser.frequencyBinCount);
          const SILENCE_THRESHOLD = 5; // lower floor so softer voices count as speech
          const SILENCE_SECONDS = 4; // consecutive silence before auto-stop
          const MIN_RECORDING_SECONDS = 3; // avoid stopping before the user starts speaking
          const MAX_DURATION = 180; // hard cap (3 min) to avoid runaway recordings

          const sample = () => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
              return;
            }

            const now = window.performance?.now?.() || Date.now();
            const elapsedSeconds = (now - recordingStartedAtRef.current) / 1000;
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
              const v = (data[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / data.length) * 100;

            if (rms < SILENCE_THRESHOLD) {
              silenceRef.current += 1;
              silenceStartedAtRef.current ??= now;
            } else {
              silenceRef.current = 0;
              silenceStartedAtRef.current = null;
            }

            const silentSeconds = silenceStartedAtRef.current
              ? (now - silenceStartedAtRef.current) / 1000
              : 0;

            if (elapsedSeconds >= MIN_RECORDING_SECONDS && silentSeconds >= SILENCE_SECONDS) {
              stopRecording();
              return;
            }
            if (elapsedSeconds >= MAX_DURATION) {
              stopRecording();
              return;
            }

            silenceRafRef.current = window.requestAnimationFrame(sample);
          };

          silenceRafRef.current = window.requestAnimationFrame(sample);
        }
      } catch {
        // Silence detection is best-effort; recording still works without it.
      }
    } catch (err) {
      if (err?.name === "NotAllowedError" || err?.name === "NotAllowed" || err?.name === "PermissionDeniedError") {
        setError(t("micPermissionDenied") || "Microphone access was denied. Please allow it in your browser settings.");
      } else {
        setError(t("micUnavailable") || "Could not access the microphone. Try again.");
      }
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  if (!supported) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400" title={t("voiceUnsupported") || "Voice input is not supported in this browser."}>
        <AlertTriangle className="h-3.5 w-3.5" />
        {t("voiceUnsupported") || "Voice not supported"}
      </span>
    );
  }

  const label = recording
    ? `${t("recording") || "Recording…"} ${elapsed}s`
    : transcribing
      ? t("transcribing") || "Transcribing…"
      : t("voiceToText") || "Voice to text";

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled || transcribing}
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          recording
            ? "bg-red-600 text-white hover:bg-red-700"
            : transcribing
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
        }`}
        aria-label={label}
        title={label}
      >
        {transcribing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : recording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">{label}</span>
      </button>
      {error ? (
        <span className="max-w-[14rem] truncate text-xs text-red-600" title={error}>
          {error}
        </span>
      ) : null}
    </span>
  );
}
