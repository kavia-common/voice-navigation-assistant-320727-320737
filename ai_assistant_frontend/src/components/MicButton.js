import React from "react";

/**
 * Floating action button for microphone capture.
 */
// PUBLIC_INTERFACE
export default function MicButton({
  isListening,
  isSupported,
  disabled,
  disabledReason,
  onClick,
  onCancel,
}) {
  const hint = !isSupported
    ? "Voice not supported here — use the text box."
    : disabled
      ? disabledReason
      : isListening
        ? "Listening… click to stop."
        : "Click to speak.";

  return (
    <div className="micFabWrap" aria-label="Voice input controls">
      {hint ? <div className="micHint">{hint}</div> : null}

      <button
        type="button"
        className="micFab"
        onClick={onClick}
        disabled={disabled || !isSupported}
        aria-label={isListening ? "Stop listening" : "Start listening"}
        title={isListening ? "Stop listening" : "Start listening"}
      >
        {isListening ? <span className="micFab__pulse" /> : null}
        <span aria-hidden="true">{isListening ? "■" : "🎙"}</span>
      </button>

      {isListening ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          aria-label="Cancel listening"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}
