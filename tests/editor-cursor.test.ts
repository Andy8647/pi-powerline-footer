import test from "node:test";
import assert from "node:assert/strict";
import { applyEditorCursorStyle, displayColumnToStringIndex } from "../index.ts";
import { NERD_ICONS } from "../icons.ts";
import { parsePowerlineConfig } from "../powerline-config.ts";
import { PRESETS } from "../presets.ts";

const PRESET_NAMES = Object.keys(PRESETS) as Array<keyof typeof PRESETS>;

test("displayColumnToStringIndex maps display columns to string indices", () => {
  // ASCII: display col == string index
  assert.equal(displayColumnToStringIndex("hello world", 0, 7), 7);
  assert.equal(displayColumnToStringIndex("hello", 0, 0), 0);
  // past the end clamps to line end
  assert.equal(displayColumnToStringIndex("hi", 0, 99), 2);
  // CJK wide chars count double
  // "你好ab": 你(2) 好(2) a(1) b(1) → col 3 lands after 好 → index 2? col 3 → consume 你(col2) 好(col4) stop at col4>=3 → i=2
  assert.equal(displayColumnToStringIndex("你好ab", 0, 3), 2);
  assert.equal(displayColumnToStringIndex("你好ab", 0, 4), 2);
  assert.equal(displayColumnToStringIndex("你好ab", 0, 5), 3);
  // fromIndex offset: start inside the line
  assert.equal(displayColumnToStringIndex("abcdef", 3, 2), 5);
});

test("applyEditorCursorStyle leaves the block cursor untouched", () => {
  const line = "text \x1b[7m \x1b[0m more";
  assert.equal(applyEditorCursorStyle(line, "block"), line);
});

test("applyEditorCursorStyle swaps the reverse block for an underline", () => {
  assert.equal(applyEditorCursorStyle("text \x1b[7m \x1b[0m more", "underline"), "text \x1b[4m \x1b[0m more");
  assert.equal(applyEditorCursorStyle("\x1b[7mx\x1b[0m", "underline"), "\x1b[4mx\x1b[0m");
  // multi-char reverse sequences (selection etc.) are left alone
  assert.equal(applyEditorCursorStyle("\x1b[7mabc\x1b[0m", "underline"), "\x1b[7mabc\x1b[0m");
});

test("applyEditorCursorStyle drops the software cursor for terminal mode", () => {
  assert.equal(applyEditorCursorStyle("text \x1b[7m \x1b[0m more", "terminal"), "text   more");
  assert.equal(applyEditorCursorStyle("\x1b[7mx\x1b[0m", "terminal"), "x");
  assert.equal(applyEditorCursorStyle("plain", "terminal"), "plain");
});

test("editor cursor style and click-to-position configs", () => {
  const defaults = parsePowerlineConfig({}, PRESET_NAMES);
  assert.equal(defaults.editorCursor, "block");
  assert.equal(defaults.editorClickCursor, true);
  const custom = parsePowerlineConfig({ editorCursor: "terminal", editorClickCursor: false }, PRESET_NAMES);
  assert.equal(custom.editorCursor, "terminal");
  assert.equal(custom.editorClickCursor, false);
  // unknown value falls back to the block default
  assert.equal(parsePowerlineConfig({ editorCursor: "beam" }, PRESET_NAMES).editorCursor, "block");
});

test("cache icon differs from context icon", () => {
  assert.notEqual(NERD_ICONS.cache, NERD_ICONS.context);
  assert.equal(NERD_ICONS.cache, "\uF0E7"); // bolt
  assert.equal(NERD_ICONS.context, "\uF1C0"); // database
});
