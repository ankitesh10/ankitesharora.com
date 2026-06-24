import type { UIMessage } from "ai";

export const createTextMessage = (
  role: Extract<UIMessage["role"], "user" | "assistant">,
  text: string,
): UIMessage => ({
  id: crypto.randomUUID(),
  role,
  parts: [{ type: "text", text }],
});

export const getMessageText = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
