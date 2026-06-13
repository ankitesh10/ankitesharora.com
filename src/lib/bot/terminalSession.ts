import { Terminal } from "@xterm/xterm";
import type { UIMessage } from "ai";

import { streamBotMessages } from "./botStream";
import { createTextMessage, getMessageText } from "./messages";
import { botPrompt, visitorPrompt } from "./terminalPrompts";
import { getTerminalPalette } from "./terminalTheme";

type BotTerminalOptions = {
  endpoint: string;
  terminalSelector: string;
};

const fontSize = 14;
const lineHeight = 1.5;
const cellHeight = fontSize * lineHeight;
const cellWidth = fontSize * 0.6;

export const startBotTerminal = ({
  endpoint,
  terminalSelector,
}: BotTerminalOptions) => {
  const terminalElement = document.querySelector<HTMLElement>(terminalSelector);

  if (!terminalElement) {
    return;
  }

  const messages: UIMessage[] = [];

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

  term.open(terminalElement);

  const fitTerminal = () => {
    const cols = Math.max(
      20,
      Math.floor(terminalElement.clientWidth / cellWidth),
    );
    const rows = Math.max(
      4,
      Math.floor(terminalElement.clientHeight / cellHeight),
    );

    if (cols !== term.cols || rows !== term.rows) {
      term.resize(cols, rows);
      term.scrollToBottom();
    }
  };

  const showPrompt = () => {
    term.write(visitorPrompt);
    term.scrollToBottom();
  };

  fitTerminal();
  new ResizeObserver(fitTerminal).observe(terminalElement);
  window.addEventListener("resize", fitTerminal);

  term.write(botPrompt);
  term.write(`Hello from \x1B[1;3;31maa_bot\x1B[0m. Ask anything about me!`);
  term.writeln("");
  showPrompt();

  let input = "";
  let isStreaming = false;
  let thinkingTimer: number | undefined;

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

  term.onData(async (e) => {
    if (isStreaming) {
      return;
    }

    if (e === "\r") {
      const userInput = input.trim();

      if (!userInput) {
        term.write("\r\n");
        showPrompt();
        input = "";
        return;
      }

      messages.push(createTextMessage("user", userInput));
      input = "";
      isStreaming = true;
      term.write("\r\n");
      term.write(botPrompt);
      startThinking();

      try {
        let assistantMessage: UIMessage | undefined;
        let writtenText = "";

        for await (const message of await streamBotMessages(
          endpoint,
          messages,
        )) {
          assistantMessage = message;
          const nextText = getMessageText(message);

          if (nextText.length > 0) {
            stopThinking();
          }

          if (nextText.startsWith(writtenText)) {
            term.write(nextText.slice(writtenText.length));
          } else {
            term.write(nextText);
          }

          writtenText = nextText;
        }

        if (assistantMessage) {
          messages.push(assistantMessage);
        }
        console.log("messages", messages);
      } catch (error) {
        console.error(error);
        stopThinking();
        term.write("\x1B[31mConnection error. Check the bot API.\x1B[0m");
      } finally {
        stopThinking();
        isStreaming = false;
        term.writeln("");
        showPrompt();
      }
    } else if (e === "\x7f") {
      if (input.length > 0) {
        input = input.slice(0, -1);
        term.write("\b \b");
      }
    } else {
      input += e;
      term.write(e);
    }
  });

  document.addEventListener("themechange", () => {
    term.options.theme = getTerminalPalette();
    term.refresh(0, term.rows - 1);
  });
};
