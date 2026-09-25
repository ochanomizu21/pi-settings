/**
 * agent-browser Extension
 *
 * Registers high-level browser automation tools that wrap the agent-browser CLI.
 * Install: npm i -g agent-browser && agent-browser install
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync, spawn } from "node:child_process";

const AB = "agent-browser";

function ab(args: string, opts?: { timeout?: number }): string {
  try {
    // Chromium cannot use its user-namespace sandbox in this container/VM.
    // Keep the workaround inside the extension so browser tools work even
    // when pi was started without the shell environment configured.
    const env = process.platform === "linux"
      ? {
          ...process.env,
          AGENT_BROWSER_ARGS: [process.env.AGENT_BROWSER_ARGS, "--no-sandbox"].filter(Boolean).join(","),
        }
      : process.env;
    return execSync(`${AB} ${args}`, {
      encoding: "utf-8",
      timeout: opts?.timeout ?? 30_000,
      stdio: ["pipe", "pipe", "pipe"],
      env,
    }).trim();
  } catch (e: any) {
    const stderr = e.stderr?.toString().trim() || e.message;
    throw new Error(`agent-browser ${args}: ${stderr}`);
  }
}

export default function (pi: ExtensionAPI) {
  // ── browser_open ──────────────────────────────────────────────
  pi.registerTool({
    name: "browser_open",
    label: "Open Browser",
    description:
      "Launch a browser and optionally navigate to a URL. Returns the page title and URL. Use this before any other browser tool.",
    promptSnippet: "Open a browser and navigate to a URL",
    promptGuidelines: [
      "Use browser_open before any other browser tool to launch the browser session.",
    ],
    parameters: Type.Object({
      url: Type.Optional(
        Type.String({ description: "URL to navigate to. Omit to open about:blank." }),
      ),
      headed: Type.Optional(
        Type.Boolean({ description: "Show the browser window (default: headless)" }),
      ),
    }),
    async execute(_id, params) {
      const args: string[] = [];
      if (params.headed) args.push("--headed");
      const cmd = params.url
        ? `open ${args.join(" ")} ${params.url}`
        : `open ${args.join(" ")}`.trim();
      const out = ab(cmd);
      return { content: [{ type: "text", text: out || "Browser opened." }] };
    },
  });

  // ── browser_snapshot ──────────────────────────────────────────
  pi.registerTool({
    name: "browser_snapshot",
    label: "Browser Snapshot",
    description:
      "Get the accessibility tree of the current page with element refs (@e1, @e2, ...). Use -i for interactive elements only (preferred). Always re-snapshot after page changes before using refs.",
    promptSnippet: "Read the current browser page via accessibility snapshot",
    promptGuidelines: [
      "Use browser_snapshot to read page content. Refs (@eN) become stale after page changes — always re-snapshot before interacting.",
    ],
    parameters: Type.Object({
      interactive: Type.Optional(
        Type.Boolean({
          description: "Show only interactive elements (default: true)",
          default: true,
        }),
      ),
      selector: Type.Optional(
        Type.String({ description: "CSS selector to scope the snapshot" }),
      ),
    }),
    async execute(_id, params) {
      const flags: string[] = [];
      if (params.interactive !== false) flags.push("-i");
      if (params.selector) flags.push(`-s "${params.selector}"`);
      const out = ab(`snapshot ${flags.join(" ")}`, { timeout: 15_000 });
      return { content: [{ type: "text", text: out }] };
    },
  });

  // ── browser_click ─────────────────────────────────────────────
  pi.registerTool({
    name: "browser_click",
    label: "Browser Click",
    description:
      "Click an element by ref (@eN), CSS selector, or semantic locator. Always snapshot first to get fresh refs.",
    promptSnippet: "Click a browser element",
    parameters: Type.Object({
      selector: Type.String({
        description: 'Element ref (e.g. @e3) or CSS selector (e.g. "#submit")',
      }),
    }),
    async execute(_id, params) {
      const out = ab(`click ${params.selector}`);
      return { content: [{ type: "text", text: out || `Clicked ${params.selector}` }] };
    },
  });

  // ── browser_fill ──────────────────────────────────────────────
  pi.registerTool({
    name: "browser_fill",
    label: "Browser Fill",
    description:
      "Clear an input field and type text into it. Use refs from a snapshot.",
    promptSnippet: "Fill a browser form field",
    parameters: Type.Object({
      selector: Type.String({
        description: 'Element ref (e.g. @e3) or CSS selector',
      }),
      value: Type.String({ description: "Text to fill in" }),
    }),
    async execute(_id, params) {
      const out = ab(`fill ${params.selector} ${JSON.stringify(params.value)}`);
      return { content: [{ type: "text", text: out || `Filled ${params.selector}` }] };
    },
  });

  // ── browser_type ──────────────────────────────────────────────
  pi.registerTool({
    name: "browser_type",
    label: "Browser Type",
    description:
      "Type text into an element without clearing it first (appends). For clearing then typing, use browser_fill instead.",
    promptSnippet: "Type into a browser element without clearing",
    parameters: Type.Object({
      selector: Type.String({
        description: 'Element ref (e.g. @e3) or CSS selector',
      }),
      text: Type.String({ description: "Text to type" }),
    }),
    async execute(_id, params) {
      const out = ab(`type ${params.selector} ${JSON.stringify(params.text)}`);
      return { content: [{ type: "text", text: out || `Typed into ${params.selector}` }] };
    },
  });

  // ── browser_press ─────────────────────────────────────────────
  pi.registerTool({
    name: "browser_press",
    label: "Browser Press Key",
    description: "Press a key or key combination (e.g. Enter, Tab, Control+a).",
    promptSnippet: "Press a keyboard key in the browser",
    parameters: Type.Object({
      key: Type.String({
        description: 'Key to press (e.g. "Enter", "Tab", "Control+a")',
      }),
    }),
    async execute(_id, params) {
      const out = ab(`press ${params.key}`);
      return { content: [{ type: "text", text: out || `Pressed ${params.key}` }] };
    },
  });

  // ── browser_screenshot ────────────────────────────────────────
  pi.registerTool({
    name: "browser_screenshot",
    label: "Browser Screenshot",
    description:
      "Take a screenshot of the current page. Returns the file path. Use --full for full page, --annotate for numbered element labels.",
    promptSnippet: "Take a browser screenshot",
    parameters: Type.Object({
      path: Type.Optional(
        Type.String({ description: "File path to save screenshot (default: temp)" }),
      ),
      full: Type.Optional(
        Type.Boolean({ description: "Capture full scroll height" }),
      ),
      annotate: Type.Optional(
        Type.Boolean({ description: "Add numbered labels matching snapshot refs" }),
      ),
    }),
    async execute(_id, params) {
      const flags: string[] = [];
      if (params.full) flags.push("--full");
      if (params.annotate) flags.push("--annotate");
      const pathArg = params.path ? params.path : "";
      const out = ab(`screenshot ${flags.join(" ")} ${pathArg}`.trim());
      return {
        content: [
          { type: "text", text: `Screenshot saved: ${out}` },
        ],
      };
    },
  });

  // ── browser_get ───────────────────────────────────────────────
  pi.registerTool({
    name: "browser_get",
    label: "Browser Get",
    description:
      "Get page info: text content, innerHTML, input value, attribute, title, URL, or element count.",
    promptSnippet: "Get text, HTML, URL, or attribute from the browser page",
    parameters: Type.Object({
      kind: Type.Union([
        Type.Literal("text"),
        Type.Literal("html"),
        Type.Literal("value"),
        Type.Literal("attr"),
        Type.Literal("title"),
        Type.Literal("url"),
        Type.Literal("count"),
      ], { description: "What to get" }),
      selector: Type.Optional(
        Type.String({ description: "Element ref or CSS selector (required for text/html/value/attr/count)" }),
      ),
      attribute: Type.Optional(
        Type.String({ description: "Attribute name (only for kind=attr)" }),
      ),
    }),
    async execute(_id, params) {
      let cmd: string;
      switch (params.kind) {
        case "text":
          cmd = `get text ${params.selector}`;
          break;
        case "html":
          cmd = `get html ${params.selector}`;
          break;
        case "value":
          cmd = `get value ${params.selector}`;
          break;
        case "attr":
          cmd = `get attr ${params.selector} ${params.attribute}`;
          break;
        case "title":
          cmd = "get title";
          break;
        case "url":
          cmd = "get url";
          break;
        case "count":
          cmd = `get count "${params.selector}"`;
          break;
        default:
          throw new Error(`Unknown kind: ${params.kind}`);
      }
      const out = ab(cmd);
      return { content: [{ type: "text", text: out }] };
    },
  });

  // ── browser_wait ──────────────────────────────────────────────
  pi.registerTool({
    name: "browser_wait",
    label: "Browser Wait",
    description:
      "Wait for a condition: element visibility, text appearance, URL match, network idle, JS condition, or a fixed duration.",
    promptSnippet: "Wait for a browser condition before proceeding",
    parameters: Type.Object({
      for: Type.Union([
        Type.Literal("element"),
        Type.Literal("text"),
        Type.Literal("url"),
        Type.Literal("networkidle"),
        Type.Literal("load"),
        Type.Literal("fn"),
        Type.Literal("time"),
      ], { description: "What to wait for" }),
      value: Type.String({
        description:
          'Selector (element), text, URL pattern, JS expression, or milliseconds (time)',
      }),
    }),
    async execute(_id, params) {
      let cmd: string;
      switch (params.for) {
        case "element":
          cmd = `wait ${params.value}`;
          break;
        case "text":
          cmd = `wait --text ${JSON.stringify(params.value)}`;
          break;
        case "url":
          cmd = `wait --url ${JSON.stringify(params.value)}`;
          break;
        case "networkidle":
          cmd = "wait --load networkidle";
          break;
        case "load":
          cmd = "wait --load load";
          break;
        case "fn":
          cmd = `wait --fn ${JSON.stringify(params.value)}`;
          break;
        case "time":
          cmd = `wait ${params.value}`;
          break;
        default:
          cmd = `wait ${params.value}`;
      }
      const out = ab(cmd, { timeout: 60_000 });
      return { content: [{ type: "text", text: out || "Wait complete." }] };
    },
  });

  // ── browser_eval ──────────────────────────────────────────────
  pi.registerTool({
    name: "browser_eval",
    label: "Browser Eval JS",
    description:
      "Run JavaScript in the browser page. Returns the result. For complex scripts with quotes, the tool handles escaping.",
    promptSnippet: "Run JavaScript in the browser",
    parameters: Type.Object({
      expression: Type.String({
        description: "JavaScript expression or code to evaluate",
      }),
    }),
    async execute(_id, params) {
      // Use base64 encoding to avoid shell escaping issues
      const b64 = Buffer.from(params.expression).toString("base64");
      const out = ab(`eval -b ${b64}`);
      return { content: [{ type: "text", text: out }] };
    },
  });

  // ── browser_scroll ────────────────────────────────────────────
  pi.registerTool({
    name: "browser_scroll",
    label: "Browser Scroll",
    description: "Scroll the page or an element into view.",
    parameters: Type.Object({
      direction: Type.Union([
        Type.Literal("up"),
        Type.Literal("down"),
        Type.Literal("left"),
        Type.Literal("right"),
        Type.Literal("intoview"),
      ], { description: "Scroll direction, or 'intoview' to scroll an element into view" }),
      pixels: Type.Optional(
        Type.Number({ description: "Pixels to scroll (for up/down/left/right)" }),
      ),
      selector: Type.Optional(
        Type.String({ description: "Element ref or selector (required for intoview)" }),
      ),
    }),
    async execute(_id, params) {
      let cmd: string;
      if (params.direction === "intoview") {
        cmd = `scrollintoview ${params.selector}`;
      } else {
        cmd = `scroll ${params.direction} ${params.pixels ?? 500}`;
      }
      const out = ab(cmd);
      return { content: [{ type: "text", text: out || "Scrolled." }] };
    },
  });

  // ── browser_tab ───────────────────────────────────────────────
  pi.registerTool({
    name: "browser_tab",
    label: "Browser Tab",
    description: "List, create, switch to, or close browser tabs.",
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal("list"),
        Type.Literal("new"),
        Type.Literal("switch"),
        Type.Literal("close"),
      ], { description: "Tab action" }),
      target: Type.Optional(
        Type.String({
          description: 'Tab number to switch/close, or URL for new tab',
        }),
      ),
    }),
    async execute(_id, params) {
      let cmd: string;
      switch (params.action) {
        case "list":
          cmd = "tab";
          break;
        case "new":
          cmd = params.target ? `tab new ${params.target}` : "tab new";
          break;
        case "switch":
          cmd = `tab ${params.target}`;
          break;
        case "close":
          cmd = `tab close ${params.target}`;
          break;
      }
      const out = ab(cmd!);
      return { content: [{ type: "text", text: out }] };
    },
  });

  // ── browser_close ─────────────────────────────────────────────
  pi.registerTool({
    name: "browser_close",
    label: "Browser Close",
    description: "Close the browser session. Use --all to close all sessions.",
    parameters: Type.Object({
      all: Type.Optional(
        Type.Boolean({ description: "Close all active sessions" }),
      ),
    }),
    async execute(_id, params) {
      const cmd = params.all ? "close --all" : "close";
      const out = ab(cmd);
      return { content: [{ type: "text", text: out || "Browser closed." }] };
    },
  });

  // ── /browser command ──────────────────────────────────────────
  pi.registerCommand("browser", {
    description: "Run an arbitrary agent-browser command",
    handler: async (args, ctx) => {
      if (!args) {
        ctx.ui.notify("Usage: /browser <command> [args...]", "info");
        return;
      }
      try {
        const out = ab(args, { timeout: 60_000 });
        ctx.ui.notify(out || "(no output)", "info");
      } catch (e: any) {
        ctx.ui.notify(`Error: ${e.message}`, "error");
      }
    },
  });
}
