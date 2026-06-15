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
  fontWeight: number;
  lineHeight: number;
  theme: Theme;
};

type DocumentTab = {
  id: string;
  markdown: string;
};

type WorkspaceState = {
  tabs: DocumentTab[];
  activeTabId: string;
};

const FONT_SIZE_MIN = 16;
const FONT_SIZE_MAX = 28;
const FONT_SIZE_STEP = 1;
const FONT_WEIGHT_MIN = 300;
const FONT_WEIGHT_MAX = 700;
const FONT_WEIGHT_STEP = 50;
const LINE_HEIGHT_MIN = 1.4;
const LINE_HEIGHT_MAX = 2.1;
const LINE_HEIGHT_STEP = 0.05;

const STORAGE_KEYS = {
  markdown: "markdown-reader.document",
  workspace: "markdown-reader.workspace",
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
  fontWeight: 400,
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

function createTab(markdown = ""): DocumentTab {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    markdown,
  };
}

function createWorkspace(markdown = ""): WorkspaceState {
  const initialTab = createTab(markdown);

  return {
    tabs: [initialTab],
    activeTabId: initialTab.id,
  };
}

function sanitizeWorkspace(candidate: unknown): WorkspaceState | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const { tabs, activeTabId } = candidate as Partial<WorkspaceState>;

  if (!Array.isArray(tabs) || typeof activeTabId !== "string") {
    return null;
  }

  const sanitizedTabs = tabs.flatMap((tab) => {
    if (!tab || typeof tab !== "object") {
      return [];
    }

    const { id, markdown } = tab as Partial<DocumentTab>;

    if (typeof id !== "string" || id.length === 0 || typeof markdown !== "string") {
      return [];
    }

    return [{ id, markdown }];
  });

  if (sanitizedTabs.length === 0) {
    return null;
  }

  const activeTabExists = sanitizedTabs.some((tab) => tab.id === activeTabId);

  return {
    tabs: sanitizedTabs,
    activeTabId: activeTabExists ? activeTabId : sanitizedTabs[0].id,
  };
}

