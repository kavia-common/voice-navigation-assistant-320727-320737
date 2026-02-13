import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Web Speech API wrapper (SpeechRecognition / webkitSpeechRecognition).
 * Provides interimTranscript + finalTranscript and a simple start/stop API.
 *
 * This is intentionally lightweight and avoids external dependencies.
 */
// PUBLIC_INTERFACE
export function useSpeechRecognition({ lang = "en-US", interimResults = true } = {}) {
  const SpeechRecognitionCtor = useMemo(() => {
    return (
      window.SpeechRecognition ||
      // eslint-disable-next-line no-undef
      window.webkitSpeechRecognition ||
      null
    );
  }, []);

  const isSupported = !!SpeechRecognitionCtor;

  const recognitionRef = useRef(null);
  const stopRequestedRef = useRef(false);

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState("");

  // Initialize recognition instance once
  useEffect(() => {
    if (!isSupported) return;

    const rec = new SpeechRecognitionCtor();
    rec.lang = lang;
    rec.interimResults = interimResults;
    rec.continuous = false;

    rec.onstart = () => {
      setError("");
      setIsListening(true);
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      // If stop was requested, we do nothing special; otherwise, browser ended capture.
      stopRequestedRef.current = false;
    };

    rec.onerror = (evt) => {
      // Common errors: 'not-allowed', 'service-not-allowed', 'network', 'no-speech'
      const msg = evt?.error
        ? `Speech error: ${evt.error}`
        : "Speech error occurred.";
      setError(msg);
      setIsListening(false);
    };

    rec.onresult = (evt) => {
      let interim = "";
      let final = "";

      for (let i = evt.resultIndex; i < evt.results.length; i += 1) {
        const res = evt.results[i];
        const transcript = res[0]?.transcript || "";
        if (res.isFinal) final += transcript;
        else interim += transcript;
      }

      setInterimTranscript(interim.trim());
      if (final.trim()) {
        setFinalTranscript(final.trim());
      }
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onstart = null;
        rec.onend = null;
        rec.stop();
      } catch {
        // ignore cleanup errors
      }
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionCtor, interimResults, isSupported, lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setFinalTranscript("");
    setInterimTranscript("");
    setError("");
    stopRequestedRef.current = false;

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Calling start twice can throw in some browsers
      setError("Could not start speech recognition. Please try again.");
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    stopRequestedRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
  };
}
