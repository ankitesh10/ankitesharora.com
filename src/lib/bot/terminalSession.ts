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
    fontFamily: '"Space Grotesk Variable", "Space Grotesk", monospace',
    fontSize: 13,
    lineHeight: 1.2,
    theme: getTerminalPalette(),
  });

  term.open(terminalElement);
  term.write(botPrompt);
  term.write(`Hello from \x1B[1;3;31maa_bot\x1B[0m. Ask anything about me!`);
  term.writeln("");
  term.write(visitorPrompt);

  let input = "";
  let isStreaming = false;

  term.onData(async (e) => {
    if (isStreaming) {
      return;
    }

    if (e === "\r") {
      const userInput = input.trim();

      if (!userInput) {
        term.write("\r\n");
        term.write(visitorPrompt);
        input = "";
        return;
      }

      messages.push(createTextMessage("user", userInput));
      input = "";
      isStreaming = true;
      term.write("\r\n");
      term.write(botPrompt);

      try {
        let assistantMessage: UIMessage | undefined;
        let writtenText = "";

        for await (const message of await streamBotMessages(
          endpoint,
          messages,
        )) {
          console.log("message", message);

          assistantMessage = message;
          const nextText = getMessageText(message);

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
        console.error(error);
        term.write("\x1B[31mConnection error. Check the bot API.\x1B[0m");
      } finally {
        isStreaming = false;
        term.writeln("");
        term.write(visitorPrompt);
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
