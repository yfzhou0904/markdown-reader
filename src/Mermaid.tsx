import { memo, useEffect, useMemo, useRef, useState } from "react";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;

async function getMermaid() {
  if (typeof window === "undefined") {
    throw new Error("Mermaid is client-only");
  }

  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((module) => {
      module.default.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        logLevel: "fatal",
        suppressErrorRendering: true,
      });

      return module.default;
    });
  }

  return mermaidPromise;
}

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debounced;
}

function hash(input: string) {
  let hashValue = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hashValue = ((hashValue << 5) + hashValue) ^ input.charCodeAt(index);
  }

  return (hashValue >>> 0).toString(36);
}

function CodeFallback({ code }: { code: string }) {
  return (
    <pre className="mermaid-fallback">
      <code className="language-mermaid">{code}</code>
    </pre>
  );
}

type Status = "ok" | "invalid";

function MermaidInner({ chart }: { chart: string }) {
  const normalizedChart = chart.replace(/\n$/, "");
  const debouncedChart = useDebounce(normalizedChart, 180);
  const [status, setStatus] = useState<Status>("invalid");
  const [svg, setSvg] = useState<string | null>(null);
  const ticketRef = useRef(0);
  const renderId = useMemo(() => `mermaid-${hash(debouncedChart)}`, [debouncedChart]);

  useEffect(() => {
    let cancelled = false;
    const ticket = ++ticketRef.current;

    void (async () => {
      try {
        const mermaid = await getMermaid();

        try {
          await mermaid.parse(debouncedChart, { suppressErrors: true });
        } catch {
          if (!cancelled && ticketRef.current === ticket) {
            setStatus("invalid");
            setSvg(null);
          }
          return;
        }

        const { svg: renderedSvg } = await mermaid.render(renderId, debouncedChart);

        if (!cancelled && ticketRef.current === ticket) {
          setStatus("ok");
          setSvg(renderedSvg);
        }
      } catch {
        if (!cancelled && ticketRef.current === ticket) {
          setStatus("invalid");
          setSvg(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedChart, renderId]);

  if (status !== "ok" || !svg) {
    return <CodeFallback code={chart} />;
  }

  return <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export const Mermaid = memo(MermaidInner, (previous, next) => previous.chart === next.chart);
