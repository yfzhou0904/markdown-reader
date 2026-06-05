import { useEffect, useMemo, useState, type CSSProperties } from "react";
import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import "./App.css";

type FontFamily = "serif" | "sans" | "mono";
type Theme = "light" | "paper" | "dark";

type ReaderSettings = {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  theme: Theme;
};

const STORAGE_KEYS = {
  markdown: "markdown-reader.document",
  settings: "markdown-reader.settings",
} as const;

const DEFAULT_MARKDOWN = `# Markdown Reader

Paste raw Markdown here and read it in a calmer surface.

## What this MVP does

- keeps your current draft in local storage
- remembers typography and theme settings
- renders Markdown as a reading document rather than a developer preview

> The source stays visible when you need it. The reader stays comfortable when you don't.

### Reading notes

This first pass is intentionally narrow. It is the app shell you can build the macOS product around: input on the left, reader on the right, and enough settings to make long reports readable.

\`\`\`ts
const preferences = {
  fontFamily: "serif",
  fontSize: 19,
  lineHeight: 1.75,
  theme: "light",
};
\`\`\`
`;

const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: "serif",
  fontSize: 19,
  lineHeight: 1.75,
  theme: "paper",
};

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
});

function readStoredMarkdown(): string {
  const stored = window.localStorage.getItem(STORAGE_KEYS.markdown);
  return stored && stored.trim().length > 0 ? stored : DEFAULT_MARKDOWN;
}

function readStoredSettings(): ReaderSettings {
  const stored = window.localStorage.getItem(STORAGE_KEYS.settings);

  if (!stored) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<ReaderSettings>;

    return {
      fontFamily:
        parsed.fontFamily === "sans" || parsed.fontFamily === "mono"
          ? parsed.fontFamily
          : "serif",
      fontSize:
        typeof parsed.fontSize === "number" ? parsed.fontSize : DEFAULT_SETTINGS.fontSize,
      lineHeight:
        typeof parsed.lineHeight === "number"
          ? parsed.lineHeight
          : DEFAULT_SETTINGS.lineHeight,
      theme:
        parsed.theme === "light" ||
        parsed.theme === "paper" ||
        parsed.theme === "dark"
          ? parsed.theme
          : parsed.theme === "sepia"
            ? "paper"
            : "light",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function App() {
  const [source, setSource] = useState<string>(() => readStoredMarkdown());
  const [settings, setSettings] = useState<ReaderSettings>(() => readStoredSettings());
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.markdown, source);
  }, [source]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  const renderedHtml = useMemo(() => {
    const dirtyHtml = markdown.render(source);
    return DOMPurify.sanitize(dirtyHtml);
  }, [source]);

  const wordCount = useMemo(() => {
    const words = source.trim().match(/\S+/g);
    return words ? words.length : 0;
  }, [source]);

  const readingMinutes = Math.max(1, Math.round(wordCount / 220));
  const readingSummary = `${wordCount} words • ${readingMinutes} min read`;

  const handleReset = () => {
    setSource(DEFAULT_MARKDOWN);
    setSettings(DEFAULT_SETTINGS);
  };

  useEffect(() => {
    if (!isPreferencesOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPreferencesOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isPreferencesOpen]);

  return (
    <main className={`app-shell theme-${settings.theme} ${isReaderOpen ? "is-reader-open" : ""}`}>
      <header className="topbar">
        <div className="status-group" aria-label="document status">
          {isReaderOpen ? (
            <button
              className="icon-button"
              type="button"
              aria-label="Close reader view"
              onClick={() => setIsReaderOpen(false)}
            >
              ×
            </button>
          ) : null}
          <div className="status-pill">{readingSummary}</div>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setIsPreferencesOpen(true)}
          >
            Preferences
          </button>
          {!isReaderOpen ? (
            <button
              className="primary-button"
              type="button"
              onClick={() => setIsReaderOpen(true)}
            >
              Reader View
            </button>
          ) : null}
        </div>
      </header>

      <section className="workspace">
        {!isReaderOpen ? (
          <label className="source-editor-shell">
            <span className="sr-only">Markdown source</span>
            <textarea
              className="source-editor"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              placeholder="Paste Markdown here"
            />
          </label>
        ) : (
          <div className="reader-card">
            <article
              className={`reader-preview font-${settings.fontFamily}`}
              style={
                {
                  "--reader-font-size": `${settings.fontSize}px`,
                  "--reader-line-height": settings.lineHeight,
                } as CSSProperties
              }
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </section>

      {isPreferencesOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsPreferencesOpen(false)}
        >
          <section
            className="preferences-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preferences-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="preferences-title">Preferences</h2>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setIsPreferencesOpen(false)}
              >
                Done
              </button>
            </div>

            <div className="modal-controls" aria-label="reader settings">
              <label className="control-row">
                <span>Font family</span>
                <select
                  value={settings.fontFamily}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      fontFamily: event.target.value as FontFamily,
                    }))
                  }
                >
                  <option value="serif">Serif</option>
                  <option value="sans">Sans</option>
                  <option value="mono">Mono</option>
                </select>
              </label>

              <label className="control-row">
                <span>Font size</span>
                <div className="slider-control">
                  <input
                    type="range"
                    min="16"
                    max="28"
                    step="1"
                    value={settings.fontSize}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        fontSize: Number(event.target.value),
                      }))
                    }
                  />
                  <strong>{settings.fontSize}px</strong>
                </div>
              </label>

              <label className="control-row">
                <span>Line height</span>
                <div className="slider-control">
                  <input
                    type="range"
                    min="1.4"
                    max="2.1"
                    step="0.05"
                    value={settings.lineHeight}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        lineHeight: Number(event.target.value),
                      }))
                    }
                  />
                  <strong>{settings.lineHeight.toFixed(2)}</strong>
                </div>
              </label>

              <label className="control-row">
                <span>Theme</span>
                <select
                  value={settings.theme}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      theme: event.target.value as Theme,
                    }))
                  }
                >
                  <option value="light">Light</option>
                  <option value="paper">Paper</option>
                  <option value="dark">Dark</option>
                </select>
              </label>

              <div className="modal-actions">
                <button className="ghost-button" type="button" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default App;
