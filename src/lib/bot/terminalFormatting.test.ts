import assert from "node:assert/strict";
import { test } from "node:test";

import { stripTerminalFormatting } from "./terminalFormatting.ts";

test("removes the bold/reset codes shown in the mobile reply", () => {
  const response =
    "Hello — I’m \x1b[1maa_bot\x1b[0m. Ask about \x1b[1mAnkitesh Arora\x1b[0m.";
  assert.equal(
    stripTerminalFormatting(response),
    "Hello — I’m aa_bot. Ask about Ankitesh Arora.",
  );
});

test("removes color and cursor codes without changing visible text", () => {
  assert.equal(
    stripTerminalFormatting(
      "\x1b[2K\x1b[38;2;120;255;100mGreen\x1b[0m\x9b1m bold\x9b0m",
    ),
    "Green bold",
  );
});

test("keeps hyperlink text and removes terminal-only link wrappers", () => {
  assert.equal(
    stripTerminalFormatting(
      "Visit \x1b]8;;https://example.com\x1b\\my site\x1b]8;;\x1b\\.",
    ),
    "Visit my site.",
  );
});

test("never leaks control fragments when streaming splits a sequence", () => {
  const response = "Hello \x1b[1maa_bot\x1b[0m!";
  const expected = "Hello aa_bot!";
  for (let end = 0; end <= response.length; end++) {
    const visible = stripTerminalFormatting(response.slice(0, end));
    assert.ok(
      expected.startsWith(visible),
      `Unexpected fragment at ${end}: ${JSON.stringify(visible)}`,
    );
  }
  assert.equal(stripTerminalFormatting(response), expected);
});

test("preserves ordinary text, brackets, Unicode, tabs, and line breaks", () => {
  const text =
    "Code: [1, 2], [1m, **bold**.\n\tनमस्ते 👋 <script>alert('hello')</script>";
  assert.equal(stripTerminalFormatting(text), text);
});

test("hides unfinished terminal hyperlinks and titles", () => {
  assert.equal(
    stripTerminalFormatting("Hello \x1b]8;;https://example.com"),
    "Hello ",
  );
  assert.equal(
    stripTerminalFormatting("\x1b]0;Terminal title\x07Hello"),
    "Hello",
  );
});