function readStoredWorkspace(): WorkspaceState {
  const storedWorkspace = window.localStorage.getItem(STORAGE_KEYS.workspace);

  if (storedWorkspace === null) {
    return createWorkspace(readStoredMarkdown());
  }

  if (storedWorkspace) {
    try {
      const parsed = JSON.parse(storedWorkspace) as unknown;
      const sanitized = sanitizeWorkspace(parsed);

      if (sanitized) {
        return sanitized;
      }
    } catch {
      // Fall through to invalid-workspace recovery.
    }
  }

  return createWorkspace(DEFAULT_MARKDOWN);
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
      fontWeight:
        typeof parsed.fontWeight === "number"
          ? Math.min(
              FONT_WEIGHT_MAX,
              Math.max(FONT_WEIGHT_MIN, Math.round(parsed.fontWeight / FONT_WEIGHT_STEP) * FONT_WEIGHT_STEP),
            )
          : DEFAULT_SETTINGS.fontWeight,
      lineHeight:
        typeof parsed.lineHeight === "number"
          ? Math.min(
              LINE_HEIGHT_MAX,
              Math.max(LINE_HEIGHT_MIN, parsed.lineHeight),
            )
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

function getReaderEmphasisWeights(fontWeight: number): {
  strongWeight: number;
  headingWeight: number;
} {
  return {
    strongWeight: Math.min(700, fontWeight + 100),
    headingWeight: Math.min(800, fontWeight + 200),
  };
}

function getDocumentTitle(markdown: string, index: number): string {
  const headingMatch = markdown.match(/^\s*#\s+(.+?)\s*$/m);
  const firstLine = markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  const candidate = headingMatch?.[1] ?? firstLine;

  return candidate && candidate.length > 0 ? candidate : `Untitled ${index + 1}`;
}

function isPrimaryShortcut(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && !(event.metaKey && event.ctrlKey) && !event.altKey;
}

function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => readStoredWorkspace());
  const [settings, setSettings] = useState<ReaderSettings>(() => readStoredSettings());
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const sourceEditorRef = useRef<HTMLTextAreaElement>(null);

  const activeTab = useMemo(
    () => workspace.tabs.find((tab) => tab.id === workspace.activeTabId) ?? workspace.tabs[0],
    [workspace],
  );
  const source = activeTab?.markdown ?? "";
  const tabTitles = useMemo(
    () => workspace.tabs.map((tab, index) => ({ id: tab.id, title: getDocumentTitle(tab.markdown, index) })),
    [workspace.tabs],
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.workspace, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const activeTitle =
      tabTitles.find((tab) => tab.id === workspace.activeTabId)?.title ?? "Markdown Reader";
    document.title = `${activeTitle} - Markdown Reader`;
  }, [tabTitles, workspace.activeTabId]);

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
  }, [isReaderOpen, workspace.activeTabId]);

  useEffect(() => {
    const { red, green, blue } = MACOS_THEME_WINDOW_COLORS[settings.theme];

    void invoke("sync_window_theme", { theme: settings.theme, red, green, blue }).catch(() => {
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
  const emphasisWeights = getReaderEmphasisWeights(settings.fontWeight);

  const updateActiveTabMarkdown = (markdown: string) => {
    setWorkspace((current) => ({
      ...current,
      tabs: current.tabs.map((tab) =>
        tab.id === current.activeTabId
          ? {
              ...tab,
              markdown,
            }
          : tab,
      ),
    }));
  };

  const handleCreateTab = () => {
    const nextTab = createTab();

    setWorkspace((current) => ({
      tabs: [...current.tabs, nextTab],
      activeTabId: nextTab.id,
    }));

    setIsPreferencesOpen(false);
    setIsReaderOpen(false);
  };

  const handleSelectTab = (tabId: string) => {
    setWorkspace((current) =>
      current.activeTabId === tabId
        ? current
        : {
            ...current,
            activeTabId: tabId,
          },
    );
  };

  const handleCloseTab = (tabId: string) => {
    setWorkspace((current) => {
      if (current.tabs.length === 1) {
        const replacement = createTab();

        return {
          tabs: [replacement],
          activeTabId: replacement.id,
        };
      }

      const closingIndex = current.tabs.findIndex((tab) => tab.id === tabId);
      const nextTabs = current.tabs.filter((tab) => tab.id !== tabId);

      if (nextTabs.length === 0) {
        return current;
      }

      if (current.activeTabId !== tabId) {
        return {
          ...current,
          tabs: nextTabs,
        };
      }

      const fallbackIndex = Math.max(0, closingIndex - 1);

      return {
        tabs: nextTabs,
        activeTabId: nextTabs[fallbackIndex]?.id ?? nextTabs[0].id,
      };
    });

    setIsPreferencesOpen(false);
  };

  const handleReset = () => {
    updateActiveTabMarkdown(DEFAULT_MARKDOWN);
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
        isPrimaryShortcut(event) &&
        !event.shiftKey &&
        event.key === "Enter" &&
        document.activeElement === sourceEditorRef.current
      ) {
        event.preventDefault();
        setIsReaderOpen(true);
      }

      if (isPrimaryShortcut(event) && !event.shiftKey && event.key.toLowerCase() === "t") {
        event.preventDefault();
        handleCreateTab();
      }

      if (isPrimaryShortcut(event) && !event.shiftKey && event.key.toLowerCase() === "w") {
        event.preventDefault();
        handleCloseTab(workspace.activeTabId);
      }

      const isPrimaryModifier = isPrimaryShortcut(event);
      const isIncreaseFontKey =
        event.key === "+" || event.key === "=" || event.code === "NumpadAdd";
      const isDecreaseFontKey =
        event.key === "-" || event.key === "_" || event.code === "NumpadSubtract";

      if (isReaderOpen && !isPreferencesOpen && isPrimaryModifier && isIncreaseFontKey) {
        event.preventDefault();
        setSettings((current) => ({
          ...current,
          fontSize: getNextFontSize(current.fontSize, 1),
        }));
      }

      if (isReaderOpen && !isPreferencesOpen && isPrimaryModifier && isDecreaseFontKey) {
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
  }, [isPreferencesOpen, isReaderOpen, workspace.activeTabId]);

  return (
    <main
      className={`app-shell theme-${settings.theme} ${isReaderOpen ? "is-reader-open" : ""} ${
        workspace.tabs.length > 1 ? "has-tabs" : ""
      }`}
    >
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
              aria-label="Open new tab"
              onClick={handleCreateTab}
            >
              <span aria-hidden="true">+</span>
            </button>
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

        {workspace.tabs.length > 1 ? (
          <header className="workspace-header">
            <div className="tab-strip" role="tablist" aria-label="Open documents">
              {tabTitles.map((tab) => {
                const isActive = tab.id === workspace.activeTabId;

                return (
                  <div
                    key={tab.id}
                    className={`tab-pill ${isActive ? "is-active" : ""}`}
                    role="presentation"
                  >
                    <button
                      className="tab-select-button"
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`document-panel-${tab.id}`}
                      id={`document-tab-${tab.id}`}
                      onClick={() => handleSelectTab(tab.id)}
                    >
                      <span>{tab.title}</span>
                    </button>
                    <button
                      className="tab-close-button"
                      type="button"
                      aria-label={`Close ${tab.title}`}
                      onClick={() => handleCloseTab(tab.id)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </header>
        ) : null}

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
            onChange={(event) => updateActiveTabMarkdown(event.target.value)}
            spellCheck={false}
            placeholder="Paste Markdown here"
          />
        </label>
        <div
          className="reader-card"
          aria-hidden={!isReaderOpen}
          inert={!isReaderOpen}
          id={`document-panel-${workspace.activeTabId}`}
          role={workspace.tabs.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={workspace.tabs.length > 1 ? `document-tab-${workspace.activeTabId}` : undefined}
        >
          <article
            className={`reader-preview font-${settings.fontFamily}`}
            style={
              {
                "--reader-font-size": `${settings.fontSize}px`,
                "--reader-font-weight": settings.fontWeight,
                "--reader-strong-weight": emphasisWeights.strongWeight,
                "--reader-heading-weight": emphasisWeights.headingWeight,
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
                <span>Font weight</span>
                <div className="slider-control">
                  <input
                    type="range"
                    min={FONT_WEIGHT_MIN}
                    max={FONT_WEIGHT_MAX}
                    step={FONT_WEIGHT_STEP}
                    value={settings.fontWeight}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        fontWeight: Number(event.target.value),
                      }))
                    }
                  />
                  <strong>{settings.fontWeight}</strong>
                </div>
              </label>

              <label className="control-row">
                <span>Line height</span>
                <div className="slider-control">
                  <input
                    type="range"
                    min={LINE_HEIGHT_MIN}
                    max={LINE_HEIGHT_MAX}
                    step={LINE_HEIGHT_STEP}
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
