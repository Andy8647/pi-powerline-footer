import test from "node:test";
import assert from "node:assert/strict";
import { renderEditorBox } from "../index.ts";
import { parsePowerlineConfig } from "../powerline-config.ts";

const PRESETS = ["default", "compact"] as const;

// The editor's own render: a top rule, one prompt line, a bottom rule. The box
// renderer strips the outer rules (index 0 and the last ─ line) and re-wraps.
function fakeEditorRender(width: number): string[] {
  return ["─".repeat(width), "hello", "─".repeat(width)];
}

function strip(lines: string[]): string[] {
  return lines.map((line) => line.replace(/\x1b\[[0-9;]*m/g, ""));
}

test("flat box keeps the default rules and a plain > prompt", () => {
  const out = strip(renderEditorBox(fakeEditorRender, 20, { style: "flat", promptColor: null, bashMode: false }));

  assert.equal(out[0], " " + "─".repeat(18)); // top rule
  assert.equal(out[1], " > hello"); // prompt prefix, no side borders
  assert.equal(out[2], " " + "─".repeat(18)); // bottom rule
  assert.equal(out.length, 3);
});

test("rounded box draws corners, side borders, and a ❯ prompt", () => {
  const out = strip(renderEditorBox(fakeEditorRender, 20, { style: "rounded", promptColor: null, bashMode: false }));

  assert.match(out[0], /^ ╭─+╮$/);
  assert.match(out[1], /^ │ .*❯.*hello.* │$/);
  assert.match(out[2], /^ ╰─+╯$/);
  assert.equal(out.length, 3);
});

test("bash mode swaps the prompt glyph to $ in both styles", () => {
  const flat = strip(renderEditorBox(fakeEditorRender, 20, { style: "flat", promptColor: null, bashMode: true }));
  const rounded = strip(renderEditorBox(fakeEditorRender, 20, { style: "rounded", promptColor: null, bashMode: true }));

  assert.ok(flat[1]?.includes("$"));
  assert.ok(!flat[1]?.includes(">"));
  assert.ok(rounded[1]?.includes("$"));
});

test("promptColor recolors the prompt glyph", () => {
  const out = renderEditorBox(fakeEditorRender, 20, { style: "flat", promptColor: "#cba6f7", bashMode: false });
  // 0xcb,0xa6,0xf7 as a truecolor foreground SGR wrapping the glyph.
  assert.ok(out[1]?.includes("\x1b[38;2;203;166;247m>"));
});

test("narrow widths fall back to the raw editor render", () => {
  const out = renderEditorBox(fakeEditorRender, 8, { style: "rounded", promptColor: null, bashMode: false });
  assert.deepEqual(out, fakeEditorRender(8));
});

test("parsePowerlineConfig defaults the editor box to rounded (combined)", () => {
  const config = parsePowerlineConfig({ preset: "default" }, PRESETS);
  assert.equal(config.editorBox, "rounded");
  assert.equal(config.promptColor, "#cba6f7");
});

test("parsePowerlineConfig parses editorBox and promptColor", () => {
  const config = parsePowerlineConfig({ preset: "default", editorBox: "flat", promptColor: "#89B4FA" }, PRESETS);
  assert.equal(config.editorBox, "flat");
  assert.equal(config.promptColor, "#89B4FA");
});

test("parsePowerlineConfig falls back on an invalid box style or prompt color", () => {
  const config = parsePowerlineConfig({ preset: "default", editorBox: "double", promptColor: "purple" }, PRESETS);
  assert.equal(config.editorBox, "rounded");
  assert.equal(config.promptColor, "#cba6f7");
});

test("parsePowerlineConfig defaults pasteCollapseLines to pi's threshold", () => {
  assert.equal(parsePowerlineConfig({ preset: "default" }, PRESETS).pasteCollapseLines, 11);
});

test("parsePowerlineConfig accepts a lower pasteCollapseLines in the 2-10 range", () => {
  assert.equal(parsePowerlineConfig({ preset: "default", pasteCollapseLines: 3 }, PRESETS).pasteCollapseLines, 3);
  assert.equal(parsePowerlineConfig({ preset: "default", pasteCollapseLines: 3.9 }, PRESETS).pasteCollapseLines, 3);
});

test("parsePowerlineConfig ignores out-of-range or non-numeric pasteCollapseLines", () => {
  for (const bad of [1, 0, -5, 11, 50, "3", null, true]) {
    assert.equal(parsePowerlineConfig({ preset: "default", pasteCollapseLines: bad }, PRESETS).pasteCollapseLines, 11);
  }
});
