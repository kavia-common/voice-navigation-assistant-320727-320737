import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { apiHealthCheck } from "./api/client";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import CollapsiblePanel from "./components/CollapsiblePanel";
import MicButton from "./components/MicButton";

/**
 * A lightweight UI for an AI voice navigation assistant:
 * - Embedded map area (placeholder; can be swapped with Google Maps JS API)
 * - Floating microphone button for voice input using Web Speech API (with text fallback)
 * - Collapsible panels for assistant responses, directions, and debug/status
 */
// PUBLIC_INTERFACE
function App() {
  /** App theme per template support (light/dark) */
  const [theme, setTheme] = useState("light");

  /** Input state */
  const [typedText, setTypedText] = useState("");
  const [lastQuery, setLastQuery] = useState("");

  /** Backend state */
  const [backendStatus, setBackendStatus] = useState({
    state: "idle", // idle | loading | ok | error
    message: "",
    lastCheckedAt: null,
  });

  /** Assistant output state (until backend provides richer endpoints) */
  const [assistantState, setAssistantState] = useState({
    state: "idle", // idle | thinking | done | error
    responseText: "",
    error: "",
  });

  /** Panels */
  const [panelsOpen, setPanelsOpen] = useState({
    assistant: true,
    directions: false,
    status: false,
  });

  const mapContainerRef = useRef(null);

  // Apply theme to document root (kept from template behavior)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Health check on mount
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setBackendStatus((s) => ({ ...s, state: "loading", message: "" }));
      try {
        await apiHealthCheck();
        if (cancelled) return;
        setBackendStatus({
          state: "ok",
          message: "Backend reachable",
          lastCheckedAt: new Date(),
        });
      } catch (e) {
        if (cancelled) return;
        setBackendStatus({
          state: "error",
          message:
            "Backend not reachable. Check that the FastAPI container is running and CORS is enabled.",
          lastCheckedAt: new Date(),
        });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Web Speech API
  const speech = useSpeechRecognition({
    lang: "en-US",
    interimResults: true,
  });

  // When a final transcript is produced, treat it as a query
  useEffect(() => {
    if (!speech.finalTranscript) return;

    const q = speech.finalTranscript.trim();
    if (!q) return;

    setTypedText(q);
    // Immediately submit the final transcript as a query
    void submitQuery(q, { source: "voice" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.finalTranscript]);

  const micDisabledReason = useMemo(() => {
    if (!speech.isSupported)
      return "Voice input not supported in this browser. Use the text box.";
    if (assistantState.state === "thinking")
      return "Assistant is processing. Please wait.";
    return "";
  }, [speech.isSupported, assistantState.state]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  async function submitQuery(query, { source }) {
    const q = (query ?? "").trim();
    if (!q) return;

    setLastQuery(q);
    setAssistantState({ state: "thinking", responseText: "", error: "" });

    // Until the backend exposes actual assistant endpoints, we provide a helpful stub response
    // but still validate backend connectivity (health).
    try {
      await apiHealthCheck();

      // Basic simulated response; replace with real endpoints once backend adds them.
      const responseText =
        source === "voice"
          ? `Heard: "${q}". (Backend is reachable, but assistant endpoints are not yet published in OpenAPI.)`
          : `Query: "${q}". (Backend is reachable, but assistant endpoints are not yet published in OpenAPI.)`;

      setAssistantState({ state: "done", responseText, error: "" });
      setPanelsOpen((p) => ({ ...p, assistant: true }));
    } catch (e) {
      setAssistantState({
        state: "error",
        responseText: "",
        error:
          "Could not reach backend. Please start the backend service and try again.",
      });
      setPanelsOpen((p) => ({ ...p, status: true, assistant: true }));
    }
  }

  function onSubmitTyped(e) {
    e.preventDefault();
    void submitQuery(typedText, { source: "text" });
  }

  return (
    <div className="App shell">
      <header className="topbar" role="banner">
        <div className="topbar__left">
          <div className="brand">
            <div className="brand__mark" aria-hidden="true">
              VA
            </div>
            <div className="brand__text">
              <div className="brand__title">Voice Navigation Assistant</div>
              <div className="brand__subtitle">
                Map + voice commands + nearby search
              </div>
            </div>
          </div>
        </div>

        <div className="topbar__right">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setBackendStatus((s) => ({
                ...s,
                state: "loading",
                message: "",
              }));
              apiHealthCheck()
                .then(() =>
                  setBackendStatus({
                    state: "ok",
                    message: "Backend reachable",
                    lastCheckedAt: new Date(),
                  }),
                )
                .catch(() =>
                  setBackendStatus({
                    state: "error",
                    message:
                      "Backend not reachable. Check backend logs and CORS.",
                    lastCheckedAt: new Date(),
                  }),
                );
            }}
            aria-label="Re-check backend status"
          >
            {backendStatus.state === "loading" ? "Checking…" : "Check backend"}
          </button>

          <button
            className="btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title="Toggle theme"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </header>

      <main className="content" role="main">
        <section className="mapArea" aria-label="Map view">
          <div className="mapFrame" ref={mapContainerRef}>
            <div className="mapPlaceholder">
              <div className="mapPlaceholder__title">Map View</div>
              <div className="mapPlaceholder__body">
                This is a map placeholder. Integrate Google Maps JS API here when
                keys/config are available.
              </div>
              <div className="mapPlaceholder__meta">
                {backendStatus.state === "ok" ? (
                  <span className="badge badge-ok">Backend OK</span>
                ) : backendStatus.state === "loading" ? (
                  <span className="badge badge-warn">Checking backend…</span>
                ) : backendStatus.state === "error" ? (
                  <span className="badge badge-error">Backend error</span>
                ) : (
                  <span className="badge">Idle</span>
                )}
              </div>
            </div>
          </div>

          <MicButton
            isListening={speech.isListening}
            isSupported={speech.isSupported}
            disabled={!!micDisabledReason}
            disabledReason={micDisabledReason}
            onClick={() => {
              // Toggle listening
              if (speech.isListening) {
                speech.stop();
              } else {
                setPanelsOpen((p) => ({ ...p, assistant: true }));
                speech.start();
              }
            }}
            onCancel={() => speech.stop()}
          />
        </section>

        <aside className="sidePanels" aria-label="Assistant panels">
          <form className="queryBar" onSubmit={onSubmitTyped}>
            <label className="srOnly" htmlFor="queryInput">
              Type a command
            </label>
            <input
              id="queryInput"
              className="input"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder='Try: "Directions to Union Square" or "Find coffee nearby"'
              autoComplete="off"
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!typedText.trim() || assistantState.state === "thinking"}
            >
              {assistantState.state === "thinking" ? "Sending…" : "Send"}
            </button>
          </form>

          <div className="panels">
            <CollapsiblePanel
              title="Assistant response"
              subtitle={
                assistantState.state === "thinking"
                  ? "Listening/processing…"
                  : lastQuery
                    ? `Last query: ${lastQuery}`
                    : "Ask a question or use the mic"
              }
              isOpen={panelsOpen.assistant}
              onToggle={() =>
                setPanelsOpen((p) => ({ ...p, assistant: !p.assistant }))
              }
            >
              {assistantState.state === "idle" ? (
                <div className="emptyState">
                  Use the microphone button (bottom right) or type a query above.
                </div>
              ) : assistantState.state === "thinking" ? (
                <div className="loadingState">
                  <div className="spinner" aria-hidden="true" />
                  <div>
                    {speech.isListening
                      ? "Listening…"
                      : "Processing your request…"}
                    {speech.interimTranscript ? (
                      <div className="muted small">
                        Interim: “{speech.interimTranscript}”
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : assistantState.state === "error" ? (
                <div className="errorState" role="alert">
                  {assistantState.error}
                </div>
              ) : (
                <div className="responseText">{assistantState.responseText}</div>
              )}
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Directions"
              subtitle="Turn-by-turn directions will appear here"
              isOpen={panelsOpen.directions}
              onToggle={() =>
                setPanelsOpen((p) => ({ ...p, directions: !p.directions }))
              }
            >
              <div className="emptyState">
                Not yet available (backend endpoints not published in OpenAPI).
              </div>
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Status"
              subtitle="Speech + backend connectivity"
              isOpen={panelsOpen.status}
              onToggle={() =>
                setPanelsOpen((p) => ({ ...p, status: !p.status }))
              }
            >
              <div className="kvList">
                <div className="kvRow">
                  <div className="kvKey">Backend</div>
                  <div className="kvVal">
                    {backendStatus.state === "ok"
                      ? "Reachable"
                      : backendStatus.state === "loading"
                        ? "Checking…"
                        : backendStatus.state === "error"
                          ? "Unreachable"
                          : "Idle"}
                  </div>
                </div>
                <div className="kvRow">
                  <div className="kvKey">Speech Recognition</div>
                  <div className="kvVal">
                    {speech.isSupported ? "Supported" : "Not supported"}
                  </div>
                </div>
                <div className="kvRow">
                  <div className="kvKey">Listening</div>
                  <div className="kvVal">{speech.isListening ? "Yes" : "No"}</div>
                </div>
                <div className="kvRow">
                  <div className="kvKey">Last backend check</div>
                  <div className="kvVal">
                    {backendStatus.lastCheckedAt
                      ? backendStatus.lastCheckedAt.toLocaleTimeString()
                      : "—"}
                  </div>
                </div>
                {backendStatus.message ? (
                  <div className="hint">{backendStatus.message}</div>
                ) : null}
              </div>
            </CollapsiblePanel>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
