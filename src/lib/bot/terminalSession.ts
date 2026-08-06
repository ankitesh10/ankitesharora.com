import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { UIMessage } from "ai";

import { streamBotMessages } from "./botStream";
import { createTextMessage, getMessageText } from "./messages";
import { botPrompt, visitorPrompt } from "./terminalPrompts";
import { getTerminalPalette } from "./terminalTheme";
import { getSessionId } from "./getSessionId";

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
    fitAddon.fit();
    term.scrollToBottom();
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

  if (!sessionId) {
    try {
      const id = await getSessionId();

      if (id) {
        sessionId = id;
      }
    } catch (error) {
      const terminalError = error as Error;

      term.write(`\x1B[31m${terminalError.message}\x1B[0m`);
    }
  }

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
          sessionId,
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
      } catch (error) {
        const apiError = error as Error;
        console.error(error);
        stopThinking();
        term.write(`\x1B[31m${apiError.message}\x1B[0m`);
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
