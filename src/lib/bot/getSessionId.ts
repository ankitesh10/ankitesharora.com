export async function getSessionId(): Promise<string | void> {
  try {
    const result = await fetch(
      `${import.meta.env.PUBLIC_API_URL}/create_chat_session`,
    );

    const response = await result.json();

    return response.resource.id;
  } catch (error) {
    console.error(error);
  }
}
