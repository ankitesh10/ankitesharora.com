import {
  parseJsonEventStream,
  readUIMessageStream,
  uiMessageChunkSchema,
  type UIMessage,
} from "ai";

const createUIMessageChunkStream = (stream: ReadableStream<Uint8Array>) =>
  parseJsonEventStream({
    stream,
    schema: uiMessageChunkSchema,
  }).pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        if (!chunk.success) {
          throw chunk.error;
        }

        controller.enqueue(chunk.value);
      },
    }),
  );

export const streamBotMessages = async (
  endpoint: string,
  messages: UIMessage[],
  sessionId: string,
) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, sessionId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Bot request failed: ${response.status}`;

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  return readUIMessageStream({
    stream: createUIMessageChunkStream(response.body),
  });
};
