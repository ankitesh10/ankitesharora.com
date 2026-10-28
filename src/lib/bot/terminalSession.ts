import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { UIMessage } from "ai";

import { streamBotMessages } from "./botStream";
import { createTextMessage, getMessageText } from "./messages";
import { botPrompt, visitorPrompt } from "./terminalPrompts";
import { getTerminalPalette } from "./terminalTheme";
import { getSessionId } from "./getSessionId";
import { stripTerminalFormatting } from "./terminalFormatting";

type BotTerminalOptions = {
  endpoint: string;
  terminalSelector: string;
};

const fontSize = 14;
const lineHeight = 1.5;

let sessionId: string = "";

export const startBotTerminal = async ({
  endpoint,
  terminalSelector,
}: BotTerminalOptions) => {
  const terminalElement = document.querySelector<HTMLElement>(terminalSelector);

  if (!terminalElement) {
    return;
  }

  const messages: UIMessage[] = [];
  const chatLog = document.querySelector<HTMLElement>("#chat-messages");
  const chatForm = document.querySelector<HTMLFormElement>("#chat-form");
  const chatInput = document.querySelector<HTMLTextAreaElement>("#chat-input");
  const chatSend = document.querySelector<HTMLButtonElement>("#chat-send");
  const chatStatus = document.querySelector<HTMLElement>("#chat-status");

  const scrollChat = () => {
    if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
  };
  if (chatLog) new ResizeObserver(scrollChat).observe(chatLog);

  const appendChatMessage = (role: "user" | "assistant", text: string) => {
    const bubble = document.createElement("div");
    bubble.className = "chat-message";
    bubble.dataset.role = role;
    const label = document.createElement("p");
    label.className = "chat-message-label";
    label.textContent = role === "user" ? "You" : "AA Bot";
    const content = document.createElement("p");
    content.className = "chat-message-text";
    content.textContent = stripTerminalFormatting(text);
    bubble.append(label, content);
    chatLog?.append(bubble);
    scrollChat();
    return content;
  };

  const term = new Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily:
      '"SFMono-Regular", "Cascadia Code", "JetBrains Mono", "Fira Code", "IBM Plex Mono", "Roboto Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    fontSize,
    letterSpacing: 0,
    lineHeight,
    theme: getTerminalPalette(),
  });

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  term.open(terminalElement);

  const fitTerminal = () => {
    if (!terminalElement.clientWidth || !terminalElement.clientHeight) return;
    fitAddon.fit();
    term.scrollToBottom();
    scrollChat();
  };

  const showPrompt = () => {
    term.write(visitorPrompt);
    term.scrollToBottom();
  };

  fitTerminal();
  new ResizeObserver(fitTerminal).observe(terminalElement);
  window.addEventListener("resize", fitTerminal);

  term.write(botPrompt);

  appendChatMessage("assistant", "Hello from aa_bot. Ask anything about me!");
  term.write(`Hello from \x1B[1;3;31maa_bot\x1B[0m. Ask anything about me!`);
  term.writeln("");
  showPrompt();

  let input = "";
  let cursor = 0;
  let isStreaming = false;
  let thinkingTimer: number | undefined;

  const syncChatInput = () => {
    if (chatSend) chatSend.disabled = isStreaming || !chatInput?.value.trim();
    if (chatInput) {
      chatInput.style.height = "auto";
      chatInput.style.height = `${chatInput.scrollHeight}px`;
    }
  };

  const startThinking = () => {
    let frame = 0;
    const frames = ["", ".", "..", "..."];

    term.write(`\x1B[90mThinking${frames[frame]}\x1B[0m`);

    thinkingTimer = window.setInterval(() => {
      frame = (frame + 1) % frames.length;
      term.write(`\r${botPrompt}\x1B[90mThinking${frames[frame]}   \x1B[0m`);
    }, 300);
  };

  const stopThinking = () => {
    if (thinkingTimer === undefined) {
      return;
    }

    window.clearInterval(thinkingTimer);
    thinkingTimer = undefined;
    term.write(`\r\x1B[2K${botPrompt}`);
  };

  const promptWidth = visitorPrompt.replace(/\x1B\[[0-9;]*m/g, "").length;

  // Repaints the whole prompt line so wrapped input stays correct.
  const setInput = (nextInput: string, nextCursor: number) => {
    const cols = term.cols;
    const rowOf = (index: number) => Math.floor((promptWidth + index) / cols);
    const cursorRow = rowOf(cursor);

    input = nextInput;
    cursor = Math.max(0, Math.min(input.length, nextCursor));

    let out = `${cursorRow > 0 ? `\x1B[${cursorRow}A` : ""}\r`;
    out += `${visitorPrompt}${input}`;
    // A full last row leaves the cursor in a pending-wrap state; force the wrap.
    if ((promptWidth + input.length) % cols === 0) {
      out += " \b";
    }
    out += "\x1B[J";

    const upRows = rowOf(input.length) - rowOf(cursor);
    if (upRows > 0) {
      out += `\x1B[${upRows}A`;
    }
    out += `\x1B[${((promptWidth + cursor) % cols) + 1}G`;
    term.write(out);
  };

  const submitMessage = async (userInput: string) => {
    messages.push(createTextMessage("user", userInput));
    appendChatMessage("user", userInput);
    input = "";
    cursor = 0;
    isStreaming = true;
    if (chatInput) chatInput.readOnly = true;
    if (chatLog) chatLog.setAttribute("aria-busy", "true");
    if (chatStatus) chatStatus.textContent = "AA Bot is thinking…";
    syncChatInput();
    const reply = appendChatMessage("assistant", "Thinking…");
    term.write("\r\n");
    term.write(botPrompt);
    startThinking();

    try {
      if (!sessionId) {
        const id = await getSessionId();
        if (!id)
          throw new Error("Unable to start a chat session. Please try again.");
        sessionId = id;
      }
      let assistantMessage: UIMessage | undefined;
      let writtenText = "";

      for await (const message of await streamBotMessages(
        endpoint,
        messages,
        sessionId,
      )) {
        assistantMessage = message;
        const nextText = getMessageText(message);

        if (nextText.length > 0) {
          stopThinking();
          reply.textContent = stripTerminalFormatting(nextText);
          if (chatStatus) chatStatus.textContent = "AA Bot is replying…";
          scrollChat();
        }

        if (nextText.startsWith(writtenText)) {
          term.write(nextText.slice(writtenText.length));
        } else {
          term.write(nextText);
        }

        writtenText = nextText;
      }

      if (assistantMessage && writtenText) {
        messages.push(assistantMessage);
      } else {
        messages.pop();
      }
      if (!writtenText)
        reply.textContent = "No reply received. Please try again.";
    } catch (error) {
      console.error(error);
      // A failed turn must not leave an unanswered user message in API history.
      messages.pop();
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to connect. Please try again.";
      reply.textContent =
        error instanceof TypeError
          ? "Couldn't connect. Please try again."
          : stripTerminalFormatting(errorMessage);
      reply.parentElement?.setAttribute("data-state", "error");
      if (reply.previousElementSibling)
        reply.previousElementSibling.textContent = "Message not sent";
      reply.setAttribute("role", "alert");
      stopThinking();
      term.write(`\x1B[31m${errorMessage}\x1B[0m`);
    } finally {
      stopThinking();
      isStreaming = false;
      if (chatInput) chatInput.readOnly = false;
      if (chatLog) chatLog.setAttribute("aria-busy", "false");
      if (chatStatus) chatStatus.textContent = "";
      syncChatInput();
      scrollChat();
      term.writeln("");
      showPrompt();
    }
  };

  chatInput?.addEventListener("input", syncChatInput);
  chatInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      chatForm?.requestSubmit();
    }
  });
  chatForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const userInput = chatInput?.value.trim();
    if (!userInput || isStreaming || !chatInput) return;
    // Mirror native input into the terminal so both views keep the same history.
    const terminalInput = userInput.replace(/\r?\n/g, " ");
    setInput(terminalInput, terminalInput.length);
    chatInput.value = "";
    chatInput.focus({ preventScroll: true });
    void submitMessage(userInput);
  });

  term.onData(async (e) => {
    if (isStreaming) return;

    if (e === "\r") {
      const userInput = input.trim();
      if (!userInput) {
        term.write("\r\n");
        showPrompt();
        input = "";
        cursor = 0;
        return;
      }
      await submitMessage(userInput);
    } else if (e === "\x7f") {
      if (cursor > 0) {
        setInput(input.slice(0, cursor - 1) + input.slice(cursor), cursor - 1);
      }
    } else if (e === "\x1b[3~") {
      setInput(input.slice(0, cursor) + input.slice(cursor + 1), cursor);
    } else if (e === "\x1b[D" || e === "\x02") {
      setInput(input, cursor - 1);
    } else if (e === "\x1b[C" || e === "\x06") {
      setInput(input, cursor + 1);
    } else if (e === "\x1b[H" || e === "\x1b[1~" || e === "\x01") {
      setInput(input, 0);
    } else if (e === "\x1b[F" || e === "\x1b[4~" || e === "\x05") {
      setInput(input, input.length);
    } else if (!e.startsWith("\x1b")) {
      const text = e.replace(/[\x00-\x1f\x7f]/g, "");

      if (text) {
        setInput(
          input.slice(0, cursor) + text + input.slice(cursor),
          cursor + text.length,
        );
      }
    }
  });

  document.addEventListener("themechange", () => {
    term.options.theme = getTerminalPalette();
    term.refresh(0, term.rows - 1);
  });
};
