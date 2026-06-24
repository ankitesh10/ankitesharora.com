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
) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`Bot request failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  return readUIMessageStream({
    stream: createUIMessageChunkStream(response.body),
  });
};
