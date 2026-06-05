import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Phase 1 scaffold</p>
          <h1>Markdown Reader</h1>
        </div>
        <div className="status-pill">Offline-first macOS app</div>
      </header>

      <section className="workspace">
        <aside className="source-pane">
          <div className="pane-header">
            <h2>Source</h2>
            <span>Paste or open Markdown</span>
          </div>
          <div className="placeholder-panel">
            <p>
              MVP implementation starts here: document input, local draft
              persistence, and file-open workflows.
            </p>
          </div>
        </aside>

        <section className="reader-pane">
          <div className="pane-header">
            <h2>Reader</h2>
            <span>Typography-first rendering surface</span>
          </div>

          <div className="reader-card">
            <div className="reader-controls">
              <span>Serif</span>
              <span>18px</span>
              <span>1.7 line height</span>
              <span>720px width</span>
              <span>Sepia</span>
            </div>

            <article className="reader-preview">
              <h3>Reader experience target</h3>
              <p>
                This scaffold is deliberately light on behavior. Its job is to
                establish the app shell, package layout, and desktop container
                so the MVP can be implemented without carrying template code
                forward.
              </p>
              <p>
                The next implementation pass should replace this placeholder with
                a real Markdown pipeline, persisted reader preferences, and a
                reading surface tuned for long-form reports.
              </p>
              <blockquote>
                Reading-first, not editor-first.
              </blockquote>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
