import { useEffect, useMemo, useRef, useState, type CSSProperties, type ComponentProps } from "react";
import { invoke } from "@tauri-apps/api/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";
import { Mermaid } from "./Mermaid";

type FontFamily = "serif" | "sans" | "mono" | "atkinson-next";
type Theme = "light" | "paper" | "dark";

type ReaderSettings = {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  theme: Theme;
};

const FONT_SIZE_MIN = 16;
const FONT_SIZE_MAX = 28;
const FONT_SIZE_STEP = 1;

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

\`\`\`mermaid
flowchart LR
  Draft[Paste Markdown] --> Reader[Open Reader View]
  Reader --> Diagram[Render Mermaid]
\`\`\`
`;

const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: "serif",
  fontSize: 19,
  lineHeight: 1.75,
  theme: "paper",
};

function getNextFontSize(current: number, delta: number): number {
  return Math.min(
    FONT_SIZE_MAX,
    Math.max(FONT_SIZE_MIN, current + delta * FONT_SIZE_STEP),
  );
}

const MACOS_THEME_WINDOW_COLORS: Record<Theme, { red: number; green: number; blue: number }> = {
  light: { red: 255, green: 255, blue: 255 },
  paper: { red: 246, green: 241, blue: 232 },
  dark: { red: 23, green: 23, blue: 24 },
};

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
        parsed.fontFamily === "sans" ||
        parsed.fontFamily === "mono" ||
        parsed.fontFamily === "atkinson-next"
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
  const sourceEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.markdown, source);
  }, [source]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (isReaderOpen) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      sourceEditorRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
    };
  }, [isReaderOpen]);

  useEffect(() => {
    const { red, green, blue } = MACOS_THEME_WINDOW_COLORS[settings.theme];

    void invoke("sync_window_theme", { red, green, blue }).catch(() => {
      // Ignore on non-Tauri/web contexts and unsupported platforms.
    });
  }, [settings.theme]);
  const markdownComponents = useMemo(
    () =>
      ({
        a({ href, children, ...props }: ComponentProps<"a">) {
          const isExternal = typeof href === "string" && /^https?:\/\//.test(href);
          return (
            <a
              href={href}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              {...props}
            >
              {children}
            </a>
          );
        },
        code({ className, children, ...props }: ComponentProps<"code">) {
          const match = /language-(\w+)/.exec(className ?? "");
          const code = String(children ?? "");

          if (match?.[1] === "mermaid") {
            return <Mermaid chart={code} />;
          }

          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }) as const,
    [],
  );

  const handleReset = () => {
    setSource(DEFAULT_MARKDOWN);
    setSettings(DEFAULT_SETTINGS);
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isPreferencesOpen) {
          setIsPreferencesOpen(false);
          return;
        }

        if (isReaderOpen) {
          setIsReaderOpen(false);
        }
      }

      if (
        event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        event.key === "Enter" &&
        document.activeElement === sourceEditorRef.current
      ) {
        event.preventDefault();
        setIsReaderOpen(true);
      }

      const isMetaOnlyModifier = event.metaKey && !event.ctrlKey && !event.altKey;
      const isIncreaseFontKey =
        event.key === "+" || event.key === "=" || event.code === "NumpadAdd";
      const isDecreaseFontKey =
        event.key === "-" || event.key === "_" || event.code === "NumpadSubtract";

      if (isReaderOpen && !isPreferencesOpen && isMetaOnlyModifier && isIncreaseFontKey) {
        event.preventDefault();
        setSettings((current) => ({
          ...current,
          fontSize: getNextFontSize(current.fontSize, 1),
        }));
      }

      if (isReaderOpen && !isPreferencesOpen && isMetaOnlyModifier && isDecreaseFontKey) {
        event.preventDefault();
        setSettings((current) => ({
          ...current,
          fontSize: getNextFontSize(current.fontSize, -1),
        }));
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [isPreferencesOpen, isReaderOpen]);

  return (
    <main className={`app-shell theme-${settings.theme} ${isReaderOpen ? "is-reader-open" : ""}`}>
      <section className="workspace">
        <div className="top-reveal-zone" aria-hidden="true" />
        <div className="floating-controls-frame">
          <div className="floating-controls" aria-label="document controls">
            {isReaderOpen ? (
              <button
                className="floating-action-button"
                type="button"
                aria-label="Close reader view"
                onClick={() => setIsReaderOpen(false)}
              >
                ×
              </button>
            ) : (
              <button
                className="floating-action-button"
                type="button"
                onClick={() => setIsReaderOpen(true)}
              >
                Reader View
              </button>
            )}
            <button
              className="floating-icon-button"
              type="button"
              aria-label="Open preferences"
              onClick={() => setIsPreferencesOpen(true)}
            >
              <span aria-hidden="true">⚙</span>
            </button>
          </div>
        </div>

        <label
          className="source-editor-shell"
          aria-hidden={isReaderOpen}
          inert={isReaderOpen}
        >
          <span className="sr-only">Markdown source</span>
          <textarea
            ref={sourceEditorRef}
            className="source-editor"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            spellCheck={false}
            placeholder="Paste Markdown here"
          />
        </label>
        <div
          className="reader-card"
          aria-hidden={!isReaderOpen}
          inert={!isReaderOpen}
        >
          <article
            className={`reader-preview font-${settings.fontFamily}`}
            style={
              {
                "--reader-font-size": `${settings.fontSize}px`,
                "--reader-line-height": settings.lineHeight,
              } as CSSProperties
            }
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {source}
            </ReactMarkdown>
          </article>
        </div>
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
                  <option value="atkinson-next">Atkinson Next</option>
                </select>
              </label>

              <label className="control-row">
                <span>Font size</span>
                <div className="slider-control">
                  <input
                    type="range"
                    min={FONT_SIZE_MIN}
                    max={FONT_SIZE_MAX}
                    step={FONT_SIZE_STEP}
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
